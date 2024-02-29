import { parse } from "std/jsonc/mod.ts";
import { ApiPromise, WsProvider } from "polkadot-js/api/mod.ts";
import { Keyring } from "polkadot-js/keyring/mod.ts";
import { Mutex, withTimeout } from "async-mutex";
import type { ISubmittableResult } from "polkadot-js/types/types/index.ts";

// Our own implementation
import { UserNonces } from "./userNonces.ts";
import { getSigner, isWriteOp, transformParams, transformResult } from "./utils.ts";
import type { AppConfig, Tx } from "./types.ts";

const APP_CONFIG_PATH = "./src/config.jsonc";
const API_PREFIX = "api";

const config: AppConfig = parse(await Deno.readTextFile(APP_CONFIG_PATH)) as unknown as AppConfig;
const keyring = new Keyring(config.keyring);

// For keeping track of user nonce when spitting out txs
// The mutex time out in 5 sec.
const mutex = withTimeout(new Mutex(), 5000, new Error("mutex time out"));
const userNonces = new UserNonces();

// deno-lint-ignore no-explicit-any
function getTxCall(api: ApiPromise, txStr: string): any {
  const segs = txStr.split(".");
  return segs.reduce(
    // @ts-ignore: traversing the ApiPromise need quite some types manipulation and understanding
    //   polkadot-js type.
    //   https://github.com/polkadot-js/build-deno.land/blob/master/api-base/types
    //   Future todo.
    (txCall, seg, idx) => idx === 0 && seg === API_PREFIX ? txCall : txCall[seg],
    api,
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
    } else if (!isWriteOp(tx)) {
      // tx is an Object but is a readOp
      txStr = tx.tx;
      const txCall = getTxCall(api, txStr);
      const transformedParams = Array.isArray(tx.params) ? transformParams(keyring, tx.params) : [];

      lastResult = await txCall.call(txCall, ...transformedParams);
    } else {
      // tx is a writeOp
      txStr = tx.tx;
      const txCall = getTxCall(api, txStr);
      const transformedParams = Array.isArray(tx.params) ? transformParams(keyring, tx.params) : [];

      if (!tx.sign || tx.sign.length === 0) {
        throw new Error(`${txStr} writeOp has no signer specified.`);
      }

      const signer = getSigner(keyring, tx.sign);

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
            .then((us: () => void) => {
              unsub = us;
            });

          release();
        });
      }
    }
    lastResult = transformResult(lastResult);
    console.log(`${txStr}\n  L`, lastResult);
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

  const results = await Promise.allSettled(apiPromises);

  const apis = results.reduce(
    (memo, res, idx) => {
      if (res.status === "fulfilled") return memo.concat([res.value]);
      console.log(`Connection rejected: ${connArr[idx]}`);
      return memo;
    },
    [] as Array<ApiPromise>,
  );

  await Promise.all(apis.map((api) => sendTxsToApi(api, txs)));
}

main()
  .catch(console.error)
  .finally(() => Deno.exit());
