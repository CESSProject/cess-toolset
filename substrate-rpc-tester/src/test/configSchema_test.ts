import { assert, assertFalse } from "std/assert/mod.ts";
import validate from "../configSchema.ts";

interface SchemaErrorType {
  schemaPath?: string;
}

const validSchema = {
  "endPoint": "ws://127.0.0.1:9944",
  "keyring": {
    "type": "sr25519",
    "ss58Format": 11330,
  },
  "writeTxWait": "inblock",
  "connections": 2,
  "development": true,
  "signers": {
    "Brandon": "0x118a67f30b9d10b4efd11fd1c141909dd6f7c79f3586294905177b90bf6463fb",
    "Chris": "bottom drive obey lake curtain smoke basket hold race lonely fit walk//Chris",
  },
  "txs": [
    "api.query.timestamp.now",
    {
      "tx": "api.query.system.account",
      "params": ["Alice"],
    },
    {
      "tx": "api.tx.balances.transfer",
      "params": ["Bob", 100000000000000000],
      "signer": "Alice",
    },
  ],
};

Deno.test("valid schema should pass", () => {
  assert(validate(validSchema), "expect a valid schema to pass");
});

Deno.test("invalid schemas should fail", async (t) => {
  await t.step("schema with no endPoint should fail", () => {
    const schema = structuredClone(validSchema);
    // @ts-ignore: to allow deletion of the `endPoint` property
    delete schema.endPoint;

    assertFalse(validate(schema));

    // check one of the errors fail at endPoint
    const errArr = validate.errors as SchemaErrorType[];
    assert(errArr.some((err) => err.schemaPath && err.schemaPath === "/properties/endPoint"));
  });

  await t.step("schema with invalid keyring should fail", () => {
    const schema = structuredClone(validSchema);
    schema.keyring.type = "invalidVal";
    // @ts-ignore: to allow deletion of the `keyring.ss58Format` property
    delete schema.keyring.ss58Format;

    assertFalse(validate(schema));

    const errArr = validate.errors as SchemaErrorType[];
    assert(
      errArr.some((err) =>
        err.schemaPath && err.schemaPath === "/properties/keyring/properties/type/enum"
      ),
      "should detect invalid type",
    );
    assert(
      errArr.some((err) =>
        err.schemaPath && err.schemaPath === "/properties/keyring/properties/ss58Format"
      ),
      "should detect missing ss58Format",
    );
  });

  await t.step("schema with no connections should fail", () => {
    const schema = structuredClone(validSchema);
    // @ts-ignore: to allow deletion of connections
    delete schema.connections;

    assertFalse(validate(schema));

    const errArr = validate.errors as SchemaErrorType[];
    assert(
      errArr.some((err) => err.schemaPath && err.schemaPath === "/properties/connections"),
      "should detect missing connections",
    );
  });

  await t.step("schema with invalid writeTxWait should fail", () => {
    const schema = structuredClone(validSchema);
    schema.writeTxWait = "invalidVal";

    assertFalse(validate(schema));

    const errArr = validate.errors as SchemaErrorType[];
    assert(
      errArr.some((err) =>
        err.schemaPath && err.schemaPath === "/optionalProperties/writeTxWait/enum"
      ),
      "should detect invalid writeTxWait value",
    );
  });
});
