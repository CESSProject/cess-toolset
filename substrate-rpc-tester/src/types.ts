export type TxParam = string | number;

export interface TxObj {
  tx: string;
  params?: Array<TxParam>;
  signer?: string;
}

export type Tx = string | TxObj;

export interface AppConfig {
  keyring: {
    type: "sr25519" | "ed25519" | "ecdsa";
    ss58Format: number;
  };
  writeTxWait?: "none" | "inBlock" | "finalized";
  endPoints: Array<string>;
  connections: number;
  txs: Tx[];
}

export type TimingRecord = Record<string, number>;
