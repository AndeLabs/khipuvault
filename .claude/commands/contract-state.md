---
description: Query on-chain contract state and balances on Mezo testnet
argument-hint: contract (IndividualPool|CooperativePool|YieldAggregator|all)
---

# Contract State: $ARGUMENTS

Query the on-chain state of KhipuVault smart contracts on Mezo testnet.

## Contract Addresses

| Contract        | Address                                    |
| --------------- | ------------------------------------------ |
| IndividualPool  | 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393 |
| CooperativePool | 0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88 |
| MezoIntegration | 0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6 |
| YieldAggregator | 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6 |
| MUSD            | 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503 |

## Queries to Execute

### 1. Verify Contract Deployment

```bash
# Check if contract has code deployed
curl -s -X POST https://rpc.test.mezo.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getCode","params":["CONTRACT_ADDRESS","latest"],"id":1}'
```

### 2. Contract Balance (ETH)

```bash
curl -s -X POST https://rpc.test.mezo.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["CONTRACT_ADDRESS","latest"],"id":1}'
```

### 3. Using Foundry (Preferred)

```bash
cd packages/contracts

# Read total deposits
cast call 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393 \
  "totalDeposits()(uint256)" \
  --rpc-url https://rpc.test.mezo.org

# Read pool status
cast call 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393 \
  "paused()(bool)" \
  --rpc-url https://rpc.test.mezo.org

# Read user balance
cast call 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393 \
  "balanceOf(address)(uint256)" \
  USER_ADDRESS \
  --rpc-url https://rpc.test.mezo.org
```

### 4. Recent Events

```bash
# Get recent Deposit events
cast logs \
  --address 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393 \
  --from-block -1000 \
  --rpc-url https://rpc.test.mezo.org
```

## State Verification Checklist

For each contract, verify:

- [ ] Contract has code deployed (not empty)
- [ ] Contract is not paused (unless intentional)
- [ ] Owner/admin is correct address
- [ ] Total balances match expected values
- [ ] No unexpected state changes

## Comparison with Database

After querying on-chain state, compare with database records:

- Total deposits should match
- User balances should match
- Transaction counts should align

## Output

Report for each contract:

- Deployment status (deployed/not deployed)
- Contract balance
- Key state variables
- Recent activity summary
- Any discrepancies with database
