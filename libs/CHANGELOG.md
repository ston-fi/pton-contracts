# Changelog

## [0.7.8] - 2024-09-17

- fixed `[object Object]` serialization in config
- `contract-inspector` -> `inspector`
- fixed tests
- fixed `pay_to` dex v2 op

## [0.7.7] - 2024-09-16

- add build annotation to better `prompt-sync` tree shaking
- inline `getExpLink` logic to remove deps from `blueprint` in onchain-helper.ts

## [0.7.6] - 2024-09-12

- fix config

## [0.7.5] - 2024-09-12

- `loggerBuilder` only transforms strings to color

## [0.7.4] - 2024-09-11

- added `publicKeys` to on-chain nft meta,
- added `processPublicKeys`
- added meta tests

## [0.7.3] - 2024-09-11

- fix types for codes.ts

## [0.7.2] - 2024-09-09

- adding `confirmBuilder` and `loggerBuilder`
- optimizing `color.colorText` and `color.decolorText`
- added `process.env.STON_CONTRACTS_LOGGER_DISABLED` to opt-out `console.log` in `color.log`
- optimizing `findArgs`
- refactored `resolve` function and added `parseData` method to config class
- introduced `runWithRetry` util function and refactored `getSeqNo`, `waitSeqNoChange`, `awaitConfirmation`, `fetchJettonData`, `getAccountState`, `waitForDeploy` based on that implementation
- refactored `toRevStr`
- added some tests

## [0.7.1] - 2024-09-06

- added dex_v1, dex_v2, farm_v3 op codes
- fixed tx parsers

## [0.7.0] - 2024-09-06

- move meta helpers to separate file
- nft wrappers parse on-chain content
- added `parseMeta`
- added `lib` param to `compileX`
- refactored config
- config tests

## [0.6.3] - 2024-09-04

- added `waitForDeploy`

## [0.6.2] - 2024-08-28

- refactor structure
- separate tests suits
- more tests

## [0.6.1] - 2024-08-28

- updated parser grammar

## [0.6.0] - 2024-08-26

Breaking: 

- refactored graph utils 
- removed `hexOpStr` (use `toHexStr` instead)

## [0.5.17] - 2024-08-20

- fix `buildLibFromCell` without ref cell

## [0.5.16] - 2024-08-19

- fix `beginMessage` test

## [0.5.15] - 2024-08-19

- `buildLibFromCell` stores libs without additional commands

## [0.5.14] - 2024-08-16

- added account state utils

## [0.5.13] - 2024-08-08

- added stage pton v2.1 as `PTON_MAINNET_ADDRESS_v2`
- added a bunch of test tokens to token list

## [0.5.12] - 2024-08-08

- added `rndBigInt64`
- `beginMessage` now uses `rndBigInt64`

## [0.5.11] - 2024-08-07

- added `isPton`

## [0.5.10] - 2024-08-06

- added `strict` arg to `findArgs` (search for includes in args)

## [0.5.9] - 2024-07-31

- skip on failure to parse op in graph
- added `intNumber`
- added `toHexStr`

## [0.5.8] - 2024-07-24

- fix op display without `0x` in graph

## [0.5.7] - 2024-07-22

- added `parseCBAddLiqV1`

## [0.5.6] - 2024-07-22

- removed parsed ops because relative paths don't work

## [0.5.5] - 2024-07-19

- added `parseLpV2`

## [0.5.4] - 2024-07-18

- moved inspector test to `./tests/`
- added raw tx parser for `pay_to` v2
- added op files for dex_v2, farm_v3 and pton_v2
- added `defaultCodeMap` with those codes

## [0.5.2] - 2024-07-18

- add `ContractInspector` lib
- add `crc16` utils

## [0.5.1] - 2024-06-13

- add `defaultPath` to config constructor

## [0.5.0] - 2024-06-04

- breaking: added support for pTon v2 and refactored v1 wrappers

## [0.4.25] - 2024-05-24

- fix op parser

## [0.4.24] - 2024-05-23

- display ops in `0x..` format in graph
- add `hexOpStr`

## [0.4.23] - 2024-05-23

- add amount to `transfer_notification` in graph

## [0.4.22] - 2024-05-22

- improve conf parser

## [0.4.21] - 2024-05-16

- added support for on-chain token `imageData`

## [0.4.20] - 2024-05-16

- floor result in date helpers

## [0.4.19] - 2024-05-15

- default explorer `tonviewer`

## [0.4.18] - 2024-05-10

- added pton_v1 consts as separate variables
- added `ptonv1` to token list 

## [0.4.17] - 2024-05-08

- refactor graph

## [0.4.16] - 2024-05-07

- added `feeDetails` in graph

## [0.4.15] - 2024-05-07

- added `parseTokenAddress`
- added `expr` in `color`

## [0.4.14] - 2024-05-07

- added `defaultConfigLegacy` and `defaultConfigSeqnoLegacy`

## [0.4.13] - 2024-05-07

- added `tokenAddresses`

## [0.4.12] - 2024-05-07

- upd index

## [0.4.11] - 2024-05-06

- added `captionsMap` in graph for custom op parsing

## [0.4.10] - 2024-05-03

- `getExpLink` returns `null` if address `null` or `undefined`
- `getSeqNo` tries 3 -> 4
- added `rndBigInt32`
- added `dateFromSec`
- added `prettyBalance`
- added `prettyFees`
- added `prettyVersion`
- added `fromNowSec`
- added `dateFromNowSec`
- added `nowSec`

## [0.4.9] - 2024-04-23

- `fetchJettonData` prints msgs if it fails to fetch url

## [0.4.8] - 2024-04-22

- add graph direction

## [0.4.7] - 2024-04-03

- parse broken dex v1 pools in `getJettonData`

## [0.4.6] - 2024-03-31

- timeout 45 -> 75 sec

## [0.4.5] - 2024-03-22

- parse testnet addresses test
- update dependencies

## [0.4.4] - 2024-03-16

- auto retries in `getSeqNo`

## [0.4.3] - 2024-03-15

- added `readLibHex`
- added `toCoins`
- added `fDate`

## [0.4.2] - 2024-03-13

- fix parse transfer code in graph

## [0.4.1] - 2024-03-06

- parse `fwd_op` in graph on `transfer_notification`

## [0.4.0] - 2024-02-20

- breaking: `compileX` second optional arg is now an object
- added base64 and cells representations as options to `compileX`
  
## [0.3.6] - 2024-02-20

- `fetchJettonData` displays fetch error in console 

## [0.3.5] - 2024-02-20

- `parseVersion` parses patch into dev string

## [0.3.4] - 2024-01-04

- default 9 decimals in `fetchJettonData`

## [0.3.3] - 2023-12-14

- support value as separate arg in wrappers
- timeout arg in `awaitConfirmation` and `waitSeqNoChange`
- improve `fetchJettonData`

## [0.3.2] - 2023-12-06

- added Deployer
- graph bracket map

## [0.3.1] - 2023-12-05

- added fetchJettonData
- added parseVersion
- `showOrigin` param in graph

## [0.3.0] - 2023-12-04

- migrate to latest blueprint
  
## [0.2.23] - 2023-12-01

- display ref fee in graph

## [0.2.22] - 2023-12-01

- added helper types
  
## [0.2.21] - 2023-11-29

- added support for data in preproc
- added `buildLibs`

## [0.2.20] - 2023-11-24

- added pTON wrappers
- throw in abc jetton wrappers if op is 0

## [0.2.19] - 2023-11-21

- graph parses `pay_to` exit code

## [0.2.18] - 2023-11-20

- added `checkEqKeys` in test-helpers
  
## [0.2.17] - 2023-11-17

- graph hides ok values

## [0.2.16] - 2023-11-15

- hole address helpers

## [0.2.15] - 2023-11-03

- token data in `graph` for `swap`
- added `chartType` param in `graph`
  
## [0.2.14] - 2023-10-31

- token data in `graph`
  
## [0.2.13] - 2023-10-27

- fix preproc path not working on win

## [0.2.12] - 2023-10-23

## helpers

- added `isBnOrNanoStr`

## build-libs

- added output options arg

## [0.2.11] - 2023-10-21

- fix `JettonMinterContractBase` `totalSupply` type
- `sendDeploy` non-bouncable
- `fromNanos` decimals arg

## [0.2.10] - 2023-10-17

## helpers

- added `isArgPresent`

## [0.2.9] - 2023-10-17

## helpers

- added `waitConfirm`
  
## [0.2.8] - 2023-10-17

- added preprocessor helpers

## [0.2.7] - 2023-10-04

## test-helpers

- added `expectEqualCell`

## [0.2.6] - 2023-09-29

## helpers

- added `findArgs`

## [0.2.5] - 2023-09-28

## onchain-helper

- added `getAccountBalance`

## [0.2.4] - 2023-09-26

## helpers

- added `cellFromStrFile`
- `createInternalMsgCell` payload can be omitted

## [0.2.3] - 2023-08-17

### config-helpers

- fix hardcoded `build` folder

### helpers

- added `cellToBocStr`

## [0.2.2] - 2023-08-07

### jetton minter

- fix meta type

### test-helper

- `getWalletBalance` works on-chain and moved to helpers

## [0.2.1] - 2023-08-04

### config-helpers

- fix `resolvers.address` not parsing raw address
- fix `isReadOnly` requiring all keys
- add inspect for `CliConfig`
- removed `resolveAddressFile` and all derivatives

## [0.2.0] - 2023-08-02

- moved all sources to `src` folder

## 2023-08-02

- added config helpers

## 2023-08-01

- added standard ft and nft wrappers
- added some helpers

## 2023-07-24

- improved error parser

## 2023-07-19

- added error parser

## 2023-07-13

- added lib utils
- added more options in `createMdGraph`

## 2023-07-06

- init


