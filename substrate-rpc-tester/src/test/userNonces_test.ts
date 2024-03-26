import { assertEquals } from "std/assert/mod.ts";
import { ApiPromise, WsProvider } from "polkadot-js/api/mod.ts";
import { Keyring } from "polkadot-js/keyring/mod.ts";
import { KeyringOptions } from "polkadot-js/keyring/types.ts";

import { UserNonces } from "../userNonces.ts";
import { DEV_ACCTS, DEV_SEED_PHRASE } from "../utils.ts";

const TEST_CONN = {
  endPoint: "ws://127.0.0.1:9944",
  keyring: {
    type: "sr25519",
    ss58Format: 11330,
  },
};

Deno.test({
  name: "Testing UserNonces caching",
  async fn(t) {
    // Setup the API
    const api = new ApiPromise({ provider: new WsProvider(TEST_CONN.endPoint) });
    // const api = await ApiPromise.create({ provider: new WsProvider(TEST_CONN.endPoint) });
    api.on("error", (err) => {
      console.error("error handler");
      console.error(`10: The testing endpoint ${TEST_CONN.endPoint} is not ready.`, err);
    });
    await api.isReady;

    console.log("API connection successful.");

    // Setup the test user keyring
    const keyring = new Keyring(TEST_CONN.keyring as KeyringOptions);
    const testUserUri = `${DEV_SEED_PHRASE}//${DEV_ACCTS[0]}`;
    const testUser = keyring.addFromUri(testUserUri);

    await t.step("nextUserNonce() works", async () => {
      const cache = new UserNonces();
      const current = await cache.nextUserNonce(api, testUser);
      const next = await cache.nextUserNonce(api, testUser);
      assertEquals(current + 1, next);
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
