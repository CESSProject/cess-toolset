import type { AppConfig } from "./types.ts";

const Config: AppConfig = {
  keyring: {
    // see: https://github.com/paritytech/ss58-registry/blob/main/ss58-registry.json
    type: "sr25519",
    ss58Format: 11330,
  },
  writeTxWait: "none",
  endPoints: [
    "ws://127.0.0.1:9944",
    // "wss://testnet-rpc1.cess.cloud/ws/",
    // "wss://rpc.polkadot.io"
  ],
  connections: 5,
  txs: [
    "api.query.timestamp.now",
    {
      tx: "api.query.system.account",
      params: ["Alice"],
    },
    {
      // Alice transfers to Bob
      tx: "api.tx.balances.transfer",
      params: ["Bob", 12345],
      signer: "Alice",
    },
    {
      // Bob transfers back to Alice
      tx: "api.tx.balances.transfer",
      params: ["Alice", 12345],
      signer: "Bob",
    },
    {
      // Alice adding Bob as proxy
      tx: "api.tx.proxy.addProxy",
      // (address, Staking type, BlockNumber)
      params: ["Bob", "Staking", 16],
      signer: "Alice",
    },
  ],
};

export default Config;
