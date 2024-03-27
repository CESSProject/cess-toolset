import type { KeyringOptions, KeyringPair } from "polkadot-js/keyring/types.ts";
import { cryptoWaitReady } from "polkadot-js/util-crypto/mod.ts";
import { Keyring } from "polkadot-js/keyring/mod.ts";
import { DEV_ACCTS, DEV_SEED_PHRASE } from "../utils.ts";

const KEYRING_OPT = {
  type: "sr25519",
  ss58Format: 11330,
} as KeyringOptions;

export const rpcEndPoint = Deno.env.get("RPC_ENDPOINT");

// Setup the test user keyring
export const keyring = new Keyring(KEYRING_OPT);
await cryptoWaitReady();

const testUserUri = `${DEV_SEED_PHRASE}//${DEV_ACCTS[0]}`;
export const testUser: KeyringPair = keyring.addFromUri(testUserUri);
