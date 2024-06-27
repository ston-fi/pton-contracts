# Proxy TON v2

## Introduction 

Proxy TON is an easy way to automatically tokenize native TON to facilitate interaction with the other smart contracts that use `transfer_notification` pattern

## Mechanics

### Deployment
In order to enable proxy ton for a certain address one must deploy pton wallet for this address first using `deploy_wallet` operation on minter. This operation can be called by anyone

### Sending ton

After the wallet is deployed you need to send `ton_transfer` op to this wallet with the amount of TON you need to tokenize and forward payload. Upon receiving `ton_transfer` the wallet will send `transfer_notification` to the owner of the wallet (dex, farm, etc) for further processing.

### Receiving ton

Upon getting tx with std jetton `transfer` op from the owner the wallet will send non-bouncable `ton_transfer` op with the specified amount of tokens to the user