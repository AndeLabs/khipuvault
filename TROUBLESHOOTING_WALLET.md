# Troubleshooting: Conexión de Wallet

## Problema: MetaMask no conecta

### Síntomas
- Click en "Connect Wallet"
- Seleccionas MetaMask
- Dice "Abriendo MetaMask..."
- Nada pasa / No se abre el popup

### Soluciones

#### 1. Verificar que MetaMask esté instalado
```bash
# Abre la consola del navegador (F12)
# En Console, escribe:
window.ethereum

# Debe devolver un objeto, NO undefined
```

#### 2. Verificar popups permitidos
- MetaMask abre un popup para confirmar conexión
- Verifica que tu navegador NO esté bloqueando popups
- En Chrome: Icono de popup bloqueado en la barra de direcciones
- Permite popups para localhost:9002

#### 3. Limpiar caché de MetaMask
```bash
# En MetaMask:
1. Click en el icono de MetaMask
2. Settings → Advanced
3. Scroll down → "Clear activity tab data"
4. Click "Clear"
5. Refresh la página (Cmd+R o Ctrl+R)
```

#### 4. Verificar que NO haya conflictos de wallets
```bash
# Si tienes múltiples wallets instaladas (Coinbase, Brave, etc.):
1. Desactiva temporalmente las otras wallets
2. Solo deja MetaMask activa
3. Refresh la página
4. Intenta conectar nuevamente
```

#### 5. Verificar logs en consola
```bash
# Abre DevTools (F12) → Console
# Busca errores en rojo que digan:
- "WalletConnect"
- "MetaMask"
- "ethereum"
- "provider"

# Si ves algún error, copia y pégalo
```

#### 6. Probar conexión directa con window.ethereum
```javascript
// En la consola del navegador:
await window.ethereum.request({ method: 'eth_requestAccounts' })

// Esto debe abrir el popup de MetaMask directamente
// Si funciona aquí pero no en la app, hay un problema con RainbowKit
```

#### 7. Verificar servidor corriendo correctamente
```bash
# En terminal:
cd /Users/munay/dev/ande-labs/KhipuVault/frontend
lsof -ti:9002 | xargs kill -9  # Mata procesos viejos
npm run dev  # Levanta servidor limpio

# Debe decir:
# ✓ Ready in XXXms
# Local: http://localhost:9002
```

#### 8. Hard Refresh del navegador
```bash
# Mac: Cmd + Shift + R
# Windows/Linux: Ctrl + Shift + R

# Esto limpia el caché del navegador
```

#### 9. Verificar configuración de Mezo Passport
```bash
# En la consola del navegador, después de cargar la página:
# Busca estos logs:
🔌 Web3Provider Initialized
   Network: Mezo Testnet (Chain ID: 31611)
   Wallet Support: Mezo Passport + RainbowKit
   Ethereum Wallets: MetaMask, WalletConnect, Rainbow, Coinbase
   Bitcoin Wallets: Unisat, Xverse, OKX

# Si NO ves estos logs, hay un problema con el provider
```

#### 10. Verificar que MetaMask esté desbloqueado
```bash
# MetaMask debe estar desbloqueada
# Si pide contraseña, ingrésala primero
# Luego intenta conectar
```

---

## Problema: MetaMask conecta pero está en red incorrecta

### Síntomas
- MetaMask se conecta
- Muestra tu dirección
- Pero muestra advertencia de "Wrong Network"

### Solución
```bash
1. La app debería cambiar automáticamente a Mezo Testnet
2. Si NO lo hace, cambia manualmente:
   - Click en el selector de red en MetaMask
   - Busca "Mezo Testnet"
   - Si NO aparece, agrégala:
     * Chain ID: 31611
     * RPC: https://rpc.test.mezo.org
     * Currency: BTC
     * Explorer: https://explorer.test.mezo.org
```

---

## Problema: "Insufficient funds for gas"

### Síntomas
- MetaMask conectado
- Intentas hacer transacción
- Error: "Insufficient funds"

### Solución
```bash
# Necesitas BTC en Mezo Testnet para gas fees
1. Ve al faucet: https://faucet.test.mezo.org/
2. Ingresa tu dirección de MetaMask
3. Click "Request BTC"
4. Espera 30 segundos
5. Verifica balance en MetaMask
```

---

## Problema: Modal de RainbowKit no abre

### Síntomas
- Click en "Connect Wallet"
- Nada pasa
- No se abre modal

### Solución
```bash
# Verifica en consola del navegador:
console.log(typeof window.ethereum)  # Debe ser 'object'

# Si es 'undefined':
1. MetaMask NO está instalada
2. Instala desde: https://metamask.io
3. Refresh la página

# Si hay errores de React:
1. Cierra el navegador completamente
2. Abre de nuevo
3. Ve a http://localhost:9002
4. Intenta conectar
```

---

## Problema: "walletConnectProjectId" no configurado

### Síntomas
- Error en consola: "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is not set"
- WalletConnect no funciona

### Solución
```bash
# Este warning es NORMAL si no usas WalletConnect
# MetaMask funciona sin esto
# Solo afecta a conexiones móviles via WalletConnect

# Si quieres arreglarlo:
1. Ve a: https://cloud.walletconnect.com
2. Crea cuenta gratis
3. Crea un proyecto
4. Copia el Project ID
5. Crea archivo .env.local:
   echo "NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id" > .env.local
6. Restart servidor: npm run dev
```

---

## Debug Avanzado

### Ver estado de Wagmi
```javascript
// En consola del navegador:
// Después de cargar la página

// 1. Verificar que config existe
console.log('Config loaded:', !!window.__wagmiConfig)

// 2. Ver connectors disponibles
// (Esto solo funciona si RainbowKit está montado)
```

### Ver estado de RainbowKit
```javascript
// En consola, busca estos elementos en el DOM:
document.querySelector('[data-rk]')  // Debe existir
document.querySelector('button')  // Debe tener el botón Connect

// Si NO existen, RainbowKit no se montó correctamente
```

### Verificar que no haya errores de hidratación
```bash
# En consola, busca:
"Hydration failed"
"Text content does not match"

# Si ves estos errores:
1. Son problemas de SSR
2. Ya están resueltos con lazy loading
3. Si persisten, cierra y abre el navegador
```

---

## Solución Rápida (Reset Total)

Si nada funciona, haz un reset completo:

```bash
# 1. Cierra el navegador completamente

# 2. En terminal, mata servidor:
lsof -ti:9002 | xargs kill -9

# 3. Limpia caché de Next.js:
cd /Users/munay/dev/ande-labs/KhipuVault/frontend
rm -rf .next

# 4. Reinstala dependencias:
npm install

# 5. Rebuild:
npm run build

# 6. Levanta servidor:
npm run dev

# 7. Abre navegador en modo incógnito:
# Chrome: Cmd+Shift+N (Mac) / Ctrl+Shift+N (Win)

# 8. Ve a: http://localhost:9002

# 9. Click "Connect Wallet"

# 10. Selecciona MetaMask
```

---

## Logs Esperados (Todo OK)

Cuando todo funciona correctamente, debes ver en consola:

```
🔌 Web3Provider Initialized
   Network: Mezo Testnet (Chain ID: 31611)
   Currency: BTC (native)
   Wallet Support: Mezo Passport + RainbowKit
   Ethereum Wallets: MetaMask, WalletConnect, Rainbow, Coinbase
   Bitcoin Wallets: Unisat, Xverse, OKX
```

Y en la página:
- Botón "Connect Wallet" visible
- Click abre modal de RainbowKit
- Modal muestra lista de wallets
- MetaMask aparece en la lista
- Click en MetaMask abre popup
- Popup pide confirmación
- Click "Connect" conecta la wallet
- Header muestra tu dirección (0x1234...)

---

## Wallets Alternativas (Si MetaMask no funciona)

### Probar con Brave Wallet
```bash
# Si usas Brave Browser:
1. Ya tiene wallet integrada
2. Click "Connect Wallet"
3. Selecciona "Brave Wallet"
4. Funciona igual que MetaMask
```

### Probar con Coinbase Wallet
```bash
1. Instala: https://www.coinbase.com/wallet
2. Refresh la página
3. Click "Connect Wallet"
4. Selecciona "Coinbase Wallet"
```

### Probar con Rainbow Wallet
```bash
1. Instala: https://rainbow.me
2. Disponible para móvil y navegador
3. Muy buena UX
```

---

## Contacto de Soporte

Si nada de esto funciona:

1. **Copia el error exacto de la consola**
2. **Toma screenshot del modal de RainbowKit**
3. **Verifica versión de navegador** (Chrome 100+, Firefox 100+, etc.)
4. **Verifica versión de MetaMask** (10.0+)
5. **Prueba en modo incógnito** (sin extensiones)

---

## Checklist Rápido

- [ ] MetaMask instalada
- [ ] MetaMask desbloqueada
- [ ] Popups permitidos
- [ ] Servidor corriendo (localhost:9002)
- [ ] Página cargada sin errores
- [ ] Botón "Connect Wallet" visible
- [ ] No hay conflictos con otras wallets
- [ ] Navegador actualizado
- [ ] Sin errores en consola (F12)

---

**Si sigues todos estos pasos y NO funciona, el problema puede ser:**
1. Versión incompatible de MetaMask (actualiza a última versión)
2. Conflicto con otra extensión (prueba modo incógnito)
3. Problema de red/firewall (prueba sin VPN)
4. Bug del navegador (prueba otro navegador)
