package main

import (
	"fmt"
	"log"
	"os"

	keyring "github.com/CESSProject/go-keyring"
	"github.com/centrifuge/go-substrate-rpc-client/v4/signature"
)

func main() {
	if len(os.Args) >= 3 {
		_, err := signature.KeyringPairFromSecret(os.Args[1], 0)
		if err != nil {
			log.Println("[err] Wrong mnemonic")
			os.Exit(1)
		}

		kr, _ := keyring.FromURI(os.Args[1], keyring.NetSubstrate{})

		// output public SS58 formatted address
		ss58, _ := kr.SS58Address()

		// sign message
		msg := []byte(os.Args[2])
		sig, _ := kr.Sign(kr.SigningContext(msg))
		sig_str := "["

		var sss = sig[:]
		var ccc [64]byte
		for i := 0; i < 64; i++ {
			ccc[i] = sss[i]
		}
		// create new keyring from SS58 public address to verify message signature
		verkr, _ := keyring.FromURI(ss58, keyring.NetSubstrate{})

		if verkr.Verify(verkr.SigningContext(msg), ccc) {
			for i := 0; i < len(sig); i++ {
				sig_str += fmt.Sprintf("%v", byte(sig[i]))
				if (i + 1) < len(sig) {
					sig_str += ","
				}
			}
			sig_str += "]"
			fmt.Println(sig_str)
		} else {
			fmt.Println("Failed")
		}
		return
	}
	log.Println("[err] Please enter 'cess-sign <your account mnemonic> <message>'")
	os.Exit(1)
}
