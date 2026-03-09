# Ownership Transfer - Quick Start

Quick reference for transferring KhipuVault contract ownership to multi-sig.

## Prerequisites Checklist

```bash
[ ] Gnosis Safe deployed and tested (3/5 or 2/3 threshold)
[ ] All signers verified access
[ ] Contract addresses ready
[ ] Deployer has DEPLOYER_PRIVATE_KEY in .env
```

## 5-Minute Transfer (Testnet)

### 1. Configure

Edit `script/TransferOwnership.s.sol`:

```solidity
// Line 57
address constant MULTI_SIG_ADDRESS = 0xYourGnosisSafe;

// Lines 60-66 - Your deployed addresses
address constant YIELD_AGGREGATOR = 0x...;
address constant MEZO_INTEGRATION = 0x...;
address constant INDIVIDUAL_POOL = 0x...;
address constant COOPERATIVE_POOL = 0x...;
address constant LOTTERY_POOL = 0x...;
address constant ROTATING_POOL = 0x...;
```

### 2. Dry Run

```bash
forge script script/TransferOwnership.s.sol \
  --rpc-url https://rpc.test.mezo.org \
  -vvvv
```

Check output for `[OK] All ownership checks passed`

### 3. Execute

```bash
forge script script/TransferOwnership.s.sol \
  --rpc-url https://rpc.test.mezo.org \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  -vvvv
```

Check output for `[SUCCESS] All ownership transfers completed!`

### 4. Verify

Update `script/VerifyOwnership.s.sol` line 34:

```solidity
address constant EXPECTED_MULTI_SIG = 0xYourGnosisSafe;
```

Then run:

```bash
forge script script/VerifyOwnership.s.sol \
  --rpc-url https://rpc.test.mezo.org \
  -vvvv
```

All checks should show `[PASS]`

### 5. Test Multi-sig

Via Gnosis Safe UI:

1. Visit https://app.safe.global
2. New Transaction → Contract Interaction
3. Try pausing a contract
4. Collect signatures
5. Execute
6. Unpause

## Mainnet Transfer

Same steps, but use mainnet RPC and addresses:

```bash
--rpc-url https://rpc.mezo.org
```

**WARNING:** Test on testnet first! Ownership transfer is irreversible.

## Common Issues

| Issue                          | Solution                           |
| ------------------------------ | ---------------------------------- |
| "Multi-sig address is zero!"   | Update MULTI_SIG_ADDRESS in script |
| "Multi-sig is not a contract!" | Deploy Gnosis Safe first           |
| "unexpected owner"             | You're not current owner           |
| Some transfers failed          | Re-run script (idempotent)         |

## Contract Addresses (Update These!)

```bash
# From your Deploy.s.sol output
YIELD_AGGREGATOR=0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6
MEZO_INTEGRATION=0xab91e387F8faF1FEBF7FF7E019e2968F19c177fD
INDIVIDUAL_POOL=0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393
COOPERATIVE_POOL=0xA39EE76DfC5106E78ABcB31e7dF5bcd4EfD3Cd1F
LOTTERY_POOL=0x8c9cc22f5184bB4E485dbb51531959A8Cf0624b4
ROTATING_POOL=0x1b7AB2aF7d58Fb8a137c237d93068A24808a7B04
STABILITY_POOL_STRATEGY=0x... # If deployed
```

## Files

- `TransferOwnership.s.sol` - Main transfer script
- `VerifyOwnership.s.sol` - Verification script
- `OWNERSHIP_TRANSFER_GUIDE.md` - Complete guide
- `README.md` - All scripts documentation

## Support

For detailed instructions, see `OWNERSHIP_TRANSFER_GUIDE.md`

Questions: security@khipuvault.com
