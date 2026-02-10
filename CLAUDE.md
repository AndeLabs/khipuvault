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

**Last Updated: 2026-02-10**

| Contract        | Address                                      | Status      |
| --------------- | -------------------------------------------- | ----------- |
| IndividualPool  | `0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393` | Deployed    |
| CooperativePool | `0xA39EE76DfC5106E78ABcB31e7dF5bcd4EfD3Cd1F` | Deployed    |
| YieldAggregator | `0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6` | Deployed    |
| MezoIntegration | `0xab91e387F8faF1FEBF7FF7E019e2968F19c177fD` | Deployed    |
| LotteryPool     | `0x8c9cc22f5184bB4E485dbb51531959A8Cf0624b4` | Deployed    |
| RotatingPool    | `0x1b7AB2aF7d58Fb8a137c237d93068A24808a7B04` | Deployed    |
| MUSD            | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` | Mezo Native |

**Deployer Wallet:** `0x8e7E7BA2BD22e6f194821Ea2cEf903eaD949F257`

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

## Auto-Applied Knowledge

Claude automatically applies specialized knowledge based on task context. No manual invocation needed.

**Knowledge Base Location**: `.claude/knowledge/AUTO_KNOWLEDGE.md`

### When Knowledge is Applied

| Task Type                  | Auto-Applied Knowledge                          |
| -------------------------- | ----------------------------------------------- |
| Frontend Web3 components   | Wagmi hooks, Viem utilities, React Query        |
| Smart contract development | Foundry testing, OpenZeppelin, Gas optimization |
| API endpoint creation      | Express patterns, Zod validation, SIWE auth     |
| Database operations        | Prisma patterns, transactions, pagination       |
| Blockchain interactions    | Mezo config, contract addresses, ethers.js      |

### Available Skills (Manual Invocation)

For detailed documentation, invoke these skills explicitly:

```
/foundry          # Forge testing, deployment scripts
/wagmi-viem       # Wagmi 2.x hooks, Viem utilities
/prisma-patterns  # Database schema, queries, transactions
/openzeppelin     # Security patterns, access control
/solidity-gas     # Gas optimization techniques
/express-api      # API routes, middleware, auth
/mezo-blockchain  # Mezo network config, RPC
/react-query      # Server state, query keys, mutations
/zod-validation   # Schema validation, type inference
```

### Security Checklist (Auto-Applied)

Claude automatically validates against these patterns:

**Smart Contracts:**

- `nonReentrant` on functions with transfers
- CEI pattern (Checks-Effects-Interactions)
- `SafeERC20` for token operations
- Events for all state changes

**Backend:**

- Zod validation on all inputs
- Proper error handling middleware
- Rate limiting on sensitive endpoints

**Frontend:**

- Loading/error states on async operations
- Transaction receipt waiting
- Query invalidation after mutations

## Auto-Applied Workflow Skills

Claude MUST follow these workflows automatically. See `.claude/SKILLS_AUTO_APPLY.md` for full details.

### Mandatory Workflow Order

```
Brainstorm → Plan → Test First → Implement → Verify → Complete
```

### Trigger-Based Skills

| When...           | Auto-Apply                       | Key Rule                                         |
| ----------------- | -------------------------------- | ------------------------------------------------ |
| Creating features | `brainstorming`                  | Ask questions ONE at a time, propose 2-3 options |
| Fixing bugs       | `systematic-debugging`           | NO fixes without root cause investigation        |
| Writing code      | `test-driven-development`        | NO production code without failing test first    |
| Building UI       | `frontend-design`                | BOLD aesthetics, NO generic AI slop              |
| React/Next.js     | `vercel-react-best-practices`    | Performance patterns (waterfalls, bundles)       |
| Multi-step tasks  | `writing-plans`                  | Save to `docs/plans/YYYY-MM-DD-<feature>.md`     |
| Claiming done     | `verification-before-completion` | Run commands BEFORE success claims               |

### Iron Laws (NEVER violate)

1. **Debugging**: `NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST`
2. **Testing**: `NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST`
3. **Completion**: `NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE`

### Verification Before Completion

**ALWAYS run before claiming success:**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

**NEVER say** "should work", "looks correct", or express satisfaction without running verification commands.

### Installed Skills Location

```
.agents/skills/           # 35 skills from skills.sh
.claude/skills/           # 10 KhipuVault-specific skills
.claude/knowledge/        # Auto-applied knowledge base
.claude/SKILLS_AUTO_APPLY.md  # Workflow rules
```
