# 🚀 KhipuVault Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying KhipuVault to testnet and mainnet with production-grade security and reliability.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start (Testnet)](#quick-start-testnet)
- [Detailed Deployment Steps](#detailed-deployment-steps)
- [Mainnet Deployment](#mainnet-deployment)
- [Post-Deployment](#post-deployment)
- [Security Checklist](#security-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
cast --version
anvil --version

# Install Node.js (v20+)
node --version
npm --version
```

### Required Accounts & Keys

1. **Deployer Wallet**
   - Private key with ETH for gas
   - Testnet: Get Sepolia ETH from faucet
   - Mainnet: Funded wallet with 0.5+ ETH

2. **Etherscan API Key**
   - Sign up at https://etherscan.io/apis
   - Used for contract verification

3. **RPC Provider**
   - Alchemy: https://www.alchemy.com
   - Infura: https://www.infura.io
   - QuickNode: https://www.quicknode.com

4. **Chainlink VRF** (for LotteryPool)
   - Create subscription at https://vrf.chain.link
   - Fund with LINK tokens

---

## Quick Start (Testnet)

### 1. Clone and Setup

```bash
cd ande-labs/KhipuVault

# Install dependencies
make install

# Setup environment
make setup-env
```

### 2. Configure Environment

Edit `contracts/.env`:

```bash
# Required
DEPLOYER_PRIVATE_KEY=0x...your_private_key...
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
FEE_COLLECTOR_ADDRESS=0x...your_fee_collector_address...

# Chainlink VRF (Sepolia)
VRF_COORDINATOR_ADDRESS=0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
VRF_KEY_HASH=0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c
VRF_SUBSCRIPTION_ID=YOUR_SUBSCRIPTION_ID
```

### 3. Deploy to Sepolia

```bash
# Run all tests first
make test

# Deploy complete system
make deploy-sepolia-all
```

This will deploy in order:
1. Mock tokens (WBTC, MUSD)
2. Core integrations (MezoIntegration, YieldAggregator)
3. All pools (Individual, Cooperative, Lottery, Rotating)

### 4. Verify Deployment

```bash
# Check deployment addresses
make deployments

# View specific deployment
cat contracts/deployments/pools-11155111.json | jq
```

---

## Detailed Deployment Steps

### Step 1: Deploy Tokens (Testnet Only)

Mainnet uses existing token addresses.

```bash
make deploy-sepolia-tokens
```

**Expected Output:**
```
WBTC deployed at: 0x...
MUSD deployed at: 0x...
Minted to deployer for testing
```

**Verification:**
- Check Etherscan for deployed contracts
- Verify token decimals (WBTC: 8, MUSD: 18)
- Confirm initial balances

### Step 2: Deploy Core Integrations

```bash
make deploy-sepolia-integrations
```

**What Gets Deployed:**

1. **MezoIntegration**
   - Manages BTC collateral
   - Handles MUSD minting
   - Configurable LTV ratio (default 50%)
   - Initial BTC price set from env

2. **YieldAggregator**
   - Routes deposits to yield strategies
   - Tracks user positions
   - Manages yield distribution
   - Initial mock vault added for testing

**Configuration Applied:**
```
Target LTV: 50%
Borrow Rate: 1% APR
Initial BTC Price: $60,000
Mock Vault APR: 6%
```

**Post-Deployment:**
- Fund MezoIntegration with MUSD
- Fund YieldAggregator with MUSD
- Update addresses in `.env` file

### Step 3: Deploy Savings Pools

```bash
make deploy-sepolia-pools
```

**What Gets Deployed:**

1. **IndividualPool**
   - Personal savings with auto-yields
   - Min: 0.005 BTC, Max: 10 BTC
   - Performance fee: 1%

2. **CooperativePool**
   - Community savings pools
   - Min contribution: 0.001 BTC
   - Max 100 members per pool

3. **LotteryPool**
   - No-loss prize savings
   - Chainlink VRF integration
   - Min ticket: 0.0005 BTC

4. **RotatingPool**
   - ROSCA implementation
   - Min 3, max 50 members
   - Turn-based distribution

**Important:** Add LotteryPool as consumer in Chainlink VRF subscription!

### Step 4: Verify All Contracts

```bash
# Automatic verification during deployment (if enabled)
# Or manually verify:
make verify-contract ADDRESS=0x... CONTRACT=IndividualPool
```

### Step 5: Fund Contracts (Testnet)

```bash
# Get contract addresses
source contracts/.env
MEZO=$(jq -r '.mezoIntegration' contracts/deployments/integrations-11155111.json)
YIELD=$(jq -r '.yieldAggregator' contracts/deployments/integrations-11155111.json)

# Send MUSD for operations
cast send $MUSD "transfer(address,uint256)" $MEZO 10000000000000000000000000 \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY

cast send $MUSD "transfer(address,uint256)" $YIELD 10000000000000000000000000 \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY
```

---

## Mainnet Deployment

### ⚠️ CRITICAL WARNINGS

**DO NOT DEPLOY TO MAINNET UNLESS:**

- ✅ Complete professional security audit
- ✅ 100% test coverage
- ✅ Testnet running successfully for 2+ weeks
- ✅ Bug bounty program active
- ✅ Emergency procedures documented
- ✅ Multisig wallet configured
- ✅ Insurance coverage obtained
- ✅ Legal review completed

### Mainnet Preparation

1. **Security Audit**
   ```bash
   make audit-prep
   # Send audit-package/ to auditor
   ```

2. **Multisig Setup**
   - Deploy Gnosis Safe
   - Add 3-5 trusted signers
   - Require 3-of-5 signatures
   - Test on testnet first

3. **Monitoring Setup**
   - Configure Tenderly alerts
   - Setup OpenZeppelin Defender
   - Enable real-time notifications

4. **Token Addresses**
   Update `.env` with mainnet addresses:
   ```bash
   # Mainnet WBTC
   WBTC_ADDRESS=0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599
   
   # Mainnet Chainlink VRF
   VRF_COORDINATOR_ADDRESS=0x271682DEB8C4E0901D1a1550aD2e64D568E69909
   ```

### Mainnet Deployment Command

```bash
# Final tests
make test
make security
make gas-snapshot

# Deploy (requires confirmation)
make deploy-mainnet
```

**Deployment Order:**
1. Type "DEPLOY_MAINNET" to confirm
2. Choose: integrations (skip tokens on mainnet)
3. Verify deployment
4. Choose: pools
5. Verify all contracts
6. Transfer ownership to multisig

### Post-Mainnet Deployment

```bash
# 1. Transfer ownership to multisig
cast send $INDIVIDUAL_POOL "transferOwnership(address)" $MULTISIG_ADDRESS \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY

# 2. Pause all pools initially
cast send $INDIVIDUAL_POOL "pause()" \
  --rpc-url $MAINNET_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY

# 3. Setup monitoring
# Add contracts to Tenderly
# Configure Defender Sentinel alerts

# 4. Unpause after final checks (via multisig)
```

---

## Post-Deployment

### 1. Chainlink VRF Setup

```bash
# Visit https://vrf.chain.link
# 1. Create subscription (if not exists)
# 2. Add LotteryPool as consumer
# 3. Fund with LINK tokens (recommend 10+ LINK)
```

### 2. Test All Functionality

#### Test IndividualPool
```bash
# Approve WBTC
cast send $WBTC "approve(address,uint256)" $INDIVIDUAL_POOL 1000000000 \
  --rpc-url $SEPOLIA_RPC_URL --private-key $TEST_USER_KEY

# Deposit 0.01 WBTC
cast send $INDIVIDUAL_POOL "deposit(uint256)" 1000000 \
  --rpc-url $SEPOLIA_RPC_URL --private-key $TEST_USER_KEY

# Check user info
cast call $INDIVIDUAL_POOL "getUserInfo(address)" $TEST_USER_ADDRESS \
  --rpc-url $SEPOLIA_RPC_URL
```

#### Test CooperativePool
```bash
# Create pool
cast send $COOPERATIVE_POOL "createPool(string,uint256,uint256,uint256)" \
  "Test Pool" 100000 1000000 10 \
  --rpc-url $SEPOLIA_RPC_URL --private-key $TEST_USER_KEY

# Join pool
cast send $COOPERATIVE_POOL "joinPool(uint256,uint256)" 1 100000 \
  --rpc-url $SEPOLIA_RPC_URL --private-key $TEST_USER_KEY
```

#### Test LotteryPool
```bash
# Create lottery round
cast send $LOTTERY_POOL "createLottery(uint8,uint256,uint256,uint256)" \
  1 50000 50 604800 \
  --rpc-url $SEPOLIA_RPC_URL --private-key $OWNER_KEY

# Buy tickets
cast send $LOTTERY_POOL "buyTickets(uint256,uint256)" 1 1 \
  --rpc-url $SEPOLIA_RPC_URL --private-key $TEST_USER_KEY
```

### 3. Frontend Integration

Update frontend `.env`:

```bash
# Copy from deployments/pools-11155111.json
NEXT_PUBLIC_INDIVIDUAL_POOL=0x...
NEXT_PUBLIC_COOPERATIVE_POOL=0x...
NEXT_PUBLIC_LOTTERY_POOL=0x...
NEXT_PUBLIC_ROTATING_POOL=0x...
NEXT_PUBLIC_WBTC=0x...
NEXT_PUBLIC_MUSD=0x...
```

Update ABIs:
```bash
# Copy ABIs to frontend
cp contracts/out/IndividualPool.sol/IndividualPool.json \
   frontend/src/contracts/abis/
```

### 4. Documentation

Update deployment documentation:
```bash
# contracts/deployments/README.md
- Network: Sepolia
- Date: 2025-01-21
- Deployer: 0x...
- IndividualPool: 0x...
- CooperativePool: 0x...
- LotteryPool: 0x...
- RotatingPool: 0x...
- Status: Active
```

---

## Security Checklist

### Pre-Deployment

- [ ] All tests passing (100%)
- [ ] Security audit completed
- [ ] Gas optimization reviewed
- [ ] Emergency procedures documented
- [ ] Multisig wallet setup (mainnet)
- [ ] Monitoring configured
- [ ] Insurance coverage (mainnet)

### During Deployment

- [ ] Environment variables validated
- [ ] Deployer wallet funded
- [ ] RPC endpoint verified
- [ ] Gas price acceptable
- [ ] Test transaction successful
- [ ] Contracts verified on Etherscan

### Post-Deployment

- [ ] All contracts verified
- [ ] Ownership transferred to multisig (mainnet)
- [ ] All pools initially paused (mainnet)
- [ ] Monitoring alerts active
- [ ] Emergency contacts notified
- [ ] Documentation updated
- [ ] Frontend integration tested
- [ ] Bug bounty program live (mainnet)

### Ongoing

- [ ] Daily health checks
- [ ] Weekly security reviews
- [ ] Monthly access control audits
- [ ] Quarterly full audits
- [ ] Emergency drill exercises

---

## Troubleshooting

### Issue: Deployment Fails with "Insufficient Funds"

**Solution:**
```bash
# Check balance
cast balance $DEPLOYER_ADDRESS --rpc-url $SEPOLIA_RPC_URL

# Get testnet ETH
# Sepolia: https://sepoliafaucet.com
# Or use Alchemy/Infura faucets
```

### Issue: Contract Verification Fails

**Solution:**
```bash
# Wait 30 seconds after deployment, then manually verify
make verify-contract ADDRESS=0x... CONTRACT=ContractName

# Or use Etherscan API directly
forge verify-contract $ADDRESS $CONTRACT_NAME \
  --chain-id 11155111 \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address)" $ARG1 $ARG2)
```

### Issue: VRF Not Working

**Solution:**
1. Check subscription is funded with LINK
2. Verify LotteryPool is added as consumer
3. Check VRF coordinator address is correct
4. Wait for at least 3 confirmations

```bash
# Check VRF subscription
cast call $VRF_COORDINATOR "getSubscription(uint64)" $SUBSCRIPTION_ID \
  --rpc-url $SEPOLIA_RPC_URL
```

### Issue: Transaction Reverts

**Solution:**
```bash
# Debug transaction
cast run $TX_HASH --rpc-url $SEPOLIA_RPC_URL

# Check contract state
cast call $CONTRACT "functionName()" --rpc-url $SEPOLIA_RPC_URL

# Enable detailed error messages
cast send $CONTRACT "functionName()" \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $KEY \
  -vvvv
```

### Issue: Gas Estimation Too High

**Solution:**
```bash
# Check gas price
cast gas-price --rpc-url $SEPOLIA_RPC_URL

# Use specific gas price
cast send $CONTRACT "functionName()" \
  --gas-price 20gwei \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $KEY

# Or wait for lower gas prices
```

---

## Useful Commands

### Check Deployment Status

```bash
# View all deployments
make deployments

# Check specific network
ls -la contracts/deployments/
cat contracts/deployments/pools-11155111.json | jq
```

### Interact with Contracts

```bash
# Read operations (free)
cast call $CONTRACT "viewFunction()" --rpc-url $RPC_URL

# Write operations (costs gas)
cast send $CONTRACT "writeFunction(uint256)" 123 \
  --rpc-url $RPC_URL \
  --private-key $KEY
```

### Monitor Contracts

```bash
# Watch events
cast logs --address $CONTRACT --rpc-url $RPC_URL

# Get transaction receipt
cast receipt $TX_HASH --rpc-url $RPC_URL

# Decode transaction data
cast 4byte-decode $DATA
```

---

## Support & Resources

### Documentation
- Smart Contracts: `docs/contracts.md`
- Architecture: `docs/architecture.md`
- API Reference: `docs/api.md`

### Community
- Discord: https://discord.gg/khipuvault
- Twitter: @KhipuVault
- GitHub Issues: Report bugs and request features

### Security
- Report vulnerabilities: security@khipuvault.xyz
- Bug bounty: https://immunefi.com/khipuvault

---

## License

MIT License - See LICENSE file for details

---

**⚠️ IMPORTANT DISCLAIMER**

This software is provided "as is" without warranty of any kind. Always perform your own security audits and testing before deploying to mainnet with real funds.