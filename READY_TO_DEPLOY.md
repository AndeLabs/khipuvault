# 🚀 KhipuVault - READY TO DEPLOY to Mezo Testnet

**Status:** ✅ ALL INFRASTRUCTURE READY  
**Mezo Testnet Chain ID:** 31611  
**Network:** Mezo Testnet (official MUSD deployment)  
**Last Updated:** October 21, 2025

---

## 📊 **DEPLOYMENT READINESS CHECKLIST**

### ✅ **COMPLETED - Infrastructure**
- ✅ Smart contracts compiled (0 errors)
- ✅ 4 Savings Pools ready (Individual, Cooperative, Lottery, Rotating)
- ✅ Mezo Integration contract ready
- ✅ Yield Aggregator contract ready
- ✅ Frontend Web3 infrastructure complete
- ✅ Makefile deployment commands configured
- ✅ Official MUSD contract addresses obtained
- ✅ Foundry configured for Mezo Testnet (EVM: london)
- ✅ Environment template created

### ⚠️ **REQUIRED - Before Deployment**
- ⚠️ **Add your DEPLOYER_PRIVATE_KEY to `.env`**
- ⚠️ **Add your FEE_COLLECTOR_ADDRESS to `.env`**
- ⚠️ **Fund deployer wallet with Mezo testnet BTC**
- ⚠️ **Review and confirm all configuration**

---

## 🔑 **OFFICIAL MEZO TESTNET ADDRESSES**

### **MUSD Protocol Contracts (Already Deployed)**

These are the official Mezo MUSD contracts on Chain ID 31611:

```bash
# Core MUSD Protocol
MATSNET_BORROWER_OPERATIONS=0xCdF7028ceAB81fA0C6971208e83fa7872994beE5
MATSNET_TROVE_MANAGER=0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0
MATSNET_PRICE_FEED=0x86bCF0841622a5dAC14A313a15f96A95421b9366
MATSNET_HINT_HELPERS=0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6
MATSNET_MUSD_ADDRESS=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503

# Additional Contracts
MATSNET_ACTIVE_POOL=0x143A063F62340DA3A8bEA1C5642d18C6D0F7FF51
MATSNET_STABILITY_POOL=0x1CCA7E410eE41739792eA0A24e00349Dd247680e
MATSNET_SORTED_TROVES=0x722E4D24FD6Ff8b0AC679450F3D91294607268fA

# Network
MATSNET_RPC_URL=https://rpc.test.mezo.org
MEZO_TESTNET_CHAIN_ID=31611
```

**Verification:**
- Explorer: https://explorer.test.mezo.org
- All addresses verified from `@mezo-org/musd-contracts` official npm package
- Chain ID confirmed: 31611

---

## 🛠️ **STEP-BY-STEP DEPLOYMENT GUIDE**

### **STEP 1: Configure Your Wallet (5 minutes)**

#### 1.1. Add Configuration to `.env`

```bash
cd contracts

# Merge the Mezo addresses with your .env
cat .env.mezo-addresses >> .env

# Now add YOUR wallet details (use a text editor)
nano .env
```

Add these lines to `.env`:

```bash
# YOUR CREDENTIALS (REPLACE WITH ACTUAL VALUES)
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
FEE_COLLECTOR_ADDRESS=0xYOUR_WALLET_ADDRESS_HERE

# Etherscan API (optional, for contract verification)
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

**Security Notes:**
- ⚠️ NEVER commit `.env` to git
- ⚠️ Use a testnet-only wallet
- ⚠️ Keep your private key secure
- ⚠️ `.env` is in `.gitignore` (safe)

#### 1.2. Get Testnet BTC

Your deployer wallet needs testnet BTC for gas fees.

**Option A: Mezo Faucet (if available)**
```
Visit: https://faucet.mezo.org (check Mezo docs)
Enter your wallet address
Request testnet BTC
```

**Option B: Bridge from Sepolia**
```
1. Get Sepolia ETH from: https://sepoliafaucet.com
2. Bridge to Mezo Testnet (check Mezo bridge)
3. Confirm receipt in wallet
```

**Minimum Required:** ~0.01 BTC for gas fees

#### 1.3. Verify Wallet Configuration

```bash
# Check your wallet has funds
cast balance YOUR_WALLET_ADDRESS --rpc-url https://rpc.test.mezo.org

# Should show: > 10000000000000000 (0.01 BTC)
```

---

### **STEP 2: Deploy Mock WBTC Token (10 minutes)**

Since we're on testnet, we need to deploy a mock WBTC token.

```bash
cd contracts

# Deploy mock WBTC and MUSD for testing
# Note: MUSD is already deployed, but we might need a wrapper
forge script script/01_DeployTokens.s.sol:DeployTokens \
    --rpc-url https://rpc.test.mezo.org \
    --broadcast \
    --slow \
    -vvvv

# Save the WBTC address from output
# Look for: "WBTC deployed at: 0x..."
```

**Update `.env` with WBTC address:**
```bash
echo "WBTC_ADDRESS=0xYOUR_WBTC_ADDRESS" >> .env
```

**Alternative: Skip token deployment**

Since MUSD is already deployed, we can just deploy integrations directly. The deployment script will use the MUSD address we configured.

---

### **STEP 3: Deploy Core Integrations (15 minutes)**

Deploy MezoIntegration and YieldAggregator contracts.

```bash
cd contracts

# Using the new make command
make deploy-mezo-integrations

# OR manually:
forge script script/02_DeployIntegrations.s.sol:DeployIntegrations \
    --rpc-url https://rpc.test.mezo.org \
    --broadcast \
    --slow \
    -vvvv
```

**Expected Output:**
```
=======================================================
    Deploying KhipuVault - Mezo MUSD Integration
=======================================================
Network: Mezo Testnet
Chain ID: 31611
Deployer: 0xYourAddress
Balance: 0.05 ETH
=======================================================

[1/2] Deploying MezoIntegration...
  Using Mezo MUSD Protocol Contracts:
    WBTC: 0x...
    MUSD: 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
    BorrowerOperations: 0xCdF7028ceAB81fA0C6971208e83fa7872994beE5
    PriceFeed: 0x86bCF0841622a5dAC14A313a15f96A95421b9366
    HintHelpers: 0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6
    TroveManager: 0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0

[SUCCESS] MezoIntegration deployed at: 0x...
  [CONFIG] Target LTV set to: 50%
  [CONFIG] Max Fee set to: 5%

[2/2] Deploying YieldAggregator...
  Base token: 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503

[SUCCESS] YieldAggregator deployed at: 0x...

Deployment saved to: deployments/integrations-31611.json
```

**Verify Deployment:**
```bash
cat deployments/integrations-31611.json
```

Should show:
```json
{
  "mezoIntegration": "0x...",
  "yieldAggregator": "0x...",
  "wbtc": "0x...",
  "musd": "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503",
  "chainId": 31611,
  "deployer": "0xYourAddress",
  "timestamp": "2025-10-21T..."
}
```

---

### **STEP 4: Deploy Savings Pools (20 minutes)**

Deploy all 4 savings pool contracts.

```bash
cd contracts

# Using make command
make deploy-mezo-pools

# OR manually:
forge script script/03_DeployPools.s.sol:DeployPools \
    --rpc-url https://rpc.test.mezo.org \
    --broadcast \
    --slow \
    -vvvv
```

**Expected Output:**
```
===========================================
Deploying All Savings Pools
===========================================
Deployer: 0xYourAddress
Chain ID: 31611
===========================================
Dependencies:
  MezoIntegration: 0x...
  YieldAggregator: 0x...
  WBTC: 0x...
  MUSD: 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
  Fee Collector: 0xYourAddress
===========================================

[1/4] Deploying IndividualPool...
IndividualPool deployed at: 0x...
  - Min Deposit: 0.005 BTC
  - Max Deposit: 10 BTC
  - Performance Fee: 1%

[2/4] Deploying CooperativePool...
CooperativePool deployed at: 0x...
  - Min Contribution: 0.001 BTC
  - Max Members: 100
  - Performance Fee: 1%

[3/4] Deploying LotteryPool...
LotteryPool deployed at: 0x...
  - Min Ticket Price: 0.0005 BTC
  - Chainlink VRF: Configured

[4/4] Deploying RotatingPool...
RotatingPool deployed at: 0x...
  - Min Members: 3
  - Max Members: 50

Deployment saved to: deployments/pools-31611.json
```

**Verify Deployment:**
```bash
cat deployments/pools-31611.json | jq
```

---

### **STEP 5: Copy ABIs to Frontend (5 minutes)**

```bash
cd contracts

# Use the automated command
make copy-abis-frontend

# Verify ABIs were copied
ls -lh ../frontend/src/contracts/abis/
```

**Expected Output:**
```
IndividualPool.json
CooperativePool.json
LotteryPool.json
RotatingPool.json
MezoIntegration.json
YieldAggregator.json
```

---

### **STEP 6: Configure Frontend (10 minutes)**

#### 6.1. Create Frontend Environment File

```bash
cd ../frontend

# Copy template
cp .env.local.example .env.local

# Edit with deployed addresses
nano .env.local
```

#### 6.2. Add Contract Addresses

Update `.env.local` with addresses from `contracts/deployments/`:

```bash
# WalletConnect (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Mezo Testnet
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org

# Token Addresses
NEXT_PUBLIC_WBTC_ADDRESS=0xYOUR_WBTC_ADDRESS
NEXT_PUBLIC_MUSD_ADDRESS=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503

# Integration Addresses (from deployments/integrations-31611.json)
NEXT_PUBLIC_MEZO_INTEGRATION_ADDRESS=0xYOUR_MEZO_INTEGRATION
NEXT_PUBLIC_YIELD_AGGREGATOR_ADDRESS=0xYOUR_YIELD_AGGREGATOR

# Pool Addresses (from deployments/pools-31611.json)
NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS=0xYOUR_INDIVIDUAL_POOL
NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS=0xYOUR_COOPERATIVE_POOL
NEXT_PUBLIC_LOTTERY_POOL_ADDRESS=0xYOUR_LOTTERY_POOL
NEXT_PUBLIC_ROTATING_POOL_ADDRESS=0xYOUR_ROTATING_POOL
```

#### 6.3. Test Frontend Build

```bash
npm run build
```

Should compile successfully with:
```
✓ Compiled successfully
✓ Generating static pages (17/17)
```

---

### **STEP 7: Deploy Frontend to Vercel (15 minutes)**

#### 7.1. Push to GitHub

```bash
cd ..
git add .
git commit -m "feat: production deployment to Mezo Testnet"
git push origin main
```

#### 7.2. Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework:** Next.js
   - **Root Directory:** `KhipuVault/frontend`
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install --legacy-peer-deps`

5. Add Environment Variables (copy from `.env.local`)

6. Click "Deploy"

#### 7.3. Verify Deployment

- ✅ Build succeeds
- ✅ Deployment URL is live
- ✅ Can connect wallet with Mezo Passport
- ✅ Network shows "Mezo Testnet"
- ✅ No console errors

---

## 🧪 **TESTING THE DEPLOYMENT**

### **Test 1: Smart Contracts**

```bash
cd contracts

# Test MezoIntegration
cast call YOUR_MEZO_INTEGRATION "targetLtv()(uint256)" --rpc-url https://rpc.test.mezo.org
# Should return: 5000 (50%)

# Test IndividualPool
cast call YOUR_INDIVIDUAL_POOL "MIN_DEPOSIT()(uint256)" --rpc-url https://rpc.test.mezo.org
# Should return: 5000000000000000 (0.005 BTC)
```

### **Test 2: Frontend**

1. Open your Vercel URL
2. Click "Conectar Wallet"
3. Select Mezo Passport or MetaMask
4. Switch to Mezo Testnet (Chain ID: 31611)
5. Navigate to each pool page
6. Verify all data loads correctly

### **Test 3: End-to-End Transaction**

```bash
# Approve WBTC for IndividualPool
cast send YOUR_WBTC_ADDRESS \
    "approve(address,uint256)" \
    YOUR_INDIVIDUAL_POOL \
    1000000000000000000 \
    --rpc-url https://rpc.test.mezo.org \
    --private-key $DEPLOYER_PRIVATE_KEY

# Deposit to IndividualPool
cast send YOUR_INDIVIDUAL_POOL \
    "deposit(uint256)" \
    5000000000000000 \
    --rpc-url https://rpc.test.mezo.org \
    --private-key $DEPLOYER_PRIVATE_KEY
```

---

## 📊 **DEPLOYMENT SUMMARY**

### **What Was Deployed**

| Contract | Purpose | Address |
|----------|---------|---------|
| MezoIntegration | BTC→MUSD conversion | From deployment |
| YieldAggregator | Yield management | From deployment |
| IndividualPool | Personal savings | From deployment |
| CooperativePool | Community pools | From deployment |
| LotteryPool | Prize savings | From deployment |
| RotatingPool | ROSCA/Pasanaku | From deployment |

### **What's Using Mezo's Official Contracts**

| Contract | Address | Purpose |
|----------|---------|---------|
| MUSD Token | `0x1189...c503` | Stablecoin |
| BorrowerOperations | `0xCdF7...beE5` | Open/close troves |
| TroveManager | `0xE47c...16bb0` | Liquidations |
| PriceFeed | `0x86bC...9366` | BTC price oracle |
| HintHelpers | `0x4e4c...BCF6` | Gas optimization |

---

## 🎯 **HACKATHON SUBMISSION CHECKLIST**

### **✅ Required Elements**

- ✅ MUSD Integration: Using official contracts
- ✅ Mezo Passport: Integrated in frontend
- ✅ Deploy on Testnet: Mezo Testnet (Chain ID 31611)
- ✅ Working Demo: Vercel URL functional
- ✅ Original Work: 100% custom development
- ✅ Documentation: Complete

### **📋 Submission Information**

```yaml
Project Name: KhipuVault
Track: Financial Access & Mass Adoption
Description: Bitcoin savings for Latin America with MUSD
Demo URL: https://your-app.vercel.app
GitHub: https://github.com/your-username/ande-labs
Team: [Your name/team]

Contract Addresses (Mezo Testnet - Chain ID 31611):
  - MezoIntegration: 0x...
  - YieldAggregator: 0x...
  - IndividualPool: 0x...
  - CooperativePool: 0x...
  - LotteryPool: 0x...
  - RotatingPool: 0x...

Technology Stack:
  - Solidity 0.8.25 (EVM: London)
  - Foundry for smart contracts
  - Next.js 15.3.3 for frontend
  - Mezo Passport for wallet connection
  - Official MUSD Protocol integration
```

---

## 🔧 **TROUBLESHOOTING**

### **Issue: "Insufficient funds for gas"**

```bash
# Check balance
cast balance YOUR_ADDRESS --rpc-url https://rpc.test.mezo.org

# Get more testnet BTC from faucet
```

### **Issue: "Contract deployment failed"**

```bash
# Check if addresses are set correctly
grep MATSNET contracts/.env

# Verify RPC is working
cast block-number --rpc-url https://rpc.test.mezo.org
```

### **Issue: "Frontend won't connect to wallet"**

```bash
# Check WalletConnect Project ID is set
grep WALLETCONNECT frontend/.env.local

# Verify contract addresses are correct
grep NEXT_PUBLIC frontend/.env.local
```

### **Issue: "Transaction reverts"**

```bash
# Test with verbose mode
forge script script/02_DeployIntegrations.s.sol:DeployIntegrations \
    --rpc-url https://rpc.test.mezo.org \
    -vvvvv  # Extra verbose

# Check contract is not paused
cast call YOUR_CONTRACT "paused()(bool)" --rpc-url https://rpc.test.mezo.org
```

---

## 📚 **RESOURCES**

### **Official Documentation**
- Mezo Docs: https://docs.mezo.org
- MUSD Protocol: https://github.com/mezo-org/musd
- Mezo Passport: https://github.com/mezo-org/passport

### **Explorers**
- Mezo Testnet: https://explorer.test.mezo.org
- View your deployed contracts by address

### **Community**
- Mezo Discord: https://discord.gg/mezo
- Mezo Twitter: @mezo_org

### **Tools**
- WalletConnect: https://cloud.walletconnect.com
- Vercel: https://vercel.com
- Foundry: https://book.getfoundry.sh

---

## ✅ **FINAL PRE-DEPLOYMENT CHECKLIST**

Before running any deployment commands:

- [ ] ✅ Foundry installed and updated
- [ ] ✅ Contracts compile successfully
- [ ] ✅ `.env` configured with YOUR credentials
- [ ] ✅ Wallet funded with testnet BTC
- [ ] ✅ All Mezo MUSD addresses verified
- [ ] ✅ Frontend dependencies installed
- [ ] ✅ GitHub repository ready
- [ ] ✅ Vercel account created
- [ ] ✅ WalletConnect Project ID obtained
- [ ] ✅ Backup of all configuration files

---

## 🚀 **DEPLOY COMMAND**

Once everything is ready, run:

```bash
cd contracts

# Complete deployment (tokens + integrations + pools)
make deploy-mezo-all

# Or step by step:
make deploy-mezo-integrations
make deploy-mezo-pools
make copy-abis-frontend
```

---

## 🎉 **SUCCESS!**

If you've completed all steps:

✅ Smart contracts deployed on Mezo Testnet  
✅ Frontend deployed on Vercel  
✅ Mezo Passport integration working  
✅ Full MUSD protocol integration  
✅ Ready for hackathon submission  

**You're now running a production-grade Bitcoin savings platform on Mezo! 🏔️**

---

**Developed with ❤️ for the Mezo Hackathon 2025**  
**Track:** Financial Access & Mass Adoption  
**Status:** 🚀 READY TO DEPLOY

---

*Last Updated: October 21, 2025*  
*Maintained By: KhipuVault Team*