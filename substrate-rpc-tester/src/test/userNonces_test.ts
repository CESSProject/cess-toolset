import { assertEquals } from "std/assert/mod.ts";
import { ApiPromise, WsProvider } from "polkadot-js/api/mod.ts";

import { UserNonces } from "../userNonces.ts";
import { rpcEndPoint, testUser } from "./helpers.ts";

Deno.test({
  name: "Testing UserNonces caching",
  ignore: !rpcEndPoint || rpcEndPoint.length === 0,
  async fn(t) {
    // Setup the API
    const api = new ApiPromise({ provider: new WsProvider(rpcEndPoint) });
    api.on("error", (err) => console.error(`Error connecting to ${rpcEndPoint}:`, err));
    await api.isReady;

    console.log(`Connected to: ${rpcEndPoint}`);

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
