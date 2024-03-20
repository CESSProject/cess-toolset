export type TxParam = string | number | bigint;

export interface TxObj {
  tx: string;
  params?: Array<TxParam>;
  signer?: string;
}

export type Tx = string | TxObj;

export interface AppConfig {
  endPoint: string;
  keyring: {
    type: "sr25519" | "ed25519" | "ecdsa";
    ss58Format: number;
  };
  writeTxWait?: "none" | "inblock" | "finalized";
  connections: number;
  development?: boolean;
  signers?: Record<string, string>;
  txs: Tx[];
}

export interface AppOptions {
  verbose?: boolean;
}
