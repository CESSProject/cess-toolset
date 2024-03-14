import { Command } from "commander";

// Our own implementation
import { AppConfig, AppOptions } from "./types.ts";
import SubstrateRpcTester from "./substrateRpcTester.ts";
import validateConfig from "./configSchema.ts";
import * as jsonc from "std/jsonc/mod.ts";

function main() {
  const program = new Command();
  program
    .name("Substrate RPC Tester")
    .description("CLI tool to play a script to remote RPC with a statistic report at the end.")
    .version("0.1.0");

  program
    .argument("<config-path>", "path to a config file (jsonc format)")
    .option("-v, --verbose", "verbose execution output", false)
    .action(async (configPath, opts) => {
      const configTxt = await Deno.readTextFile(configPath);
      const config = jsonc.parse(configTxt);

      if (!validateConfig(config)) {
        console.error("Invalid config file");
        console.error(validateConfig.errors);
        Deno.exit(1);
      }

      const substrateRpcTester = new SubstrateRpcTester(
        config as unknown as AppConfig,
        opts as AppOptions,
      );
      await substrateRpcTester.initialize();
      await substrateRpcTester.executeTxs();

      substrateRpcTester.displayTxResults();
      substrateRpcTester.displayPerformance();

      Deno.exit();
    });

  program.parse();
}

main();
