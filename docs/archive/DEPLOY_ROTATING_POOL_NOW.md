# 🚀 Deploy RotatingPool AHORA - Guía Rápida

## ✅ Lo que ya está listo:

1. ✅ Contrato RotatingPool compilado (860 líneas, production-ready)
2. ✅ Script de deployment creado (`DeployRotatingPool.s.sol`)
3. ✅ ABI generado y copiado al frontend (152KB)
4. ✅ Script de deployment ejecutable creado

## 🎯 3 Pasos para Deployar:

### Paso 1: Configurar Private Key (1 minuto)

```bash
cd packages/contracts

# Crear .env desde template
cp .env.example .env

# Editar y agregar tu private key
nano .env
```

En el archivo `.env`, agregar:

```bash
DEPLOYER_PRIVATE_KEY=tu_private_key_sin_0x
MEZO_TESTNET_RPC=https://rpc.test.mezo.org
```

⚠️ **IMPORTANTE**: La wallet debe tener fondos en Mezo testnet!

### Paso 2: Ejecutar Deployment (30 segundos)

```bash
# Opción A: Usando el script automatizado
./deploy-rotating-pool.sh

# Opción B: Comando manual
forge script script/DeployRotatingPool.s.sol \
  --rpc-url https://rpc.test.mezo.org \
  --broadcast \
  -vvvv
```

### Paso 3: Copiar Dirección del Output

El script mostrará:

```
=== DEPLOYMENT SUMMARY ===
RotatingPool: 0xABC123...  ← COPIA ESTA DIRECCIÓN
```

## 📝 Actualizar Frontend (2 archivos)

### Archivo 1: `apps/web/src/hooks/web3/rotating/use-rotating-pool.ts`

Línea 18:

```typescript
// ANTES
const ROTATING_POOL_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

// DESPUÉS (reemplaza con tu dirección)
const ROTATING_POOL_ADDRESS = "0xABC123..." as Address;
```

### Archivo 2: `apps/web/src/lib/web3/contracts.ts`

Buscar `rotatingPool`:

```typescript
// ANTES
rotatingPool: "0x0000000000000000000000000000000000000000",

// DESPUÉS (reemplaza con tu dirección)
rotatingPool: "0xABC123...",
```

## 🧪 Probar en UI

```bash
# Volver al root del proyecto
cd ../..

# Si pnpm dev está corriendo, reiniciarlo (Ctrl+C y luego):
pnpm dev

# Abrir navegador en:
# http://localhost:9002/dashboard/rotating-pool
```

## ✅ Verificar que Funciona:

1. **Contador de Pools**: Ya no debería mostrar "..."
2. **Botón "Create ROSCA"**: Debería funcionar
3. **Crear Pool de Prueba**:
   - Name: "Test ROSCA"
   - Members: 3
   - Contribution: 0.001 BTC
   - Period: 7 days
4. **Confirmar transacción** en wallet
5. **Verificar**: Pool aparece en "All ROSCAs" con status "Forming"

## 🔍 Block Explorer

Verificar deployment en:

```
https://explorer.test.mezo.org/address/0xTU_DIRECCION_AQUI
```

## 📊 Estado Actual del Proyecto:

```
├── ✅ Individual Savings    - 100% funcional (deployed)
├── ✅ Cooperative Savings    - 100% funcional (deployed)
├── ⏳ Rotating Pool (ROSCA)  - 98% listo (solo falta deploy)
└── ✅ Lottery Pool           - 100% funcional (deployed)
```

## 🎯 Después del Deployment:

### Estadísticas que cambiarán:

**ANTES:**

```
Total ROSCAs: ...
My ROSCAs: 0
Total Yields: 0.000 BTC
```

**DESPUÉS (con pools creados):**

```
Total ROSCAs: 1
My ROSCAs: 1
Status: Forming
Members: 3/3
```

## 🐛 Troubleshooting

### Error: "insufficient funds"

- Tu wallet necesita ETH/gas en Mezo testnet
- Usa faucet: https://faucet.mezo.org

### Error: "Invalid address"

- Verifica que copiaste la dirección completa (0x...)
- Debe empezar con `0x` y tener 42 caracteres

### Error: "Contract not deployed"

- Verifica en block explorer que la transacción se confirmó
- Espera ~30 segundos para confirmación

### Pool no carga en UI

- Reinicia `pnpm dev`
- Verifica que actualizaste AMBOS archivos del frontend
- Revisa consola del navegador (F12) para errores

## 📞 Comandos Útiles

```bash
# Ver deployment en tiempo real
tail -f packages/contracts/broadcast/DeployRotatingPool.s.sol/31611/run-latest.json

# Verificar compilación
forge build --contracts src/pools/v3/RotatingPool.sol

# Ver estado del contrato después de deploy
cast call 0xTU_DIRECCION poolCounter --rpc-url https://rpc.test.mezo.org
```

## 🎉 ¡Listo!

Una vez completado, tendrás:

- ✅ RotatingPool desplegado en Mezo testnet
- ✅ Frontend conectado al contrato
- ✅ UI 100% funcional
- ✅ Listo para crear y unirse a ROSCAs

---

**Total time: ~5 minutos** ⏱️

¿Listo para deployar? ¡Vamos! 🚀
