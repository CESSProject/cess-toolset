# cess-sign
cess-sign is a signing tool, Enter the wallet private key and message to get the message signature.

the signature tool supports linux and windows systems.

## System Requirements

- Linux-amd64

## Usage
```
git clone https://github.com/CESSProject/cess-toolset.git
cd cess-sign/
chmod +x build.sh
./build.sh
```

## Example

- linux
```
./cess-sign_linux "account mnemonic" "message"
[172,231,60,124,...,156,190,237,135]
```

- windows
```
cess-sign_win.exe "account mnemonic" "message"
[172,231,60,124,...,156,190,237,135]
```