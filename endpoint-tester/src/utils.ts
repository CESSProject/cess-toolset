import { Keyring } from "polkadot-js/keyring/mod.ts";
import type { KeyringPair } from "polkadot-js/keyring/types.ts";

// Our own implementation
import type { Tx, TxParam } from "./types.ts";

export const DEV_SEED_PHRASE =
  "bottom drive obey lake curtain smoke basket hold race lonely fit walk";
export const DEV_ACCTS = ["Alice", "Bob", "Charlie", "Dave", "Eve", "Fredie"];

export function transformParams(keyring: Keyring, params: Array<TxParam>) {
  return params.map((param) => {
    // if it is a dev account
    if (typeof param === "string" && DEV_ACCTS.includes(param)) {
      const acct = keyring.addFromUri(`${DEV_SEED_PHRASE}//${param}`);
      return acct.address;
    }

    // return its original form
    return param;
  });
}

// This function works on polkadot-js api type. It is quite complicated with the dynamic type
//   fetched on-chain.
//   ref: https://polkadot.js.org/docs/api/start/types.basics
// deno-lint-ignore no-explicit-any
export function transformResult(result: any): any {
  if (typeof result === "object" && "toJSON" in result) {
    return result.toJSON();
  }
  return result;
}

export function isWriteOp(tx: Tx): boolean {
  if (typeof tx === "string") return false;
  return tx.tx.includes("tx.");
}

export function getSigner(keyring: Keyring, signerStr: string): KeyringPair {
  if (DEV_ACCTS.includes(signerStr)) {
    return keyring.addFromUri(`${DEV_SEED_PHRASE}//${signerStr}`);
  }
  return keyring.addFromUri(signerStr);
}