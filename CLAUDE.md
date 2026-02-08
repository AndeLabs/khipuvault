# CLAUDE.md - KhipuVault

> Decentralized Bitcoin savings platform on Mezo blockchain

## Quick Reference

```bash
# Development
pnpm dev              # All services (web:9002, api:3001, indexer)
pnpm dev:web          # Frontend only
pnpm dev:api          # Backend only

# Database
pnpm docker:up        # Start PostgreSQL
pnpm db:generate      # Generate Prisma client (run after schema changes)
pnpm db:push          # Push schema to DB
pnpm db:seed          # Seed test data

# Smart Contracts
pnpm contracts:build  # Compile (forge build)
pnpm contracts:test   # Test (forge test)

# Security
pnpm security:semgrep         # Semgrep SAST (auto-detected rules)
pnpm security:semgrep:custom  # Custom KhipuVault rules
pnpm security:snyk:test       # Snyk dependency scan
pnpm security:audit           # npm audit

# Quality
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript check
pnpm test             # Run all tests
pnpm format           # Format with Prettier

# Git Hooks
pnpm push:check       # Verify code is ready to push
pnpm push:help        # View pre-push guide
pnpm commit:help      # View commit conventions
```

## Architecture

```
apps/
├── web/              # Next.js 15 (Wagmi, Viem, React Query 5)
└── api/              # Express.js (Prisma, SIWE/JWT auth, Pino)

packages/
├── contracts/        # Solidity (Foundry)
├── database/         # Prisma schema + PostgreSQL
├── blockchain/       # ethers.js event indexer
├── web3/             # ABIs, hooks, contract addresses
├── ui/               # Radix/shadcn components
└── shared/           # Types, constants, utilities
```

### Package Import Map

- `@khipu/web3` → ABIs, hooks, addresses (used by web, api, blockchain)
- `@khipu/database` → Prisma client (used by api, blockchain)
- `@khipu/shared` → Types, constants (used by all)
- `@khipu/ui` → Components (used by web)

## Smart Contracts (Mezo Testnet - Chain ID 31611)

| Contract        | Address                                      |
| --------------- | -------------------------------------------- |
| IndividualPool  | `0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393` |
| CooperativePool | `0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88` |
| MezoIntegration | `0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6` |
| YieldAggregator | `0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6` |
| MUSD            | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` |

RPC: `https://rpc.test.mezo.org`

## Code Patterns

### Frontend (apps/web)

- **Feature-based**: `src/features/{individual-savings,cooperative-savings,portfolio}/`
- **Web3 hooks**: `src/hooks/web3/{cooperative,individual}/` with barrel exports
- **State**: React Query for server state, Zustand for client state
- **Styling**: Tailwind + shadcn/ui components from @khipu/ui

### Backend (apps/api)

- **Routes**: `src/routes/` - Express handlers
- **Services**: `src/services/` - Business logic layer
- **Auth**: SIWE (Sign-In With Ethereum) + JWT tokens
- **Logging**: Pino with structured JSON logs

### Blockchain (packages/blockchain)

- **Listeners**: `src/listeners/` - Event indexing for pools
- **Services**: `src/services/` - Transaction processing
- **Retry**: Exponential backoff with idempotency checks

### Contracts (packages/contracts)

- **Source**: `src/` - Solidity contracts
- **Tests**: `test/` - Foundry tests
- **Scripts**: `script/` - Deployment scripts
- **Make targets**: `make test`, `make deploy-testnet`

## Environment Setup

### Required Files

```
.env                  # Root (DATABASE_URL, RPC_URL)
apps/web/.env.local   # Frontend (NEXT_PUBLIC_*)
apps/api/.env         # Backend (JWT_SECRET, CORS_ORIGIN)
```

### First Time Setup

```bash
pnpm install
pnpm docker:up
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

## Conventions

### Code Style

- TypeScript strict mode everywhere
- ESLint with circular dependency detection (max depth 3)
- Prettier for formatting
- No console.log in production code (use Pino logger)
- cspell for spell checking (see `SPELLING_GUIDE.md`)
  - Runs on markdown files during pre-commit
  - Manual check: `pnpm spell:check`
  - Add project terms to `.cspell-custom.txt`

### Git

- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`
- PRs require passing CI (lint → typecheck → test → build)
- Squash merge to main
- Pre-push hooks enforce quality gates (see `.husky/PRE_PUSH_GUIDE.md`)
  - TypeScript type checking (always)
  - Test suite (full on protected branches, changed files on feature branches)
  - No `.only()` or `.skip()` in tests
  - No `console.log` in production code
  - Bundle size monitoring

### Testing

- Vitest for unit/integration tests
- 80% coverage threshold
- Test files: `*.test.ts` or `__tests__/`

## Common Tasks

### Add a new API endpoint

1. Create route in `apps/api/src/routes/`
2. Add service logic in `apps/api/src/services/`
3. Register route in `apps/api/src/index.ts`
4. Add Zod validation schema

### Add a new Web3 hook

1. Create hook in `packages/web3/src/hooks/`
2. Export from barrel file
3. Use `useReadContract` or `useWriteContract` from Wagmi

### Modify database schema

1. Edit `packages/database/prisma/schema.prisma`
2. Run `pnpm db:generate`
3. Run `pnpm db:push` (dev) or `pnpm db:migrate` (prod)

### Deploy contracts

1. Update `.env` with deployer private key
2. Run `cd packages/contracts && make deploy-testnet`
3. Update addresses in `packages/web3/src/addresses.ts`

## Troubleshooting

### Database connection fails

```bash
pnpm docker:up          # Ensure PostgreSQL is running
docker ps               # Verify container status
```

### Prisma client errors

```bash
pnpm db:generate        # Regenerate client after schema changes
```

### Contract compilation errors

```bash
cd packages/contracts
forge clean && forge build
```

### Port already in use

```bash
lsof -i :9002           # Find process on port
kill -9 <PID>           # Kill it
```

## Workspace Filters

```bash
pnpm --filter @khipu/web <cmd>
pnpm --filter @khipu/api <cmd>
pnpm --filter @khipu/database <cmd>
pnpm --filter @khipu/contracts <cmd>
```

## Anti-Patterns (NEVER do these)

### Security

- NEVER commit `.env` files or any secrets
- NEVER hardcode private keys, API keys, or passwords
- NEVER use `eval()` or `dangerouslySetInnerHTML` without sanitization
- NEVER skip input validation on API endpoints
- NEVER deploy contracts without all tests passing

### Code Quality

- NEVER use `any` type in TypeScript - always define proper types
- NEVER use `console.log` in production code - use Pino logger
- NEVER skip error handling for async operations
- NEVER convert BigInt to Number for wei values (precision loss)
- NEVER ignore TypeScript errors with `@ts-ignore`

### Smart Contracts

- NEVER make external calls before state changes (reentrancy risk)
- NEVER use `tx.origin` for authorization
- NEVER skip events for state changes
- NEVER deploy upgradeable contracts without proper access control
- NEVER use floating pragma versions in production

### Git

- NEVER push directly to main branch
- NEVER commit with failing tests
- NEVER force push to shared branches

## Verification Commands

Before committing, ALWAYS run:

```bash
pnpm lint && pnpm typecheck && pnpm test
```

For spell checking:

```bash
pnpm spell:check              # Check all files
pnpm spell:check:changed      # Check only staged files
```

For security scanning:

```bash
pnpm security:semgrep:custom  # Run KhipuVault custom rules
pnpm security:audit           # Check dependency vulnerabilities
```

For smart contracts:

```bash
cd packages/contracts && forge test --gas-report
```

Before deploying:

```bash
pnpm build
pnpm security:semgrep  # Full security scan
```

## Model Selection Guide

Use the appropriate Claude model for each task:

| Task Type                      | Model  | Rationale            |
| ------------------------------ | ------ | -------------------- |
| Simple formatting, scaffolding | Haiku  | Fast, cost-effective |
| Daily development, code review | Sonnet | Good balance         |
| Security audits, architecture  | Opus   | Maximum capability   |

## Context7 Usage

When you need up-to-date documentation, add to your prompt:

```
"use context7 for [library] documentation"
```

Examples:

- "use context7 for wagmi hooks"
- "use context7 for prisma patterns"
- "use context7 for solidity gas optimization"
