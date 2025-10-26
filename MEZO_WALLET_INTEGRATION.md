# Integración de Wallet Mezo - KhipuVault

## 📋 Resumen

KhipuVault ahora soporta el sistema de autenticación dual de Mezo Platform:
- **Continue with Ethereum** → MetaMask y wallets EVM
- **Continue with Bitcoin** → Unisat y wallets Bitcoin

Esta integración sigue las especificaciones oficiales de Mezo para participar en el hackathon y usar MUSD.

---

## 🎯 Características Implementadas

### 1. **Dual Wallet Support**
- ✅ Ethereum wallets (MetaMask, WalletConnect, etc.)
- ✅ Bitcoin wallets (Unisat)
- ✅ Mezo Passport integration
- ✅ Cambio dinámico entre wallets

### 2. **Componentes Creados**

#### `MezoWalletSelector`
Selector principal de wallet con UI similar a Mezo.org

**Ubicación:** `frontend/src/components/wallet/mezo-wallet-selector.tsx`

**Características:**
- Modal elegante con dos opciones de conexión
- Detección automática de wallets instaladas
- Manejo de errores y redirección a instalación
- Estado de conexión en tiempo real

```tsx
import { MezoWalletSelector } from '@/components/wallet/mezo-wallet-selector'

// Uso en cualquier componente
<MezoWalletSelector />
```

#### `MezoWalletButton`
Versión compacta para headers/navbars

```tsx
import { MezoWalletButton } from '@/components/wallet/mezo-wallet-selector'

<MezoWalletButton />
```

### 3. **Hooks Creados**

#### `useBitcoinWallet`
Hook completo para interactuar con Bitcoin wallets (Unisat)

**Ubicación:** `frontend/src/hooks/web3/use-bitcoin-wallet.ts`

**Funciones:**
- `connect()` - Conectar wallet
- `disconnect()` - Desconectar wallet  
- `getBalance()` - Obtener balance en BTC
- `signMessage()` - Firmar mensajes
- `sendBitcoin()` - Enviar transacciones

**Ejemplo:**
```tsx
import { useBitcoinWallet } from '@/hooks/web3/use-bitcoin-wallet'

function MyComponent() {
  const { 
    address, 
    balance, 
    isConnected, 
    connect, 
    disconnect 
  } = useBitcoinWallet()

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Address: {address}</p>
          <p>Balance: {balance} BTC</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connect}>Connect Bitcoin Wallet</button>
      )}
    </div>
  )
}
```

### 4. **Mezo Passport Integration**

**Ubicación:** `frontend/src/lib/web3/mezo-passport.ts`

Integración completa con Mezo Passport para autenticación y gestión de identidad.

**Funciones principales:**
- `authenticateWithEthereum()` - Autenticar con wallet Ethereum
- `authenticateWithBitcoin()` - Autenticar con wallet Bitcoin
- `disconnectPassport()` - Desconectar de Mezo Passport
- `getPassportSession()` - Obtener sesión actual
- `signMessageWithPassport()` - Firmar mensajes
- `verifyMezoAccess()` - Verificar acceso a features de Mezo

**Ejemplo:**
```tsx
import { 
  authenticateWithEthereum, 
  getPassportSession 
} from '@/lib/web3/mezo-passport'

// Autenticar con Ethereum
const session = await authenticateWithEthereum(window.ethereum)

// Verificar sesión
const currentSession = getPassportSession()
console.log(currentSession)
```

---

## 🔧 Configuración

### Variables de Entorno

Añade a tu `.env.local`:

```bash
# Mezo Network Configuration
NEXT_PUBLIC_MEZO_NETWORK=testnet
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id_aqui

# Mezo RPC
NEXT_PUBLIC_MEZO_RPC_URL=https://rpc.test.mezo.org
NEXT_PUBLIC_MEZO_CHAIN_ID=31611
```

### WalletConnect Project ID

Obtén tu Project ID en: https://cloud.walletconnect.com

---

## 🚀 Uso en el Proyecto

### Landing Page (`/`)
```tsx
// frontend/src/components/layout/header.tsx
import { MezoWalletSelector } from '@/components/wallet/mezo-wallet-selector'

export function Header() {
  return (
    <header>
      {/* ... */}
      <MezoWalletSelector />
    </header>
  )
}
```

### Dashboard (`/dashboard`)
```tsx
// frontend/src/components/layout/dashboard-header.tsx
import { MezoWalletButton } from '@/components/wallet/mezo-wallet-selector'

export function DashboardHeader() {
  return (
    <header>
      {/* ... */}
      <MezoWalletButton />
    </header>
  )
}
```

---

## 📱 Wallets Soportadas

### Ethereum (EVM)
- ✅ MetaMask
- ✅ WalletConnect
- ✅ Coinbase Wallet
- ✅ Rainbow Wallet
- ✅ Cualquier wallet compatible con EIP-1193

### Bitcoin
- ✅ Unisat Wallet
- 🔄 Xverse (próximamente)
- 🔄 Leather (próximamente)

---

## 🎨 UI/UX

La interfaz sigue el diseño oficial de Mezo:

```
┌─────────────────────────────────────┐
│   Bienvenido a KhipuVault          │
│   Usa tu wallet existente          │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ 🔷 Continue with Ethereum   │  │
│  │ Conecta con MetaMask        │  │
│  └─────────────────────────────┘  │
│                                     │
│  ┌─────────────────────────────┐  │
│  │ ₿  Continue with Bitcoin    │  │
│  │ Conecta con Unisat          │  │
│  └─────────────────────────────┘  │
│                                     │
│  ¿No tienes cuenta? Crear cuenta   │
└─────────────────────────────────────┘
```

---

## 🔐 Seguridad

### Protecciones Implementadas

1. **Validación de Red**
   - Verifica que el usuario esté en Mezo Testnet (Chain ID 31611)
   - Alerta si la red es incorrecta

2. **Manejo de Errores**
   - Error boundaries para prevenir crashes
   - Mensajes de error user-friendly
   - Logging detallado para debugging

3. **SSR Safety**
   - Todos los componentes son seguros para Server-Side Rendering
   - Prevención de errores de hydration
   - Loading states apropiados

4. **Type Safety**
   - TypeScript en todos los componentes
   - Interfaces bien definidas
   - Validación de tipos en runtime cuando es necesario

---

## 📊 Estado de la Integración

| Feature | Estado | Notas |
|---------|--------|-------|
| Ethereum Wallet | ✅ | Completamente funcional |
| Bitcoin Wallet | ✅ | Completamente funcional |
| Mezo Passport | ✅ | Integrado |
| Dual Connection | ✅ | Ambos tipos simultáneamente |
| Balance Display | ✅ | BTC y ETH |
| Transaction Signing | ✅ | Ambas redes |
| Error Handling | ✅ | Robusto |
| Mobile Support | ✅ | Responsive |

---

## 🧪 Testing

### Testear Ethereum Wallet
1. Instala MetaMask
2. Añade Mezo Testnet:
   - Chain ID: 31611
   - RPC: https://rpc.test.mezo.org
   - Currency: BTC (18 decimals)
3. Click "Continue with Ethereum"
4. Aprueba la conexión

### Testear Bitcoin Wallet
1. Instala Unisat Wallet
2. Cambia a Testnet en la configuración
3. Click "Continue with Bitcoin"
4. Aprueba la conexión

---

## 🐛 Troubleshooting

### Error: "WagmiProviderNotFoundError"
**Solución:** Ya está resuelto con la nueva estructura de providers.

### Error: "Unisat is not defined"
**Solución:** Asegúrate de tener Unisat wallet instalada.

### Error: "Chain ID mismatch"
**Solución:** Cambia tu wallet a Mezo Testnet (31611).

### Balance no se muestra
**Solución:** Asegúrate de tener fondos en Mezo Testnet.

---

## 📚 Recursos

- [Mezo Docs](https://docs.mezo.org)
- [Mezo Passport](https://docs.mezo.org/developers/passport)
- [Mezo Hackathon](https://mezo.org/hackathon)
- [Unisat Wallet](https://unisat.io)
- [MetaMask](https://metamask.io)

---

## 🎉 Próximos Pasos

Para usar esta integración en tu app:

1. **Conectar Wallet**
   ```tsx
   <MezoWalletSelector />
   ```

2. **Obtener Datos del Usuario**
   ```tsx
   const { address, isConnected } = useAccount() // Ethereum
   const { address, balance } = useBitcoinWallet() // Bitcoin
   ```

3. **Interactuar con Contratos**
   ```tsx
   // Usa address para llamar tus contratos de MUSD
   const { depositBTC, borrowMUSD } = useIndividualPool()
   ```

4. **Verificar Acceso a Mezo**
   ```tsx
   const hasAccess = await verifyMezoAccess()
   if (hasAccess) {
     // Permitir operaciones con MUSD
   }
   ```

---

## ✅ Checklist Hackathon Mezo

- [x] Integración con MUSD
- [x] Mezo Passport implementado
- [x] Soporte Ethereum wallet
- [x] Soporte Bitcoin wallet
- [x] Demo funcional en testnet
- [x] UI/UX profesional
- [x] Código limpio y documentado
- [x] Error handling robusto
- [x] Responsive design

---

**Autor:** KhipuVault Team  
**Fecha:** Octubre 2025  
**Versión:** 1.0.0  
**Licencia:** MIT
