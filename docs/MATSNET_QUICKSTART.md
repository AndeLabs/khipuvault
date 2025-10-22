# 🚀 KhipuVault - Matsnet Quick Start Guide

**Deploy KhipuVault with Real MUSD Integration in 15 Minutes**

This guide helps you deploy KhipuVault to Matsnet (Mezo's MUSD testnet) with real protocol integration.

## 📋 Prerequisites

### Required Tools
```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verify installation
forge --version
cast --version
```

### Required Accounts
- **Wallet with Sepolia ETH** (for gas fees)
- **Etherscan API Key** (for contract verification)
- **Alchemy/Infura RPC** (for reliable network access)

### Get Testnet Funds
```bash
# Sepolia ETH faucets
https://sepoliafaucet.com
https://faucet.quicknode.com/ethereum/sepolia

# Need at least 0.1 ETH for deployment
```

## ⚡ Quick Deploy (5 Commands)

```bash
# 1. Clone and setup
cd ande-labs/KhipuVault
make install && make setup-env

# 2. Get real MUSD addresses
./scripts/get-musd-addresses.sh matsnet

# 3. Configure environment
cp contracts/.env.matsnet.example contracts/.env
# Edit .env with your keys (see Configuration below)

# 4. Deploy complete system
make deploy-matsnet-all

# 5. Verify deployment
make deployments-matsnet
```

**🎉 Done! Your KhipuVault is deployed with real MUSD integration.**

## 🔧 Configuration

Edit `contracts/.env` with your values:

```bash
# === CRITICAL: Add your keys ===
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
MATSNET_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY

# === MUSD Contract Addresses (auto-filled by script) ===
MATSNET_MUSD_ADDRESS=0x...
MATSNET_BORROWER_OPERATIONS=0x...
MATSNET_TROVE_MANAGER=0x...
MATSNET_PRICE_FEED=0x...
MATSNET_HINT_HELPERS=0x...

# === Optional: Chainlink VRF (for LotteryPool) ===
VRF_SUBSCRIPTION_ID=YOUR_SUBSCRIPTION_ID
```

## 🧪 Test Real MUSD Integration

### 1. Get Test WBTC
```bash
# Visit WBTC faucet or use deals in tests
# You'll need some WBTC to test deposits
```

### 2. Test Deposit & Mint
```bash
# Test with 0.01 WBTC
make interact-musd AMOUNT=0.01

# Check your Trove status
make check-musd-trove
```

### 3. Monitor System
```bash
# Monitor MUSD protocol health
make monitor-musd-system

# Check deployment status
make deployments-matsnet
```

## 📊 Deployment Verification

After deployment, verify these contracts exist:

### Core Integration
- ✅ **MezoIntegration** - BTC deposits & MUSD minting
- ✅ **YieldAggregator** - DeFi yield management

### Savings Pools
- ✅ **IndividualPool** - Personal savings
- ✅ **CooperativePool** - Community pools  
- ✅ **LotteryPool** - No-loss lottery
- ✅ **RotatingPool** - ROSCA implementation

### MUSD Protocol (External)
- ✅ **BorrowerOperations** - Trove management
- ✅ **TroveManager** - System state & liquidations
- ✅ **PriceFeed** - BTC/USD oracle
- ✅ **HintHelpers** - Gas optimization

## 🔍 Verification Steps

### 1. Contract Verification
```bash
# Contracts should auto-verify during deployment
# Check on Sepolia Etherscan:
https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS
```

### 2. Real Integration Test
```bash
# Run integration tests against real contracts
make test-matsnet-integration

# This tests:
# - Real Trove creation in MUSD protocol
# - BTC price feeds from Chainlink
# - MUSD minting and burning
# - Collateral ratio calculations
```

### 3. System Health Check
```bash
# Check MUSD protocol is working
make monitor-musd-system

# Should show:
# ✅ BTC Price: ~$60,000
# ✅ Recovery Mode: false
# ✅ System healthy
```

## 🚨 Troubleshooting

### Issue: "MUSD addresses not found"
```bash
# Solution: Manual address lookup
./scripts/get-musd-addresses.sh matsnet

# If still failing, get addresses from:
# - Mezo Discord
# - GitHub: https://github.com/mezo-org/musd
# - Mezo documentation
```

### Issue: "Transaction reverts on depositAndMint"
```bash
# Check:
# 1. You have WBTC balance
# 2. WBTC is approved for spending
# 3. Amount meets minimum requirements
# 4. BTC price oracle is working

# Debug:
cast call $PRICE_FEED_ADDR "fetchPrice()" --rpc-url $MATSNET_RPC_URL
```

### Issue: "Contract verification failed"
```bash
# Manually verify:
make verify-contract ADDRESS=0x... CONTRACT=MezoIntegration

# Or check constructor args match deployment
```

### Issue: "Tests failing on fork"
```bash
# Ensure you're forking Matsnet, not regular Sepolia:
forge test --fork-url $MATSNET_RPC_URL --match-contract MatsnetIntegration -vvv
```

## 🎯 Next Steps After Deployment

### 1. Fund Contracts
```bash
# The YieldAggregator needs MUSD for operations
# Fund it manually or through the protocol
```

### 2. Setup Chainlink VRF (Optional)
```bash
# For LotteryPool functionality:
# 1. Create VRF subscription at https://vrf.chain.link
# 2. Fund with LINK tokens
# 3. Add LotteryPool as consumer
```

### 3. Test All Pool Types
```bash
# Test each savings pool:
# - Individual: Personal savings
# - Cooperative: Community pools
# - Lottery: Prize pools
# - Rotating: ROSCA implementation
```

### 4. Monitor & Maintain
```bash
# Regular health checks:
make monitor-musd-system

# Check deployment status:
make deployments-matsnet

# View transaction logs:
cast logs --address $MEZO_INTEGRATION_ADDR --rpc-url $MATSNET_RPC_URL
```

## 📚 Advanced Configuration

### Custom Target LTV
```bash
# Default: 50% LTV, adjust in .env:
TARGET_LTV=4000  # 40% LTV (more conservative)
TARGET_LTV=6000  # 60% LTV (more aggressive)
```

### Gas Optimization
```bash
# For high gas periods:
GAS_PRICE_GWEI=30

# For deployment:
forge script --gas-price 25gwei ...
```

### Multiple Test Users
```bash
# Add test user keys to .env:
TEST_USER_1_PRIVATE_KEY=0x...
TEST_USER_2_PRIVATE_KEY=0x...

# Use in integration tests
```

## 📞 Support & Resources

### Getting Help
- **Discord**: Join KhipuVault community
- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check `/docs` folder

### Mezo Protocol Resources
- **Discord**: https://discord.gg/mezo
- **Documentation**: Official Mezo docs
- **GitHub**: https://github.com/mezo-org/musd

### Useful Links
- **Sepolia Etherscan**: https://sepolia.etherscan.io
- **Chainlink VRF**: https://vrf.chain.link
- **WBTC Faucets**: Various testnet faucets

## 🔐 Security Notes

### Testnet Safety
- ✅ Only use testnet funds
- ✅ Never use mainnet private keys
- ✅ Verify all contract addresses
- ✅ Test thoroughly before mainnet

### Production Checklist
- [ ] Professional security audit
- [ ] Multisig wallet setup
- [ ] Emergency procedures documented
- [ ] Bug bounty program active
- [ ] Insurance coverage obtained
- [ ] Legal review completed

---

## 🎉 Success! 

You've successfully deployed KhipuVault with real MUSD protocol integration on Matsnet. Your DeFi-powered Bitcoin banking system is ready for testing!

**Happy Building! 🏔️⚡**