// Our own implementation
import config from "./config.ts";
import SubstrateRpcTester from "./substrateRpcTester.ts";

async function main() {
  const substrateRpcTester = new SubstrateRpcTester(config);
  await substrateRpcTester.initialize();
  await substrateRpcTester.executeTxs();

  substrateRpcTester.displayReport();
}

main()
  .catch(console.error)
  .finally(() => Deno.exit());
