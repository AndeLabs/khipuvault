# Actualización de Arquitectura para Mezo - BTC Nativo

## Fecha: 2025-10-24

## Resumen Ejecutivo

Se identificó y corrigió un error fundamental en la arquitectura del proyecto: **estábamos intentando deployar WBTC y MUSD cuando estos ya existen en Mezo**, y además **BTC es NATIVO en Mezo** (como ETH en Ethereum), no requiere wrapping.

## Hallazgos Clave

### 1. BTC es NATIVO en Mezo
- BTC tiene **18 decimals** (no 8 como BTC real)
- Se envía con `msg.value` en funciones `payable`
- No se necesita WBTC ni aprobaciones ERC20
- Es como ETH en Ethereum

### 2. MUSD Ya Existe en la Red
**Mezo Testnet:**
- MUSD Token: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`

**Protocolo MUSD (ya deployado):**
- BorrowerOperations: `0xCdF7028ceAB81fA0C6971208e83fa7872994beE5`
- TroveManager: `0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0`
- HintHelpers: `0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6`
- PriceFeed: `0x86bCF0841622a5dAC14A313a15f96A95421b9366`
- SortedTroves: `0x722E4D24FD6Ff8b0AC679450F3D91294607268fA`

## Cambios Realizados

### Contratos Actualizados

#### 1. `MezoIntegration.sol` ✅
**Antes:**
```solidity
// Usaba WBTC (ERC20)
IERC20 public immutable WBTC;
function depositAndMint(uint256 btcAmount) external
```

**Después:**
```solidity
// Acepta BTC nativo (payable)
function depositAndMintNative() external payable returns (uint256)
// BTC se envía con msg.value
```

**Cambios clave:**
- Eliminado: WBTC token, SafeERC20
- Agregado: `receive() external payable {}`
- Todas las funciones que reciben BTC son ahora `payable`
- Transferencias de BTC usan `call{value: amount}("")`

#### 2. `IndividualPool.sol` ✅
**Antes:**
```solidity
IERC20 public immutable WBTC;
function deposit(uint256 btcAmount) external
```

**Después:**
```solidity
// Solo MUSD token
IERC20 public immutable MUSD;
function deposit() external payable
```

**Constructor actualizado:**
```solidity
// Antes: 5 parámetros (incluía _wbtc)
// Después: 4 parámetros (sin _wbtc)
constructor(
    address _mezoIntegration,
    address _yieldAggregator,
    address _musd,  // Solo MUSD
    address _feeCollector
)
```

#### 3. `CooperativePool.sol` ✅
**Cambios idénticos a IndividualPool:**
- Eliminado WBTC
- `joinPool(uint256 poolId)` ahora es `payable`
- Constructor reducido de 5 a 4 parámetros

#### 4. `IMezoIntegration.sol` (Interface) ✅
**Simplificada - solo mantiene funciones esenciales:**
```solidity
function depositAndMintNative() external payable returns (uint256);
function depositAndMint(uint256) external returns (uint256); // Legacy, reverts
function burnAndWithdraw(uint256) external returns (uint256);
function getUserPosition(address) external view returns (uint256, uint256);
function getCollateralRatio(address) external view returns (uint256);
function isPositionHealthy(address) external view returns (bool);
```

### Scripts de Deployment Actualizados

#### 1. `01_DeployTokens.s.sol` ❌ ELIMINADO
- Ya no es necesario
- MUSD existe en Mezo
- BTC es nativo

#### 2. `02_DeployIntegrations.s.sol` ✅
**Cambios:**
```solidity
// Antes: 6 parámetros (incluía _wbtc)
MezoIntegration mezo = new MezoIntegration(
    wbtc,  // ❌ Eliminado
    musd,
    borrowerOperations,
    priceFeed,
    hintHelpers,
    troveManager
);

// Después: 5 parámetros
MezoIntegration mezo = new MezoIntegration(
    musd,
    borrowerOperations,
    priceFeed,
    hintHelpers,
    troveManager
);
```

**Variables de entorno actualizadas:**
```bash
# Eliminado
WBTC_ADDRESS  # Ya no existe

# Actualizado a nombres correctos
MUSD_ADDRESS=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
MEZO_BORROWER_OPERATIONS=0xCdF7028ceAB81fA0C6971208e83fa7872994beE5
MEZO_TROVE_MANAGER=0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0
MEZO_HINT_HELPERS=0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6
MEZO_PRICE_FEED=0x86bCF0841622a5dAC14A313a15f96A95421b9366
```

### Archivo `.env` Actualizado ✅
```bash
# MUSD Token (Native stablecoin on Mezo)
MUSD_ADDRESS=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503

# Mezo Protocol Contracts (Already deployed)
MEZO_BORROWER_OPERATIONS=0xCdF7028ceAB81fA0C6971208e83fa7872994beE5
MEZO_TROVE_MANAGER=0xE47c80e8c23f6B4A1aE41c34837a0599D5D16bb0
MEZO_HINT_HELPERS=0x4e4cBA3779d56386ED43631b4dCD6d8EacEcBCF6
MEZO_PRICE_FEED=0x86bCF0841622a5dAC14A313a15f96A95421b9366
MEZO_SORTED_TROVES=0x722E4D24FD6Ff8b0AC679450F3D91294607268fA
```

## Tareas Pendientes

### Tests y Mocks (En Progreso)
Los siguientes archivos necesitan actualizarse para coincidir con la nueva arquitectura:

1. **`test/mocks/MockMezoIntegration.sol`**
   - Eliminar funciones obsoletas que no están en la nueva interfaz
   - Remover `override` de funciones que ya no existen en interface

2. **`test/fuzz/IndividualPoolFuzz.t.sol`**
   - Cambiar `pool.deposit(amount)` → `pool.deposit{value: amount}()`
   - Actualizar constructor para 4 parámetros (sin WBTC)

3. **`test/integration/MatsnetIntegration.t.sol`**
   - Actualizar constructor de MezoIntegration (5 parámetros)
   - Eliminar referencias a `WBTC_TOKEN`

4. **`script/03_DeployPools.s.sol`**
   - Actualizar constructores de pools (4 parámetros)

### Frontend (Pendiente)

1. **`frontend/src/lib/web3/contracts.ts`**
   - Actualizar con direcciones reales de Mezo Testnet
   - Eliminar direcciones de WBTC
   - Agregar direcciones del protocolo MUSD

2. **`frontend/src/hooks/web3/use-individual-pool-data-real.ts`**
   - Cambiar `deposit` para usar transacciones payable
   - No requiere aprobación de WBTC

3. **`frontend/src/hooks/web3/use-pool-transactions.ts`**
   - Eliminar lógica de aprobación WBTC
   - Actualizar `useDepositToPool` para enviar BTC con `value`

## Flujo de Depósito Actualizado

### Antes (Incorrecto)
```
Usuario → Aprobar WBTC → Transferir WBTC → Pool → Mezo
```

### Después (Correcto)
```
Usuario → Enviar BTC nativo (msg.value) → Pool → Mezo
         (No aprobación necesaria)
```

## Ejemplo de Uso

### Smart Contract (Deposit)
```solidity
// Usuario deposita en IndividualPool
function deposit() external payable {
    // msg.value contiene el BTC nativo
    uint256 btcAmount = msg.value;
    
    // Enviar BTC a MezoIntegration
    uint256 musdAmount = MEZO_INTEGRATION.depositAndMintNative{value: btcAmount}();
    
    // Continuar con la lógica...
}
```

### Frontend (React/TypeScript)
```typescript
// Antes (Incorrecto)
await wbtc.approve(poolAddress, amount);
await pool.deposit(amount);

// Después (Correcto)
await pool.deposit({
  value: parseEther(amount) // BTC nativo con 18 decimals
});
```

## Comandos para Deployment

```bash
# 1. Compilar contratos
cd contracts
forge build

# 2. Deploy MezoIntegration + YieldAggregator
forge script script/02_DeployIntegrations.s.sol:DeployIntegrations \
  --rpc-url https://rpc.test.mezo.org \
  --broadcast \
  -vvv

# 3. Deploy Pools
forge script script/03_DeployPools.s.sol:DeployPools \
  --rpc-url https://rpc.test.mezo.org \
  --broadcast \
  -vvv
```

## Referencias

- **Mezo Docs**: https://mezo.org/docs
- **Chain ID**: 31611 (Testnet), 31612 (Mainnet)
- **RPC**: https://rpc.test.mezo.org
- **Explorer**: https://explorer.test.mezo.org
- **Faucet**: https://faucet.test.mezo.org

## Notas Importantes

1. **BTC tiene 18 decimals en Mezo**, no 8 como BTC real
2. **MUSD ya existe** - no deployar tokens mock
3. **Todos los contratos del protocolo MUSD ya están deployados** en testnet
4. **No usar `WBTC.approve()`** - BTC es nativo, se envía con `msg.value`
5. **Funciones que reciben BTC deben ser `payable`**
6. **Transfers de BTC usan `call{value: amount}("")`**, no `transfer()`

## Estado Actual

✅ **Completado:**
- Investigación de arquitectura Mezo
- Actualización de contratos core (MezoIntegration, IndividualPool, CooperativePool)
- Actualización de interfaces
- Actualización de scripts de deployment
- Actualización de `.env` con direcciones reales
- Documentación de cambios

⏳ **En Progreso:**
- Corrección de tests y mocks

📋 **Pendiente:**
- Actualización del frontend
- Testing end-to-end en Mezo Testnet
- Deployment a producción
