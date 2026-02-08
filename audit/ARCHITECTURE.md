# 🏗️ KhipuVault Architecture Documentation

**Version:** 1.0.0
**Date:** 2026-02-08
**For:** Security Auditors & Developers

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Smart Contract Architecture](#smart-contract-architecture)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Blockchain Indexer](#blockchain-indexer)
6. [Data Flow](#data-flow)
7. [Security Model](#security-model)
8. [Deployment Architecture](#deployment-architecture)

---

## 1. System Overview

KhipuVault is a decentralized savings platform built on the Mezo blockchain, offering Bitcoin-native DeFi products with yield generation through Mezo's stability pool integration.

### Core Technologies

```
┌─────────────────────────────────────────────────────────────────┐
│                        KhipuVault Stack                         │
├─────────────────────────────────────────────────────────────────┤
│ Blockchain:    Mezo Testnet (Chain ID: 31611)                  │
│ Smart Contracts: Solidity 0.8.25 + Foundry                     │
│ Backend:       Node.js + Express.js + PostgreSQL               │
│ Frontend:      Next.js 15 + React 19 + Wagmi + Viem            │
│ Indexer:       Custom ethers.js event listener                 │
│ Database:      PostgreSQL 16 + Prisma ORM                      │
│ Auth:          SIWE (Sign-In With Ethereum) + JWT              │
│ Deployment:    Vercel (frontend) + Self-hosted (backend)       │
└─────────────────────────────────────────────────────────────────┘
```

### System Components

```
                  ┌─────────────────┐
                  │   End Users     │
                  └────────┬────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
    ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
    │   Web App  │  │  Wallet    │  │  Docs Site │
    │ (Next.js)  │  │  (Privy)   │  │ (Fumadocs) │
    └─────┬──────┘  └─────┬──────┘  └────────────┘
          │                │
          │         ┌──────▼──────┐
          │         │   Mezo      │
          │         │  Blockchain │
          │         │  (Layer 2)  │
          │         └──────┬──────┘
          │                │
    ┌─────▼────────────────▼─────┐
    │      Smart Contracts       │
    │  ┌──────────────────────┐  │
    │  │ IndividualPool       │  │
    │  │ CooperativePool      │  │
    │  │ RotatingPool (ROSCA) │  │
    │  │ LotteryPool          │  │
    │  │ MezoIntegration      │  │
    │  │ YieldAggregator      │  │
    │  └──────────┬───────────┘  │
    └─────────────┼───────────────┘
                  │
       ┌──────────┼──────────┐
       │          │          │
  ┌────▼────┐ ┌──▼───┐ ┌────▼─────┐
  │ Indexer │ │ API  │ │ Database │
  │(Events) │ │(REST)│ │(Postgres)│
  └─────────┘ └──────┘ └──────────┘
```

---

## 2. Smart Contract Architecture

### Contract Hierarchy

```
                    ┌─────────────────┐
                    │  UUPSUpgradeable│
                    │  (OpenZeppelin) │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   ┌────▼────┐        ┌─────▼──────┐      ┌─────▼──────┐
   │BasePoolV3│        │BaseMezo   │      │Yield       │
   │          │        │Integration│      │Aggregator  │
   └────┬─────┘        └─────┬──────┘      └─────┬──────┘
        │                    │                    │
  ┌─────┼─────┬──────┬───────┼────────┐          │
  │     │     │      │       │        │          │
┌─▼─┐ ┌─▼──┐┌─▼──┐┌─▼──┐  ┌─▼─────┐ ┌▼──────┐  │
│Ind││Coop││ROSCA││Lotto│  │Mezo   │ │Stabil.│  │
│Pool││Pool││Pool ││Pool │  │Integr.│ │Pool   │  │
└───┘└────┘└─────┘└─────┘  │V3     │ │Strat. │  │
                            └───────┘ └───────┘  │
                                                  │
                            ┌─────────────────────┘
                            │
                      ┌─────▼──────┐
                      │Multi-Vault │
                      │YieldAggr.  │
                      └────────────┘
```

### Core Contracts

#### 2.1 IndividualPoolV3

**Purpose:** Personal savings accounts with auto-compound options

**Key Features:**

- Single-user deposits
- Automatic yield compounding
- Referral rewards system
- Flash loan protection
- Performance fee collection

**State Variables:**

```solidity
mapping(address => UserDeposit) userDeposits;
uint256 totalMusdDeposited;
uint256 totalYieldsGenerated;
uint256 performanceFee; // basis points
```

**Critical Functions:**

- `deposit(uint256 musdAmount, address referrer)`
- `withdraw()`
- `withdrawPartial(uint256 amount)`
- `claimYield()`
- `setAutoCompound(bool enabled)`

---

#### 2.2 CooperativePoolV3

**Purpose:** Multi-user savings pools with shared yield

**Key Features:**

- Pool creation with custom parameters
- Member join/leave mechanics
- Proportional yield distribution
- Pool pause/resume by owner
- Emergency withdraw

**State Variables:**

```solidity
struct PoolInfo {
    string name;
    uint256 minDeposit;
    uint256 maxMembers;
    uint256 totalBtcCollateral;
    uint256 totalMusdMinted;
    PoolStatus status;
}
mapping(uint256 => PoolInfo) pools;
mapping(uint256 => mapping(address => MemberInfo)) poolMembers;
```

**Critical Functions:**

- `createPool(string name, uint256 minDeposit, ...)`
- `joinPool(uint256 poolId) payable`
- `leavePool(uint256 poolId)`
- `claimYield(uint256 poolId)`
- `closePool(uint256 poolId)` (owner only)

---

#### 2.3 RotatingPool (ROSCA)

**Purpose:** Rotating Savings and Credit Association

**Key Features:**

- Fixed member count
- Rotating payout system
- Period-based contributions
- Automatic period advancement
- Yield distribution to current recipient

**State Variables:**

```solidity
struct PoolInfo {
    uint256 contributionAmount;
    uint256 periodDuration;
    uint256 currentPeriod;
    address[] memberAddresses;
    bool isPrivate;
}
mapping(uint256 => mapping(uint256 => PeriodInfo)) poolPeriods;
```

**Critical Functions:**

- `createPool(..., address[] invitedMembers)`
- `joinPool(uint256 poolId)`
- `makeContribution(uint256 poolId, uint256 amount)`
- `claimPayout(uint256 poolId)`
- `advancePeriod(uint256 poolId)`

---

#### 2.4 LotteryPoolV3

**Purpose:** Prize pool with lottery mechanics

**Key Features:**

- Round-based system
- Ticket purchase mechanism
- Commit-reveal randomness (VRF-like)
- Winner selection algorithm
- Yield-enhanced prizes

**State Variables:**

```solidity
struct Round {
    uint256 ticketPrice;
    uint256 maxTickets;
    uint256 totalTicketsSold;
    uint256 totalMusd;
    address winnerAddress;
    RoundStatus status;
}
mapping(uint256 => Round) rounds;
```

**Critical Functions:**

- `createRound(uint256 ticketPrice, ...)`
- `buyTickets(uint256 roundId, uint256 quantity)`
- `submitCommitment(uint256 roundId, bytes32 commitment)`
- `revealSeed(uint256 roundId, uint256 seed, bytes32 salt)`
- `claimPrize(uint256 roundId)`

---

#### 2.5 MezoIntegrationV3

**Purpose:** Bridge to Mezo protocol for BTC collateral

**Key Features:**

- Native BTC → MUSD conversion
- Trove management (Mezo's CDP system)
- Collateral ratio tracking
- Price oracle integration
- Liquidation protection

**State Variables:**

```solidity
struct Position {
    uint128 btcCollateral;
    uint128 musdDebt;
}
mapping(address => Position) userPositions;
uint256 totalBtcDeposited;
uint256 totalMusdMinted;
```

**Critical Functions:**

- `depositAndMintNative() payable` - Deposit BTC, get MUSD
- `burnAndWithdraw(uint256 musdAmount)` - Repay MUSD, get BTC
- `getCollateralRatio(address user)` - Check health factor

---

#### 2.6 YieldAggregatorV3

**Purpose:** Multi-strategy yield optimizer

**Key Features:**

- Multiple yield vault support
- Automatic yield distribution
- Share-based accounting
- Performance fee collection
- Vault rebalancing

**State Variables:**

```solidity
struct Vault {
    address strategy;
    uint128 totalDeposited;
    uint64 apr;
    bool isActive;
}
mapping(address => Vault) vaults;
mapping(address => mapping(address => Position)) positions;
```

**Critical Functions:**

- `deposit(uint256 amount)` - Deposit to best vault
- `withdraw(uint256 amount)` - Withdraw from vaults
- `claimYield()` - Harvest accrued yield
- `compoundYields()` - Auto-compound across vaults

---

### Upgradeability

All pool contracts use UUPS (Universal Upgradeable Proxy Standard):

```
User Transaction
      ↓
  [Proxy Contract]
      ↓ delegatecall
  [Implementation V1]  →  [Implementation V2]
                             (after upgrade)
```

**Security:** Only owner can upgrade, with 48-hour timelock (recommended for mainnet).

---

## 3. Backend Architecture

### API Service (Express.js)

```
┌─────────────────────────────────────────┐
│            Express.js API               │
├─────────────────────────────────────────┤
│  Routes:                                │
│    /auth       - SIWE authentication    │
│    /users      - User profiles          │
│    /pools      - Pool data aggregation  │
│    /transactions - Transaction history  │
│    /analytics  - TVL, APY calculations  │
├─────────────────────────────────────────┤
│  Middleware:                            │
│    - JWT verification                   │
│    - Rate limiting                      │
│    - CORS                               │
│    - Request logging (Pino)            │
│    - Error handling                     │
├─────────────────────────────────────────┤
│  Services:                              │
│    - UserService                        │
│    - PoolService                        │
│    - TransactionService                 │
│    - AnalyticsService                   │
└─────────────────────────────────────────┘
```

### Authentication Flow

```
1. Frontend → Request Nonce
   GET /auth/nonce?address=0x...

2. Backend → Generate Nonce
   nonce = randomBytes(32)
   Store in Redis with TTL

3. Frontend → Sign Message
   signature = wallet.signMessage(nonce)

4. Frontend → Submit Signature
   POST /auth/verify
   { address, signature, nonce }

5. Backend → Verify SIWE
   Recover signer from signature
   Validate: signer === address

6. Backend → Issue JWT
   token = jwt.sign({ address }, SECRET, { expiresIn: '7d' })

7. Frontend → Store Token
   localStorage.setItem('token', token)

8. Subsequent Requests
   Authorization: Bearer <token>
```

### Database Schema (PostgreSQL + Prisma)

**Key Tables:**

```sql
-- Users
CREATE TABLE "User" (
    id TEXT PRIMARY KEY,
    address TEXT UNIQUE NOT NULL,
    ens_name TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pools
CREATE TABLE "Pool" (
    id TEXT PRIMARY KEY,
    contract_address TEXT UNIQUE NOT NULL,
    pool_type ENUM('INDIVIDUAL', 'COOPERATIVE', 'LOTTERY', 'ROTATING'),
    tvl NUMERIC(78, 0),  -- BigInt as string
    apr DECIMAL(18, 8),
    status ENUM('ACTIVE', 'PAUSED', 'CLOSED')
);

-- Transactions (Deposits/Withdrawals)
CREATE TABLE "Deposit" (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES "User"(id),
    pool_id TEXT REFERENCES "Pool"(id),
    type ENUM('DEPOSIT', 'WITHDRAW', 'YIELD_CLAIM'),
    amount NUMERIC(78, 0),  -- Wei as string
    tx_hash TEXT UNIQUE NOT NULL,
    block_number INTEGER,
    status ENUM('PENDING', 'CONFIRMED', 'FAILED', 'REORGED'),
    timestamp TIMESTAMP
);

-- Event Logs (for indexer)
CREATE TABLE "EventLog" (
    id TEXT PRIMARY KEY,
    contract_address TEXT,
    event_name TEXT,
    tx_hash TEXT,
    block_number INTEGER,
    block_hash TEXT,  -- For reorg detection
    args JSONB,
    processed BOOLEAN DEFAULT FALSE,
    removed BOOLEAN DEFAULT FALSE  -- Marked true on reorg
);

-- Indexer State
CREATE TABLE "IndexerState" (
    id TEXT PRIMARY KEY,
    contract_address TEXT UNIQUE,
    last_indexed_block INTEGER,
    last_indexed_hash TEXT,
    is_healthy BOOLEAN DEFAULT TRUE
);
```

**Indexes:**

```sql
CREATE INDEX idx_deposits_user ON "Deposit"(user_id);
CREATE INDEX idx_deposits_pool ON "Deposit"(pool_id);
CREATE INDEX idx_deposits_timestamp ON "Deposit"(timestamp);
CREATE INDEX idx_events_block ON "EventLog"(block_number);
CREATE INDEX idx_events_processed ON "EventLog"(processed, removed);
```

---

## 4. Frontend Architecture

### Next.js 15 App Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (dashboard)/       # Protected routes
│   │   │   ├── savings/       # Individual savings
│   │   │   ├── pools/         # Cooperative pools
│   │   │   ├── rosca/         # Rotating pools
│   │   │   └── lottery/       # Prize pools
│   │   ├── api/               # API routes (Next.js)
│   │   └── layout.tsx         # Root layout
│   ├── components/
│   │   ├── layout/            # Header, Footer
│   │   ├── features/          # Feature components
│   │   └── ui/                # shadcn/ui components
│   ├── hooks/
│   │   ├── web3/              # Wagmi hooks
│   │   └── api/               # React Query hooks
│   ├── lib/
│   │   ├── wagmi.ts           # Wagmi config
│   │   ├── privy.ts           # Privy wallet config
│   │   └── utils.ts           # Utilities
│   └── styles/
│       └── globals.css        # Tailwind + custom CSS
```

### Web3 Integration

**Wagmi + Viem Setup:**

```typescript
// lib/wagmi.ts
import { createConfig, http } from "wagmi";
import { mezoTestnet } from "wagmi/chains";

export const config = createConfig({
  chains: [mezoTestnet],
  transports: {
    [mezoTestnet.id]: http("https://rpc.test.mezo.org"),
  },
});
```

**Custom Hooks:**

```typescript
// hooks/web3/individual/useDeposit.ts
export function useDeposit() {
  const { writeContract, isPending } = useWriteContract();

  const deposit = async (amount: bigint, referrer: `0x${string}`) => {
    return writeContract({
      address: INDIVIDUAL_POOL_ADDRESS,
      abi: IndividualPoolABI,
      functionName: "deposit",
      args: [amount, referrer],
    });
  };

  return { deposit, isPending };
}
```

**State Management:**

```typescript
// React Query for server state
const { data: pools } = useQuery({
  queryKey: ["pools", poolType],
  queryFn: () => api.getPools(poolType),
});

// Zustand for client state
const useWalletStore = create((set) => ({
  isConnected: false,
  address: null,
  setAddress: (address) => set({ address, isConnected: true }),
}));
```

---

## 5. Blockchain Indexer

### Event Indexing Architecture

```
┌─────────────────────────────────────────┐
│         Blockchain Indexer              │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     Event Listeners               │ │
│  │  - IndividualPool events          │ │
│  │  - CooperativePool events         │ │
│  │  - RotatingPool events            │ │
│  │  - LotteryPool events             │ │
│  │  - YieldAggregator events         │ │
│  └────────┬──────────────────────────┘ │
│           │                             │
│  ┌────────▼──────────────────────────┐ │
│  │     Event Processing              │ │
│  │  - Parse event arguments          │ │
│  │  - Validate block confirmations   │ │
│  │  - Detect reorgs                  │ │
│  │  - Idempotency checks             │ │
│  └────────┬──────────────────────────┘ │
│           │                             │
│  ┌────────▼──────────────────────────┐ │
│  │     Database Updates              │ │
│  │  - Upsert deposits/withdrawals    │ │
│  │  - Update pool TVL                │ │
│  │  - Update user balances           │ │
│  │  - Store event logs               │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Reorg Detection

```typescript
// packages/blockchain/src/listeners/base.ts
class BaseListener {
  async handleEvent(event: Event) {
    const currentBlock = await provider.getBlock(event.blockNumber);

    // Check if block hash matches
    if (currentBlock.hash !== event.blockHash) {
      console.warn("Reorg detected!");
      await this.markEventsAsRemoved(event.blockNumber);
      await this.reindexFromBlock(event.blockNumber - 10);
    }

    // Process event only after N confirmations
    const latestBlock = await provider.getBlockNumber();
    if (latestBlock - event.blockNumber < CONFIRMATIONS_REQUIRED) {
      return; // Wait for more confirmations
    }

    await this.processEvent(event);
  }
}
```

### Idempotency

```typescript
// Prevent duplicate processing
async function processDeposit(txHash: string, logIndex: number) {
  const existing = await prisma.deposit.findUnique({
    where: {
      txHash_logIndex: { txHash, logIndex },
    },
  });

  if (existing) {
    console.log("Deposit already processed");
    return existing;
  }

  // Process new deposit...
}
```

---

## 6. Data Flow

### User Deposit Flow

```
1. User Action (Frontend)
   ↓
2. Connect Wallet (Privy/Wagmi)
   ↓
3. Sign Transaction
   wallet.sendTransaction({
     to: POOL_ADDRESS,
     value: depositAmount,
     data: depositFunction(...)
   })
   ↓
4. Transaction Broadcast
   ↓
5. Mezo Blockchain
   ├─→ Smart Contract Execution
   │   ├─ Validate inputs
   │   ├─ Transfer tokens
   │   ├─ Update pool state
   │   ├─ Emit Deposit event
   │   └─ Return success
   │
   └─→ Event Emission
       event Deposit(
         address indexed user,
         uint256 poolId,
         uint256 amount,
         uint256 timestamp
       )
   ↓
6. Blockchain Indexer
   ├─ Listen for Deposit events
   ├─ Wait for confirmations
   ├─ Parse event data
   └─ Update database
       INSERT INTO "Deposit" (...)
   ↓
7. Backend API
   ├─ Query updated data
   └─ Serve to frontend
   ↓
8. Frontend Update
   ├─ React Query refetch
   └─ UI reflects new balance
```

### Yield Calculation Flow

```
1. Backend Cron Job (Every 1 hour)
   ↓
2. Query YieldAggregator Contract
   totalYield = await aggregator.getTotalYield()
   ↓
3. Calculate Per-User Yield
   userYield = (userDeposit / totalDeposits) * totalYield
   ↓
4. Update Database
   UPDATE "User" SET yield_accrued = userYield
   ↓
5. Frontend Displays
   useQuery('userYield') → shows pending yield
```

---

## 7. Security Model

### Access Control

```
Owner (Deployer)
  ↓
  ├─ Can upgrade contracts (UUPS)
  ├─ Can pause/unpause pools
  ├─ Can set fee parameters
  └─ Can set operator role

Operator (Multi-sig recommended)
  ↓
  ├─ Can create lottery rounds
  ├─ Can force-complete rounds
  └─ Cannot upgrade or steal funds

Users
  ↓
  ├─ Can deposit/withdraw own funds
  ├─ Can claim own yield
  └─ Cannot access other users' funds
```

### Reentrancy Protection

All state-changing functions use OpenZeppelin's ReentrancyGuard:

```solidity
function deposit() external payable nonReentrant {
    // Safe from reentrancy attacks
}
```

### Flash Loan Protection

```solidity
modifier noFlashLoan() {
    require(
        depositBlock[msg.sender] != block.number,
        "No flash loans"
    );
    _;
}
```

### Oracle Security

Price feeds from Mezo's official oracle with:

- Freshness checks (< 1 hour old)
- Deviation limits (< 10% from last known price)
- Fallback to TWAP if oracle fails

---

## 8. Deployment Architecture

### Smart Contracts

```
Deployment Script (Foundry)
  ↓
1. Deploy Implementation Contracts
   - IndividualPoolV3
   - CooperativePoolV3
   - RotatingPool
   - LotteryPoolV3
   - MezoIntegrationV3
   - YieldAggregatorV3
   ↓
2. Deploy UUPS Proxies
   - Point to implementations
   - Initialize with owner
   ↓
3. Configure Contracts
   - Set fee parameters
   - Set oracle addresses
   - Set operator roles
   ↓
4. Verify on Block Explorer
   forge verify-contract <address> <contract>
```

### Backend & Indexer

```
Server: DigitalOcean / AWS
OS: Ubuntu 22.04
Runtime: Node.js 20.x
Database: PostgreSQL 16
Process Manager: PM2

Deployment:
  git pull origin main
  pnpm install
  pnpm build
  pm2 restart khipu-api
  pm2 restart khipu-indexer
```

### Frontend

```
Platform: Vercel
Framework: Next.js 15
Build Command: pnpm turbo build --filter=@khipu/web
Output: .next/

Environment Variables:
  - NEXT_PUBLIC_MEZO_RPC_URL
  - NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS
  - NEXT_PUBLIC_PRIVY_APP_ID
```

---

## 📊 Performance Characteristics

| Metric              | Value       | Notes                     |
| ------------------- | ----------- | ------------------------- |
| Gas Cost (Deposit)  | ~150K gas   | Includes Mezo integration |
| Gas Cost (Withdraw) | ~120K gas   | Simple withdrawal         |
| Max TPS             | ~10-20      | Mezo L2 capacity          |
| Indexer Lag         | < 5 seconds | With 3 confirmations      |
| API Latency         | < 100ms     | 95th percentile           |
| Frontend Load       | < 2 seconds | Initial page load         |

---

## 🔍 Testing Strategy

- **Unit Tests:** 150+ tests covering all contract functions
- **Integration Tests:** Full user flow testing
- **Fuzz Tests:** Input randomization for edge cases
- **Gas Profiling:** Forge gas reporting
- **Coverage:** Target 90%+ line coverage

---

## 📝 Assumptions & Limitations

**Assumptions:**

1. Mezo RPC is reliable and censorship-resistant
2. Price oracle provides accurate BTC/USD prices
3. Users have basic understanding of DeFi
4. Mezo protocol (Troves) remains functional

**Limitations:**

1. UUPS upgrades require 48h timelock (production)
2. Maximum pool size limited by gas costs
3. Lottery randomness depends on commit-reveal (not VRF yet)
4. Indexer requires external monitoring for uptime

---

**Document Version:** 1.0.0
**Last Updated:** 2026-02-08
**Maintained By:** KhipuVault Core Team
