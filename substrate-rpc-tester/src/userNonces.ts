import { ApiPromise } from "polkadot-js/api/mod.ts";
import type { KeyringPair } from "polkadot-js/keyring/types.ts";

import { transformTxResult } from "./utils.ts";

class UserNonces {
  nonces: Map<string, number>;

  constructor() {
    this.nonces = new Map();
  }

  async nextUserNonce(api: ApiPromise, signer: KeyringPair): Promise<number> {
    const rt = api.runtimeVersion;
    const key = `${rt.specName}-${rt.specVersion}/${signer.address}`;

    const nonce = this.nonces.has(key)
      ? this.nonces.get(key)
      : transformTxResult(await api.rpc.system.accountNextIndex(signer.address));

    if (typeof nonce !== "number") {
      throw new Error(`${key} nonce cannot be retrieved.`);
    }

    this.nonces.set(key, nonce + 1);
    return nonce;
  }
}

export { UserNonces };
