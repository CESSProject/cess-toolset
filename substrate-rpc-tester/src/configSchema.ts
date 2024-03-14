import Ajv from "ajv/dist/jtd.js";
import type { JsonValue } from "std/json/common.ts";
// our own implementation
import type { AppConfig } from "./types.ts";

const ajv = new Ajv.default({ allErrors: true });
const configSchema = {
  properties: {
    endPoint: { type: "string" },
    keyring: {
      properties: {
        type: { enum: ["sr25519", "ed25519", "ecdsa"] },
        ss58Format: { type: "uint32" },
      },
    },
    connections: { type: "uint16" },
    txs: {
      // it required discriminated union. So txs is not checking
      // ref: https://ajv.js.org/json-type-definition.html#empty-form
      elements: {},
    },
  },
  optionalProperties: {
    writeTxWait: {
      enum: ["none", "inblock", "finalized"],
    },
    development: { type: "boolean" },
    signers: {
      values: { type: "string" },
    },
  },
};

const txObjSchema = {
  properties: {
    tx: { type: "string" },
  },
  optionalProperties: {
    signer: { type: "string" },
    params: {
      elements: {},
    },
  },
};

const overallValidate = ajv.compile(configSchema);
const txValidate = ajv.compile(txObjSchema);

type ValidateFunc = {
  (config: JsonValue): boolean;
  errors?: Array<unknown> | null;
};

const validate: ValidateFunc = (config: JsonValue) => {
  if (!overallValidate(config)) {
    validate.errors = overallValidate.errors;
    return false;
  }

  if (config && Object.hasOwn(config as object, "txs")) {
    const txs = (config as unknown as AppConfig).txs;
    for (const tx of txs) {
      if (typeof tx === "string") continue;
      if (!txValidate(tx)) {
        validate.errors = txValidate.errors;
        return false;
      }
    }
  }

  return true;
};

export default validate;
export { configSchema };
