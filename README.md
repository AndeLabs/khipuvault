# KhipuVault

A decentralized Bitcoin savings platform built on Mezo, offering multiple savings strategies with automatic yield optimization through MUSD integration.

## Overview

KhipuVault provides four distinct savings pools designed to meet different financial goals and risk preferences:

- **Individual Pool**: Personal savings with auto-yield optimization
- **Cooperative Pool**: Community pooled savings with shared rewards
- **Lottery Pool**: Prize-based savings with no-loss lottery mechanics
- **Rotating Pool**: Turn-based distribution system (ROSCA/Pasanaku)

## Features

- 🔗 **Mezo Integration**: Native MUSD (Bitcoin-backed stablecoin) support
- 🔐 **Mezo Passport**: Unified Bitcoin and EVM wallet experience
- ⚡ **Yield Optimization**: Automatic routing to best yield strategies
- 🎲 **Chainlink VRF**: Verifiable randomness for lottery mechanics
- 🛡️ **Security First**: Comprehensive testing and audit-ready contracts

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

### Testnet (Mezo Testnet)
The contracts are deployed on Mezo Testnet (Chain ID: 31611):

- **IndividualPool**: `0x0Ae6141D150A3B77Cef3C8d45ff6463Bf3c83374`
- **CooperativePool**: `0x10931caec055481F3FFd642C6903189E7A496Df3`
- **LotteryPool**: `0xC9075e81864C6a603Ea0C87E5b8f4e3471A9D567`
- **RotatingPool**: `0x68b6a3b7a640071f04E1e3737De24ed0f72213B5`

### Production
For mainnet deployment, follow the deployment guides in the `docs/` directory.

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