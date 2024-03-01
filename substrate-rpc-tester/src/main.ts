import { ApiPromise, WsProvider } from "polkadot-js/api/mod.ts";
import { Keyring } from "polkadot-js/keyring/mod.ts";
import { Mutex, withTimeout } from "async-mutex";
import type { ISubmittableResult } from "polkadot-js/types/types/index.ts";

// Our own implementation
import config from "./config.ts";
import { UserNonces } from "./userNonces.ts";
import * as utils from "./utils.ts";
import type { TimingRecord, Tx } from "./types.ts";

const API_PREFIX = "api";
const keyring = new Keyring(config.keyring);

// For keeping track of user nonce when spitting out txs
// The mutex time out in 5 sec.
const mutex = withTimeout(new Mutex(), 5000, new Error("mutex time out"));
const userNonces = new UserNonces();

const timings: TimingRecord = {};

// deno-lint-ignore no-explicit-any
function getTxCall(api: ApiPromise, txStr: string): any {
  const segs = txStr.split(".");
  return segs.reduce(
    (txCall, seg, idx) => idx === 0 && seg === API_PREFIX ? txCall : txCall[seg],
    // deno-lint-ignore no-explicit-any
    api as Record<string, any>,
  );
}

async function sendTxsToApi(api: ApiPromise, txs: Array<Tx>) {
  let txStr;
  let lastResult;

  for (const tx of txs) {
    if (typeof tx === "string") {
      txStr = tx;
      const txCall = getTxCall(api, tx);
      lastResult = await txCall.call(txCall);
    } else if (!utils.isWriteOp(tx)) {
      // tx is an Object but is a readOp
      txStr = tx.tx;
      const txCall = getTxCall(api, txStr);
      const transformedParams = Array.isArray(tx.params)
        ? utils.transformParams(keyring, tx.params)
        : [];

      lastResult = await txCall.call(txCall, ...transformedParams);
    } else {
      // tx is a writeOp
      txStr = tx.tx;
      const txCall = getTxCall(api, txStr);
      const transformedParams = Array.isArray(tx.params)
        ? utils.transformParams(keyring, tx.params)
        : [];

      if (!tx.signer || tx.signer.length === 0) {
        throw new Error(`${txStr} writeOp has no signer specified.`);
      }

      const signer = utils.getSigner(keyring, tx.signer);

      // lock the mutex
      const release = await mutex.acquire();
      const nonce = await userNonces.nextUserNonce(api, signer);

      if (!config.writeTxWait || config.writeTxWait === "none") {
        const txReceipt = await txCall
          .call(txCall, ...transformedParams)
          .signAndSend(signer, { nonce });

        // release the mutex
        release();
        lastResult = `txReceipt: ${txReceipt}`;
      } else {
        lastResult = await new Promise((resolve, reject) => {
          let unsub: () => void;
          txCall
            .call(txCall, ...transformedParams)
            .signAndSend(signer, { nonce }, (res: ISubmittableResult) => {
              if (config.writeTxWait === "inBlock" && res.isInBlock) {
                unsub();
                resolve(`inBlock: ${res.status.asInBlock}`);
              }
              if (config.writeTxWait === "finalized" && res.isFinalized) {
                unsub();
                resolve(`finalized: ${res.status.asFinalized}`);
              }
              if (res.isError) {
                unsub();
                reject(`error: ${res.dispatchError}`);
              }
            })
            .then((us: () => void) => (unsub = us));

          release();
        });
      }
    }
    lastResult = utils.transformResult(lastResult);
    console.log(`${utils.txDisplay(tx)}\n  L`, lastResult);
  }

  return lastResult;
}

async function main() {
  const { endPoints, connections, txs } = config;
  const connArr: string[] = endPoints.reduce(
    (memo, ep) => memo.concat([...Array(connections).keys()].map(() => ep)),
    [] as string[],
  );

  const apiPromises: Promise<ApiPromise>[] = connArr.map((ep) =>
    ApiPromise.create({ provider: new WsProvider(ep) })
  );

  timings["allConnStart"] = performance.now();

  const results = await Promise.allSettled(apiPromises);

  timings["allConnEnd"] = performance.now();

  const apis = results.reduce(
    (memo, res, idx) => {
      if (res.status === "fulfilled") return memo.concat([res.value]);
      console.log(`Connection rejected: ${connArr[idx]}`);
      return memo;
    },
    [] as Array<ApiPromise>,
  );

  timings["allTxsStart"] = performance.now();

  await Promise.all(apis.map((api) => sendTxsToApi(api, txs)));

  timings["allTxsEnd"] = performance.now();

  utils.displayTimingReport(timings);
}

main()
  .catch(console.error)
  .finally(() => Deno.exit());
