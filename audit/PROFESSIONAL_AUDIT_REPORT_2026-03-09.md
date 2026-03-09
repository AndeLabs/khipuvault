# KhipuVault Professional Security Audit Report

**Fecha:** 2026-03-09
**Auditor:** Security Specialist (Claude Opus 4.5)
**Scope:** Full-stack security review pre-produccion
**Proyecto:** KhipuVault - Bitcoin DeFi Platform on Mezo L2
**Version:** v3.0.0

---

## Executive Summary

### Overall Risk Assessment: 🟡 MEDIUM-HIGH

| Categoria       | Estado                  | Score  |
| --------------- | ----------------------- | ------ |
| Smart Contracts | ⚠️ 9 HIGH Issues        | 65/100 |
| API Backend     | ✅ Solid                | 88/100 |
| Frontend Web3   | ✅ Production-Grade     | 90/100 |
| Indexer         | ✅ Good w/ Improvements | 82/100 |
| Infrastructure  | ⚠️ Incomplete           | 70/100 |

### Blockers for Mainnet Launch

| Issue                               | Severity    | Blocker?       |
| ----------------------------------- | ----------- | -------------- |
| Reentrancy en StabilityPoolStrategy | 🔴 CRITICAL | ✅ YES         |
| Weak PRNG en LotteryPool            | 🔴 HIGH     | ✅ YES         |
| Reentrancy en multiple pools        | 🔴 HIGH     | ✅ YES         |
| Missing professional contract audit | 🔴 CRITICAL | ✅ YES         |
| Staging environment not configured  | 🟠 MEDIUM   | ⚠️ Recommended |
| Production monitoring not setup     | 🟠 MEDIUM   | ⚠️ Recommended |

---

## PILAR 1: Mapeo del Flujo de Transaccion

### 1.1 Conexion de Wallet via Privy

```
┌─────────────────────────────────────────────────────────────────┐
│                    WALLET CONNECTION FLOW                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User clicks "Connect Wallet"                                   │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │  Privy Modal    │ ← SDK initializes (NEXT_PUBLIC_PRIVY_ID)  │
│  │  Opens          │                                           │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────────────────────────────┐                   │
│  │ User selects wallet type:               │                   │
│  │ • MetaMask (injected)                   │                   │
│  │ • Embedded Privy wallet                 │                   │
│  │ • WalletConnect                         │                   │
│  └────────┬────────────────────────────────┘                   │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐                                           │
│  │ Wallet signs    │ ← SIWE message generated                  │
│  │ SIWE message    │   (nonce from /api/auth/nonce)            │
│  └────────┬────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ POST /api/auth/ │────▶│ JWT Generated   │                   │
│  │ verify          │     │ (2hr expiry)    │                   │
│  └─────────────────┘     └────────┬────────┘                   │
│                                   │                             │
│                                   ▼                             │
│                          Session persisted                      │
│                          (localStorage + cookie)                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**SPOF Analysis:**

| Point of Failure             | Impact                   | Mitigation Status          |
| ---------------------------- | ------------------------ | -------------------------- |
| Privy SDK down               | Users cannot connect     | ⚠️ No fallback             |
| /api/auth/nonce rate limited | 5 attempts blocked       | ✅ Expected behavior       |
| JWT expired mid-session      | User sees stale data     | ✅ Frontend handles        |
| Network switch rejected      | Wrong chain interactions | ✅ Auto-switch implemented |

**Recomendaciones:**

- [ ] Implementar fallback a WalletConnect si Privy SDK falla
- [ ] Agregar indicador visual de "session expiring soon"

---

### 1.2 Deposito en IndividualPool / CooperativePool

```
┌───────────────────────────────────────────────────────────────────────┐
│                        DEPOSIT TRANSACTION FLOW                        │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  STEP 1: Frontend (apps/web)                                         │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ useApproveAndExecute() hook                                 │     │
│  │ • Check network (auto-switch to Mezo if needed)             │     │
│  │ • Check MUSD allowance via readContract()                   │     │
│  │ • If insufficient: Submit approve() tx first                │     │
│  └─────────────────────────────────────────────────────────────┘     │
│           │                                                           │
│           ▼                                                           │
│  STEP 2: Wallet Signature                                            │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ MetaMask/Privy popup                                        │     │
│  │ State: AWAITING_APPROVAL                                    │     │
│  │ • User can REJECT → error state, retry available            │     │
│  │ • User APPROVES → proceed to broadcast                      │     │
│  └─────────────────────────────────────────────────────────────┘     │
│           │                                                           │
│           ▼                                                           │
│  STEP 3: Transaction Broadcast                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Wagmi sends tx to Mezo RPC                                  │     │
│  │ State: BROADCASTING                                         │     │
│  │ • txHash returned immediately                               │     │
│  │ • UI shows "Sending to Mezo network..."                     │     │
│  └─────────────────────────────────────────────────────────────┘     │
│           │                                                           │
│           ▼                                                           │
│  STEP 4: On-chain Execution                                          │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ IndividualPoolV3.deposit() executes                         │     │
│  │ • MUSD.transferFrom() called                                │     │
│  │ • _depositWithReferral() internal call                      │     │
│  │ • YIELD_AGGREGATOR.deposit() → Mezo integration             │     │
│  │ • Deposit event emitted                                     │     │
│  └─────────────────────────────────────────────────────────────┘     │
│           │                                                           │
│           ▼                                                           │
│  STEP 5: Confirmation Wait                                           │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ useWaitForTransactionReceipt() polls RPC                    │     │
│  │ State: CONFIRMING (1/3 blocks)                              │     │
│  │ Polling interval: 3000ms                                    │     │
│  └─────────────────────────────────────────────────────────────┘     │
│           │                                                           │
│           ▼                                                           │
│  STEP 6: Indexer Processing (packages/blockchain)                    │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ BaseEventListener captures Deposit event                    │     │
│  │ • Event parsed with ethers.js                               │     │
│  │ • Prisma upserts to PostgreSQL                              │     │
│  │ • ~2-5 seconds latency typical                              │     │
│  └─────────────────────────────────────────────────────────────┘     │
│           │                                                           │
│           ▼                                                           │
│  STEP 7: UI Update                                                   │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ React Query invalidates ["pool", "balance"] keys            │     │
│  │ New balance fetched from API                                │     │
│  │ State: SUCCESS                                              │     │
│  │ Toast: "Deposit successful! +X MUSD"                        │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**SPOF Analysis - Step 5 Failure (Indexer Lag):**

| Scenario            | Current Behavior            | Risk                  |
| ------------------- | --------------------------- | --------------------- |
| Indexer 30s+ behind | UI shows stale balance      | 🟡 UX issue           |
| Indexer crashed     | Balance never updates       | 🔴 User confusion     |
| Reorg occurs        | Potentially incorrect state | 🟠 Data inconsistency |

**Recomendaciones:**

```typescript
// Agregar indicador de sync status en UI
const { data: health } = useQuery({
  queryKey: ['indexer-health'],
  queryFn: () => fetch('/api/health/indexer').then(r => r.json()),
  refetchInterval: 10000
});

// Mostrar banner si indexer está atrasado
if (health.lag > 30) {
  return <SyncingBanner blocks={health.lag} />;
}
```

---

### 1.3 Retiro de Fondos (Withdrawal)

```
┌───────────────────────────────────────────────────────────────────────┐
│                       WITHDRAWAL SECURITY CHECKS                       │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  PRE-EXECUTION CHECKS (Contract Level):                              │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ 1. nonReentrant modifier                          ✅ APPLIED │     │
│  │    - ReentrancyGuardUpgradeable from OpenZeppelin           │     │
│  │    - Prevents recursive calls during execution              │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ 2. noFlashLoan modifier                           ✅ APPLIED │     │
│  │    - depositBlock[msg.sender] != block.number               │     │
│  │    - Prevents same-block deposit+withdraw                   │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ 3. whenNotPaused modifier                         ✅ APPLIED │     │
│  │    - Contract can be paused by owner                        │     │
│  │    - Emergency stop capability                              │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ⚠️ ISSUE: State updates AFTER external calls in some functions      │
│     - withdrawPartial() writes state after YIELD_AGGREGATOR call     │
│     - Protected by nonReentrant but violates CEI pattern             │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

### 1.4 ROSCA / RotatingPool - Ciclo de Rotacion

```
┌───────────────────────────────────────────────────────────────────────┐
│                     ROSCA ROTATION CYCLE FLOW                          │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  POOL CREATION:                                                       │
│  createPool(name, contribution, periods, duration, members[])        │
│           │                                                           │
│           ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Members order randomized using SecureRandomness library     │     │
│  │ • Fisher-Yates shuffle                                      │     │
│  │ • Seeds: block.prevrandao + block.timestamp + chainId       │     │
│  │ • C-03 FIX: Deterministic order → Shuffled order            │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  CONTRIBUTION PHASE (each period):                                   │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Each member calls makeContribution(poolId)                  │     │
│  │ • BTC deposited to Mezo → MUSD minted                       │     │
│  │ • MUSD deposited to YieldAggregator                         │     │
│  │ • _checkAndCompletePeriod() called after each contribution  │     │
│  └─────────────────────────────────────────────────────────────┘     │
│           │                                                           │
│           ▼                                                           │
│  PERIOD COMPLETION (automatic when all contribute):                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ _completePeriod() triggered                                 │     │
│  │ • Recipient = poolMemberOrder[poolId][currentPeriod]        │     │
│  │ • Payout = totalContributions + periodYield                 │     │
│  │ • Period marked as completed                                │     │
│  └─────────────────────────────────────────────────────────────┘     │
│           │                                                           │
│           ▼                                                           │
│  PAYOUT CLAIM:                                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Recipient calls claimPayout(poolId)                         │     │
│  │ • _withdrawBtcFromMezo() converts MUSD → BTC                │     │
│  │ • BTC sent to recipient via low-level call                  │     │
│  │ • If call fails: pendingBtcClaims[recipient] += amount      │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  ⚠️ SPOF: No automatic triggering mechanism                          │
│     - Manual: Each member must call makeContribution()               │
│     - No keeper/automation for period completion                     │
│     - Stuck if member doesn't contribute (no penalty mechanism)      │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

**Recomendacion:** Implementar mecanismo de timeout y penalizacion:

```solidity
// Si miembro no contribuye en X bloques
function forceSkipMember(uint256 poolId, address member) external {
    require(block.number > periodDeadline[poolId], "Deadline not passed");
    // Mark member as defaulted, redistribute their share
    memberDefaulted[poolId][member] = true;
    // Continue to next period
}
```

---

### 1.5 LotteryPool - Sorteo de Premio

```
┌───────────────────────────────────────────────────────────────────────┐
│                    LOTTERY RANDOMNESS ANALYSIS                         │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  CURRENT IMPLEMENTATION (LotteryPoolV3.sol:565-594):                 │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ function _selectWinnerAndComplete(roundId, seed) {          │     │
│  │     uint256 winningTicket = seed % round.totalTicketsSold;  │     │
│  │     ...                                                     │     │
│  │ }                                                           │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  🔴 SLITHER FINDING: weak-prng                                       │
│     - seed % totalTicketsSold is predictable                         │
│     - Modulo bias if totalTicketsSold doesn't divide evenly          │
│                                                                       │
│  SEED SOURCES USED:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ forceComplete() uses SecureRandomness library:              │     │
│  │ • block.prevrandao (EIP-4399)                    ✅ Good    │     │
│  │ • block.timestamp                                ⚠️ Weak    │     │
│  │ • Additional entropy from commitments            ✅ Good    │     │
│  │ • FORCE_COMPLETE_DELAY for unpredictability      ✅ Good    │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  FRONT-RUNNING PROTECTION:                                           │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Commit-Reveal Pattern:                           ✅ Exists  │     │
│  │ 1. Users submit commitments before round end                │     │
│  │ 2. Reveal phase after round closes                          │     │
│  │ 3. Final seed = hash(all reveals + block entropy)           │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  RECOMENDACION: Chainlink VRF para produccion                        │
│  - Integrar Chainlink VRF v2.5 para randomness verificable           │
│  - Costo estimado: ~0.25 LINK por request                            │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

### 1.6 YieldAggregator - Routing de Estrategia

```
┌───────────────────────────────────────────────────────────────────────┐
│                    YIELD AGGREGATOR SECURITY                           │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  DEPOSIT FLOW:                                                        │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ deposit(musdAmount) → getBestVault() → vault.deposit()      │     │
│  │                                                             │     │
│  │ SECURITY CHECKS:                                            │     │
│  │ ✅ noFlashLoan modifier                                     │     │
│  │ ✅ nonReentrant modifier                                    │     │
│  │ ✅ whenNotPaused modifier                                   │     │
│  │ ✅ depositsEnabled check                                    │     │
│  │ ✅ Minimum deposit amount validation                        │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  VAULT MANIPULATION RISK:                                            │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Q: Can router be manipulated to redirect funds?             │     │
│  │                                                             │     │
│  │ A: Limited risk due to:                                     │     │
│  │ • Only owner can add/remove vaults (onlyOwner)              │     │
│  │ • Vaults must be pre-registered                             │     │
│  │ • No dynamic vault selection based on user input            │     │
│  │                                                             │     │
│  │ ⚠️ Risk: If owner key compromised, malicious vault added    │     │
│  │ Mitigation: Use multi-sig for owner operations              │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  SLIPPAGE PROTECTION:                                                │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ ⚠️ No explicit slippage protection in current impl          │     │
│  │                                                             │     │
│  │ Current: Deposits at current exchange rate                  │     │
│  │ Risk: Flash loan could manipulate vault share price         │     │
│  │                                                             │     │
│  │ Recommendation: Add minSharesOut parameter                  │     │
│  │ deposit(amount, minSharesOut) {                             │     │
│  │     (shares, _) = vault.deposit(amount);                    │     │
│  │     require(shares >= minSharesOut, "Slippage too high");   │     │
│  │ }                                                           │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## PILAR 2: Seguridad y Edge Cases

### 2.1 Smart Contract Edge Cases

| Check                      | Status     | Details                                          |
| -------------------------- | ---------- | ------------------------------------------------ |
| Reentrancy en pools        | ⚠️ PARTIAL | ReentrancyGuard applied but CEI pattern violated |
| Integer overflow/underflow | ✅ SAFE    | Solidity 0.8.25 built-in protection              |
| Access Control             | ✅ OK      | onlyOwner on critical functions                  |
| UUPS Upgradeable           | ⚠️ RISK    | Owner = EOA, not multi-sig                       |
| Pausable                   | ✅ OK      | Emergency pause available                        |
| Flash Loan Protection      | ✅ OK      | noFlashLoan modifier on all pools                |

### 2.2 Current Slither HIGH Severity Issues

| #   | Issue              | Location                      | Status                        |
| --- | ------------------ | ----------------------------- | ----------------------------- |
| 1   | arbitrary-send-eth | StabilityPoolStrategy:508     | 🔴 UNMITIGATED                |
| 2   | weak-prng          | LotteryPoolV3:569             | 🟠 DOCUMENTED                 |
| 3   | reentrancy-balance | CooperativePoolV3:474-515     | 🔴 UNMITIGATED                |
| 4   | reentrancy-eth     | RotatingPool:385-422          | ⚠️ PARTIAL (has nonReentrant) |
| 5   | reentrancy-eth     | MezoIntegrationV3:69-109      | ⚠️ PARTIAL (has nonReentrant) |
| 6   | reentrancy-eth     | StabilityPoolStrategy:251-288 | 🔴 UNMITIGATED                |
| 7   | reentrancy-eth     | StabilityPoolStrategy:200-242 | 🔴 UNMITIGATED                |
| 8   | reentrancy-eth     | StabilityPoolStrategy:519-551 | 🔴 UNMITIGATED                |
| 9   | reentrancy-eth     | CooperativePoolV3:562-578     | ⚠️ PARTIAL (has guard check)  |

### 2.3 Infrastructure Edge Cases

| Scenario                   | Current Behavior         | Recommendation            |
| -------------------------- | ------------------------ | ------------------------- |
| RPC de Mezo caido          | ❌ No fallback RPC       | Agregar RPC secundario    |
| Indexer lag/crash          | ⚠️ UI muestra stale data | Agregar sync indicator    |
| Reorg en Mezo              | ❌ No detection          | Implementar reorg handler |
| PostgreSQL down            | ✅ API returns 503       | OK                        |
| JWT expired during tx      | ✅ Tx continues          | OK                        |
| User closes during signing | ⚠️ Tx may/may not send   | Agregar tx recovery       |
| Gas insuficiente           | ✅ Clear error message   | OK                        |
| Contract paused during tx  | ✅ Tx reverts safely     | OK                        |

### 2.4 API Security Verification

| Check                 | Status    | Details                                     |
| --------------------- | --------- | ------------------------------------------- |
| CORS restrictivo      | ✅ OK     | Whitelist enforced in production            |
| Rate limiting         | ✅ OK     | Multi-tier (global, auth, write, expensive) |
| Privy App ID exposure | ✅ SAFE   | Public IDs are meant to be exposed          |
| Secrets en logs       | ✅ OK     | Pino configured to filter sensitive data    |
| DATABASE_URL SSL      | ⚠️ VERIFY | Check Railway config                        |
| Vercel env separation | ⚠️ VERIFY | Confirm testnet/mainnet separation          |

---

## PILAR 3: Gestion de Estados y UI/UX

### 3.1 Matriz de Estados Completa

#### Transaction States (All Pools)

| Estado             | Componente      | Mensaje Usuario               | Accion Disponible |
| ------------------ | --------------- | ----------------------------- | ----------------- |
| IDLE               | Boton principal | Balance visible, form enabled | Escribir monto    |
| VALIDATING         | Input field     | "Verificando balance..."      | Ninguna           |
| SWITCHING_NETWORK  | Modal           | "Cambiando a Mezo Testnet..." | Cancelar          |
| CHECKING_ALLOWANCE | Spinner         | "Verificando aprobacion..."   | Ninguna           |
| AWAITING_APPROVAL  | Wallet popup    | "Aprueba en tu wallet"        | Cancelar          |
| APPROVING          | Progress        | "Aprobando MUSD..."           | Ver en explorer   |
| AWAITING_SIGNATURE | Wallet popup    | "Firma la transaccion"        | Cancelar          |
| WALLET_REJECTED    | Toast error     | "Transaccion rechazada"       | Reintentar        |
| BROADCASTING       | Spinner + hash  | "Enviando a Mezo... [0x...]"  | Ver en explorer   |
| CONFIRMING         | Progress bar    | "Confirmando... 1/3 bloques"  | Ver en explorer   |
| INDEXING           | Spinner suave   | "Actualizando saldo..."       | Ninguna           |
| SUCCESS            | Toast verde     | "Deposito exitoso! +X MUSD"   | Ver historial     |
| TX_FAILED_ONCHAIN  | Toast rojo      | "Transaccion fallo: [reason]" | Reintentar        |
| NETWORK_ERROR      | Banner sticky   | "Problema de conexion"        | Actualizar        |
| CONTRACT_PAUSED    | Banner alerta   | "Contrato en mantenimiento"   | Notificarme       |
| SESSION_EXPIRED    | Modal re-login  | "Sesion expirada"             | Reconectar        |

#### ROSCA-Specific States

| Estado                | Mensaje                              | Accion            |
| --------------------- | ------------------------------------ | ----------------- |
| WAITING_MY_TURN       | "Tu turno: ronda X (aprox Y dias)"   | Ver calendario    |
| MY_TURN_ACTIVE        | "Es tu turno! X horas para reclamar" | Reclamar payout   |
| MY_TURN_MISSED        | "Turno perdido. Penalizacion: X%"    | Contactar soporte |
| POOL_COMPLETED        | "Ciclo ROSCA completado!"            | Ver resumen       |
| AWAITING_CONTRIBUTION | "Contribucion pendiente de [member]" | Notificar         |

#### Lottery-Specific States

| Estado       | Mensaje                             | Accion          |
| ------------ | ----------------------------------- | --------------- |
| ROUND_OPEN   | "Ronda activa - Termina en X horas" | Comprar tickets |
| ROUND_ENDING | "Ultimos 30 minutos!"               | Comprar tickets |
| ROUND_CLOSED | "Ronda cerrada - Esperando sorteo"  | Ninguna         |
| DRAWING      | "Seleccionando ganador..."          | Ninguna         |
| WON          | "Felicidades! Ganaste X MUSD!"      | Reclamar premio |
| LOST         | "No ganaste esta vez"               | Jugar de nuevo  |
| CLAIMING     | "Reclamando premio..."              | Ninguna         |

---

## PILAR 4: Alineacion Frontend/Backend/Indexer

### 4.1 Indexer Architecture Review

**Location:** `packages/blockchain/`

```
┌─────────────────────────────────────────────────────────────────┐
│                    INDEXER ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ResilientProvider                                              │
│  ├─ Health check every 30s                                      │
│  ├─ Auto-reconnect on 3 consecutive failures                    │
│  ├─ Exponential backoff (max 60s)                               │
│  └─ Latency monitoring (warns >5s)                              │
│                                                                 │
│  IndexerOrchestrator                                            │
│  ├─ Manages multiple BaseEventListener instances                │
│  ├─ Starts from last indexed block (from eventLog table)        │
│  └─ No catchup mechanism for missed blocks ⚠️                   │
│                                                                 │
│  Event Listeners (per contract):                                │
│  ├─ individual-pool.ts                                          │
│  ├─ cooperative-pool.ts                                         │
│  ├─ lottery-pool.ts                                             │
│  ├─ rotating-pool.ts                                            │
│  └─ Uses provider.on('event', ...) pattern                      │
│                                                                 │
│  Retry Utility:                                                 │
│  ├─ crypto.randomBytes() for jitter ✅ (Fixed)                  │
│  ├─ CircuitBreaker pattern available                            │
│  └─ Max 5 retries with exponential backoff                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Issues Identificados:**

1. **No Reorg Detection** 🔴
   - Indexer does not detect chain reorganizations
   - Risk: Incorrect state persisted in PostgreSQL

2. **No Catchup Mechanism** 🟠
   - If indexer restarts after extended downtime, may miss blocks
   - Uses fromBlock from last event, but gaps possible

3. **Single RPC** 🟠
   - No fallback RPC provider configured
   - Single point of failure for blockchain data

**Recomendacion - Reorg Detection:**

```typescript
// packages/blockchain/src/indexer/reorg-detector.ts
export class ReorgDetector {
  private blockHashes: Map<number, string> = new Map();

  async checkForReorg(provider: ethers.Provider): Promise<number | null> {
    const currentBlock = await provider.getBlockNumber();

    // Check last 10 blocks
    for (let i = currentBlock - 10; i <= currentBlock; i++) {
      const block = await provider.getBlock(i);
      const storedHash = this.blockHashes.get(i);

      if (storedHash && storedHash !== block.hash) {
        console.warn(`⚠️ Reorg detected at block ${i}`);
        return i; // Return reorg point
      }

      this.blockHashes.set(i, block.hash);
    }
    return null;
  }

  async handleReorg(fromBlock: number): Promise<void> {
    // Delete all events from reorg point onwards
    await prisma.eventLog.deleteMany({
      where: { blockNumber: { gte: fromBlock } },
    });
    // Re-index from reorg point
  }
}
```

### 4.2 Backend → Frontend Communication

**Current Implementation:** REST Polling

| Pattern            | Implementation                  | Status |
| ------------------ | ------------------------------- | ------ |
| WebSockets         | Not implemented                 | ❌     |
| Server-Sent Events | Not implemented                 | ❌     |
| REST Polling       | React Query with staleTime      | ✅     |
| Event-driven       | useWatchContractEvent (limited) | ⚠️     |

**Current Polling Configuration:**

```typescript
// apps/web/src/lib/query-client.ts
queries: {
  staleTime: 60_000,        // 1 minute
  gcTime: 5 * 60_000,       // 5 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true
}
```

**Recomendacion - SSE Implementation:**

```typescript
// apps/api/src/routes/events.ts
import { Router } from "express";
import { EventEmitter } from "events";

const router = Router();
const eventBus = new EventEmitter();

// Indexer emits to eventBus when processing events
// (Add this to BaseEventListener)

router.get("/pool/:address", authenticateJWT, (req, res) => {
  const { address } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data: PoolEvent) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Keep-alive ping every 30s
  const pingInterval = setInterval(() => {
    res.write(": ping\n\n");
  }, 30000);

  // Subscribe to pool events
  const eventKey = `pool:${address.toLowerCase()}`;
  eventBus.on(eventKey, sendEvent);

  req.on("close", () => {
    clearInterval(pingInterval);
    eventBus.off(eventKey, sendEvent);
    res.end();
  });
});

export default router;
```

### 4.3 Wagmi → Viem → Mezo RPC Configuration

**Current Config:** `apps/web/src/lib/web3/config.ts`

| Setting          | Value          | Recommendation                     |
| ---------------- | -------------- | ---------------------------------- |
| Batch requests   | 100ms          | ✅ OK                              |
| Retry count      | 5              | ✅ OK                              |
| Retry delay      | 1000-2000ms    | ✅ OK                              |
| Timeout          | 10s            | ⚠️ May be too short for slow nodes |
| Polling interval | 4000ms         | ✅ OK                              |
| Confirmations    | Not configured | ⚠️ Should be 1-3                   |

**Recomendacion - Fallback RPC:**

```typescript
// apps/web/src/lib/web3/config.ts
const mezoTestnet = defineChain({
  id: 31611,
  name: "Mezo Testnet",
  // ...
});

const transport = fallback(
  [
    http(process.env.NEXT_PUBLIC_RPC_URL!, {
      batch: { wait: 100 },
      retryCount: 3,
      timeout: 15_000,
    }),
    // Fallback RPC
    http("https://rpc.mezo.org/testnet", {
      batch: { wait: 100 },
      retryCount: 3,
      timeout: 20_000,
    }),
  ],
  {
    rank: true, // Auto-rank by latency
    retryCount: 1,
  }
);
```

---

## ENTREGABLES

### 1. Diagnostico de Vulnerabilidades

#### Smart Contracts

| ID    | Vulnerabilidad           | Severidad   | Archivo                   | Linea   | Estado                    |
| ----- | ------------------------ | ----------- | ------------------------- | ------- | ------------------------- |
| SC-01 | Arbitrary ETH send       | 🔴 CRITICAL | StabilityPoolStrategy.sol | 508     | BLOQUEA LAUNCH            |
| SC-02 | Weak PRNG                | 🔴 HIGH     | LotteryPoolV3.sol         | 569     | BLOQUEA LAUNCH            |
| SC-03 | Reentrancy stale balance | 🔴 HIGH     | CooperativePoolV3.sol     | 493-500 | BLOQUEA LAUNCH            |
| SC-04 | CEI violation            | 🟠 MEDIUM   | Multiple                  | -       | Mitigado con nonReentrant |
| SC-05 | Owner = EOA              | 🟠 MEDIUM   | All upgradeable           | -       | Fix antes de mainnet      |
| SC-06 | No slippage protection   | 🟠 MEDIUM   | YieldAggregatorV3.sol     | -       | Recomendado               |

#### Indexer

| ID    | Issue                | Severidad | Impacto                 |
| ----- | -------------------- | --------- | ----------------------- |
| IX-01 | No reorg detection   | 🔴 HIGH   | Incorrect state         |
| IX-02 | No catchup mechanism | 🟠 MEDIUM | Missed events           |
| IX-03 | Single RPC provider  | 🟠 MEDIUM | Single point of failure |

#### API Backend

| ID     | Issue                             | Severidad | Estado                 |
| ------ | --------------------------------- | --------- | ---------------------- |
| API-01 | Pool refresh no ownership check   | 🟡 LOW    | Puede causar DoS       |
| API-02 | Redis pattern deletion incomplete | 🟡 LOW    | Funcionalidad limitada |

#### Frontend

| ID    | Issue                   | Severidad | Estado         |
| ----- | ----------------------- | --------- | -------------- |
| FE-01 | MetaMask-only connector | 🟡 LOW    | Limita wallets |
| FE-02 | No tx timeout handling  | 🟡 LOW    | UX issue       |

---

### 2. Plan de Implementacion Tecnica

#### A. Hook useTransactionLifecycle()

```typescript
// apps/web/src/hooks/web3/use-transaction-lifecycle.ts
import { useCallback, useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useToast } from "@/hooks/use-toast";

type TxState =
  | "idle"
  | "switching-network"
  | "checking-allowance"
  | "approving"
  | "awaiting-signature"
  | "broadcasting"
  | "confirming"
  | "indexing"
  | "success"
  | "error";

interface TransactionLifecycle {
  state: TxState;
  txHash: `0x${string}` | null;
  error: string | null;
  confirmations: number;
  execute: () => Promise<void>;
  reset: () => void;
}

export function useTransactionLifecycle(config: {
  address: `0x${string}`;
  abi: readonly unknown[];
  functionName: string;
  args: unknown[];
  onSuccess?: () => void;
  confirmationsRequired?: number;
}): TransactionLifecycle {
  const [state, setState] = useState<TxState>("idle");
  const [confirmations, setConfirmations] = useState(0);
  const { toast } = useToast();

  const { writeContractAsync, data: txHash, error, reset: resetWrite } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
    confirmations: config.confirmationsRequired ?? 1,
    onReplaced(replacement) {
      if (replacement.reason === "repriced") {
        toast({ title: "Transaction repriced", variant: "warning" });
      }
    },
  });

  // Track confirmations
  useEffect(() => {
    if (txHash && isConfirming) {
      setState("confirming");
      // Poll for confirmation count
      const interval = setInterval(async () => {
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
        if (receipt) {
          const current = await publicClient.getBlockNumber();
          setConfirmations(Number(current - receipt.blockNumber));
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [txHash, isConfirming]);

  useEffect(() => {
    if (isSuccess) {
      setState("indexing");
      // Wait for indexer (poll API or use SSE)
      setTimeout(() => {
        setState("success");
        config.onSuccess?.();
      }, 5000);
    }
  }, [isSuccess]);

  const execute = useCallback(async () => {
    try {
      setState("awaiting-signature");
      await writeContractAsync({
        address: config.address,
        abi: config.abi,
        functionName: config.functionName,
        args: config.args,
      });
      setState("broadcasting");
    } catch (err) {
      const message = parseError(err);
      setState("error");
      toast({ title: "Transaction failed", description: message, variant: "destructive" });
    }
  }, [config, writeContractAsync]);

  const reset = useCallback(() => {
    setState("idle");
    setConfirmations(0);
    resetWrite();
  }, [resetWrite]);

  return {
    state,
    txHash: txHash ?? null,
    error: error?.message ?? null,
    confirmations,
    execute,
    reset,
  };
}
```

#### B. Sistema de Notificaciones Global

```typescript
// apps/web/src/providers/notification-provider.tsx
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X } from 'lucide-react';

interface Notification {
  id: string;
  type: 'toast' | 'banner';
  variant: 'default' | 'success' | 'warning' | 'destructive';
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  persistent?: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (n: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((n: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { ...n, id }]);

    // Auto-remove non-persistent after 5s
    if (!n.persistent) {
      setTimeout(() => removeNotification(id), 5000);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const banners = notifications.filter(n => n.type === 'banner');

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {/* Persistent banners at top */}
      <div className="fixed top-0 left-0 right-0 z-50 space-y-2 p-4">
        {banners.map(banner => (
          <Alert key={banner.id} variant={banner.variant}>
            <AlertTitle>{banner.title}</AlertTitle>
            {banner.description && <AlertDescription>{banner.description}</AlertDescription>}
            <button onClick={() => removeNotification(banner.id)} className="absolute top-2 right-2">
              <X className="h-4 w-4" />
            </button>
          </Alert>
        ))}
      </div>

      {children}
      <Toaster />
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
```

#### C. Endpoint SSE para Actualizaciones

```typescript
// apps/api/src/routes/events.ts
import { Router } from "express";
import { EventEmitter } from "events";
import { requireAuth } from "../middleware/auth";
import { logger } from "../lib/logger";

const router = Router();

// Global event bus (in production, use Redis Pub/Sub)
export const eventBus = new EventEmitter();
eventBus.setMaxListeners(1000); // Allow many connections

interface SSEClient {
  id: string;
  address: string;
  res: Response;
  createdAt: Date;
}

const clients: Map<string, SSEClient> = new Map();

// Cleanup stale connections every minute
setInterval(() => {
  const now = Date.now();
  for (const [id, client] of clients) {
    if (now - client.createdAt.getTime() > 30 * 60 * 1000) {
      // 30 min max
      client.res.end();
      clients.delete(id);
    }
  }
}, 60000);

router.get("/stream/:address", requireAuth, (req, res) => {
  const { address } = req.params;
  const clientId = crypto.randomUUID();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering
  res.flushHeaders();

  // Initial connection message
  res.write(`data: ${JSON.stringify({ type: "connected", clientId })}\n\n`);

  const client: SSEClient = {
    id: clientId,
    address: address.toLowerCase(),
    res,
    createdAt: new Date(),
  };
  clients.set(clientId, client);

  logger.info({ clientId, address }, "SSE client connected");

  // Keep-alive every 15s
  const keepAlive = setInterval(() => {
    res.write(": keepalive\n\n");
  }, 15000);

  // Event handler
  const onEvent = (event: PoolEvent) => {
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  eventBus.on(`pool:${address.toLowerCase()}`, onEvent);
  eventBus.on(`user:${req.user.address}`, onEvent);

  req.on("close", () => {
    clearInterval(keepAlive);
    eventBus.off(`pool:${address.toLowerCase()}`, onEvent);
    eventBus.off(`user:${req.user.address}`, onEvent);
    clients.delete(clientId);
    logger.info({ clientId }, "SSE client disconnected");
  });
});

// Broadcast to all clients watching a pool
export function broadcastPoolEvent(poolAddress: string, event: PoolEvent) {
  eventBus.emit(`pool:${poolAddress.toLowerCase()}`, event);
}

export default router;
```

#### D. Middleware Rate Limiting Mejorado

```typescript
// apps/api/src/middleware/enhanced-rate-limit.ts
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../lib/redis";
import { logger } from "../lib/logger";

// Distributed rate limiter with Redis
function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
  skipSuccessfulRequests?: boolean;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? false,

    // Use Redis for distributed rate limiting
    store: redis
      ? new RedisStore({
          sendCommand: (...args: string[]) => redis.call(...args),
          prefix: `rl:${options.keyPrefix}:`,
        })
      : undefined,

    keyGenerator: (req) => {
      // Use wallet address if authenticated, otherwise IP
      return req.user?.address || req.ip || "unknown";
    },

    handler: (req, res) => {
      logger.warn(
        {
          ip: req.ip,
          address: req.user?.address,
          path: req.path,
          limit: options.max,
          window: options.windowMs,
        },
        "Rate limit exceeded"
      );

      res.status(429).json({
        error: "Too Many Requests",
        retryAfter: Math.ceil(options.windowMs / 1000),
        message: `Rate limit exceeded. Try again in ${Math.ceil(options.windowMs / 1000)} seconds.`,
      });
    },

    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path.startsWith("/health");
    },
  });
}

// Export configured limiters
export const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyPrefix: "global",
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyPrefix: "auth",
  skipSuccessfulRequests: true,
});

export const writeLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  keyPrefix: "write",
});

export const expensiveLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 5,
  keyPrefix: "expensive",
});

// Per-pool rate limiter (prevents pool refresh spam)
export const poolOperationLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 3, // 3 operations per pool per minute
  keyPrefix: "pool-op",
});
```

#### E. Sistema de Retry con Backoff Exponencial

```typescript
// packages/blockchain/src/utils/resilient-retry.ts
import crypto from "crypto";

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitter: boolean;
  onRetry?: (error: Error, attempt: number, delayMs: number) => void;
  shouldRetry?: (error: Error) => boolean;
  abortSignal?: AbortSignal;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000,
  maxDelayMs: 60000,
  factor: 2,
  jitter: true,
};

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = "RetryError";
  }
}

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    // Check abort signal
    if (cfg.abortSignal?.aborted) {
      throw new Error("Operation aborted");
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry this error
      if (cfg.shouldRetry && !cfg.shouldRetry(lastError)) {
        throw lastError;
      }

      // Last attempt failed
      if (attempt === cfg.maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      let delayMs = Math.min(cfg.initialDelayMs * Math.pow(cfg.factor, attempt), cfg.maxDelayMs);

      // Add secure random jitter (prevents thundering herd)
      if (cfg.jitter) {
        const randomBuffer = crypto.randomBytes(4);
        const secureRandom = randomBuffer.readUInt32BE(0) / 0xffffffff;
        delayMs = delayMs * (0.5 + secureRandom * 0.5);
      }

      // Notify about retry
      cfg.onRetry?.(lastError, attempt + 1, delayMs);

      // Wait before retrying
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delayMs);

        // Allow abort during wait
        cfg.abortSignal?.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(new Error("Operation aborted"));
          },
          { once: true }
        );
      });
    }
  }

  throw new RetryError(
    `Operation failed after ${cfg.maxRetries} retries: ${lastError?.message}`,
    cfg.maxRetries,
    lastError!
  );
}

// Pre-configured for blockchain operations
export const blockchainRetry = <T>(fn: () => Promise<T>) =>
  retryWithExponentialBackoff(fn, {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    jitter: true,
    shouldRetry: (error) => {
      const message = error.message.toLowerCase();
      return (
        message.includes("timeout") ||
        message.includes("network") ||
        message.includes("rate limit") ||
        message.includes("unavailable") ||
        message.includes("bad gateway")
      );
    },
    onRetry: (error, attempt, delay) => {
      console.log(`⏳ Blockchain retry ${attempt}/5 in ${Math.round(delay)}ms: ${error.message}`);
    },
  });
```

---

### 3. Checklist de QA Pre-Produccion

#### Smart Contracts

```
[ ] forge test -vvv → 100% passing, 0 errores
[ ] forge coverage → >90% en contracts/pools/v3/ y contracts/integrations/
[ ] slither . → 0 findings HIGH (actualmente 9 HIGH)
[ ] Verificar ReentrancyGuard en: deposit(), withdraw(), claimYield(), distribute()
[ ] Verificar Flash Loan Protection: misma tx no puede deposit+withdraw
[ ] Verificar Access Control: solo authorized en pause(), upgrade()
[ ] Verificar UUPS: implementationAuthority es multisig, NO EOA
[ ] Test de reentrancy manual con Foundry AttackContract
[ ] Test de overflow en cantidades maximas de deposito
[ ] Test de sorteo LotteryPool: verificar aleatoriedad con multiples seeds
[ ] Test de ROSCA: completar ciclo completo con 5+ participantes
[ ] Test de YieldAggregator: redireccion de estrategia bajo condiciones adversas
```

#### Backend & Indexer

```
[ ] Indexer procesa evento Deposit y actualiza DB en <5 segundos
[ ] Indexer detecta reorg de 1 bloque y revierte estado correctamente
[ ] Indexer se recupera de un reinicio sin perder eventos (catchup)
[ ] API responde 401 con JWT expirado o invalido
[ ] API aplica rate limiting: maximo 100 req/min por IP
[ ] CORS rechaza requests de dominios no autorizados
[ ] DATABASE_URL usa SSL (ssl=true en connection string)
[ ] Logs de Pino NO contienen JWT, passwords ni private keys
[ ] Endpoint /health devuelve estado del indexer (blockHeight, lag)
[ ] Test de carga: 100 usuarios concurrentes depositando simultaneamente
```

#### Frontend

```
[ ] Privy conecta wallet y crea sesion SIWE correctamente
[ ] Estado AWAITING_SIGNATURE visible en <500ms tras click en "Depositar"
[ ] Si usuario rechaza firma: toast de error en <1s, formulario re-habilitado
[ ] Si RPC esta caido: banner "red no disponible" en <3s
[ ] Hash de transaccion visible con link a Mezo Explorer durante BROADCASTING
[ ] Balance actualizado en UI tras confirmacion (sin refresh manual)
[ ] Funciona en: Chrome, Firefox, Safari, MetaMask Mobile, Coinbase Wallet
[ ] Responsive: funciona en mobile 375px con wallet embedded de Privy
[ ] No hay console.error en flujo normal de deposito
[ ] Variables NEXT_PUBLIC_* correctas para testnet y mainnet (env separados)
[ ] No hay private keys, secrets ni mnemonics en el codigo fuente
```

#### Seguridad General

```
[ ] pnpm audit --audit-level=high → 0 vulnerabilidades CRITICAL o HIGH
[ ] snyk test → 0 vulnerabilidades criticas en dependencias
[ ] semgrep → 0 findings criticos en TypeScript y Solidity
[ ] .env.example NO contiene valores reales de produccion
[ ] .gitignore cubre todos los archivos .env
[ ] Revisar todos los TODO y FIXME en el codigo: hay deuda tecnica critica?
[ ] Contratos en mainnet: owner = multisig (no EOA), upgrade con timelock
[ ] Bug bounty program activo antes de mainnet
```

---

## Conclusion y Proximos Pasos

### Bloqueantes para Mainnet

1. **🔴 CRITICAL:** Contratar auditoria profesional de smart contracts ($20k-50k)
2. **🔴 CRITICAL:** Resolver 9 issues HIGH de Slither (especialmente StabilityPoolStrategy)
3. **🔴 CRITICAL:** Cambiar owner de contratos de EOA a multi-sig
4. **🟠 HIGH:** Implementar deteccion de reorgs en indexer
5. **🟠 HIGH:** Configurar staging environment

### Timeline Recomendado

| Semana | Tareas                                     |
| ------ | ------------------------------------------ |
| 1-2    | Fix Slither HIGH issues, setup staging     |
| 3-4    | Contract audit engagement, reorg detection |
| 5-8    | Audit findings remediation, load testing   |
| 9-10   | Bug bounty launch, final security review   |
| 11-12  | Go/No-Go decision, mainnet deployment      |

### Estimacion de Costos

| Item                        | Costo             |
| --------------------------- | ----------------- |
| Smart Contract Audit        | $20,000 - $50,000 |
| Bug Bounty (initial pool)   | $10,000 - $25,000 |
| Chainlink VRF (per lottery) | ~0.25 LINK        |
| Monitoring (Sentry, Uptime) | $50/month         |
| **Total Minimo**            | ~$30,000          |

---

**Reporte generado:** 2026-03-09
**Proximo review:** Post-auditoria profesional
**Contacto seguridad:** security@khipuvault.com
