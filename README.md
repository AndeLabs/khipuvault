# KhipuVault

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/AndeLabs/khipuvault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Mezo Testnet](https://img.shields.io/badge/Network-Mezo%20Testnet-blue)](https://explorer.test.mezo.org)

A decentralized Bitcoin savings platform built on Mezo, offering multiple savings strategies with automatic yield optimization through MUSD integration.

## 🚀 Overview

KhipuVault provides multiple savings pools designed to meet different financial goals and risk preferences, all powered by MUSD (Mezo's Bitcoin-backed stablecoin):

- **Individual Pool**: Personal savings with auto-yield optimization ✅ **DEPLOYED**
- **Cooperative Pool**: Community pooled savings with shared rewards ✅ **DEPLOYED**
- **Lottery Pool**: Prize-based savings with no-loss lottery mechanics 🚧 **COMING SOON**
- **Rotating Pool**: Turn-based distribution system (ROSCA/Pasanaku) 🚧 **COMING SOON**

## ✨ Features

- 🪙 **MUSD-First**: Uses MUSD, the Bitcoin-backed stablecoin from Mezo
- ⚡ **Yield Optimization**: Automatic routing to best yield strategies
- 🔗 **Simple Integration**: Standard EVM wallet connection (MetaMask, WalletConnect)
- 🛡️ **Security First**: Comprehensive testing and production-ready contracts
- 🌐 **Mezo Testnet**: Deployed and functional on Chain ID 31611

## 🏗️ Architecture

### Smart Contracts
- **MezoIntegration**: Manages BTC deposits and MUSD minting
- **YieldAggregator**: Routes deposits to optimal yield strategies
- **Savings Pools**: Four specialized pool contracts for different strategies
- **Governance**: Fee collection and parameter management

### Frontend
- **Next.js 15**: Modern React framework with App Router
- **Mezo Passport**: Integrated wallet connection
- **Wagmi + RainbowKit**: Web3 connectivity and wallet management
- **Tailwind CSS**: Responsive, accessible design system

## 📋 Smart Contracts (Mezo Testnet - Chain ID: 31611)

### 🏦 Savings Pools

#### IndividualPool
**Address**: `0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393`  
**Description**: Personal savings with automatic yield optimization  
**Explorer**: [View on Explorer](https://explorer.test.mezo.org/address/0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393)  
**Status**: ✅ **FUNCTIONAL**

#### CooperativePool
**Address**: `0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88`  
**Description**: Community savings pool with shared rewards  
**Explorer**: [View on Explorer](https://explorer.test.mezo.org/address/0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88)  
**Status**: ✅ **FUNCTIONAL**

### 🔧 Core Integration

#### MezoIntegration
**Address**: `0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6`  
**Description**: Integration with Mezo protocol for BTC and MUSD management  
**Explorer**: [View on Explorer](https://explorer.test.mezo.org/address/0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6)  
**Status**: ✅ **FUNCTIONAL**

#### YieldAggregator
**Address**: `0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6`  
**Description**: Intelligent yield router for optimal strategy allocation  
**Explorer**: [View on Explorer](https://explorer.test.mezo.org/address/0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6)  
**Status**: ✅ **FUNCTIONAL**

### 💰 Tokens

#### MUSD
**Address**: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`  
**Description**: Mezo's official Bitcoin-backed stablecoin  
**Explorer**: [View on Explorer](https://explorer.test.mezo.org/address/0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503)  
**Status**: ✅ **PRODUCTION** (Official Mezo token)

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - Modern React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Wagmi** - React hooks for Ethereum
- **TanStack Query** - Server-state management
- **Zustand** - Client-state management

### Smart Contracts
- **Solidity** - Smart contract development
- **Foundry** - Development framework
- **UUPS Pattern** - Upgradeable proxy pattern
- **OpenZeppelin** - Secure contract libraries

### Protocol
- **Mezo** - Bitcoin Layer 2 network
- **MUSD** - Bitcoin-backed stablecoin
- **Stability Pool** - Yield generation mechanism

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Foundry for smart contract development
- Git for version control

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/AndeLabs/khipuvault.git
cd khipuvault
```

2. **Install dependencies**
```bash
# Install frontend dependencies
cd frontend && npm install

# Install contract dependencies
cd ../contracts && forge install
```

3. **Set up environment variables**
```bash
# Copy environment template
cp frontend/.env.mezo-testnet frontend/.env.local

# Edit with your configuration
nano frontend/.env.local
```

4. **Start development server**
```bash
cd frontend && npm run dev
```

## 💡 How to Use KhipuVault

### Step 1: Configure Wallet
Add Mezo Testnet to your MetaMask:
- **Network Name**: Mezo Testnet
- **RPC URL**: `https://rpc.test.mezo.org`
- **Chain ID**: `31611`
- **Currency**: BTC
- **Explorer**: `https://explorer.test.mezo.org`

### Step 2: Get MUSD
1. Visit [mezo.org](https://mezo.org)
2. Deposit BTC (get testnet BTC from faucet)
3. Mint MUSD (Bitcoin-backed stablecoin)

### Step 3: Connect to KhipuVault
1. Go to [khipuvault.vercel.app](https://khipuvault.vercel.app)
2. Click "Connect Wallet"
3. Select MetaMask
4. Ensure you're on Mezo Testnet

### Step 4: Deposit in a Pool

#### Option A: Individual Savings Pool
1. Go to Dashboard > Individual Savings
2. Enter MUSD amount
3. Click "Approve MUSD" (first time only)
4. Click "Deposit"
5. Confirm transaction in MetaMask
6. ✅ Done! Your yields start accumulating automatically

#### Option B: Cooperative Pool
1. Go to Dashboard > Cooperative Savings
2. Option 1: Create your own pool
   - Click "Create Pool"
   - Define name and minimum contribution
   - Invite other users
3. Option 2: Join existing pool
   - Explore available pools
   - Click "Join Pool"
   - Send BTC according to required contribution

### Step 5: Manage Your Savings
- **View yields**: Dashboard shows real-time earnings
- **Claim yields**: Click "Claim Yields" to receive earnings
- **Withdraw**: Click "Withdraw" to get your MUSD + yields
- **No penalties**: Withdraw anytime, no lock-up period

## 🛡️ Security

- All contracts include comprehensive testing
- Reentrancy protection on all external calls
- Pausable functionality for emergency stops
- Multi-signature governance for critical operations
- Upgradeable contracts using UUPS pattern

## 📊 Current Performance

- **Individual Pool APR**: ~6.2% (via Mezo Stability Pool)
- **Performance Fee**: 1% on generated yields
- **Yields in**: MUSD
- **Updates**: Automatic every 24 hours

## 🔗 Important Links

- **App**: [khipuvault.vercel.app](https://khipuvault.vercel.app)
- **Mezo Testnet Explorer**: [explorer.mezo.org](https://explorer.mezo.org)
- **Get MUSD**: [mezo.org](https://mezo.org)
- **Technical Documentation**: [docs/](docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📞 Support

For questions and support:
- GitHub Issues: [github.com/AndeLabs/khipuvault/issues](https://github.com/AndeLabs/khipuvault/issues)
- Discord: [Coming Soon]

## ⚠️ Disclaimer

KhipuVault is currently on **Mezo Testnet**. Funds are for testing purposes only. Do not use real funds. The project is in active development and may contain bugs.

---

Built with ❤️ for the Bitcoin community on Mezo