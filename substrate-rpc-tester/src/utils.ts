import { ApiPromise } from "polkadot-js/api/mod.ts";
import chalk from "chalk";
import type { KeyringPair } from "polkadot-js/keyring/types.ts";

// Our own implementation
import type { Tx, TxParam } from "./types.ts";

const API_PREFIX = "api";

export const DEV_SEED_PHRASE =
  "bottom drive obey lake curtain smoke basket hold race lonely fit walk";
export const DEV_ACCTS = ["Alice", "Bob", "Charlie", "Dave", "Eve", "Fredie"];

export function transformTxParams(params: Array<TxParam>, signers: Map<string, KeyringPair>) {
  return params.map((param) => {
    // if it is a dev account
    if (typeof param === "string" && signers.has(param)) {
      return (signers.get(param) as KeyringPair).address;
    } else if (typeof param === "number" && !Number.isSafeInteger(param)) {
      return BigInt(param);
    }
    // return its original form
    return param;
  });
}

export function getSigner(
  signerStr: string | undefined,
  signers: Map<string, KeyringPair>,
): KeyringPair {
  if (!signerStr || signerStr.length === 0) {
    throw new Error(`writeOp has no signer specified.`);
  }
  if (!signers.has(signerStr)) {
    throw new Error(`${signerStr} signer is not recognized`);
  }
  return signers.get(signerStr) as KeyringPair;
}

// This function works on polkadot-js api type. It is quite complicated with the dynamic type
//   fetched on-chain.
//   ref: https://polkadot.js.org/docs/api/start/types.basics
// deno-lint-ignore no-explicit-any
export function transformTxResult(result: any): any {
  if (typeof result === "object" && "toJSON" in result) {
    return result.toJSON();
  }
  return result;
}

export function isWriteOp(tx: Tx): boolean {
  if (typeof tx === "string") return false;
  return tx.tx.includes("tx.");
}

// deno-lint-ignore no-explicit-any
export function getTxCall(api: ApiPromise, txStr: string): any {
  const segs = txStr.split(".");
  return segs.reduce(
    (txCall, seg, idx) => idx === 0 && seg === API_PREFIX ? txCall : txCall[seg],
    // deno-lint-ignore no-explicit-any
    api as Record<string, any>,
  );
}

export function txDisplay(tx: Tx): string {
  const decorate = chalk.underline;
  const em = "🔗";
  let text: string;

  if (typeof tx === "string") {
    text = `${tx}()`;
  } else {
    const paramsStr = tx.params ? tx.params.join(", ") : "";
    text = !tx.signer ? `${tx.tx}(${paramsStr})` : `${tx.tx}(${paramsStr}) | ✍️  ${tx.signer}`;
  }
  return `${em} ${decorate(text)}`;
}

export function stringify(
  result: string | number | boolean | object | Array<unknown>,
  spacing: number = 0,
): string {
  if (Array.isArray(result)) {
    if (result.length > 0 && typeof result[0] === "string") {
      return result.join(`\n${" ".repeat(spacing)}`);
    }
    // an array of object or empty array
    return JSON.stringify(result, undefined, 2);
  }

  if (typeof result === "object") {
    return JSON.stringify(result, undefined, 2);
  }

  return result.toString();
}

export async function measurePerformance(name: string, fnPromise: () => Promise<unknown>) {
  performance.mark(name);
  await fnPromise();
  performance.measure(name, name);
}

// For display
const { log: display } = console;
const mainTitle = chalk.bold.yellowBright.inverse;
const catTitle = chalk.bgBlack.yellow;
// const keyF = chalk.cyan;
// const valF = chalk.whiteBright;

export function displayTxResults(conn: number, txResults: Map<number, string[]>) {
  for (let idx = 0; idx < conn; idx++) {
    display(mainTitle(`-- Connection ${idx + 1} --`));

    const res = txResults.get(idx);
    if (res && res.length > 0) display(res.join("\n"));
  }
}

export function displayPerformance() {
  display(mainTitle("-- Performance --"));

  const measures = performance.getEntriesByType("measure");
  for (const measure of measures) {
    display(catTitle(measure.name), `start: ${measure.startTime}, duration: ${measure.duration}ms`);
  }
}
