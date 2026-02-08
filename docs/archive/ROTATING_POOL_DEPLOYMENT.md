# RotatingPool (ROSCA) - Manual Deployment Guide

Este documento te guía paso a paso para desplegar el contrato RotatingPool en Mezo testnet.

## 📋 Pre-requisitos

- [ ] Wallet con fondos en Mezo testnet
- [ ] Private key del deployer wallet
- [ ] Foundry instalado (`forge --version`)

## 🎯 Paso 1: Configurar Variables de Entorno

```bash
cd packages/contracts

# Crear archivo .env desde el ejemplo
cp .env.example .env

# Editar .env y agregar tu private key
nano .env  # o usa tu editor preferido
```

En `.env`:

```bash
DEPLOYER_PRIVATE_KEY=tu_private_key_aqui_sin_0x
MEZO_TESTNET_RPC=https://rpc.test.mezo.org
```

⚠️ **IMPORTANTE**: Nunca commitees el archivo `.env` al repositorio!

## 🔨 Paso 2: Compilar Contratos

```bash
# Limpiar compilaciones anteriores
forge clean

# Compilar todos los contratos
forge build

# Verificar que RotatingPool compiló correctamente
ls -la out/RotatingPool.sol/
```

Deberías ver:

```
RotatingPool.json  # ABI y bytecode
```

## 🧪 Paso 3: Ejecutar Tests (Opcional pero Recomendado)

```bash
# Ejecutar todos los tests
forge test

# Solo tests de RotatingPool (si existen)
forge test --match-contract RotatingPool

# Con verbosidad para ver detalles
forge test -vvv
```

## 🚀 Paso 4: Desplegar en Mezo Testnet

```bash
# Ejecutar script de deployment
forge script script/DeployRotatingPool.s.sol \
  --rpc-url $MEZO_TESTNET_RPC \
  --broadcast \
  --verify \
  -vvvv

# Si falla la verificación, puedes deployar sin ella
forge script script/DeployRotatingPool.s.sol \
  --rpc-url $MEZO_TESTNET_RPC \
  --broadcast \
  -vvvv
```

## 📝 Paso 5: Copiar Dirección del Contrato

El script mostrará algo como:

```
=== DEPLOYMENT SUMMARY ===
RotatingPool: 0xYourContractAddressHere

=== FRONTEND CONFIGURATION ===
Update the following in your frontend:

// apps/web/src/hooks/web3/rotating/use-rotating-pool.ts
const ROTATING_POOL_ADDRESS = "0xYourContractAddressHere" as Address;
```

**Copia esta dirección** - la necesitarás para el siguiente paso.

## 🔧 Paso 6: Actualizar Frontend

### 6.1 Actualizar Hook de React

```bash
# Abrir archivo del hook
code apps/web/src/hooks/web3/rotating/use-rotating-pool.ts
```

Reemplazar la línea 18:

```typescript
// ANTES
const ROTATING_POOL_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

// DESPUES
const ROTATING_POOL_ADDRESS = "0xYourContractAddressHere" as Address;
```

### 6.2 Actualizar Archivo de Contratos

```bash
# Abrir archivo de contratos
code apps/web/src/lib/web3/contracts.ts
```

Buscar la sección de `rotatingPool` y actualizar:

```typescript
// ANTES
rotatingPool: "0x0000000000000000000000000000000000000000",

// DESPUES
rotatingPool: "0xYourContractAddressHere",
```

## 📦 Paso 7: Generar y Copiar ABI

```bash
# Desde el directorio raíz del proyecto
cd packages/contracts

# Copiar ABI compilado al frontend
cp out/RotatingPool.sol/RotatingPool.json \
   ../../apps/web/src/contracts/abis/RotatingPool.json

# Verificar que se copió correctamente
ls -la ../../apps/web/src/contracts/abis/RotatingPool.json
```

## 🎨 Paso 8: Verificar Frontend

```bash
# Volver al directorio raíz
cd ../../

# Reiniciar el servidor de desarrollo (si está corriendo)
# Presiona Ctrl+C en la terminal donde corre pnpm dev, luego:
pnpm dev
```

Abrir el navegador en:

```
http://localhost:9002/dashboard/rotating-pool
```

## ✅ Paso 9: Probar Funcionalidad

### 9.1 Verificar que Carga

- La página no debería mostrar "0x0000..." como dirección
- El contador de pools debería cargar (puede ser 0 si no hay pools)

### 9.2 Crear Pool de Prueba

1. Click en "Create ROSCA"
2. Llenar formulario:
   - Name: "Test ROSCA"
   - Members: 3-5
   - Contribution: 0.001 BTC
   - Period: 7 days
3. Confirmar transacción en tu wallet
4. Esperar confirmación (~10-30 segundos en testnet)

### 9.3 Verificar Creación

- El pool debería aparecer en la lista "All ROSCAs"
- Status: "Forming"
- Pool counter debería incrementar

## 🔍 Troubleshooting

### Error: "Invalid address"

- Verifica que actualizaste correctamente la dirección en ambos archivos
- Asegúrate de que la dirección empieza con `0x`

### Error: "Contract not deployed"

- Verifica en block explorer de Mezo que el contrato se desplegó
- URL: https://explorer.test.mezo.org/address/0xYourContractAddressHere

### Error: "ABI mismatch"

- Regenera el ABI:

```bash
cd packages/contracts
forge build --force
cp out/RotatingPool.sol/RotatingPool.json ../../apps/web/src/contracts/abis/
```

### Pool no aparece en UI

- Verifica que el wallet esté conectado
- Revisa la consola del navegador (F12) para errores
- Verifica que el RPC de Mezo funcione

## 📊 Verificación en Block Explorer

Visita:

```
https://explorer.test.mezo.org/address/0xYourContractAddressHere
```

Deberías ver:

- Contract creation transaction
- Contract bytecode
- Si verificaste: Source code

## 🎉 ¡Éxito!

Si completaste todos los pasos, deberías tener:

- ✅ Contrato desplegado en Mezo testnet
- ✅ Frontend actualizado con la dirección correcta
- ✅ ABI copiado al frontend
- ✅ Funcionalidad de crear pools trabajando

## 📸 Screenshots Esperados

### Antes del Deployment

```
Total ROSCAs: ...
My ROSCAs: 0
Total Yields: 0.000 BTC
```

### Después de Crear un Pool

```
Total ROSCAs: 1
Status: Forming
Members: 3 members
Contribution: 0.001 BTC
Period: Every 7 days
```

## 🚀 Próximos Pasos

Ahora puedes:

1. Invitar amigos a unirse al pool (share pool ID)
2. Hacer contribuciones cuando el pool esté activo
3. Recibir payouts en tu turno
4. Ganar yields de DeFi mientras esperas

## 📞 Support

Si encuentras problemas:

1. Revisa los logs en consola del navegador (F12)
2. Verifica transacciones en block explorer
3. Revisa que todas las direcciones estén correctas

---

**Happy ROSCAing! 🎊**
