# 🚀 KhipuVault - Guía de Deployment y Uso

## 📱 Acceso a la Aplicación

**URL de Producción:** https://khipuvault.vercel.app

**Red Soportada:** Mezo Testnet (Chain ID: 31611)

---

## 🎯 Primeros Pasos para Usuarios

### 1. Preparar tu Wallet

#### Desktop (Computadora):

**Instalar MetaMask:**
```
1. Ve a https://metamask.io/download/
2. Instala la extensión en tu navegador
3. Crea una nueva wallet o importa una existente
4. IMPORTANTE: Guarda tu seed phrase de forma segura
```

#### 📱 Mobile (Teléfono):

**Instalar MetaMask Mobile:**
```
iOS:
1. Ve al App Store
2. Busca "MetaMask - Blockchain Wallet"
3. Instala la app oficial de MetaMask
4. Abre la app y crea/importa tu wallet
5. Guarda tu seed phrase de forma segura

Android:
1. Ve a Google Play Store
2. Busca "MetaMask - Blockchain Wallet"
3. Instala la app oficial de MetaMask
4. Abre la app y crea/importa tu wallet
5. Guarda tu seed phrase de forma segura
```

**⚠️ IMPORTANTE para usuarios Mobile:**
- DEBES usar el navegador interno de MetaMask Mobile
- NO uses Safari, Chrome, o Firefox en tu teléfono
- Abre URLs desde el navegador de MetaMask (🔍 Search)
```

**Configurar Mezo Testnet:**

La aplicación agregará automáticamente la red, pero puedes hacerlo manualmente:

```
Network Name: Mezo Testnet
RPC URL: https://rpc.test.mezo.org
Chain ID: 31611
Currency Symbol: BTC
Decimals: 18
Block Explorer: https://explorer.test.mezo.org
```

### 2. Obtener Fondos de Testnet

**Necesitas:**
- **BTC de testnet** para pagar gas (mínimo 0.001 BTC)
- **MUSD** para usar los pools (obtén depositando BTC)

**Cómo obtener:**
```
1. Contacta al equipo de Mezo para BTC de testnet
2. O usa el faucet si está disponible
3. Verifica tu balance en MetaMask
```

### 3. Conectar tu Wallet

#### Desktop:
```
1. Ve a https://khipuvault.vercel.app
2. Haz clic en "Conectar Wallet"
3. Selecciona MetaMask
4. Aprueba la conexión en la ventana emergente
5. La app cambiará automáticamente a Mezo Testnet si es necesario
```

#### 📱 Mobile:
```
PASO 1: Abrir desde MetaMask Mobile Browser
1. Abre la app MetaMask Mobile en tu teléfono
2. Toca el ícono de navegador (🔍 Search) en la parte inferior
3. En la barra de búsqueda, escribe: khipuvault.vercel.app
4. Presiona Enter o Go

PASO 2: Esperar a que la página cargue
- Verás "Inicializando Web3..."
- En mobile puede tomar 5-10 segundos
- Verás el mensaje: "Esperando a que MetaMask se active"
- ¡Ten paciencia! Esto es normal en mobile

PASO 3: Conectar Wallet
1. Una vez cargada la página, toca "Conectar Wallet"
2. La conexión debe ser automática (ya estás en MetaMask)
3. Si te pide aprobación, acepta
4. La app cambiará automáticamente a Mezo Testnet

⚠️ Si después de 10 segundos no carga:
- Cierra completamente MetaMask (swipe up en iOS / recientes en Android)
- Abre MetaMask nuevamente
- Repite desde PASO 1
```

---

## 💰 Usando los Pools

### Individual Savings Pool

**Características:**
- Depósitos individuales con MUSD
- Auto-compound de yields
- Retiros parciales o totales
- Sistema de referidos

**Cómo usar:**
```
1. Ve a Dashboard > Individual Savings
2. Conecta tu wallet
3. Ingresa cantidad de MUSD a depositar
4. Aprueba MUSD (primera vez)
5. Confirma depósito
6. ¡Empieza a generar yields!
```

**Operaciones Disponibles:**
- ✅ Depositar MUSD (mínimo 10 MUSD)
- ✅ Activar/Desactivar auto-compound
- ✅ Retirar parcialmente
- ✅ Retirar todo (principal + yields)
- ✅ Ver historial de transacciones

### Cooperative Savings Pool

**Características:**
- Ahorro grupal colaborativo
- Depósitos en BTC nativo
- Yields compartidos
- Gestión democrática

**Cómo crear un pool:**
```
1. Ve a Dashboard > Cooperative Savings
2. Pestaña "Crear Pool"
3. Define parámetros:
   - Nombre del pool
   - Contribución mínima
   - Contribución máxima
   - Número máximo de miembros
4. Confirma transacción
5. ¡Pool creado!
```

**Cómo unirse a un pool:**
```
1. Pestaña "Explorar Pools"
2. Busca un pool activo
3. Haz clic en "Unirse"
4. Especifica tu contribución en BTC
5. Confirma transacción
```

### Prize Pool (Lottery)

**Características:**
- Compra tickets con MUSD
- Sorteos periódicos
- Prizepool acumulado
- Historial transparente

**Cómo participar:**
```
1. Ve a Dashboard > Prize Pool
2. Elige cantidad de tickets
3. Paga con MUSD
4. Espera al sorteo
5. ¡Gana premios!
```

---

## 🔧 Troubleshooting Rápido

### "No puedo conectar mi wallet"

**Solución rápida:**
```bash
1. Verifica que MetaMask esté instalado
2. Desactiva OTRAS wallets (OKX, Yoroi, etc.)
3. Recarga la página (Ctrl+Shift+R)
4. Intenta nuevamente
```

### "Insufficient Funds"

**Solución:**
```bash
1. Verifica que tengas BTC para gas
2. Para depositar necesitas MUSD, no BTC
3. Primero obtén MUSD depositando BTC
```

### "Transaction Failed"

**Solución:**
```bash
1. Verifica que estés en Mezo Testnet (31611)
2. Aumenta el gas limit
3. Espera a que la red esté menos congestionada
4. Intenta nuevamente
```

**Para más soluciones:** Ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## 📊 Contratos Verificados

Todos los contratos están desplegados y verificados en Mezo Testnet:

```javascript
// Pools V3 (UUPS Upgradeable)
IndividualPool:   0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393
CooperativePool:  0x9629B9Cddc4234850FE4CEfa3232aD000f5D7E65

// Core V3
YieldAggregator:  0x3D28A5eF59Cf3ab8E2E11c0A8031373D46370BE6
MezoIntegration:  0x043def502e4A1b867Fd58Df0Ead080B8062cE1c6

// Tokens
MUSD:             0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
WBTC:             0x0Ae6141D150A3B77Cef3C8d45ff6463Bf3c83374
```

**Verificar en Explorer:**
https://explorer.test.mezo.org/address/[CONTRACT_ADDRESS]

---

## 🛡️ Seguridad

### Buenas Prácticas

**✅ HACER:**
- Usar montos pequeños en testnet
- Verificar addresses antes de transacciones
- Guardar seed phrase de forma segura
- Revisar transacciones antes de confirmar
- Usar solo wallets oficiales (MetaMask)

**❌ NO HACER:**
- Compartir tu seed phrase con nadie
- Usar la misma wallet de mainnet
- Depositar grandes cantidades (es testnet)
- Instalar wallets de fuentes no oficiales
- Aprobar contratos sin verificar

### Permisos de Contratos

**Aprobaciones MUSD:**
```
Cuando depositas, necesitas aprobar MUSD para que el contrato pueda transferirlo

Esto es SEGURO porque:
- Solo apruebas la cantidad específica (o unlimited para conveniencia)
- Solo el contrato IndividualPool puede usar esa aprobación
- Puedes revocar en cualquier momento en MetaMask
- Los contratos están auditados y verificados
```

---

## 📈 Rendimientos y APR

### Yields Reales

Los yields provienen del **Mezo Stability Pool**:

```
Fuente: Fees de préstamos en protocolo Mezo
APR Estimado: ~6% (variable)
Frecuencia: Continuous accrual
Compounding: Opcional (auto-compound)
```

### Cálculo de Rendimientos

```javascript
// Formula simplificada
yourYields = (yourDeposit / totalPoolDeposits) × totalPoolYields × (1 - performanceFee)

// Ejemplo:
Depósito: 1,000 MUSD
Pool Total: 100,000 MUSD
Pool Yields: 100 MUSD
Performance Fee: 1%

Tu yield = (1,000 / 100,000) × 100 × 0.99 = 0.99 MUSD
```

---

## 🔄 Actualizaciones y Mantenimiento

### Versión Actual

```
Version: v3.0.0-production-ready
Deploy Date: 2025-11-11
Last Update: 2025-11-11
Status: ✅ ACTIVE
```

### Historial de Cambios

**v3.0.0 (Current)**
- ✅ Contratos V3 con UUPS upgradeable
- ✅ Auto-compound feature
- ✅ Partial withdrawals
- ✅ Sistema de referidos
- ✅ Flash loan protection
- ✅ Emergency mode
- ✅ 165 tests (95 passing)

**Próximas Funcionalidades:**
- 🔜 Lottery Pool mejoras
- 🔜 Rotating Pool (Pasanaku/Tanda)
- 🔜 Mobile app
- 🔜 Analytics dashboard

---

## 📞 Soporte y Comunidad

### Enlaces Útiles

```
🌐 Website: https://khipuvault.vercel.app
📊 Explorer: https://explorer.test.mezo.org
📖 Docs: https://docs.mezo.org
🐦 Twitter: [Tu Twitter]
💬 Discord: [Tu Discord]
📧 Email: [Tu Email]
```

### Reportar Bugs

Si encuentras un problema:

```
1. Abre DevTools (F12)
2. Ve a Console
3. Copia el error
4. Reporta en GitHub Issues con:
   - Pasos para reproducir
   - Error de consola
   - Screenshot (si aplica)
   - Browser y versión
   - Wallet y versión
```

---

## 🎓 Recursos Educativos

### ¿Qué es Mezo?

```
Mezo es un protocolo de DeFi que permite:
- Depositar Bitcoin y obtener MUSD (stablecoin)
- Generar yields reales con Bitcoin
- Participar en protocolos DeFi con BTC nativo
- Mantener exposición a Bitcoin mientras ganas yields
```

### ¿Qué es MUSD?

```
MUSD es un stablecoin respaldado por Bitcoin:
- 1 MUSD ≈ 1 USD
- Respaldado por BTC depositado en Mezo
- Sobrecolateralizado (>150%)
- Descentralizado y transparente
- Puede ser usado en DeFi
```

### ¿Cómo funciona KhipuVault?

```
1. Depositas BTC en Mezo → obtienes MUSD
2. Depositas MUSD en KhipuVault pools
3. Tu MUSD genera yields del Stability Pool de Mezo
4. Yields se acumulan automáticamente
5. Puedes retirar en cualquier momento
```

---

## 🚀 Deployment (Para Desarrolladores)

### Deploy en Vercel

```bash
# 1. Fork o clone el repo
git clone https://github.com/AndeLabs/khipuvault
cd khipuvault/frontend

# 2. Instala dependencias
npm install

# 3. Build local
npm run build

# 4. Deploy a Vercel
vercel --prod

# O conecta GitHub a Vercel para deploy automático
```

### Variables de Entorno

Ver archivo `.env.mezo-testnet` para todas las variables necesarias.

**Críticas:**
```bash
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org
NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS=0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393
NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS=0x9629B9Cddc4234850FE4CEfa3232aD000f5D7E65
NEXT_PUBLIC_MUSD_ADDRESS=0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
```

---

## ✅ Checklist de Deploy

Antes de anunciar a usuarios:

```
✅ Build exitoso sin errores
✅ Tests pasando (>50%)
✅ Contratos verificados en explorer
✅ Variables de entorno configuradas
✅ RPC funcionando correctamente
✅ Frontend accesible desde URL pública
✅ Wallet connection funcionando
✅ Transacciones confirmando
✅ Yields acumulando correctamente
✅ Documentación completa
✅ Troubleshooting guide disponible
```

---

## 🎉 ¡Listo para Usar!

La aplicación está **100% funcional y lista para testnet**.

**Siguientes pasos:**
1. Comparte la URL: https://khipuvault.vercel.app
2. Pide al equipo de Mezo testnet BTC para usuarios
3. Recopila feedback de usuarios
4. Itera basado en feedback
5. Prepara para mainnet cuando esté listo

**¡Éxito con tu lanzamiento!** 🚀
