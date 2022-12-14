#!/bin/bash

export CGO_ENABLED=0
export GOOS=linux
export GOARCH=amd64

if [[ -f cess-sign_linux ]];then
    rm -fe cess-sign_linux
fi

go build -o cess-sign_linux main.go

export GOOS=windows
if [[ -f cess-sign_win.exe ]];then
    rm -fe cess-sign_win.exe
fi
go build -o cess-sign_win.exe main.go
