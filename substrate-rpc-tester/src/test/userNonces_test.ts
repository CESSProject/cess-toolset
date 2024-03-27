import { assertEquals } from "std/assert/mod.ts";
import { ApiPromise, WsProvider } from "polkadot-js/api/mod.ts";
import { Keyring } from "polkadot-js/keyring/mod.ts";
import { KeyringOptions } from "polkadot-js/keyring/types.ts";

import { UserNonces } from "../userNonces.ts";
import { DEV_ACCTS, DEV_SEED_PHRASE } from "../utils.ts";

const KEYRING_OPT = {
  type: "sr25519",
  ss58Format: 11330,
} as KeyringOptions;

const rpcEndPoint = Deno.env.get("RPC_ENDPOINT");

Deno.test({
  name: "Testing UserNonces caching",
  ignore: !rpcEndPoint || rpcEndPoint.length === 0,
  async fn(t) {
    // Setup the API
    const api = new ApiPromise({ provider: new WsProvider(rpcEndPoint) });
    api.on("error", (err) => console.error(`Error connecting to ${rpcEndPoint}:`, err));
    await api.isReady;

    console.log(`Connected to: ${rpcEndPoint}`);

    // Setup the test user keyring
    const keyring = new Keyring(KEYRING_OPT);
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
