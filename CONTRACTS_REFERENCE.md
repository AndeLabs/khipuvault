# KhipuVault - Contracts Reference Guide

## Sistema de Contratos V3

Este documento describe todos los contratos del sistema KhipuVault V3, sus funcionalidades y flujos de trabajo.

---

## 1. IndividualPoolV3

**Descripción**: Pool de ahorro individual donde los usuarios depositan MUSD y generan yields automáticamente.

**Características**:
- ✅ UUPS Upgradeable Pattern
- ✅ Storage Packing (ahorro de ~40k gas)
- ✅ Auto-compounding opcional
- ✅ Flash loan protection
- ✅ Sistema de referidos
- ✅ Depósitos incrementales
- ✅ Retiros parciales
- ✅ Emergency mode

### Funcionalidades Principales

#### Depósitos
- `deposit(musdAmount)` - Depósito simple
- `depositWithReferral(musdAmount, referrer)` - Depósito con código de referido

**Flujo**:
1. Usuario aprueba MUSD al contrato
2. Contrato transfiere MUSD del usuario
3. Deposita en YieldAggregator
4. Actualiza balance del usuario
5. Si hay referrer, calcula bonus

#### Retiros
- `withdrawPartial(musdAmount)` - Retiro parcial del principal
- `withdraw()` - Retiro total (principal + yields)

**Flujo**:
1. Calcula yields pendientes
2. Auto-compound si está habilitado
3. Retira del YieldAggregator
4. Actualiza estado del usuario
5. Transfiere MUSD al usuario

#### Yields
- `claimYield()` - Reclamar yields sin tocar el principal
- `setAutoCompound(bool)` - Habilitar/deshabilitar auto-compounding

**Flujo de Claim**:
1. Calcula pending yields
2. Calcula performance fee (1%)
3. Claim del YieldAggregator si es necesario
4. Transfiere net yield al usuario
5. Transfiere fee al collector

#### Sistema de Referidos
- `claimReferralRewards()` - Reclamar recompensas de referidos
- `getReferralStats(user)` - Ver estadísticas

**Bonus**: 0.5% del depósito va al referrer

### Parámetros
- MIN_DEPOSIT: 10 MUSD
- MAX_DEPOSIT: 100,000 MUSD
- MIN_WITHDRAWAL: 1 MUSD
- AUTO_COMPOUND_THRESHOLD: 1 MUSD
- Performance Fee: 1% (100 basis points)
- Referral Bonus: 0.5% (50 basis points)

### View Functions
- `getUserInfo(user)` - Info completa del usuario
- `getUserTotalBalance(user)` - Balance total (principal + yields netos)

---

## 2. CooperativePoolV3

**Descripción**: Pool cooperativo donde múltiples miembros aportan BTC, se mintea MUSD, y los yields se distribuyen proporcionalmente.

**Características**:
- ✅ UUPS Upgradeable Pattern
- ✅ Storage Packing (~60k gas saved)
- ✅ Flash loan protection
- ✅ Emergency mode
- ✅ Contribuciones incrementales
- ✅ Gobernanza flexible

### Funcionalidades Principales

#### Creación de Pools
- `createPool(name, minContribution, maxContribution, maxMembers)`

**Flujo**:
1. Valida parámetros
2. Crea nuevo pool con ID único
3. Estado inicial: ACCEPTING
4. Emite evento PoolCreated

#### Unirse a Pool
- `joinPool(poolId)` - Pagar en BTC (payable)

**Flujo**:
1. Valida que el pool acepta miembros
2. Recibe BTC del usuario
3. Si el pool alcanza MIN_POOL_SIZE:
   - Deposita BTC en MezoIntegration
   - Mintea MUSD
   - Deposita MUSD en YieldAggregator
4. Asigna shares al miembro
5. Estado del pool → ACTIVE

#### Salir del Pool
- `leavePool(poolId)`

**Flujo**:
1. Calcula yields del miembro
2. Calcula proporción de shares
3. Retira MUSD del YieldAggregator
4. Quema MUSD en MezoIntegration
5. Recupera BTC
6. Transfiere BTC al usuario
7. Transfiere yields (MUSD) con fee

#### Reclamar Yields
- `claimYield(poolId)`

**Flujo**:
1. Calcula yields del miembro
2. Claim del YieldAggregator
3. Calcula performance fee
4. Transfiere net yield al miembro

### Parámetros
- MIN_POOL_SIZE: 0.01 BTC
- MAX_POOL_SIZE: 100 BTC
- MIN_CONTRIBUTION: 0.001 BTC
- MAX_MEMBERS_LIMIT: 100
- Performance Fee: 1%

### View Functions
- `getPoolInfo(poolId)` - Info completa del pool
- `getMemberInfo(poolId, member)` - Info del miembro
- `getPoolMembers(poolId)` - Lista de miembros
- `calculateMemberYield(poolId, member)` - Yields del miembro
- `getTotalShares(poolId)` - Total de shares
- `getPoolStats(poolId)` - Estadísticas del pool

### Pool Status
- ACCEPTING - Aceptando nuevos miembros
- ACTIVE - Pool activo generando yields
- CLOSED - Pool cerrado

---

## 3. LotteryPool

**Descripción**: Sistema de lotería sin pérdida. Los participantes nunca pierden su capital, solo compiten por los yields generados.

**Características**:
- ✅ Chainlink VRF para sorteos verificables
- ✅ Sin pérdida de capital
- ✅ Yields para todos
- ✅ Sorteos semanales/mensuales
- ✅ Probabilidades justas

### Funcionalidades Principales

#### Crear Lotería
- `createLottery(lotteryType, ticketPrice, maxParticipants, durationInSeconds)`

**Parámetros**:
- lotteryType: WEEKLY, MONTHLY, CUSTOM
- ticketPrice: 0.0005 - 0.1 BTC
- maxParticipants: Sin límite (hasta MAX_PARTICIPANTS)
- duration: Duración de la ronda

#### Comprar Tickets
- `buyTickets(roundId, ticketCount)`

**Flujo**:
1. Valida que la ronda está OPEN
2. Calcula precio total (ticketPrice * ticketCount)
3. Transfiere WBTC del usuario
4. Deposita en MezoIntegration → mintea MUSD
5. Deposita MUSD en YieldAggregator
6. Asigna tickets al usuario (firstTicket - lastTicket)
7. Actualiza stats de la ronda

**Límites**:
- MAX_TICKETS_PER_USER: 10 tickets por usuario

#### Sorteo
- `requestDraw(roundId)` - Owner solicita sorteo

**Flujo**:
1. Valida que la ronda terminó (endTime)
2. Solicita random number a Chainlink VRF
3. Estado → DRAWING
4. Espera callback de VRF

**Callback VRF**:
- `fulfillRandomWords(requestId, randomWords)` - Llamado por VRF Coordinator

**Flujo**:
1. Recibe random word
2. Selecciona ganador: `winningTicket = randomWord % totalTickets`
3. Calcula yields totales
4. Premio ganador = principal + 90% yields
5. 10% yields → treasury
6. Estado → COMPLETED

#### Reclamar Premio
- `claimPrize(roundId)`

**Flujo**:
- **Si eres ganador**:
  1. Recibes tu BTC (principal)
  2. Recibes 90% de yields (MUSD)
- **Si no ganaste**:
  1. Recibes tu BTC (principal)
  2. No recibes yields

### Parámetros
- MIN_TICKET_PRICE: 0.0005 BTC (~$30)
- MAX_TICKET_PRICE: 0.1 BTC (~$6000)
- MAX_TICKETS_PER_USER: 10
- TREASURY_FEE: 10% (1000 basis points)

### View Functions
- `getLotteryInfo(roundId)` - Info de la ronda
- `getParticipantInfo(roundId, participant)` - Info del participante
- `getParticipants(roundId)` - Lista de participantes
- `getWinProbability(roundId, participant)` - Probabilidad de ganar (basis points)

### Lottery Status
- OPEN - Aceptando participantes
- DRAWING - Sorteo en progreso (esperando VRF)
- COMPLETED - Sorteo completado
- CANCELLED - Cancelada (emergencia)

---

## 4. YieldAggregatorV3

**Descripción**: Agregador de yields que distribuye depósitos entre múltiples vaults para maximizar retornos.

**Características**:
- ✅ UUPS Upgradeable
- ✅ Multi-vault support
- ✅ Auto-routing al mejor vault
- ✅ Auto-compounding
- ✅ Flash loan protection

### Funcionalidades Principales

#### Depósitos
- `deposit(amount)` - Deposita en el mejor vault automáticamente
- `depositToVault(vaultAddress, amount)` - Deposita en vault específico

**Flujo**:
1. Valida amount >= MIN_DEPOSIT
2. Selecciona mejor vault (por APR)
3. Transfiere MUSD del usuario
4. Calcula shares
5. Actualiza posición del usuario
6. Actualiza TVL del vault

#### Retiros
- `withdraw(amount)` - Retira de todos los vaults proporcionalmente
- `withdrawFromVault(vaultAddress, shares)` - Retira de vault específico

**Flujo**:
1. Calcula pending yields
2. Retira de vault(s)
3. Quema shares
4. Transfiere MUSD al usuario

#### Yields
- `claimYield()` - Reclama yields de todos los vaults
- `compoundYields()` - Auto-compound yields al mejor vault

**Flujo de Compound**:
1. Calcula total yields pendientes
2. Selecciona mejor vault
3. Agrega yields al principal
4. Actualiza shares

### Gestión de Vaults
- `addVault(address, strategy, apr)` - Agregar nuevo vault
- `updateVaultApr(address, apr)` - Actualizar APR
- `setVaultActive(address, bool)` - Activar/desactivar vault

### Parámetros
- MIN_DEPOSIT: 1 MUSD
- MAX_VAULTS: 10

### View Functions
- `getPendingYield(user)` - Yields pendientes totales
- `getPendingYieldInVault(user, vault)` - Yields en vault específico
- `getUserPosition(user)` - Posición total (principal + yields)
- `getUserPositionInVault(user, vault)` - Posición en vault
- `getVaultInfo(vault)` - Info del vault
- `getActiveVaults()` - Lista de vaults activos
- `getBestVault()` - Mejor vault (por APR)
- `calculateExpectedYield(amount, vault, time)` - Yield estimado
- `getTotalValueLocked()` - TVL total
- `getAverageApr()` - APR promedio ponderado

### Yield Strategies
```solidity
enum YieldStrategy {
    STABILITY_POOL,    // Mezo Stability Pool
    LENDING,           // Lending protocols
    STAKING,           // Staking
    LIQUIDITY_MINING   // Liquidity mining
}
```

---

## 5. MezoIntegrationV3

**Descripción**: Wrapper para interactuar con Mezo MUSD protocol. Deposita BTC y mintea MUSD manteniendo collateral ratio saludable.

**Características**:
- ✅ UUPS Upgradeable
- ✅ Flash loan protection
- ✅ Gestión automática de Troves
- ✅ Health monitoring
- ✅ Emergency mode

### Funcionalidades Principales

#### Depositar y Mintear
- `depositAndMintNative()` - Payable function para depositar BTC

**Flujo**:
1. Recibe BTC del usuario
2. Obtiene precio actual de BTC
3. Calcula MUSD a mintear (basado en targetLTV)
4. Si es primera vez:
   - Abre Trove en Mezo
5. Si ya tiene Trove:
   - Ajusta Trove (añade collateral + mintea más MUSD)
6. Actualiza posición del usuario
7. Transfiere MUSD al usuario
8. Valida que la posición es saludable

**Target LTV**: 50% (5000 basis points)

#### Quemar y Retirar
- `burnAndWithdraw(musdAmount)`

**Flujo**:
1. Recibe MUSD del usuario
2. Calcula BTC a devolver proporcionalmente
3. Si quema todo el debt:
   - Cierra Trove
   - Devuelve todo el BTC
4. Si quema parcial:
   - Ajusta Trove (reduce collateral + quema MUSD)
5. Transfiere BTC al usuario

### Parámetros
- MIN_BTC_DEPOSIT: 0.001 BTC
- Target LTV: 50% (5000 basis points)
- Max Fee Percentage: 5% (500 basis points)
- Minimum Collateral Ratio: 110% (healthy position)

### View Functions
- `isPositionHealthy(user)` - Verifica salud de la posición
- `getCollateralRatio(user)` - Ratio de colateral (basis points)
- `getUserPosition(user)` - (btcCollateral, musdDebt)

### Admin Functions
- `setTargetLtv(newLtv)` - Actualizar target LTV (max 80%)
- `setMaxFeePercentage(newFee)` - Actualizar max fee (max 10%)

---

## 6. StabilityPoolStrategy

**Descripción**: Estrategia que deposita MUSD en Mezo Stability Pool para ganar recompensas de liquidación.

**Características**:
- ✅ Sin riesgo de liquidación
- ✅ Ganancias en BTC de liquidaciones
- ✅ Shares-based accounting
- ✅ Performance fees
- ✅ Auto-harvesting

### Funcionalidades Principales

#### Depositar
- `depositMUSD(amount)`

**Flujo**:
1. Valida amount >= MIN_DEPOSIT (10 MUSD)
2. Harvests pending collateral gains
3. Calcula shares a emitir
4. Transfiere MUSD del usuario
5. Deposita en Mezo Stability Pool
6. Actualiza posición del usuario

#### Retirar
- `withdrawMUSD(amount)`

**Flujo**:
1. Calcula shares a quemar
2. Reclama collateral gains
3. Retira de Stability Pool
4. Transfiere MUSD al usuario
5. Quema shares

#### Reclamar Ganancias
- `claimCollateralGains()` - Reclama ganancias en BTC

**Flujo**:
1. Harvests latest gains
2. Calcula share del usuario del collateral
3. Transfiere BTC al usuario
4. Actualiza snapshot

#### Harvest
- `harvestCollateralGains()` - Anyone can call

**Flujo**:
1. Obtiene pending collateral del Stability Pool
2. Trigger distribution (withdraw 0)
3. Calcula performance fee (default 1%)
4. Transfiere fee al collector
5. Actualiza totalPendingCollateral

### Parámetros
- MIN_DEPOSIT: 10 MUSD
- Performance Fee: Configurable (max 10%)
- MAX_PERFORMANCE_FEE: 10% (1000 basis points)

### View Functions
- `getUserMusdValue(user)` - Valor MUSD de las shares
- `getUserPendingGains(user)` - Ganancias pendientes en BTC
- `getUserSharePercentage(user)` - Porcentaje de shares (basis points)
- `getTVL()` - Total Value Locked
- `getEstimatedAPY()` - APY estimado basado en ganancias históricas
- `getUserPosition(user)` - Posición completa

---

## Flujo General del Sistema

### 1. Ahorro Individual
```
Usuario → IndividualPoolV3 (MUSD)
         → YieldAggregatorV3
         → StabilityPoolStrategy (Mezo Stability Pool)
         → Gana yields de liquidaciones
```

### 2. Ahorro Cooperativo
```
Usuarios → CooperativePoolV3 (BTC)
         → MezoIntegrationV3 (mint MUSD)
         → YieldAggregatorV3
         → StabilityPoolStrategy
         → Yields distribuidos proporcionalmente
```

### 3. Lotería
```
Usuarios → LotteryPool (WBTC)
         → MezoIntegrationV3 (mint MUSD)
         → YieldAggregatorV3
         → Chainlink VRF sortea ganador
         → Ganador: principal + 90% yields
         → Perdedores: recuperan principal
```

---

## Testing Strategy

Para probar cada contrato:

1. **Unit Tests**: Probar cada función individualmente
2. **Integration Tests**: Probar interacciones entre contratos
3. **Fuzz Tests**: Generar casos aleatorios
4. **Invariant Tests**: Verificar invariantes del sistema

### Invariantes Clave

**IndividualPoolV3**:
- `totalMusdDeposited == suma(userDeposits.musdAmount)`
- `userBalance >= userDeposit`

**CooperativePoolV3**:
- `totalBtcDeposited == suma(memberContributions)`
- `totalShares == suma(memberShares)`

**YieldAggregatorV3**:
- `TVL == suma(vault.totalDeposited)`
- `userTotalDeposited == suma(userVaultPositions.principal)`

---

## Próximos Pasos

1. ✅ Documentación completa
2. ⏳ Crear tests para IndividualPoolV3
3. ⏳ Crear tests para CooperativePoolV3
4. ⏳ Crear tests para LotteryPool
5. ⏳ Crear tests para YieldAggregatorV3
6. ⏳ Crear tests para MezoIntegrationV3
7. ⏳ Crear tests para StabilityPoolStrategy
8. ⏳ Implementar UI/UX completo

---

## Notas de Seguridad

Todos los contratos incluyen:
- ✅ ReentrancyGuard
- ✅ Pausable
- ✅ Flash loan protection
- ✅ Ownable (admin functions)
- ✅ Emergency mode
- ✅ SafeERC20 para transfers
- ✅ Checks-Effects-Interactions pattern
