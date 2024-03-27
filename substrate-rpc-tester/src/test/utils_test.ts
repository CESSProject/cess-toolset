import { assertEquals, assertObjectMatch } from "std/assert/mod.ts";
import { Keyring } from "polkadot-js/keyring/mod.ts";
import { ApiPromise, WsProvider } from "polkadot-js/api/mod.ts";
import type { KeyringOptions, KeyringPair } from "polkadot-js/keyring/types.ts";

import * as utils from "../utils.ts";
import { DEV_ACCTS, DEV_SEED_PHRASE } from "../utils.ts";

const KEYRING_OPT = {
  type: "sr25519",
  ss58Format: 11330,
} as KeyringOptions;

const rpcEndPoint = Deno.env.get("RPC_ENDPOINT");

const TEST_USER_ID = "TEST_USER";
const TX_PARAMS = {
  replaceSigner: [TEST_USER_ID],
  keepInt: [2 ** 53 - 1],
  changeToBigInt: [2 ** 53],
  rest: ["testUser"],
};

Deno.test("Testing some utils functions", async (t) => {
  // Setup the test user keyring
  const keyring = new Keyring(KEYRING_OPT);
  const testUserUri = `${DEV_SEED_PHRASE}//${DEV_ACCTS[0]}`;
  const testUser = keyring.addFromUri(testUserUri);

  const signers = new Map<string, KeyringPair>();
  signers.set(TEST_USER_ID, testUser);

  await t.step("transformTxParams()", () => {
    assertEquals(
      utils.transformTxParams(TX_PARAMS.replaceSigner, signers),
      [signers.get(TEST_USER_ID)!.address],
    );

    assertEquals(
      utils.transformTxParams(TX_PARAMS.keepInt, signers),
      [2 ** 53 - 1],
    );

    assertEquals(
      utils.transformTxParams(TX_PARAMS.changeToBigInt, signers),
      [BigInt(2 ** 53)],
    );

    assertEquals(
      utils.transformTxParams(TX_PARAMS.rest, signers),
      ["testUser"],
    );
  });
});

const TEST_TX = "api.tx.proxy.addProxy";
const EXPECTED_FIELDS = {
  method: "addProxy",
  section: "proxy",
};

Deno.test({
  name: "Testing utils functions requiring remote RPC endpoint",
  ignore: !rpcEndPoint || rpcEndPoint.length === 0,
  async fn(t) {
    // Setup the API
    const api = new ApiPromise({ provider: new WsProvider(rpcEndPoint) });
    api.on("error", (err) => console.error(`Error connecting to ${rpcEndPoint}:`, err));
    await api.isReady;

    console.log(`Connected to: ${rpcEndPoint}`);

    await t.step("getTxCall() works", () => {
      const obj = utils.getTxCall(api, TEST_TX);
      assertObjectMatch(obj, EXPECTED_FIELDS, `testing ${TEST_TX} with unexpected return value.`);
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
