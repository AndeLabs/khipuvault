# 🏦 KhipuVault

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/AndeLabs/khipuvault)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Mezo Testnet](https://img.shields.io/badge/Network-Mezo%20Testnet-blue)](https://explorer.test.mezo.org)
[![Audit Status](https://img.shields.io/badge/Audit-In%20Preparation-yellow)](./audit/README.md)

> Bitcoin-native DeFi savings platform on Mezo blockchain
> **Status:** Testnet Deployment | Pre-Audit Preparation | Mezo Hackathon Winner 🏆

---

## 🎉 Mezo Hackathon Winner

**Track 1 Winner** - $7,500 MUSD Prize
**Grant Application:** 15,000 MEZO Tokens (Pending)

---

## 📋 Quick Links

- 🔍 **[Audit Documentation](./audit/README.md)** - For security auditors
- 📚 **[User Documentation](https://docs.khipuvault.com)** - 86 pages of guides
- 🚀 **[Launch Plan](./docs/planning/MAINNET_LAUNCH_PLAN.md)** - Go-to-market strategy
- 🏗️ **[Architecture](./audit/ARCHITECTURE.md)** - System design
- 🛡️ **[Security](./audit/SECURITY.md)** - Security model
- 📊 **[Development Guide](./docs/archive/CLAUDE.md)** - For contributors

---

## 🌟 Overview

KhipuVault is a decentralized Bitcoin savings platform built on the Mezo blockchain, offering multiple savings strategies with automatic yield optimization through Mezo's stability pool integration.

### Core Products

- 🪙 **Individual Savings** - Personal accounts with auto-compound
- 👥 **Community Pools** - Multi-user savings with shared yields
- 🔄 **Rotating Pools (ROSCA)** - Traditional savings circles on-chain
- 🎰 **Prize Pools** - Lottery-based savings with yield-enhanced prizes

### Key Features

- ✅ **Bitcoin-Native** - Built on Mezo L2, inherits Bitcoin security
- ✅ **Non-Custodial** - Users always control their funds
- ✅ **Yield Optimized** - Automatic strategy allocation via YieldAggregator
- ✅ **Transparent** - Open-source, audited smart contracts
- ✅ **Accessible** - Low minimums starting from $10 equivalent

---

## 🏗️ Architecture

```
KhipuVault/
├── audit/                      # 🔍 Audit documentation
│   ├── README.md              # Start here for auditors
│   ├── ARCHITECTURE.md        # System design
│   ├── SECURITY.md            # Security model
│   ├── contracts/             # → Smart contracts (symlink)
│   ├── test/                  # → Test suite (symlink)
│   └── reports/               # Slither, gas, coverage reports
│
├── apps/
│   ├── web/                   # Next.js 15 frontend
│   └── api/                   # Express.js REST API
│
├── packages/
│   ├── contracts/             # Solidity smart contracts (Foundry)
│   ├── database/              # Prisma ORM & PostgreSQL schema
│   ├── blockchain/            # Event indexer (ethers.js)
│   ├── web3/                  # Web3 hooks & ABIs
│   ├── ui/                    # Shared UI components (Radix, shadcn)
│   └── shared/                # Types, constants, utilities
│
├── docs/
│   ├── planning/              # Launch plans & deployment guides
│   └── archive/               # Historical development docs
│
└── scripts/                   # Development & deployment scripts
```

---

## 🚀 Quick Start

### Prerequisites

```bash
node >= 20.x
pnpm >= 9.x
docker & docker-compose
foundry (for smart contracts)
```

### Installation

```bash
# Clone repository
git clone https://github.com/AndeLabs/khipuvault.git
cd KhipuVault

# Install dependencies
pnpm install

# Start PostgreSQL
pnpm docker:up

# Setup database
pnpm db:generate
pnpm db:push
pnpm db:seed

# Start all services
pnpm dev
```

### Development Commands

```bash
# Start services
pnpm dev              # All services
pnpm dev:web          # Frontend (localhost:9002)
pnpm dev:api          # Backend (localhost:3001)

# Database
pnpm db:studio        # Open Prisma Studio
pnpm db:push          # Push schema changes
pnpm db:seed          # Seed test data

# Smart Contracts
pnpm contracts:build  # Compile contracts (forge build)
pnpm contracts:test   # Run tests (forge test)

# Security
pnpm security:semgrep         # Semgrep SAST scan
pnpm security:snyk:test       # Snyk dependency scan
pnpm security:audit           # npm audit

# Quality
pnpm lint             # Lint all packages
pnpm typecheck        # TypeScript check
pnpm format           # Format with Prettier
```

---

## 📊 Tech Stack

### Frontend

- **Framework:** Next.js 15 with App Router
- **Web3:** Wagmi 2.x + Viem 2.x
- **State:** React Query 5 + Zustand
- **Auth:** Privy (embedded wallets)
- **UI:** Tailwind CSS + shadcn/ui (Radix)
- **Language:** TypeScript (strict mode)

### Backend

- **API:** Express.js + Zod validation
- **Database:** PostgreSQL 16 + Prisma ORM
- **Auth:** SIWE (Sign-In With Ethereum) + JWT
- **Logging:** Pino (structured JSON logs)
- **Language:** TypeScript (strict mode)

### Blockchain

- **Contracts:** Solidity 0.8.25
- **Framework:** Foundry (forge, cast, anvil)
- **Libraries:** OpenZeppelin v5.x
- **Indexer:** ethers.js v6 with reorg detection
- **Network:** Mezo Testnet (Chain ID: 31611)

### DevOps

- **Monorepo:** pnpm workspaces + Turborepo
- **CI/CD:** GitHub Actions
- **Deployment:** Vercel (frontend) + Railway (backend)
- **Containers:** Docker Compose

---

## 🔗 Deployed Contracts (Mezo Testnet)

**Chain:** Mezo Testnet
**Chain ID:** 31611
**RPC:** https://rpc.test.mezo.org
**Explorer:** https://explorer.test.mezo.org

| Contract            | Address                                                                                                  | Description               |
| ------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------- |
| **IndividualPool**  | [`0xdfBEd...0393`](https://explorer.test.mezo.org/address/0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393)    | Personal savings accounts |
| **CooperativePool** | [`0x323Fc...1655F88`](https://explorer.test.mezo.org/address/0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88) | Community pooled savings  |
| **MezoIntegration** | [`0x043de...CE1c6`](https://explorer.test.mezo.org/address/0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6)   | BTC ↔ MUSD bridge        |
| **YieldAggregator** | [`0x3D28A...E6`](https://explorer.test.mezo.org/address/0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6)      | Yield strategy router     |
| **MUSD Token**      | [`0x11891...503`](https://explorer.test.mezo.org/address/0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503)     | Mezo stablecoin           |

---

## 🔍 For Security Auditors

### Audit Documentation

All audit-related materials are in the **[`audit/`](./audit/README.md)** folder:

- 📄 **[Audit Guide](./audit/README.md)** - Start here
- 🏗️ **[Architecture](./audit/ARCHITECTURE.md)** - System design, contracts, data flows
- 🛡️ **[Security Model](./audit/SECURITY.md)** - Access control, assumptions, mitigations
- ✅ **[Audit Checklist](./audit/PRE_AUDIT_CHECKLIST.md)** - Preparation guide
- 📊 **[Security Findings](./audit/reports/SECURITY_FINDINGS.md)** - Slither analysis (84 findings)

### Quick Audit Setup

```bash
# Clone and install
git clone https://github.com/AndeLabs/khipuvault.git
cd KhipuVault/audit

# Contracts are symlinked
cd contracts  # → packages/contracts/src/
cd test       # → packages/contracts/test/

# Run tests
cd ../packages/contracts  # or from root
forge test -vvv
forge test --gas-report
```

**Audit Scope:**

- `contracts/pools/v3/*.sol` - Pool implementations (4 contracts)
- `contracts/integrations/v3/*.sol` - Mezo integration (2 contracts)
- `contracts/integrations/base/*.sol` - Shared base contracts

**Security Tools:**

- ✅ Slither (static analysis complete)
- ✅ Semgrep (SAST for TypeScript/Solidity)
- ✅ Snyk (dependency scanning)
- ✅ Foundry (150+ tests, fuzz testing)
- ⏳ Formal verification (planned)

---

## 📚 Documentation

### For Users

- **[Documentation Site](https://docs.khipuvault.com)** - 86 pages covering:
  - Getting Started
  - Product Guides (Individual, Cooperative, ROSCA, Lottery)
  - Security Best Practices
  - FAQ & Troubleshooting

### For Developers

- **[Development Guide](./docs/archive/CLAUDE.md)** - Comprehensive guide for contributors:
  - Architecture overview
  - Code patterns & anti-patterns
  - Package import map
  - Testing strategies
  - Deployment procedures

### For Auditors

- **[Audit Package](./audit/README.md)** - Complete audit documentation

### For Grant Reviewers

- **[Mainnet Launch Plan](./docs/planning/MAINNET_LAUNCH_PLAN.md)** - Go-to-market strategy:
  - Timeline (12 months)
  - Marketing strategy
  - Budget & projections
  - User acquisition plan

---

## 🛡️ Security

### Audit Status

**Current:** Pre-Audit Preparation (85% complete)
**Next:** Professional audit submission (Supernormal Foundation partner)

### Security Features

- ✅ **OpenZeppelin Contracts** - Industry-standard security primitives
- ✅ **ReentrancyGuard** - All state-changing functions protected
- ✅ **Flash Loan Protection** - Same-block deposit/withdraw prevention
- ✅ **Access Control** - Multi-sig planned for mainnet
- ✅ **UUPS Upgradeable** - Secure upgrade pattern
- ✅ **Pausable** - Emergency stop mechanism

### Testing

- **Unit Tests:** 150+ tests covering all functions
- **Integration Tests:** Full user flow testing
- **Fuzz Testing:** Randomized input validation
- **Gas Profiling:** Optimization analysis
- **Coverage:** Target 90%+ (blocked by stack-too-deep in some contracts)

### Known Findings

**Slither Analysis:**

- 🔴 6 High Severity (reentrancy - all mitigated)
- 🟠 12 Medium Severity (input validation improvements)
- 🟡 66 Low Severity (code quality, best practices)

See [Security Findings Report](./audit/reports/SECURITY_FINDINGS.md) for details.

---

## 🌐 Environment Setup

### Root `.env`

```env
DATABASE_URL="postgresql://khipu:password@localhost:5432/khipuvault"
RPC_URL="https://rpc.test.mezo.org"
```

### Frontend `.env.local` (`apps/web/`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org
NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS=0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393
NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS=0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
```

### Backend `.env` (`apps/api/`)

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://khipu:password@localhost:5432/khipuvault"
JWT_SECRET=your_secret_key
CORS_ORIGIN=http://localhost:9002
```

---

## 🚀 Deployment

### Frontend (Vercel)

```bash
cd apps/web
vercel --prod
```

**Environment Variables:** Set in Vercel dashboard

- All `NEXT_PUBLIC_*` variables
- Build command: `pnpm turbo build --filter=@khipu/web`
- Output directory: `.next`

### Backend (Railway/Render)

Deploy `apps/api` as Node.js service:

- **Start command:** `pnpm start`
- **Environment:** `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`

### Indexer (Background Worker)

Deploy `packages/blockchain` with:

- **Environment:** `DATABASE_URL`, `RPC_URL`
- **Restart policy:** Always

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/khipuvault.git`
3. **Create branch:** `git checkout -b feature/amazing-feature`
4. **Make changes** following our code style (see development guide)
5. **Test:** `pnpm test && pnpm lint && pnpm typecheck`
6. **Commit:** `git commit -m 'feat: add amazing feature'`
7. **Push:** `git push origin feature/amazing-feature`
8. **Open PR** with clear description

### Development Guidelines

- **Code Style:** ESLint + Prettier (enforced via husky)
- **Commits:** Conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- **TypeScript:** Strict mode, no `any` types
- **Tests:** Required for new features
- **Documentation:** Update relevant docs

See the development guide in docs/archive for detailed contribution information.

---

## 📊 Project Status

### Completed ✅

- [x] Smart contracts deployed to Mezo Testnet
- [x] Full-stack application (web, API, indexer)
- [x] 4 DeFi products implemented
- [x] Documentation site with 86 pages
- [x] Security analysis (Slither)
- [x] Test suite (150+ tests)
- [x] Domain purchased (khipuvault.com)

### In Progress 🔄

- [ ] Professional security audit
- [ ] Fix 6 high-severity findings
- [ ] Test coverage >90%
- [ ] Mainnet deployment preparation

### Upcoming ⏳

- [ ] Multi-sig wallet setup
- [ ] Bug bounty program
- [ ] Insurance coverage
- [ ] Mainnet launch
- [ ] User acquisition campaign

---

## 📈 Roadmap

**Q1 2026 (Current):**

- ✅ Testnet deployment
- ⏳ Security audit
- ⏳ Bug fixes & hardening

**Q2 2026:**

- Mainnet launch (post-audit)
- Beta testing program
- Marketing campaign start
- Target: 100 users, $50K TVL

**Q3 2026:**

- Feature expansion
- Mobile app (React Native)
- Fiat on-ramp integration
- Target: 500 users, $250K TVL

**Q4 2026:**

- DAO governance launch
- Multi-chain expansion
- Institutional partnerships
- Target: 2,000 users, $1M TVL

See [Full Launch Plan](./docs/planning/MAINNET_LAUNCH_PLAN.md) for details.

---

## 🏆 Achievements

- 🥇 **Mezo Hackathon Winner** - Track 1 ($7,500 MUSD)
- 📚 **Comprehensive Documentation** - 86 pages + audit package
- 🔒 **Security First** - OpenZeppelin + Slither analysis
- 🏗️ **Full-Stack Platform** - Contracts + Backend + Frontend + Indexer

---

## 📞 Support & Community

- **Issues:** [GitHub Issues](https://github.com/AndeLabs/khipuvault/issues)
- **Discussions:** [GitHub Discussions](https://github.com/AndeLabs/khipuvault/discussions)
- **Documentation:** [docs.khipuvault.com](https://docs.khipuvault.com)
- **Email:** security@khipuvault.com (audit/security only)
- **Twitter:** @KhipuVault (coming soon)
- **Discord:** Coming post-audit

---

## ⚖️ License

MIT License - see [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

**KhipuVault is currently on Mezo Testnet.**

- Use testnet funds only
- Smart contracts are in pre-audit phase
- Not recommended for production use until after professional audit
- No financial advice - DYOR (Do Your Own Research)

---

## 🙏 Acknowledgments

- **Mezo Foundation** - For the hackathon prize and grant opportunity
- **Supernormal Foundation** - For audit partnership
- **OpenZeppelin** - For battle-tested security contracts
- **Foundry Team** - For excellent smart contract tooling

---

**Built with ❤️ on Mezo**

For auditors: Start with [`audit/README.md`](./audit/README.md)
For developers: See development guide in docs/archive
For users: Visit [docs.khipuvault.com](https://docs.khipuvault.com)
