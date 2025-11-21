# KhipuVault v3.0

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/AndeLabs/khipuvault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Mezo Testnet](https://img.shields.io/badge/Network-Mezo%20Testnet-blue)](https://explorer.test.mezo.org)

> Bitcoin savings platform on Mezo - Complete monorepo architecture

## Overview

KhipuVault is a decentralized Bitcoin savings platform built on the Mezo blockchain, offering multiple savings strategies with automatic yield optimization through MUSD integration. This monorepo contains the entire platform: smart contracts, backend API, blockchain indexer, and Next.js frontend.

### Features

- 🪙 **Individual Pool**: Personal savings with auto-yield optimization
- 👥 **Cooperative Pool**: Community pooled savings with shared rewards
- 📊 **Analytics Dashboard**: Real-time portfolio and performance metrics
- ⚡ **Event Indexer**: Automatic blockchain event tracking
- 🛡️ **REST API**: Complete backend for user data and analytics
- 🎨 **Modern UI**: Feature-based Next.js architecture with shadcn/ui

## Architecture

```
KhipuVault/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   └── api/                    # Express.js REST API
│
├── packages/
│   ├── contracts/              # Solidity smart contracts (Foundry)
│   ├── database/               # Prisma ORM & PostgreSQL
│   ├── blockchain/             # Event indexer (ethers.js)
│   ├── web3/                   # Web3 hooks & contract interactions
│   ├── ui/                     # Shared UI components (Radix, shadcn)
│   └── shared/                 # Shared types, constants, utils
│
├── tooling/                    # Shared configs
│   ├── typescript/             # TypeScript configs
│   └── eslint/                 # ESLint configs
│
└── scripts/                    # Development & deployment scripts
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- Foundry (for smart contracts)

### Installation

```bash
# Clone repository
git clone https://github.com/AndeLabs/khipuvault.git
cd KhipuVault

# Run setup script (installs deps, sets up DB, seeds data)
./scripts/setup.sh
```

### Development

```bash
# Start all services
pnpm dev

# Or start individual services
pnpm dev:web        # Frontend (localhost:3000)
pnpm dev:api        # Backend (localhost:3001)
pnpm dev:indexer    # Blockchain indexer

# Database
pnpm db:studio      # Open Prisma Studio
pnpm db:push        # Push schema changes
pnpm db:seed        # Seed database

# Smart contracts
pnpm contracts:build   # Build contracts
pnpm contracts:test    # Run tests
```

## Tech Stack

### Frontend
- Next.js 15, TypeScript, Tailwind CSS
- Radix UI, shadcn/ui
- React Query, Wagmi, Viem
- Feature-based architecture

### Backend
- Express.js, TypeScript
- Prisma ORM, PostgreSQL
- Zod validation

### Blockchain
- Solidity, Foundry
- ethers.js for indexing
- Mezo Testnet (Chain ID: 31611)

### DevOps
- pnpm workspaces
- Turborepo
- Docker Compose
- Automated scripts

## Smart Contracts (Mezo Testnet)

### 🏦 Savings Pools

**IndividualPool**: `0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393`
Personal savings with automatic yield optimization
[View on Explorer](https://explorer.test.mezo.org/address/0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393)

**CooperativePool**: `0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88`
Community savings pool with shared rewards
[View on Explorer](https://explorer.test.mezo.org/address/0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88)

### 🔧 Core Integration

**MezoIntegration**: `0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6`
Integration with Mezo protocol for BTC and MUSD management

**YieldAggregator**: `0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6`
Intelligent yield router for optimal strategy allocation

**MUSD**: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`
Mezo's official Bitcoin-backed stablecoin

## Project Structure

### Apps

#### Frontend (`apps/web`)
Feature-based architecture with:
- Individual & Cooperative Pool interfaces
- Portfolio & Analytics dashboard
- Settings & User management

See [apps/web/ARCHITECTURE.md](apps/web/ARCHITECTURE.md) for detailed docs.

#### Backend (`apps/api`)
REST API with endpoints for:
- User portfolios & transactions
- Pool data & analytics
- Transaction history & stats
- Event logs & activity timeline

See [apps/api/README.md](apps/api/README.md) for API docs.

### Packages

#### Contracts (`packages/contracts`)
Solidity contracts for savings pools, yield aggregation, and Mezo integration.

#### Database (`packages/database`)
Prisma schema with models for Users, Deposits, Pools, Analytics, and EventLogs.

#### Blockchain (`packages/blockchain`)
Event indexer that listens to on-chain events and stores them in the database.

#### Web3 (`packages/web3`)
React hooks for contract interactions, contract addresses, and API client.

#### UI (`packages/ui`)
Shared UI components built with Radix UI and Tailwind CSS.

#### Shared (`packages/shared`)
Common types, constants, and utility functions used across the monorepo.

## Environment Setup

### Root `.env`
```env
DATABASE_URL="postgresql://khipu:password@localhost:5432/khipuvault"
RPC_URL="https://rpc.test.mezo.org"
```

### Frontend `.env` (`apps/web/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS=0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393
```

### Backend `.env` (`apps/api/.env`)
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://khipu:password@localhost:5432/khipuvault"
```

See `.env.example` files in each package for complete configurations.

## Scripts

### Development
```bash
pnpm dev              # All services
pnpm dev:web          # Frontend only
pnpm dev:api          # Backend only
pnpm dev:indexer      # Indexer only
```

### Build
```bash
pnpm build            # All packages
pnpm build:web        # Frontend
pnpm build:api        # Backend
```

### Database
```bash
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema
pnpm db:migrate       # Create migration
pnpm db:studio        # Prisma Studio
pnpm db:seed          # Seed data
```

### Docker
```bash
pnpm docker:up        # Start services
pnpm docker:down      # Stop services
pnpm docker:logs      # View logs
```

### Utilities
```bash
pnpm clean            # Clean artifacts
pnpm setup            # Setup from scratch
pnpm format           # Format code
pnpm lint             # Lint code
pnpm typecheck        # Type check
```

## Deployment

### Frontend (Vercel)
```bash
cd apps/web
vercel --prod
```

### Backend (Railway/Render)
Deploy `apps/api` as a Node.js service with DATABASE_URL configured.

### Indexer
Deploy `packages/blockchain` as a background worker with DATABASE_URL and RPC_URL.

## Documentation

- [Root README](README.md) - Monorepo overview (this file)
- [Frontend Architecture](apps/web/ARCHITECTURE.md) - Feature-based organization
- [API Documentation](apps/api/README.md) - REST endpoints
- [Database Package](packages/database/README.md) - Prisma schema
- [Blockchain Indexer](packages/blockchain/README.md) - Event indexing
- [Web3 Package](packages/web3/README.md) - Contract hooks
- [UI Components](packages/ui/README.md) - Shared components

## How to Use KhipuVault

### 1. Configure Wallet
Add Mezo Testnet to MetaMask:
- **Network Name**: Mezo Testnet
- **RPC URL**: `https://rpc.test.mezo.org`
- **Chain ID**: `31611`
- **Currency**: BTC

### 2. Get MUSD
1. Visit [mezo.org](https://mezo.org)
2. Deposit BTC (testnet)
3. Mint MUSD

### 3. Connect & Deposit
1. Go to [khipuvault.vercel.app](https://khipuvault.vercel.app)
2. Connect wallet
3. Choose a savings pool
4. Approve MUSD (first time)
5. Deposit and start earning yield!

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting: `pnpm test && pnpm lint`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

## Security

- Comprehensive smart contract testing
- Reentrancy protection
- Pausable functionality
- Multi-signature governance
- UUPS upgradeable pattern

## Support

- **Issues**: [GitHub Issues](https://github.com/AndeLabs/khipuvault/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AndeLabs/khipuvault/discussions)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Disclaimer

⚠️ KhipuVault is currently on **Mezo Testnet**. Use testnet funds only. The project is in active development.

---

Built with ❤️ by the KhipuVault team on Mezo
