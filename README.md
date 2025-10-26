   Creating an optimized production build ...
Failed to compile.
./src/app/dashboard/settings/layout.tsx
Module not found: Can't resolve '../../lib/utils'
https://nextjs.org/docs/messages/module-not-found
./src/app/dashboard/settings/layout.tsx
Module not found: Can't resolve '../../components/animate-on-scroll'
https://nextjs.org/docs/messages/module-not-found
./src/components/ui/button.tsx
Module not found: Can't resolve '../lib/utils'
# KhipuVault

A decentralized Bitcoin savings platform built on Mezo, offering multiple savings strategies with automatic yield optimization through MUSD integration.

## Overview

KhipuVault provides multiple savings pools designed to meet different financial goals and risk preferences, all powered by MUSD (Mezo's Bitcoin-backed stablecoin):

- **Individual Pool**: Personal savings with auto-yield optimization ✅ DEPLOYED
- **Cooperative Pool**: Community pooled savings with shared rewards ✅ DEPLOYED
- **Lottery Pool**: Prize-based savings with no-loss lottery mechanics (Coming Soon)
- **Rotating Pool**: Turn-based distribution system (ROSCA/Pasanaku) (Coming Soon)

## Features

- 🪙 **MUSD-First**: Uses MUSD, the Bitcoin-backed stablecoin from Mezo
- ⚡ **Yield Optimization**: Automatic routing to best yield strategies
- 🔗 **Simple Integration**: Standard EVM wallet connection (MetaMask, WalletConnect)
- 🛡️ **Security First**: Comprehensive testing and production-ready contracts
- 🌐 **Mezo Testnet**: Deployed and functional on Chain ID 31611

## Architecture

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

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Foundry for smart contract development
- Git for version control

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AndeLabs/khipuvault.git
cd khipuvault
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend && npm install

# Install contract dependencies
cd ../contracts && forge install
```

3. Set up environment variables:
```bash
# Copy environment template
cp frontend/.env.mezo-testnet frontend/.env.local

# Edit with your configuration
nano frontend/.env.local
```

4. Start development server:
```bash
cd frontend && npm run dev
```

## Deployment

### Mezo Testnet (Chain ID: 31611)
Production-ready contracts deployed and verified:

**Core Pools (FUNCTIONAL)**
- **IndividualPool**: `0x6028E4452e6059e797832578D70dBdf63317538a`
- **CooperativePool**: `0x92eCA935773b71efB655cc7d3aB77ee23c088A7a`

**Core Integration**
- **MezoIntegration**: `0xa19B54b8b3f36F047E1f755c16F423143585cc6B`
- **YieldAggregator**: `0x5BDac57B68f2Bc215340e4Dc2240f30154f4A007`

**MUSD Token (Mezo Official)**
- **MUSD**: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`

For complete deployment details, see `contracts/deployments/pools-31611.json`

## How to Use

### For Users

1. **Get MUSD**: Visit [mezo.org](https://mezo.org) to obtain MUSD (Bitcoin-backed stablecoin)
2. **Connect Wallet**: Use MetaMask or any EVM wallet on Mezo Testnet
3. **Deposit MUSD**: Choose a savings pool and deposit your MUSD
4. **Earn Yields**: Your deposits automatically earn optimized yields
5. **Withdraw Anytime**: Claim your yields or withdraw your funds whenever you want

### Network Configuration

Add Mezo Testnet to your wallet:
- **Network Name**: Mezo Testnet
- **RPC URL**: `https://rpc.test.mezo.org`
- **Chain ID**: `31611`
- **Currency**: BTC
- **Explorer**: `https://explorer.mezo.org`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Security

- All contracts include comprehensive testing
- Reentrancy protection on all external calls
- Pausable functionality for emergency stops
- Multi-signature governance for critical operations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [Documentation](docs/)
- [Mezo Testnet Explorer](https://testnet-explorer.mezo.org)
- [Mezo Passport](https://passport.mezo.org)

## Support

For questions and support, please open an issue in this repository.
