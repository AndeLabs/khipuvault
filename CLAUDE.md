# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KhipuVault is a decentralized Bitcoin savings platform on Mezo blockchain. It's a Turborepo monorepo with pnpm workspaces containing smart contracts, backend API, blockchain indexer, and Next.js frontend.

## Commands

### Development
```bash
pnpm dev                # All services concurrently
pnpm dev:web            # Frontend only (localhost:9002)
pnpm dev:api            # Backend only (localhost:3001)
pnpm dev:indexer        # Blockchain event indexer
```

### Build & Test
```bash
pnpm build              # Build all packages
pnpm build:web          # Build frontend only
pnpm build:api          # Build backend only
pnpm test               # Run all tests
pnpm lint               # Lint all packages
pnpm typecheck          # TypeScript check all packages
pnpm format             # Format with Prettier
```

### Database (Prisma)
```bash
pnpm db:generate        # Generate Prisma client
pnpm db:push            # Push schema changes to DB
pnpm db:migrate         # Create migration
pnpm db:studio          # Open Prisma Studio GUI
pnpm db:seed            # Seed initial data
```

### Smart Contracts (Foundry)
```bash
pnpm contracts:build    # Compile contracts (forge build)
pnpm contracts:test     # Run contract tests (forge test)
```

### Docker
```bash
pnpm docker:up          # Start PostgreSQL container
pnpm docker:down        # Stop containers
```

## Architecture

```
apps/
├── web/                # Next.js 15 frontend (wagmi, viem, react-query)
└── api/                # Express.js REST API (Prisma, JWT/SIWE auth)

packages/
├── contracts/          # Solidity smart contracts (Foundry)
├── database/           # Prisma ORM schema + PostgreSQL
├── blockchain/         # ethers.js event indexer
├── web3/               # Web3 hooks, ABIs, contract addresses
├── ui/                 # Shared Radix/shadcn components
└── shared/             # Types, constants, utilities

tooling/
├── eslint/             # Shared ESLint config
└── typescript/         # Base tsconfig
```

### Package Dependencies
- All apps import from `@khipu/*` packages
- `@khipu/web3` exports ABIs, hooks, and contract addresses
- `@khipu/database` provides Prisma client and types
- `@khipu/shared` contains cross-package types and utilities

### Frontend Architecture (apps/web)
Feature-based organization under `src/features/`:
- `individual-savings/` - Personal pool UI and logic
- `cooperative-savings/` - Community pool features
- `portfolio/` - Dashboard and analytics

Web3 hooks in `src/hooks/web3/`:
- `cooperative/` - Cooperative pool hooks (queries, mutations, helpers)
- `individual/` - Individual pool hooks
- Barrel exports maintain backward compatibility

### Backend Architecture (apps/api)
```
src/
├── routes/             # Express route handlers
├── services/           # Business logic layer
├── middleware/         # Auth, error-handler, security, logging
└── index.ts            # Entry point
```

API uses SIWE (Sign-In With Ethereum) + JWT for authentication.

## Smart Contracts (Mezo Testnet - Chain ID 31611)

| Contract | Address |
|----------|---------|
| IndividualPool | 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393 |
| CooperativePool | 0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88 |
| MezoIntegration | 0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6 |
| YieldAggregator | 0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6 |
| MUSD | 0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503 |

## Key Technologies

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind, Wagmi 2.18+, Viem 2+, React Query 5
- **Backend**: Express.js, Prisma ORM, PostgreSQL, Zod, Pino logging
- **Blockchain**: Solidity, Foundry, ethers.js 6.13+
- **Build**: Turborepo, pnpm workspaces, tsup for package bundling

## Environment Variables

Root `.env`:
```
DATABASE_URL=postgresql://khipu:password@localhost:5432/khipuvault
RPC_URL=https://rpc.test.mezo.org
```

See `.env.example` files in root, `apps/web/`, and `apps/api/` for complete configurations.

## Workspace Commands

Target specific packages using pnpm filters:
```bash
pnpm --filter @khipu/web <command>
pnpm --filter @khipu/api <command>
pnpm --filter @khipu/database <command>
```

## Development Notes

- Node.js 20+ required
- Always run `pnpm db:generate` after schema changes
- Contract ABIs are auto-generated in `@khipu/web3` from Solidity sources
- Frontend dev server runs on port 9002, API on port 3001
- ESLint enforces circular dependency detection (max depth 3)
- TypeScript strict mode enabled across all packages
