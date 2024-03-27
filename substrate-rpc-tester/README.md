# Substrate RPC Tester

This tool connects to a series of Substrate RPC endpoints and sending a script of transactions to these endpoints.

To run the tester, you have to [install Deno](https://docs.deno.com/runtime/manual/getting_started/installation).

After cloning the repository, you can use it as:

```bash
deno task start -v config/localhost.jsonc
```

The `-v` options will give you a verbose output.

To build the binary:

```bash
deno task compile
```

The binary is built at `./dist/substrate-rpc-tester`. Afterwards you can replace the command section of `deno task start...` with `substrate-rpc-tester...`.

To get help on the command:

```bash
deno task start -h
```

## Configuration

An example of the config is as follows:

```jsonc
{
  "endPoint": "ws://127.0.0.1:9944",
  "keyring": {
    "type": "sr25519",
    "ss58Format": 11330,
  },
  "writeTxWait": "none",
  "connections": 2,
  "development": true,
  "signers": {
    "Brandon": "0x118a67f30b9d10b4efd11fd1c141909dd6f7c79f3586294905177b90bf6463fb",
    "Chris": "bottom drive obey lake curtain smoke basket hold race lonely fit walk//Chris",
  },
  "txs": [
    "api.query.timestamp.now",
    {
      "tx": "api.query.system.account",
      "params": ["Alice"],
    },
    {
      "tx": "api.tx.balances.transfer",
      "params": ["Bob", 12345],
      "signer": "Alice"
    },
    {
      "tx": "api.tx.balances.transfer",
      "params": ["Brandon", 5000000000000],
      "signer": "Alice"
    },
    {
      // Bob transfers back to Alice
      "tx": "api.tx.balances.transfer",
      "params": ["Chris", 2000000000000],
      "signer": "Brandon"
    },
    {
      // Alice adding Bob as proxy
      "tx": "api.tx.proxy.addProxy",
      // (address, Staking type, BlockNumber)
      "params": ["Brandon", "Staking", 16],
      "signer": "Chris"
    },
  ],
}
```

- **endPoint**: the RPC endpoints that the script is connecting to.

- **keyring** type to be `sr25519` and ss58 network prefix of `11330`. This is the network prefix of [CESS Testnet](https://github.com/paritytech/ss58-registry/blob/57920666a85e0ec28bf47bdbc9f9317a87649988/ss58-registry.json#L1237-L1245).

- **writeTxWait**: it can be `none` || `inBlock` || `finalized`. This determines the behavior of what happen after sending write transactions to the endpoint. `none` is not waiting. `inBlock` is waiting till the tx is included in a block. `finalized` is waiting till the tx is finalized.

- **connections**: number of connections connecting to the endpoint. This is for load-testing the particular endpoint.

- **development**: If this is true, `Alice`, `Bob`, `Charlie`, `Dave`, `Eve`, `Fredie` development accounts will be recognized when used in the **signer** field.

- **signers**: An key-value object, with the key being the signer ID, and the value being the mnemonic or private key.

- **txs**: the transactions to be sent over. It can be:
  - A string (if no parameters).
  - An object of "tx" and "params".
  - If it is a write transaction, you will need to include the signer ID.

### Running Tests

To run tests without connecing to a remote cess-node RPC connection

```bash
deno task test
```

To run tests with remote cess-node, let's specify a remote `RPC_ENDPOINT` env.
```bash
RPC_ENDPOINT="ws://127.0.0.1:9944" deno task test
```

## Performance Report

![Primitive Report](./doc/asset/primitive-report.png)

A primitive performance report is generated at the end on establishing the connections and executing all the transactions.
