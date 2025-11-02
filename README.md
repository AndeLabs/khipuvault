   Creating an optimized production build ...
Failed to compile.
./src/app/dashboard/settings/layout.tsx
Module not found: Can't resolve '../../lib/utils'
https://nextjs.org/docs/messages/module-not-found
./src/app/dashboard/settings/layout.tsx
Module not found: Can't resolve '../../components/animate-on-scroll'
https://nextjs.org/docs/messages/module-not-found
./src/components/ui/button.tsx
Module not found: Can't resolve '../lib/utils'
# KhipuVault

A decentralized Bitcoin savings platform built on Mezo, offering multiple savings strategies with automatic yield optimization through MUSD integration.

## Overview

KhipuVault provides multiple savings pools designed to meet different financial goals and risk preferences, all powered by MUSD (Mezo's Bitcoin-backed stablecoin):

- **Individual Pool**: Personal savings with auto-yield optimization ✅ DEPLOYED
- **Cooperative Pool**: Community pooled savings with shared rewards ✅ DEPLOYED
- **Lottery Pool**: Prize-based savings with no-loss lottery mechanics (Coming Soon)
- **Rotating Pool**: Turn-based distribution system (ROSCA/Pasanaku) (Coming Soon)

## Features

- 🪙 **MUSD-First**: Uses MUSD, the Bitcoin-backed stablecoin from Mezo
- ⚡ **Yield Optimization**: Automatic routing to best yield strategies
- 🔗 **Simple Integration**: Standard EVM wallet connection (MetaMask, WalletConnect)
- 🛡️ **Security First**: Comprehensive testing and production-ready contracts
- 🌐 **Mezo Testnet**: Deployed and functional on Chain ID 31611

## Architecture

### Smart Contracts
- **MezoIntegration**: Manages BTC deposits and MUSD minting
- **YieldAggregator**: Routes deposits to optimal yield strategies
- **Savings Pools**: Four specialized pool contracts for different strategies
- **Governance**: Fee collection and parameter management

### Frontend
- **Next.js 15**: Modern React framework with App Router
- **Mezo Passport**: Integrated wallet connection
- **Wagmi + RainbowKit**: Web3 connectivity and wallet management
- **Tailwind CSS**: Responsive, accessible design system

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Foundry for smart contract development
- Git for version control

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AndeLabs/khipuvault.git
cd khipuvault
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd frontend && npm install

# Install contract dependencies
cd ../contracts && forge install
```

3. Set up environment variables:
```bash
# Copy environment template
cp frontend/.env.mezo-testnet frontend/.env.local

# Edit with your configuration
nano frontend/.env.local
```

4. Start development server:
```bash
cd frontend && npm run dev
```

## Smart Contracts (Mezo Testnet - Chain ID: 31611)

### 🏦 Savings Pools

#### IndividualPool (`0x6028E4452e6059e797832578D70dBdf63317538a`)
**Ahorro personal con optimización automática de rendimientos**
- Deposita MUSD y gana yields automáticamente
- Retira en cualquier momento sin penalización
- Yields optimizados a través de estrategias DeFi
- Performance fee: 1% sobre yields generados
- **Status**: ✅ FUNCIONAL (200 MUSD depositados)

**Funciones principales:**
- `deposit(uint256 musdAmount)` - Depositar MUSD
- `withdraw(uint256 musdAmount)` - Retirar MUSD + yields
- `claimYield()` - Reclamar solo yields
- `userDeposits(address)` - Ver tu depósito actual

#### CooperativePool (`0x92eCA935773b71efB655cc7d3aB77ee23c088A7a`)
**Ahorro comunitario con rendimientos compartidos**
- Crea o únete a pools cooperativos
- Rendimientos se distribuyen equitativamente entre miembros
- Gobernanza simple por votación
- Ideal para grupos de ahorro (ROSCAs/Pasanakus digitales)
- **Status**: ✅ FUNCIONAL (listo para crear pools)

**Funciones principales:**
- `createPool(string name, uint256 minContribution)` - Crear pool
- `joinPool(uint256 poolId)` - Unirse a un pool (enviar BTC)
- `leavePool(uint256 poolId)` - Salir de un pool
- `claimYield(uint256 poolId)` - Reclamar yields

### 🔧 Core Integration

#### MezoIntegration (`0xa19B54b8b3f36F047E1f755c16F423143585cc6B`)
**Integración con protocolo Mezo para gestión de BTC y MUSD**
- Gestiona depósitos de BTC nativo
- Minting/burning de MUSD
- Interacción con Trove Manager de Mezo
- Control de ratios de colateralización
- **Status**: ✅ FUNCIONAL

#### YieldAggregator (`0x5BDac57B68f2Bc215340e4Dc2240f30154f4A007`)
**Router inteligente de yields**
- Enruta depósitos a las mejores estrategias
- Actualmente integrado con Mezo Stability Pool
- Optimización automática de rendimientos
- Distribución de yields entre pools
- **Status**: ✅ FUNCIONAL

### 💰 Tokens

#### MUSD (`0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`)
**Stablecoin oficial de Mezo respaldado por Bitcoin**
- ERC20 estándar con 18 decimales
- 1 MUSD ≈ 1 USD
- Respaldado por BTC depositado en Mezo
- Genera yields en Stability Pool
- **Status**: ✅ PRODUCCIÓN (token oficial de Mezo)

**Cómo obtener MUSD:**
1. Visita [mezo.org](https://mezo.org)
2. Deposita BTC
3. Minta MUSD
4. Usa MUSD en KhipuVault

### 📊 Verificación de Contratos

Todos los contratos pueden ser verificados en el Mezo Explorer:
- **Explorer**: https://explorer.mezo.org
- **RPC**: https://rpc.test.mezo.org
- **Chain ID**: 31611

**Verificación manual con Foundry:**
```bash
# Ver total depositado en IndividualPool
cast call 0x6028E4452e6059e797832578D70dBdf63317538a \
  "totalMusdDeposited()(uint256)" \
  --rpc-url https://rpc.test.mezo.org

# Ver pools en CooperativePool
cast call 0x92eCA935773b71efB655cc7d3aB77ee23c088A7a \
  "poolCounter()(uint256)" \
  --rpc-url https://rpc.test.mezo.org
```

## 🚀 Cómo Usar KhipuVault

### Paso 1: Configurar Wallet
Agrega Mezo Testnet a tu MetaMask:
- **Network Name**: Mezo Testnet
- **RPC URL**: `https://rpc.test.mezo.org`
- **Chain ID**: `31611`
- **Currency**: BTC
- **Explorer**: `https://explorer.mezo.org`

### Paso 2: Obtener MUSD
1. Visita [mezo.org](https://mezo.org)
2. Deposita BTC (puedes obtener BTC de testnet en un faucet)
3. Minta MUSD (stablecoin respaldado por Bitcoin)

### Paso 3: Conectar a KhipuVault
1. Ve a [khipuvault.vercel.app](https://khipuvault.vercel.app)
2. Click en "Connect Wallet"
3. Selecciona MetaMask
4. Asegúrate de estar en Mezo Testnet

### Paso 4: Depositar en un Pool

#### Opción A: Individual Savings Pool
1. Ve a Dashboard > Individual Savings
2. Ingresa cantidad de MUSD
3. Click "Aprobar MUSD" (solo primera vez)
4. Click "Depositar"
5. Confirma transacción en MetaMask
6. ✅ ¡Listo! Tus yields comienzan a acumularse automáticamente

#### Opción B: Cooperative Pool
1. Ve a Dashboard > Cooperative Savings
2. Opción 1: Crear tu propio pool
   - Click "Create Pool"
   - Define nombre y contribución mínima
   - Invita a otros usuarios
3. Opción 2: Unirse a pool existente
   - Explora pools disponibles
   - Click "Join Pool"
   - Envía BTC según contribución requerida

### Paso 5: Gestionar tus Ahorros
- **Ver yields**: Dashboard muestra rendimientos en tiempo real
- **Reclamar yields**: Click "Claim Yields" para recibir ganancias
- **Retirar**: Click "Withdraw" para sacar tu MUSD + yields
- **Sin penalización**: Retira cuando quieras, no hay lock-up period

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Security

- All contracts include comprehensive testing
- Reentrancy protection on all external calls
- Pausable functionality for emergency stops
- Multi-signature governance for critical operations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links Importantes

- **App**: [khipuvault.vercel.app](https://khipuvault.vercel.app)
- **Mezo Testnet Explorer**: [explorer.mezo.org](https://explorer.mezo.org)
- **Obtener MUSD**: [mezo.org](https://mezo.org)
- **Documentación Técnica**: [docs/](docs/)

## 📈 Rendimientos Actuales

- **Individual Pool APR**: ~6.2% (vía Mezo Stability Pool)
- **Performance Fee**: 1% sobre yields generados
- **Yields en**: MUSD
- **Actualización**: Automática cada 24 horas

## 🛠️ Para Desarrolladores

### Testing Local
```bash
# Clonar repositorio
git clone https://github.com/AndeLabs/khipuvault.git
cd khipuvault

# Frontend
cd frontend
npm install
npm run dev

# Contratos
cd contracts
forge install
forge build
forge test
```

### Interactuar con Contratos
```bash
# Ver depósito de un usuario
cast call 0x6028E4452e6059e797832578D70dBdf63317538a \
  "userDeposits(address)(uint256,uint256,uint256,uint256,bool)" \
  YOUR_WALLET_ADDRESS \
  --rpc-url https://rpc.test.mezo.org

# Depositar MUSD (necesitas aprobar primero)
cast send 0x6028E4452e6059e797832578D70dBdf63317538a \
  "deposit(uint256)" 1000000000000000000 \
  --rpc-url https://rpc.test.mezo.org \
  --private-key YOUR_PRIVATE_KEY
```

## 📞 Support

Para preguntas y soporte:
- GitHub Issues: [github.com/AndeLabs/khipuvault/issues](https://github.com/AndeLabs/khipuvault/issues)
- Discord: [Próximamente]

## ⚠️ Disclaimer

KhipuVault está actualmente en **Mezo Testnet**. Los fondos son para testing únicamente. No uses fondos reales. El proyecto está en desarrollo activo y puede contener bugs.

---

Construido con ❤️ para la comunidad Bitcoin en Mezo
