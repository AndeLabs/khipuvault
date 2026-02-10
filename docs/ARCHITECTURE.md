# KhipuVault - Arquitectura Completa del Sistema

> Plataforma de ahorro descentralizada en Bitcoin sobre Mezo blockchain

## Resumen Ejecutivo

KhipuVault es una plataforma DeFi que ofrece 4 productos de ahorro en Bitcoin:

1. **Individual Savings** - Ahorro personal con auto-compound
2. **Cooperative Pools** - Pools grupales con distribución de yields
3. **Prize Pool** - Lotería sin pérdida (no-loss lottery)
4. **Rotating Pool** - ROSCA (tandas/pasanaku)

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 15)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Individual │  │ Cooperative │  │  Prize Pool │  │  Rotating   │         │
│  │   Savings   │  │    Pools    │  │  (Lottery)  │  │    Pool     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                │                 │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐         │
│  │                    React Query + Wagmi Hooks                    │         │
│  └─────────────────────────────┬───────────────────────────────────┘         │
└────────────────────────────────┼─────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         │                                               │
         ▼                                               ▼
┌─────────────────────┐                       ┌─────────────────────┐
│   MEZO BLOCKCHAIN   │                       │    BACKEND API      │
│   (Chain ID: 31611) │                       │   (Express.js)      │
│                     │                       │                     │
│  ┌───────────────┐  │                       │  ┌───────────────┐  │
│  │ IndividualPool│  │                       │  │   /api/auth   │  │
│  │     V3        │  │                       │  │   /api/users  │  │
│  ├───────────────┤  │                       │  │   /api/pools  │  │
│  │ CooperativePool│ │                       │  │   /api/txs    │  │
│  │     V3        │  │                       │  │  /api/lottery │  │
│  ├───────────────┤  │                       │  └───────┬───────┘  │
│  │  LotteryPool  │  │                       │          │          │
│  │     V3        │  │                       │          ▼          │
│  ├───────────────┤  │                       │  ┌───────────────┐  │
│  │ RotatingPool  │  │                       │  │   PostgreSQL  │  │
│  ├───────────────┤  │                       │  │   (Prisma)    │  │
│  │ MezoIntegration│ │◄──────────────────────│  └───────────────┘  │
│  ├───────────────┤  │    Event Indexer      │          ▲          │
│  │YieldAggregator│  │                       │          │          │
│  └───────────────┘  │                       └──────────┼──────────┘
└─────────────────────┘                                  │
                                              ┌──────────┴──────────┐
                                              │  BLOCKCHAIN INDEXER │
                                              │    (ethers.js)      │
                                              │                     │
                                              │  • Event listeners  │
                                              │  • Reorg handling   │
                                              │  • DB sync          │
                                              └─────────────────────┘
```

---

## 1. Smart Contracts (Mezo Testnet)

### Direcciones de Producción

| Contrato          | Dirección                                    | Propósito           |
| ----------------- | -------------------------------------------- | ------------------- |
| IndividualPoolV3  | `0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393` | Ahorro personal     |
| CooperativePoolV3 | `0x323FcA9b377fe29B8fc95dDbD9Fe54cea1655F88` | Pools grupales      |
| MezoIntegration   | `0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6` | Bridge a Mezo       |
| YieldAggregator   | `0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6` | Agregador de yields |
| MUSD              | `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` | Token estable       |

### Estructura de Contratos

```
packages/contracts/src/
├── pools/v3/
│   ├── BasePoolV3.sol          # Base abstracta (UUPS, pausable, fees)
│   ├── IndividualPoolV3.sol    # Ahorro personal + referidos
│   ├── CooperativePoolV3.sol   # Pools grupales + shares
│   ├── LotteryPoolV3.sol       # Lotería con commit-reveal
│   └── RotatingPool.sol        # ROSCA/tandas
├── integrations/
│   ├── base/
│   │   └── BaseMezoIntegration.sol  # Base para Mezo
│   └── v3/
│       ├── MezoIntegrationV3.sol    # Wrapper de protocolo Mezo
│       └── YieldAggregatorV3.sol    # Multi-vault yields
├── strategies/
│   └── StabilityPoolStrategy.sol    # Estrategia de stability pool
├── libraries/
│   ├── YieldCalculations.sol   # Cálculos de yields
│   ├── SecureRandomness.sol    # Randomness para lotería
│   ├── PriceValidator.sol      # Validación de precios
│   ├── Events.sol              # Catálogo de eventos
│   └── Errors.sol              # Errores personalizados
└── interfaces/
    └── IMezo*.sol              # Interfaces de Mezo
```

### Flujos Principales

#### Depósito Individual

```
Usuario → deposit(amount) → IndividualPoolV3
    → Valida monto (10-100,000 MUSD)
    → SafeERC20.transferFrom(user, pool, amount)
    → _depositToYieldAggregator(amount)
    → Emite Deposited(user, amount, timestamp)
```

#### Pool Cooperativo

```
Creador → createPool(name, min, max, members) → CooperativePoolV3
    → Valida parámetros
    → Crea poolId, registra creator
    → Emite PoolCreated(poolId, creator, name)

Miembro → joinPool(poolId, contribution) → CooperativePoolV3
    → Valida: pool activo, espacio, rango de contribución
    → Calcula shares = contribution
    → poolTotalShares[poolId] += shares
    → Emite MemberJoined(poolId, member, contribution, shares)
```

#### Lotería (No-Loss)

```
1. createRound(ticketPrice, maxTickets, duration)
2. buyTickets(roundId, count) → compra con mUSD
3. commitRandomness(roundId, hash) → operador commit
4. revealRandomness(roundId, seed) → revela seed
5. _selectWinner() → SecureRandomness.generateWithCommitReveal()
6. claimPrize(roundId) → ganador reclama
7. withdrawContribution(roundId) → no-ganadores recuperan capital
```

### Seguridad Aplicada

| Fix  | Problema                | Solución                            |
| ---- | ----------------------- | ----------------------------------- |
| H-01 | Flash loan attacks      | Block-number tracking               |
| H-02 | O(n) loops en shares    | Cached poolTotalShares              |
| H-8  | Return values ignorados | Validación de returns               |
| L-04 | UUPS sin validación     | Check newImplementation.code.length |
| C-01 | Referral sin fondos     | Reserve tracking                    |

---

## 2. Backend API (Express.js)

### Configuración

```
Puerto: 3001
Auth: SIWE + JWT (2h expiration)
Rate Limiting: 100 req/15min (global)
Base de Datos: PostgreSQL via Prisma
```

### Endpoints

#### Autenticación (`/api/auth`)

| Método | Endpoint  | Auth | Descripción                 |
| ------ | --------- | ---- | --------------------------- |
| GET    | `/nonce`  | No   | Genera nonce para SIWE      |
| POST   | `/verify` | No   | Verifica firma, retorna JWT |
| POST   | `/logout` | Sí   | Invalida token              |
| GET    | `/me`     | Sí   | Info del usuario actual     |

#### Usuarios (`/api/users`)

| Método | Endpoint                 | Auth | Descripción                     |
| ------ | ------------------------ | ---- | ------------------------------- |
| GET    | `/:address`              | Sí   | Perfil + 10 depósitos recientes |
| GET    | `/:address/portfolio`    | Sí   | Resumen de portfolio            |
| GET    | `/:address/transactions` | Sí   | Historial paginado              |
| GET    | `/:address/positions`    | Sí   | Posiciones en pools             |
| POST   | `/`                      | Sí   | Crear/actualizar perfil         |

#### Pools (`/api/pools`)

| Método | Endpoint                  | Auth | Descripción                 |
| ------ | ------------------------- | ---- | --------------------------- |
| GET    | `/`                       | No   | Todos los pools activos     |
| GET    | `/address/:address`       | No   | Detalles de pool            |
| GET    | `/address/:address/users` | No   | Miembros del pool           |
| GET    | `/address/:address/stats` | No   | Estadísticas en tiempo real |
| GET    | `/:poolId/analytics`      | No   | Analytics históricos        |

#### Transacciones (`/api/transactions`)

| Método | Endpoint         | Auth | Descripción             |
| ------ | ---------------- | ---- | ----------------------- |
| GET    | `/recent`        | No   | Transacciones recientes |
| GET    | `/stats`         | No   | Estadísticas globales   |
| GET    | `/:txHash`       | No   | Transacción por hash    |
| GET    | `/pool/:address` | No   | Transacciones de pool   |

#### Lotería (`/api/lottery`)

| Método | Endpoint               | Auth | Descripción             |
| ------ | ---------------------- | ---- | ----------------------- |
| GET    | `/stats`               | No   | Estadísticas de lotería |
| GET    | `/rounds`              | No   | Todas las rondas        |
| GET    | `/rounds/active`       | No   | Rondas activas          |
| GET    | `/rounds/:roundId`     | No   | Detalles de ronda       |
| GET    | `/user/:address/stats` | No   | Stats del usuario       |

#### Health (`/health`)

| Método | Endpoint   | Descripción             |
| ------ | ---------- | ----------------------- |
| GET    | `/`        | Health check (API + DB) |
| GET    | `/indexer` | Estado del indexer      |
| GET    | `/ready`   | Readiness probe         |
| GET    | `/live`    | Liveness probe          |

### Servicios

```
apps/api/src/services/
├── UsersService       # CRUD usuarios, portfolio
├── PoolsService       # Pools, analytics, stats
├── TransactionsService # Historial, búsqueda
├── AnalyticsService   # Métricas globales, timeline
└── LotteryService     # Rondas, tickets, ganadores
```

---

## 3. Blockchain Indexer

### Arquitectura

```
packages/blockchain/src/
├── index.ts                    # Entry point: startIndexer()
├── cli.ts                      # CLI: pnpm index start
├── provider.ts                 # ResilientProvider (health checks)
├── indexer/
│   └── orchestrator.ts         # Coordina todos los listeners
├── listeners/
│   ├── base.ts                 # BaseEventListener (abstracto)
│   ├── individual-pool.ts      # Eventos de IndividualPoolV3
│   ├── cooperative-pool.ts     # Eventos de CooperativePoolV3
│   └── lottery-pool.ts         # Eventos de LotteryPoolV3
├── services/
│   └── reorg-handler.ts        # Detección de reorganizaciones
└── utils/
    └── retry.ts                # Retry con backoff exponencial
```

### Eventos Indexados

#### IndividualPoolV3

- `Deposited` - Depósito de usuario
- `PartialWithdrawn` - Retiro parcial
- `FullWithdrawal` - Retiro completo
- `YieldClaimed` - Reclamo de yields
- `AutoCompounded` - Auto-compound
- `ReferralRewardsClaimed` - Bonos de referido
- `ReferralRecorded` - Registro de referido

#### CooperativePoolV3

- `PoolCreated` - Nuevo pool creado
- `MemberJoined` - Miembro se une
- `MemberLeft` - Miembro sale
- `PartialWithdrawal` - Retiro parcial
- `PoolClosed` - Pool cerrado
- `PoolStatusUpdated` - Cambio de estado
- `YieldClaimed` - Yield reclamado

#### LotteryPoolV3

- `RoundCreated` - Nueva ronda
- `TicketsPurchased` - Compra de tickets
- `CommitSubmitted` - Commit de randomness
- `SeedRevealed` - Reveal de seed
- `WinnerSelected` - Ganador seleccionado
- `PrizeClaimed` - Premio reclamado
- `RoundCancelled` - Ronda cancelada

### Manejo de Reorgs

```
Confirmation Depth: 6 bloques
Check Interval: 30 segundos
Max Reorg Depth: 100 bloques

Flujo:
1. Indexer procesa eventos de bloques finalizados (current - 6)
2. ReorgHandler verifica hashes de bloques cada 30s
3. Si detecta mismatch → marca registros como REORGED
4. Listeners re-indexan bloques afectados
```

### Resiliencia

```typescript
// Retry con backoff exponencial
maxRetries: 5
initialDelay: 1000ms
maxDelay: 60000ms
factor: 2
jitter: true (±50%)

// Circuit Breaker
threshold: 5 failures → OPEN
timeout: 60s antes de half-open
```

---

## 4. Frontend (Next.js 15)

### Estructura de Rutas

```
apps/web/src/app/
├── (landing)/
│   └── page.tsx              # Landing pre-launch
├── dashboard/
│   ├── layout.tsx            # Layout con Web3Provider
│   ├── page.tsx              # Portfolio overview
│   ├── individual-savings/   # Ahorro personal
│   ├── cooperative-savings/  # Pools grupales
│   ├── prize-pool/           # Lotería
│   ├── rotating-pool/        # ROSCA
│   │   └── [id]/             # Pool específico
│   └── settings/
│       ├── wallets/          # Gestión de wallets
│       └── activity/         # Historial
└── layout.tsx                # Root (sin Web3Provider)
```

### Features por Módulo

#### Individual Savings (100% completo)

```
Componentes:
├── DepositCard         # Formulario de depósito
├── WithdrawCard        # Formulario de retiro
├── PositionCard        # Posición actual
├── ActionsCard         # Claim yields, auto-compound
├── PoolStatistics      # Estadísticas del pool
├── TransactionHistory  # Historial (decomposed)
└── YieldAnalytics      # Calculadora de yields
```

#### Cooperative Pools (100% completo)

```
Componentes:
├── PoolsBrowseV3       # Explorar pools
├── MyPoolsDashboard    # Mis pools (decomposed)
├── CreatePoolModalV3   # Crear pool
├── JoinPoolModalV3     # Unirse a pool
├── LeavePoolDialog     # Salir de pool
├── PoolDetailsModal    # Detalles (decomposed)
└── WithdrawPartialModal # Retiro parcial
```

#### Prize Pool (100% completo)

```
Componentes:
├── ActiveLotteryHero   # Ronda actual
├── BuyTicketsModal     # Comprar tickets
├── YourTickets         # Tus tickets
├── ProbabilityCalculator # Probabilidad
├── DrawHistory         # Historial de sorteos
├── LotteryStats        # Estadísticas
└── HowItWorks          # Instrucciones
```

#### Rotating Pool (40% completo)

```
Componentes:
├── RoscaCard           # Card de ROSCA
└── CreateRoscaModal    # Crear ROSCA

Pendiente:
├── Gestión de contribuciones
├── Distribución de pagos
├── UI de miembros
└── Estadísticas
```

### Hooks Web3

```
apps/web/src/hooks/web3/
├── common/
│   ├── use-contract-mutation.ts    # Wrapper de mutaciones
│   ├── use-musd-approval.ts        # Approval de tokens
│   └── use-transaction-verification.ts
├── individual/
│   ├── use-deposit-hooks.ts
│   ├── use-yield-hooks.ts
│   └── use-aggregator-hooks.ts
├── cooperative/
│   ├── use-pool-queries.ts
│   ├── use-pool-mutations.ts
│   └── use-pool-helpers.ts
├── lottery/
│   ├── use-lottery-pool.ts
│   └── use-lottery-pool-events.ts
└── rotating/
    ├── use-rotating-pool.ts
    ├── use-create-rotating-pool.ts
    └── use-join-rotating-pool.ts
```

### Providers

```
Web3Provider
├── WagmiProvider (Wagmi 2.x)
│   └── MetaMask connector (EIP-6963)
├── QueryClientProvider (React Query 5.x)
│   └── staleTime: 60s, gcTime: 5min
└── TransactionProvider
    └── Modal global de transacciones
```

---

## 5. Base de Datos (PostgreSQL + Prisma)

### Modelos Principales

```prisma
model User {
  id          String   @id @default(cuid())
  address     String   @unique  // Ethereum address
  ensName     String?
  deposits    Deposit[]
  notifications Notification[]
}

model Deposit {
  id          String   @id @default(cuid())
  userId      String
  userAddress String   // Denormalizado
  poolType    PoolType
  poolAddress String
  type        TransactionType
  amount      String   // Wei como string
  txHash      String   @unique
  blockNumber Int
  status      TransactionStatus
  metadata    Json?

  @@unique([txHash, logIndex])
  @@index([userAddress, timestamp])
  @@index([poolAddress, type, timestamp])
}

model Pool {
  id              String   @id @default(cuid())
  contractAddress String   @unique
  poolType        PoolType
  name            String
  tvl             String   // Wei
  apr             Decimal  @db.Decimal(18, 8)
  status          PoolStatus
  analytics       PoolAnalytics[]
}

model EventLog {
  id              String   @id @default(cuid())
  contractAddress String
  eventName       String
  txHash          String
  blockNumber     Int
  args            Json
  processed       Boolean  @default(false)
  removed         Boolean  @default(false)

  @@unique([txHash, logIndex])
}
```

### Enums

```prisma
enum PoolType {
  INDIVIDUAL
  COOPERATIVE
  LOTTERY
  ROTATING
}

enum TransactionType {
  DEPOSIT
  WITHDRAW
  YIELD_CLAIM
  COMPOUND
}

enum TransactionStatus {
  PENDING
  CONFIRMED
  FAILED
  REORGED
}
```

---

## 6. Flujo Completo de una Transacción

### Ejemplo: Depósito en Individual Pool

```
1. FRONTEND
   Usuario ingresa monto → DepositCard
   ↓
   useDepositWithApprove() hook
   ↓
   Verifica allowance de MUSD
   ↓
   Si insuficiente → approve() → espera confirmación
   ↓
   deposit(amount) → IndividualPoolV3

2. BLOCKCHAIN
   Contrato valida:
   - amount >= MIN_DEPOSIT (10 MUSD)
   - amount <= MAX_DEPOSIT (100,000 MUSD)
   ↓
   SafeERC20.transferFrom(user, pool, amount)
   ↓
   _depositToYieldAggregator(amount)
   ↓
   emit Deposited(user, amount, timestamp)

3. INDEXER
   IndividualPoolListener escucha "Deposited"
   ↓
   Espera 6 confirmaciones (finality)
   ↓
   prisma.$transaction:
   - Upsert User
   - Create Deposit (status: CONFIRMED)
   - Update EventLog (processed: true)

4. API
   GET /api/users/:address/transactions
   ↓
   Prisma query con paginación
   ↓
   Retorna historial actualizado

5. FRONTEND
   React Query refetch automático
   ↓
   TransactionHistory muestra nuevo depósito
   ↓
   Toast de éxito
```

---

## 7. Identificación de Problemas

### Dónde Buscar por Tipo de Error

| Síntoma                   | Dónde Buscar         | Archivos Clave                                       |
| ------------------------- | -------------------- | ---------------------------------------------------- |
| **Wallet no conecta**     | Web3Provider, config | `providers/web3-provider.tsx`, `lib/web3/config.ts`  |
| **Transacción falla**     | Contratos, hooks     | `contracts/addresses.ts`, `hooks/web3/*`             |
| **Datos no aparecen**     | Indexer, API         | `blockchain/listeners/*`, `api/routes/*`             |
| **Datos desactualizados** | Query cache, indexer | `lib/query-config.ts`, `blockchain/reorg-handler.ts` |
| **Error de red**          | Provider, RPC        | `blockchain/provider.ts`, `.env`                     |
| **Base de datos**         | Prisma, migrations   | `database/prisma/schema.prisma`                      |
| **UI rota**               | Componentes          | `features/*/components/*`                            |

### Comandos de Diagnóstico

```bash
# Health checks
curl http://localhost:3001/health
curl http://localhost:3001/health/indexer

# Logs del API
pnpm --filter @khipu/api dev  # Ver logs en consola

# Logs del indexer
pnpm --filter @khipu/blockchain start

# Verificar contratos
cd packages/contracts && forge test -vvv

# Verificar DB
pnpm db:push  # Sync schema
pnpm db:studio  # GUI de Prisma

# TypeScript errors
pnpm typecheck

# Lint errors
pnpm lint
```

### Errores Comunes y Soluciones

| Error                           | Causa                     | Solución                   |
| ------------------------------- | ------------------------- | -------------------------- |
| `User rejected transaction`     | Usuario canceló en wallet | UX: Mostrar mensaje claro  |
| `Insufficient allowance`        | No aprobó tokens          | Llamar `approve()` primero |
| `NoActiveDeposit`               | Sin depósito activo       | Validar estado antes       |
| `PoolFull`                      | Pool sin espacio          | Mostrar capacidad en UI    |
| `CooldownNotComplete`           | Espera de 24h             | Mostrar tiempo restante    |
| `REORGED` status                | Blockchain reorg          | Indexer re-procesa         |
| `PrismaClientKnownRequestError` | Constraint violation      | Check unique keys          |

---

## 8. Lo Que Falta Para Producción

### Crítico (Bloqueante)

1. **Auditoría de Seguridad**
   - Smart contracts no auditados formalmente
   - 9 findings HIGH en Slither

2. **Rotating Pool Frontend**
   - Solo 40% implementado
   - Falta: contribuciones, pagos, miembros

3. **Lottery Indexer**
   - LotteryPoolListener existe pero no está en orchestrator
   - Agregar a `startIndexer()`

### Importante (Pre-launch)

1. **Monitoring/Alertas**
   - No hay Prometheus/Grafana
   - No hay alertas de errores

2. **Multi-sig para Admin**
   - Owner es EOA single
   - Migrar a Gnosis Safe

3. **Rate Limiting Distribuido**
   - Redis configurado pero opcional
   - Necesario para múltiples instancias

### Nice-to-Have

1. **Referral System UI**
   - Backend listo, UI pendiente

2. **Mainnet Deployment Scripts**
   - Solo testnet configurado

3. **Mobile App**
   - Solo web responsive

---

## 9. Comandos Rápidos

```bash
# Desarrollo
pnpm dev              # Todo el monorepo
pnpm dev:web          # Solo frontend
pnpm dev:api          # Solo backend

# Base de datos
pnpm docker:up        # Iniciar PostgreSQL
pnpm db:generate      # Generar Prisma client
pnpm db:push          # Aplicar schema
pnpm db:seed          # Datos de prueba

# Smart Contracts
pnpm contracts:build  # Compilar
pnpm contracts:test   # Tests

# Calidad
pnpm lint             # ESLint
pnpm typecheck        # TypeScript
pnpm test             # Tests unitarios
```

---

## 10. Contacto y Recursos

- **RPC Testnet**: `https://rpc.test.mezo.org`
- **Chain ID**: `31611`
- **Explorer**: `https://explorer.test.mezo.org`
- **Docs Mezo**: `https://docs.mezo.org`

---

_Última actualización: Febrero 2026_
