import { ApiPromise, WsProvider } from "polkadot-js/api/mod.ts";
import { Keyring } from "polkadot-js/keyring/mod.ts";
import type { KeyringPair } from "polkadot-js/keyring/types.ts";
import { Mutex, MutexInterface, withTimeout } from "async-mutex";
import type { ISubmittableResult } from "polkadot-js/types/types/index.ts";

import { AppConfig, AppOptions, Tx } from "./types.ts";
import { UserNonces } from "./userNonces.ts";
import * as utils from "./utils.ts";

const MUTEX_TIMEOUT = 5000;
const { DEV_SEED_PHRASE, DEV_ACCTS } = utils;

class SubstrateRpcTester {
  config: AppConfig;
  opts: AppOptions;
  apis: ApiPromise[];
  keyring: Keyring;
  signers: Map<string, KeyringPair>;
  mutex: MutexInterface;
  userNonces: UserNonces;
  txResults: Map<number, string[]>;

  constructor(_config: AppConfig, opts: AppOptions = {}) {
    this.config = _config;
    this.apis = [];
    this.opts = opts;
    this.keyring = new Keyring(_config.keyring);
    this.signers = new Map();
    this.mutex = withTimeout(new Mutex(), MUTEX_TIMEOUT, new Error("mutex time out"));
    this.userNonces = new UserNonces();
    this.txResults = new Map();
  }

  async setupApis() {
    // Setup apis
    const arr = Array.from(Array(this.config.connections).keys());
    const apiPromises: Promise<ApiPromise>[] = arr.map(() =>
      ApiPromise.create({ provider: new WsProvider(this.config.endPoint) })
    );

    await utils.measurePerformance("connectAPI", async () => {
      this.apis = await Promise.all(apiPromises);
    });
  }

  setupSigners() {
    const keyring = this.keyring;
    if (this.config.development) {
      for (const acct of DEV_ACCTS) {
        this.signers.set(acct, keyring.addFromUri(`${DEV_SEED_PHRASE}//${acct}`));
      }
    }

    if (this.config.signers) {
      for (const en of Object.entries(this.config.signers)) {
        this.signers.set(en[0], keyring.addFromUri(en[1]));
      }
    }
  }

  async initialize() {
    await this.setupApis();
    this.setupSigners();
  }

  appendExeLog(idx: number, logLine: string) {
    this.txResults.has(idx)
      ? (this.txResults.get(idx) as string[]).push(logLine)
      : this.txResults.set(idx, [logLine]);
  }

  async executeTxs(ptxs?: Tx[]) {
    const txs = ptxs ? ptxs : this.config.txs;
    await Promise.all(this.apis.map((api, idx) => this.executeTxsOnAnApi(api, idx, txs)));
  }

  async executeTxsOnAnApi(api: ApiPromise, idx: number, txs: Tx[]) {
    let txStr;
    let lastResult;

    await utils.measurePerformance(`${idx + 1}-executeTxs`, async () => {
      for (const tx of txs) {
        this.opts.verbose && console.log(`executing ${idx + 1}:`, tx);

        if (typeof tx === "string") {
          txStr = tx;
          const txCall = utils.getTxCall(api, tx);
          lastResult = await txCall.call(txCall);
        } else if (!utils.isWriteOp(tx)) {
          // tx is an Object but is a readOp
          txStr = tx.tx;
          const txCall = utils.getTxCall(api, txStr);
          const transformedParams = Array.isArray(tx.params)
            ? utils.transformTxParams(tx.params, this.signers)
            : [];
          lastResult = await txCall.call(txCall, ...transformedParams);
        } else {
          // tx is a writeOp
          txStr = tx.tx;
          const txCall = utils.getTxCall(api, txStr);
          const transformedParams = Array.isArray(tx.params)
            ? utils.transformTxParams(tx.params, this.signers)
            : [];

          const signer = utils.getSigner(tx.signer, this.signers);

          // lock the mutex
          const release = await this.mutex.acquire();
          const nonce = await this.userNonces.nextUserNonce(api, signer);
          const { writeTxWait = false } = this.config;

          if (!writeTxWait || writeTxWait === "none") {
            const txReceipt = await txCall
              .call(txCall, ...transformedParams)
              .signAndSend(signer, { nonce });

            // release the mutex
            release();
            lastResult = `txReceipt: ${txReceipt}`;
          } else {
            lastResult = await new Promise((resolve, reject) => {
              let unsub: () => void;
              const buf: string[] = [];

              txCall
                .call(txCall, ...transformedParams)
                .signAndSend(signer, { nonce }, (res: ISubmittableResult) => {
                  const { status, txHash } = res;

                  if (res.isInBlock) {
                    buf.push(`txHash: ${txHash.toHex()}`);

                    if (writeTxWait === "inblock") {
                      buf.push(`block:  ${status.asInBlock}`);
                      unsub();
                      resolve(buf);
                    }
                  }
                  if (res.isFinalized && writeTxWait === "finalized") {
                    buf.push(`fnl:    ${status.asFinalized}`);
                    unsub();
                    resolve(buf);
                  }
                  if (res.isError) {
                    buf.push(`error:  ${res.dispatchError}`);
                    unsub();
                    reject(buf);
                  }
                })
                .then((us: () => void) => (unsub = us));

              release();
            });
          }
        }

        lastResult = utils.transformTxResult(lastResult);
        this.appendExeLog(
          idx,
          `${utils.txDisplay(tx)}\n  L ${utils.stringify(lastResult, 4)}\n`,
        );
      }
    });
  }

  displayTxResults() {
    utils.displayTxResults(this.config.connections, this.txResults);
  }

  displayPerformance() {
    utils.displayPerformance();
  }
}

export default SubstrateRpcTester;
