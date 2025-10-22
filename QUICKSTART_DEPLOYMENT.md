# 🚀 KhipuVault - Guía Rápida de Deployment

**Tiempo estimado:** 2-3 horas  
**Objetivo:** Deploy completo en Mezo Testnet + Frontend en Vercel

---

## 📋 **PRERREQUISITOS**

Antes de comenzar, asegúrate de tener:

- [ ] Node.js 20+
- [ ] Foundry instalado (`foundryup`)
- [ ] Wallet con testnet BTC en Mezo Testnet
- [ ] Cuenta en Vercel
- [ ] Cuenta en WalletConnect Cloud (para Project ID)
- [ ] GitHub repository con el código

---

## ⚡ **PASO 1: Deploy de Contratos (30 min)**

### 1.1. Configurar Environment Variables

```bash
cd KhipuVault/contracts
cp .env.example .env
```

Edita `.env` con tus valores:

```bash
# Mezo Testnet
MEZO_RPC_URL=https://rpc.test.mezo.org
MEZO_CHAIN_ID=31611

# Tu Wallet
DEPLOYER_PRIVATE_KEY=0xTU_PRIVATE_KEY_AQUI
FEE_COLLECTOR_ADDRESS=0xTU_ADDRESS_AQUI

# Etherscan (opcional, para verificación)
ETHERSCAN_API_KEY=tu_api_key

# Chainlink VRF (para LotteryPool)
VRF_COORDINATOR_ADDRESS=0x... # Buscar en docs de Mezo
VRF_KEY_HASH=0x...
VRF_SUBSCRIPTION_ID=0
```

### 1.2. Compilar y Testear

```bash
# Instalar dependencias
forge install

# Compilar contratos
forge build

# Correr tests
forge test -vv
```

**Esperado:** Todos los contratos compilan, mínimo 80% de tests pasan.

### 1.3. Deploy a Mezo Testnet

```bash
# Opción 1: Deploy completo (tokens + integrations + pools)
make deploy-mezotestnet-all

# Opción 2: Deploy paso a paso
make deploy-mezotestnet-integrations
make deploy-mezotestnet-pools
```

### 1.4. Guardar Direcciones

```bash
# Ver direcciones desplegadas
cat deployments/pools-31611.json

# Copiar estas direcciones - las necesitarás para el frontend
```

**Ejemplo de output:**
```json
{
  "individualPool": "0x...",
  "cooperativePool": "0x...",
  "lotteryPool": "0x...",
  "rotatingPool": "0x...",
  "mezoIntegration": "0x...",
  "yieldAggregator": "0x...",
  "wbtc": "0x...",
  "musd": "0x..."
}
```

---

## ⚡ **PASO 2: Configurar Frontend (60 min)**

### 2.1. Instalar Dependencias Web3

```bash
cd ../frontend

# Instalar Mezo Passport y dependencias Web3
npm install @mezo-org/passport @rainbow-me/rainbowkit wagmi viem@2.x @tanstack/react-query @wagmi/core --legacy-peer-deps
```

### 2.2. Crear Archivos de Configuración Web3

#### Crear: `src/lib/web3/chains.ts`

```typescript
import { Chain } from 'viem'

export const mezoTestnet: Chain = {
  id: 31611,
  name: 'Mezo Testnet',
  network: 'mezo-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Bitcoin',
    symbol: 'BTC',
  },
  rpcUrls: {
    default: { http: ['https://rpc.test.mezo.org'] },
    public: { http: ['https://rpc.test.mezo.org'] },
  },
  blockExplorers: {
    default: { 
      name: 'Mezo Explorer', 
      url: 'https://explorer.test.mezo.org' 
    },
  },
  testnet: true,
}
```

#### Crear: `src/lib/web3/wagmi-config.ts`

```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { mezoTestnet } from './chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'KhipuVault',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [mezoTestnet],
  ssr: true,
})
```

#### Crear: `src/contracts/addresses.ts`

```typescript
export const CONTRACT_ADDRESSES = {
  WBTC: process.env.NEXT_PUBLIC_WBTC_ADDRESS as `0x${string}`,
  MUSD: process.env.NEXT_PUBLIC_MUSD_ADDRESS as `0x${string}`,
  MEZO_INTEGRATION: process.env.NEXT_PUBLIC_MEZO_INTEGRATION_ADDRESS as `0x${string}`,
  YIELD_AGGREGATOR: process.env.NEXT_PUBLIC_YIELD_AGGREGATOR_ADDRESS as `0x${string}`,
  INDIVIDUAL_POOL: process.env.NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS as `0x${string}`,
  COOPERATIVE_POOL: process.env.NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS as `0x${string}`,
  LOTTERY_POOL: process.env.NEXT_PUBLIC_LOTTERY_POOL_ADDRESS as `0x${string}`,
  ROTATING_POOL: process.env.NEXT_PUBLIC_ROTATING_POOL_ADDRESS as `0x${string}`,
} as const

export type ContractAddresses = typeof CONTRACT_ADDRESSES
```

#### Crear: `src/providers/web3-provider.tsx`

```typescript
'use client'

import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from '@/lib/web3/wagmi-config'
import { mezoTestnet } from '@/lib/web3/chains'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider 
          initialChain={mezoTestnet}
          theme={darkTheme({
            accentColor: '#0EA5E9',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
```

### 2.3. Copiar ABIs de Contratos

```bash
# Crear directorio para ABIs
mkdir -p src/contracts/abis

# Copiar ABIs compilados
cp ../contracts/out/IndividualPool.sol/IndividualPool.json src/contracts/abis/
cp ../contracts/out/CooperativePool.sol/CooperativePool.json src/contracts/abis/
cp ../contracts/out/LotteryPool.sol/LotteryPool.json src/contracts/abis/
cp ../contracts/out/RotatingPool.sol/RotatingPool.json src/contracts/abis/
cp ../contracts/out/MezoIntegration.sol/MezoIntegration.json src/contracts/abis/
cp ../contracts/out/YieldAggregator.sol/YieldAggregator.json src/contracts/abis/

# Verificar que se copiaron
ls -la src/contracts/abis/
```

### 2.4. Actualizar Layout Principal

Modificar `src/app/layout.tsx`:

```typescript
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Web3Provider } from "@/providers/web3-provider";

export const metadata: Metadata = {
  title: 'KhipuVault | Ahorro Bitcoin para Latinoamérica',
  description: 'Digitalizamos Pasanaku, Tandas y Roscas con MUSD de Mezo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Mono:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <Web3Provider>
          {children}
          <Toaster />
        </Web3Provider>
      </body>
    </html>
  );
}
```

### 2.5. Actualizar Header con Connect Button

Modificar `src/components/layout/header.tsx`:

```typescript
"use client";

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

const navLinks = [
  { href: '#features', label: 'Características' },
  { href: '#pools', label: 'Pools' },
  { href: '#how-it-works', label: 'Cómo Funciona' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          KhipuVault 🏔️
        </Link>
        
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-base font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <ConnectButton 
            chainStatus="icon"
            showBalance={false}
            label="Conectar Wallet"
          />

          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex h-full flex-col">
                <Link href="/" className="text-2xl font-bold mb-8">
                  KhipuVault 🏔️
                </Link>
                <nav className="flex flex-col gap-6">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto">
                  <ConnectButton showBalance={true} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
```

### 2.6. Configurar Environment Variables

Crear `.env.local`:

```bash
# WalletConnect (obtener en https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id_aqui

# Mezo Testnet
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org
NEXT_PUBLIC_EXPLORER_URL=https://explorer.test.mezo.org

# Contract Addresses (usar las del deployment)
NEXT_PUBLIC_WBTC_ADDRESS=0x...
NEXT_PUBLIC_MUSD_ADDRESS=0x...
NEXT_PUBLIC_MEZO_INTEGRATION_ADDRESS=0x...
NEXT_PUBLIC_YIELD_AGGREGATOR_ADDRESS=0x...
NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS=0x...
NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS=0x...
NEXT_PUBLIC_LOTTERY_POOL_ADDRESS=0x...
NEXT_PUBLIC_ROTATING_POOL_ADDRESS=0x...

# Feature Flags
NEXT_PUBLIC_ENABLE_TESTNET=true
```

### 2.7. Test Local

```bash
# Compilar
npm run build

# Correr en dev
npm run dev

# Abrir http://localhost:9002
```

**Verificar:**
- [ ] Página carga sin errores
- [ ] Connect Button aparece
- [ ] Mezo Passport se puede conectar
- [ ] No hay errores en console

---

## ⚡ **PASO 3: Deploy a Vercel (30 min)**

### 3.1. Crear Proyecto en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import tu repositorio de GitHub
4. Configurar:
   - **Framework Preset:** Next.js
   - **Root Directory:** `KhipuVault/frontend`
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install --legacy-peer-deps`

### 3.2. Configurar Environment Variables en Vercel

En la sección "Environment Variables", agrega:

```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id
NEXT_PUBLIC_CHAIN_ID=31611
NEXT_PUBLIC_RPC_URL=https://rpc.test.mezo.org
NEXT_PUBLIC_WBTC_ADDRESS=0x...
NEXT_PUBLIC_MUSD_ADDRESS=0x...
NEXT_PUBLIC_INDIVIDUAL_POOL_ADDRESS=0x...
NEXT_PUBLIC_COOPERATIVE_POOL_ADDRESS=0x...
NEXT_PUBLIC_LOTTERY_POOL_ADDRESS=0x...
NEXT_PUBLIC_ROTATING_POOL_ADDRESS=0x...
```

### 3.3. Deploy

Click "Deploy" y espera...

### 3.4. Verificar Deployment

- [ ] Build exitoso
- [ ] No hay errores en logs
- [ ] Sitio accesible en URL de Vercel
- [ ] Connect Button funciona
- [ ] Mezo Testnet se detecta correctamente

---

## ⚡ **PASO 4: Testing Final (30 min)**

### 4.1. Test de Conexión

1. Abrir tu URL de Vercel
2. Click en "Conectar Wallet"
3. Seleccionar Mezo Passport
4. Verificar que conecta a Mezo Testnet (Chain ID 31611)
5. Verificar que muestra tu balance

### 4.2. Test de Lectura de Contratos

Crear hook de prueba en `src/hooks/useIndividualPool.ts`:

```typescript
import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/contracts/addresses'
import IndividualPoolABI from '@/contracts/abis/IndividualPool.json'

export function useIndividualPool() {
  const { data: minDeposit } = useReadContract({
    address: CONTRACT_ADDRESSES.INDIVIDUAL_POOL,
    abi: IndividualPoolABI.abi,
    functionName: 'MIN_DEPOSIT',
  })

  return {
    minDeposit,
  }
}
```

Usar en un componente para verificar que lee del contrato:

```typescript
const { minDeposit } = useIndividualPool()
console.log('Min Deposit:', minDeposit) // Debe mostrar: 5000000 (0.005 BTC en wei)
```

### 4.3. Checklist Final

- [ ] ✅ Contratos desplegados en Mezo Testnet
- [ ] ✅ Frontend desplegado en Vercel
- [ ] ✅ Mezo Passport integrado
- [ ] ✅ Connect Button funciona
- [ ] ✅ Lectura de contratos funciona
- [ ] ✅ UI responsive
- [ ] ✅ No hay errores en console
- [ ] ✅ URL pública para demostración

---

## 🎯 **SUBMISSION HACKATHON**

### Información Requerida:

1. **Demo URL:** `https://tu-app.vercel.app`
2. **GitHub Repo:** `https://github.com/tu-usuario/ande-labs`
3. **Contract Addresses:** (de `deployments/pools-31611.json`)
   ```
   IndividualPool: 0x...
   CooperativePool: 0x...
   LotteryPool: 0x...
   RotatingPool: 0x...
   ```
4. **Video Demo:** (opcional pero recomendado) 2-3 minutos mostrando:
   - Conectar wallet con Mezo Passport
   - Navegar por los diferentes pools
   - Mostrar integración con MUSD
5. **Pitch Deck:** Explicar:
   - Problema que resuelves
   - Solución (KhipuVault)
   - Target (Latinoamérica)
   - Tracción (aunque sea mínima)

---

## 🚨 **TROUBLESHOOTING COMÚN**

### Error: "Cannot find module @mezo-org/passport"

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Error: "Chain ID mismatch"

Verificar que `.env.local` tiene:
```
NEXT_PUBLIC_CHAIN_ID=31611
```

Y que Mezo Passport esté configurado con `mezoTestnet` chain.

### Error: "Contract not deployed"

Verificar que las direcciones en `.env.local` son correctas:
```bash
# Verificar que el contrato existe
cast code $INDIVIDUAL_POOL_ADDRESS --rpc-url https://rpc.test.mezo.org
```

### Error: "Transaction failed"

Verificar:
1. Wallet tiene balance en Mezo Testnet
2. Contrato no está pausado
3. Aprobaciones necesarias (WBTC → Pool)

### Error de Build en Vercel

Verificar:
1. Install Command: `npm install --legacy-peer-deps`
2. Todas las env variables configuradas
3. No hay imports absolutos sin alias

---

## 📚 **RECURSOS ÚTILES**

- **Mezo Docs:** https://docs.mezo.org
- **Mezo Passport:** https://github.com/mezo-org/passport
- **RainbowKit:** https://www.rainbowkit.com/docs
- **Wagmi:** https://wagmi.sh
- **Vercel:** https://vercel.com/docs

---

## ✅ **CHECKLIST COMPLETO**

### Contratos:
- [ ] Foundry instalado
- [ ] `.env` configurado
- [ ] Contratos compilan
- [ ] Tests pasan (>80%)
- [ ] Desplegados en Mezo Testnet
- [ ] Direcciones guardadas

### Frontend:
- [ ] Dependencias Web3 instaladas
- [ ] Archivos de configuración creados
- [ ] ABIs copiados
- [ ] Layout actualizado con Web3Provider
- [ ] Header con ConnectButton
- [ ] `.env.local` configurado
- [ ] Build local exitoso

### Deployment:
- [ ] Vercel project creado
- [ ] Environment variables configuradas
- [ ] Deploy exitoso
- [ ] URL pública funcional
- [ ] Mezo Passport conecta correctamente

### Testing:
- [ ] Wallet connection funciona
- [ ] Lectura de contratos funciona
- [ ] UI responsive
- [ ] No errores en console
- [ ] Demo grabado (opcional)

---

## 🎉 **¡LISTO PARA EL HACKATHON!**

Una vez completado este checklist, tendrás:

✅ Smart contracts production-ready en Mezo Testnet  
✅ Frontend funcional con Mezo Passport  
✅ Demo pública accesible  
✅ Sistema completo end-to-end  

**Siguiente paso:** Preparar tu presentación y pitch para los jueces del hackathon.

¡Buena suerte! 🚀