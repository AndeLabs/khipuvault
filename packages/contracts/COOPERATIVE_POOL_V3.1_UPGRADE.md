# CooperativePoolV3 - Upgrade to v3.1.0

## Overview

Esta actualización agrega la funcionalidad de **retiro parcial** (partial withdrawal) a los Cooperative Pools, permitiendo a los miembros retirar parte de su contribución sin tener que salir completamente del pool.

## Cambios Implementados

### Nueva Función: `withdrawPartial`

```solidity
function withdrawPartial(uint256 poolId, uint256 withdrawAmount)
    external
    nonReentrant
    noFlashLoan
```

**Funcionalidad:**

- Permite retirar una cantidad específica de BTC sin salir del pool
- Mantiene la membresía activa con el saldo restante
- Verifica que el saldo restante cumpla con la contribución mínima del pool
- Quema shares proporcionalmente al monto retirado
- Repaga mUSD proporcionalmente del YieldAggregator
- Retorna BTC al usuario

**Validaciones:**

- `withdrawAmount > 0` - No se permite retiro de 0
- `withdrawAmount < currentContribution` - No se puede retirar todo (use `leavePool`)
- `remainingContribution >= pool.minContribution` - El saldo restante debe cumplir con el mínimo del pool
- Usuario debe ser miembro activo del pool

**Ejemplo de Uso:**

```typescript
// Usuario tiene 0.01 BTC en el pool
// Quiere retirar 0.003 BTC
await cooperativePool.withdrawPartial(poolId, parseEther("0.003"));
// Resultado: Usuario ahora tiene 0.007 BTC en el pool
```

### Nuevo Evento: `PartialWithdrawal`

```solidity
event PartialWithdrawal(
    uint256 indexed poolId,
    address indexed member,
    uint256 btcAmount,
    uint256 remainingContribution,
    uint256 timestamp
);
```

**Emitido cuando:**

- Un miembro retira parcialmente su contribución

**Parámetros:**

- `poolId` - ID del pool
- `member` - Dirección del miembro
- `btcAmount` - Cantidad de BTC retirada
- `remainingContribution` - Saldo restante en el pool
- `timestamp` - Momento del retiro

## Funcionalidad Existente (Ya Disponible)

### `joinPool` - Agregar Más Contribución

La función `joinPool` **ya permite** agregar más BTC a tu contribución existente (líneas 259-274):

```solidity
if (!member.active) {
    // Primera vez que te unes
    member.btcContributed = uint128(btcAmount);
    // ...
} else {
    // Ya eres miembro - agrega más BTC
    uint256 newContribution = uint256(member.btcContributed) + btcAmount;
    member.btcContributed = uint128(newContribution);
    member.shares = uint128(newContribution);
}
```

**Uso:**

```typescript
// Ya tienes 0.009 BTC en el pool
// Quieres agregar 0.001 BTC más
await cooperativePool.joinPool(poolId, { value: parseEther("0.001") });
// Resultado: Ahora tienes 0.010 BTC en el pool
```

## Comparación de Funciones

| Función           | Propósito                | Mantiene Membresía | Retorna BTC | Retorna Yields |
| ----------------- | ------------------------ | ------------------ | ----------- | -------------- |
| `joinPool`        | Unirse o agregar más BTC | ✅                 | ❌          | ❌             |
| `withdrawPartial` | Retirar parte del BTC    | ✅                 | ✅ Parcial  | ❌             |
| `leavePool`       | Salir completamente      | ❌                 | ✅ Todo     | ✅             |
| `claimYield`      | Reclamar yields          | ✅                 | ❌          | ✅             |

## Actualización de Versión

- **Versión Anterior:** 3.0.0
- **Nueva Versión:** 3.1.0

## Próximos Pasos

### 1. Testing

Ejecutar tests del contrato:

```bash
cd /Users/munay/dev/KhipuVault/packages/contracts
forge test --match-contract CooperativePoolV3Test -vv
```

### 2. Deployment (UUPS Upgrade)

Como el contrato usa UUPS, se puede actualizar sin cambiar la dirección:

```solidity
// 1. Deploy nueva implementación
forge create src/pools/v3/CooperativePoolV3.sol:CooperativePoolV3 \
  --rpc-url $MEZO_RPC_URL \
  --private-key $PRIVATE_KEY

// 2. Llamar upgradeToAndCall en el proxy existente
cast send $PROXY_ADDRESS "upgradeToAndCall(address,bytes)" \
  $NEW_IMPLEMENTATION_ADDRESS 0x \
  --rpc-url $MEZO_RPC_URL \
  --private-key $OWNER_PRIVATE_KEY
```

### 3. Frontend Integration

Actualizar los hooks de React para usar la nueva función:

**Archivo:** `/Users/munay/dev/KhipuVault/apps/web/src/hooks/web3/use-cooperative-pool-v3.ts`

```typescript
const withdrawPartial = async (poolId: number, btcAmount: string) => {
  if (!address) {
    setError("Please connect your wallet");
    setState("error");
    return;
  }

  try {
    setState("idle");
    setError("");
    resetWrite();

    const amount = parseEther(btcAmount);

    console.log("💸 Partial withdrawal from pool:", poolId, "amount:", btcAmount, "BTC");
    setState("executing");

    write({
      address: poolAddress,
      abi: POOL_ABI,
      functionName: "withdrawPartial",
      args: [BigInt(poolId), amount],
    });
  } catch (err) {
    console.error("❌ Error:", err);
    setState("error");
    setError(err instanceof Error ? err.message : "Unknown error");
  }
};
```

### 4. Actualizar ABI en Frontend

Copiar el nuevo ABI compilado:

```bash
cp packages/contracts/out/CooperativePoolV3.sol/CooperativePoolV3.json \
   apps/web/src/contracts/abis/CooperativePoolV3.json
```

## Seguridad

✅ **Protecciones Implementadas:**

- `nonReentrant` - Protección contra reentrancy
- `noFlashLoan` - Protección contra flash loans (tx.origin check)
- Validación de montos mínimos
- Cálculo proporcional de shares
- Manejo seguro de transferencias de BTC

## Notas Técnicas

**Cálculo de Shares:**

```solidity
uint256 withdrawShare = (withdrawAmount * 1e18) / currentContribution;
uint256 sharesToBurn = (member.shares * withdrawShare) / 1e18;
```

**Ejemplo:**

- Contribución actual: 0.010 BTC (10_000_000_000_000_000 wei)
- Shares actuales: 10_000_000_000_000_000
- Retiro: 0.003 BTC (3_000_000_000_000_000 wei)
- withdrawShare: (3_000_000_000_000_000 \* 1e18) / 10_000_000_000_000_000 = 0.3e18 (30%)
- sharesToBurn: (10_000_000_000_000_000 \* 0.3e18) / 1e18 = 3_000_000_000_000_000
- Shares restantes: 7_000_000_000_000_000 (70%)

## Autor

KhipuVault Team
Fecha: 21 de Noviembre, 2025
