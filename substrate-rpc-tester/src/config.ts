import type { AppConfig } from "./types.ts";

const Config: AppConfig = {
  endPoint: "ws://127.0.0.1:9944",
  // "wss://testnet-rpc1.cess.cloud/ws/",
  // "wss://rpc.polkadot.io"
  keyring: {
    // see: https://github.com/paritytech/ss58-registry/blob/main/ss58-registry.json
    type: "sr25519",
    ss58Format: 11330,
  },
  writeTxWait: "inblock",
  connections: 2,
  development: true,
  signers: {
    // Biden using secret key
    Biden: "0x118a67f30b9d10b4efd11fd1c141909dd6f7c79f3586294905177b90bf6463fb",
    // Chris using mnemonic and derived path
    Chris: "bottom drive obey lake curtain smoke basket hold race lonely fit walk//Chris",
  },
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
      params: ["Biden", 5000000000000],
      signer: "Alice",
    },
    {
      // Bob transfers back to Alice
      tx: "api.tx.balances.transfer",
      params: ["Chris", 2000000000000],
      signer: "Biden",
    },
    {
      // Alice adding Bob as proxy
      tx: "api.tx.proxy.addProxy",
      // (address, Staking type, BlockNumber)
      params: ["Biden", "Staking", 16],
      signer: "Chris",
    },
  ],
};

export default Config;
