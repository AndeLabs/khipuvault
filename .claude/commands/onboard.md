---
description: Developer onboarding and project overview guide
---

# Developer Onboarding Guide

Welcome to **KhipuVault** - a decentralized Bitcoin savings platform on Mezo blockchain.

## Project Overview

KhipuVault allows users to:

- Create individual savings pools with lock periods
- Participate in cooperative community savings
- Earn yield through Mezo staking integration
- Track portfolio performance

## Architecture Tour

### Monorepo Structure

```
KhipuVault/
├── apps/
│   ├── web/           # Next.js 15 frontend (port 9002)
│   └── api/           # Express.js API (port 3001)
├── packages/
│   ├── contracts/     # Solidity smart contracts
│   ├── database/      # Prisma schema
│   ├── blockchain/    # Event indexer
│   ├── web3/          # ABIs, hooks, addresses
│   ├── ui/            # Shared components
│   └── shared/        # Types, utilities
```

### Key Technologies

| Layer      | Stack                                          |
| ---------- | ---------------------------------------------- |
| Frontend   | Next.js 15, React 18, Wagmi, Viem, React Query |
| Backend    | Express.js, Prisma, PostgreSQL, Pino           |
| Blockchain | Solidity, Foundry, ethers.js                   |
| Network    | Mezo Testnet (Chain ID 31611)                  |

## Setup Instructions

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)
- Foundry (for contracts)

### First Time Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL
pnpm docker:up

# Setup database
pnpm db:generate
pnpm db:push
pnpm db:seed

# Start development servers
pnpm dev
```

### Environment Files

Create these files:

- `.env` (root) - DATABASE_URL, RPC_URL
- `apps/web/.env.local` - NEXT*PUBLIC*\* vars
- `apps/api/.env` - JWT_SECRET, CORS_ORIGIN

## Key Files to Understand

### Smart Contracts

- `packages/contracts/src/pools/IndividualPool.sol` - Personal savings
- `packages/contracts/src/pools/CooperativePool.sol` - Group savings

### Frontend

- `apps/web/src/features/` - Feature modules
- `apps/web/src/hooks/web3/` - Blockchain hooks

### Backend

- `apps/api/src/routes/` - API endpoints
- `apps/api/src/services/` - Business logic

### Database

- `packages/database/prisma/schema.prisma` - Data models

## Development Workflow

### Making Changes

1. Create feature branch: `git checkout -b feat/my-feature`
2. Make changes
3. Run quality checks: `pnpm lint && pnpm typecheck && pnpm test`
4. Commit with conventional format: `git commit -m "feat: add feature"`
5. Create PR to main

### Common Commands

```bash
pnpm dev              # Start all services
pnpm dev:web          # Frontend only
pnpm dev:api          # Backend only
pnpm contracts:test   # Test smart contracts
pnpm db:studio        # Open Prisma Studio
```

## Recommended First Tasks

1. **Explore the codebase** - Run `pnpm dev` and click around
2. **Read existing tests** - Good way to understand patterns
3. **Fix a small bug** - Look for "good first issue" labels
4. **Add a test** - Improve coverage in any area

## Getting Help

- Check CLAUDE.md for quick reference
- Use `/debug` command for common issues
- Ask questions in team chat

## Code Conventions

- TypeScript strict mode everywhere
- No console.log (use Pino logger)
- Conventional commits: `feat:`, `fix:`, `chore:`
- 80% test coverage target
