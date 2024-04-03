import { assert } from "std/assert/mod.ts";
import * as jsonc from "std/jsonc/mod.ts";
import { fromFileUrl } from "std/path/mod.ts";

import { rpcEndPoint } from "./helpers.ts";
import SubstrateRpcTester from "../substrateRpcTester.ts";
import validateConfig from "../configSchema.ts";
import type { AppConfig } from "../types.ts";

const SCRIPT_PATH = fromFileUrl(import.meta.resolve("./test_cfg.jsonc"));

Deno.test({
  name: "Running test_cfg.jsonc script once should work",
  ignore: !rpcEndPoint || rpcEndPoint.length === 0,
  async fn(t) {
    await t.step("Running test_cfg.jsonc against cess-node should work", async () => {
      console.log(SCRIPT_PATH);
      const configTxt = await Deno.readTextFile(SCRIPT_PATH);
      const config = jsonc.parse(configTxt);

      assert(
        validateConfig(config),
        `script file at ${SCRIPT_PATH} should be a valid config file.`,
      );

      const appConfig = config as unknown as AppConfig;
      appConfig.connections = 1;
      // Replace the config RPC endpoint with the one from env
      appConfig.endPoint = rpcEndPoint as string;

      const substrateRpcTester = new SubstrateRpcTester(appConfig, { verbose: true });
      await substrateRpcTester.initialize();
      await substrateRpcTester.executeTxs();

      substrateRpcTester.displayTxResults();
      substrateRpcTester.displayPerformance();
    });
  },
  sanitizeOps: false,
  sanitizeResources: false,
});
