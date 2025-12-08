---
description: Smart contract development helper - build, test, deploy
argument-hint: action (build|test|deploy|analyze)
---

# Smart Contracts Helper

Help with KhipuVault smart contracts on Mezo Testnet (Chain ID: 31611).

## Current Deployed Contracts

| Contract        | Address                                    |
| --------------- | ------------------------------------------ |
| IndividualPool  | 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393 |
| CooperativePool | 0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88 |
| MezoIntegration | 0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6 |
| YieldAggregator | 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6 |
| MUSD            | 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503 |

## Commands

- Build: `cd packages/contracts && forge build`
- Test: `cd packages/contracts && forge test -vvv`
- Gas report: `cd packages/contracts && forge test --gas-report`
- Deploy: `cd packages/contracts && make deploy-testnet`

What would you like to do? Build, test, deploy, or analyze a specific contract?
