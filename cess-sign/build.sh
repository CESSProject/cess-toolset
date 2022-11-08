#!/bin/bash

export CGO_ENABLED=0
export GOOS=linux
export GOARCH=amd64

rm cess-sign_linux 
go build -o cess-sign_linux main.go

export GOOS=windows
rm cess-sign_win.exe
go build -o cess-sign_win.exe main.go
