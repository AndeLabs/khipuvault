# 🎯 Guía de Usuario - KhipuVault Frontend

**Para Usuarios Finales** - Cómo usar KhipuVault paso a paso

---

## 📱 Paso 1: Configurar MetaMask para Mezo Testnet

### Opción A: Automático (Recomendado)

1. Ve a **http://localhost:9002**
2. Haz click en **"Conectar Wallet"**
3. Selecciona **MetaMask**
4. El sistema **automáticamente** te pedirá agregar Mezo Testnet
5. Acepta en MetaMask ✅

### Opción B: Manual

Si el cambio automático no funciona, agrega manualmente:

1. Abre **MetaMask**
2. Click en el selector de red (arriba)
3. Click en **"Agregar red"** o **"Add Network"**
4. Click en **"Agregar red manualmente"**

**Datos de Mezo Testnet:**
```
Nombre de red: Mezo Testnet
URL RPC: https://rpc.test.mezo.org
Chain ID: 31611
Símbolo de moneda: BTC
Explorador de bloques: https://explorer.test.mezo.org
```

5. Guarda y cambia a **Mezo Testnet** ✅

---

## 💰 Paso 2: Agregar Token MUSD a MetaMask

MUSD es el stablecoin que usarás para depositar. Necesitas agregarlo:

1. En MetaMask, ve a la pestaña **"Tokens"** o **"Assets"**
2. Scroll hasta abajo
3. Click en **"Importar tokens"**
4. Pega esta dirección:

```
0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503
```

5. Los datos se llenarán automáticamente:
   - **Símbolo**: MUSD
   - **Decimales**: 18

6. Click **"Importar"** ✅

Ahora verás tu balance de MUSD (actualmente tienes **6,411.81 MUSD**)

---

## 🔥 Paso 3: Obtener BTC para Gas (Si no tienes)

Necesitas BTC para pagar las tarifas de transacción (gas).

### Verificar tu balance BTC:
- Abre MetaMask
- Asegúrate de estar en **Mezo Testnet**
- Verás tu balance de BTC arriba

### Si tienes menos de 0.01 BTC:

**Opción 1: Faucet de Mezo**
1. Ve a un faucet de Mezo Testnet
2. Pega tu dirección de wallet
3. Solicita BTC de prueba

**Opción 2: Solicitar al equipo**
- Dinos tu dirección y te enviamos BTC de prueba

**Tu dirección actual**: `0xB4d5B9a6e744A3c5fdBE2726f469e878e319a8D8`

---

## 🎯 Paso 4: Usar KhipuVault - Individual Savings

### 4.1 Conectar Wallet

1. Ve a **http://localhost:9002**
2. Click en **"Conectar Wallet"** (arriba derecha)
3. Selecciona **MetaMask**
4. Aprueba la conexión
5. **Automáticamente** cambiará a Mezo Testnet

✅ Verás tu dirección conectada

### 4.2 Ir a Individual Savings

1. En el dashboard, click en **"Individual Savings"**
2. Verás:
   - Tu balance de MUSD
   - Stats del pool
   - Formulario de depósito

### 4.3 Depositar MUSD

**Primer Paso: Aprobar MUSD** (solo la primera vez)

1. Escribe la cantidad a depositar (mínimo **10 MUSD**)
2. Click en **"Depositar"**
3. Aparecerá **"Aprobar MUSD"** primero
4. Click en **"Aprobar"**
5. MetaMask mostrará transacción (puede verse confusa, pero es segura)
6. **Acepta** la transacción
7. Espera confirmación (~10 segundos)

✅ **Aprobación completa**

**Segundo Paso: Depositar**

1. Después de aprobar, el botón cambiará a **"Depositar"**
2. Click en **"Depositar"**
3. MetaMask mostrará la transacción
4. Acepta
5. Espera confirmación

✅ **Depósito exitoso!**

### 4.4 Ver tu Posición

Después de depositar verás:

- **Principal depositado**: Tu MUSD depositado
- **Yields acumulados**: Rendimientos generados
- **APR**: Tasa de rendimiento anual (~6.2%)
- **Tiempo depositado**: Cuánto llevas en el pool

### 4.5 Reclamar Yields

Si quieres reclamar solo los rendimientos (sin tocar el principal):

1. Ve a la sección **"Your Position"**
2. Click en **"Claim Yields"**
3. Acepta la transacción en MetaMask
4. Los yields se transfieren a tu wallet

✅ Recibes MUSD de yields (con 1% de fee)

### 4.6 Retirar Todo

Para retirar tu depósito completo + yields:

1. Click en **"Withdraw All"**
2. Acepta la transacción
3. Recibes:
   - Todo tu MUSD depositado
   - Todos los yields acumulados (con 1% de fee)

✅ Retiro completo!

---

## 🎰 Paso 5: Prize Pool (Lotería)

### 5.1 Comprar Tickets

1. Ve a **"Prize Pool"** en el menú
2. Escribe cuántos tickets quieres (1 ticket = X MUSD)
3. Click **"Buy Tickets"**
4. Aprueba MUSD (si es primera vez)
5. Confirma compra

### 5.2 Ver tus Tickets

- Se muestran en **"Your Tickets"**
- Cada ticket tiene un número único
- Los yields del pool se acumulan como premio

### 5.3 Sorteo

- El sorteo se hace automáticamente cada X tiempo
- Si ganas, recibes el premio en MUSD
- **IMPORTANTE**: Nunca pierdes tu capital inicial

---

## 👥 Paso 6: Cooperative Pool

### 6.1 Crear Pool Cooperativo

1. Ve a **"Cooperative Savings"**
2. Click **"Create Pool"**
3. Llena los datos:
   - **Nombre**: Ej. "Familia Pérez"
   - **Min Contribution**: Mínimo por persona
   - **Max Contribution**: Máximo por persona
   - **Max Members**: Cuántas personas
4. Deposita tu contribución inicial (BTC nativo)
5. Confirma transacción

✅ Pool creado!

### 6.2 Unirse a Pool

1. Explora pools disponibles
2. Click **"Join Pool"**
3. Deposita BTC (entre min y max del pool)
4. Confirma

✅ Eres miembro del pool!

### 6.3 Ver Rendimientos del Pool

- Todos los miembros ganan yields proporcionalmente
- Los yields se distribuyen según tu contribución
- Puedes retirarte en cualquier momento

---

## ⚠️ Solución de Problemas

### Problema: "Fondos insuficientes para gas"

**Solución**:
- Necesitas BTC para pagar gas
- Verifica tu balance BTC en MetaMask
- Usa faucet o solicita BTC de prueba

### Problema: "Red incorrecta"

**Solución**:
- MetaMask debe estar en **Mezo Testnet**
- El sistema debería cambiar automáticamente
- Si no, cambia manualmente (ver Paso 1)

### Problema: "No veo mis tokens MUSD"

**Solución**:
- Agrega el token MUSD a MetaMask (ver Paso 2)
- Dirección: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503`

### Problema: "Transacción fallida"

**Solución**:
1. Verifica que estés en Mezo Testnet
2. Verifica que tengas suficiente BTC para gas
3. Si depositando, primero **aprueba MUSD**
4. Espera a que la aprobación se confirme
5. Luego deposita

### Problema: "MetaMask muestra 0 BTC pero tengo fondos"

**Solución**:
- Asegúrate de estar en **Mezo Testnet**
- Actualiza la página
- Desconecta y reconecta wallet

---

## 📊 Información de tus Fondos Actuales

**Tu Wallet**: `0xB4d5B9a6e744A3c5fdBE2726f469e878e319a8D8`

**Balances en Mezo Testnet**:
- **BTC**: ~0.015 BTC (suficiente para gas)
- **MUSD**: 6,411.81 MUSD ✅

**Contratos Verificados**:
- **IndividualPool**: `0x6028E4452e6059e797832578D70dBdf63317538a` ✅
- **CooperativePool**: `0x92eCA935773b71efB655cc7d3aB77ee23c088A7a` ✅
- **MUSD Token**: `0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503` ✅

---

## 🎯 Flujo Completo Resumido

```
1. Configurar MetaMask → Mezo Testnet
2. Agregar token MUSD a MetaMask
3. Verificar balances (BTC para gas, MUSD para depositar)
4. Ir a http://localhost:9002
5. Conectar wallet (auto-switch a Mezo)
6. Individual Savings → Depositar:
   a. Aprobar MUSD (primera vez)
   b. Depositar MUSD
7. Ver yields acumularse
8. Reclamar yields o retirar todo
```

---

## 🔗 Links Útiles

- **Frontend**: http://localhost:9002
- **Explorer**: https://explorer.test.mezo.org
- **Mezo Docs**: https://docs.mezo.org
- **Tu Wallet en Explorer**: https://explorer.test.mezo.org/address/0xB4d5B9a6e744A3c5fdBE2726f469e878e319a8D8

---

## 💡 Tips

1. **Siempre verifica** que estés en Mezo Testnet antes de hacer transacciones
2. **Primero aprueba** MUSD, luego deposita
3. **Espera confirmaciones** antes de hacer otra transacción
4. **Yields se acumulan** automáticamente, no necesitas hacer nada
5. **1% fee** en yields al reclamar o retirar

---

**¿Necesitas ayuda?** Pregunta en el chat y te ayudamos en tiempo real.
