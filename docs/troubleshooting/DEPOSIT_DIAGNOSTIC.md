# 🔍 Diagnóstico de Problema de Depósito - KhipuVault

## ✅ Verificación de Configuración con Mezo

### 📋 Límites Oficiales de Mezo vs KhipuVault

| Parámetro | Valor Mezo (Contrato) | Valor KhipuVault | Estado |
|-----------|----------------------|------------------|---------|
| **Mínimo Depósito** | 10 MUSD | 10 MUSD | ✅ Correcto |
| **Máximo Depósito** | 100,000 MUSD | 100,000 MUSD | ✅ Correcto |
| **Mínimo Retiro** | 1 MUSD | 1 MUSD | ✅ Correcto |
| **MUSD Decimales** | 18 | 18 | ✅ Correcto |

### ✅ Tu Intento de Depósito

- **Monto**: 88 MUSD
- **Estado**: ✅ Dentro de límites válidos (10-100k MUSD)
- **Saldo MUSD**: 522.36 MUSD ✅ Suficiente
- **Allowance**: Unlimited ✅ Ya aprobado

---

## 🔍 Cómo Diagnosticar el Problema

### Paso 1: Abrir Consola del Navegador

1. **Chrome/Brave**: Presiona `F12` o `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. **Firefox**: Presiona `F12`
3. Ve a la pestaña **Console**

### Paso 2: Buscar Mensajes de Error

Busca estos mensajes en la consola:

#### 📊 Mensajes de Estado Normal:

```javascript
📊 Approval state: {
  isApproving: false,
  isApproveConfirming: false,
  isApprovalConfirmed: true,
  depositNeedsApproval: false,
  allowance: "115792089237316195423570985008687907853269984665640564039457584007913129639935"
}

💰 Iniciando depósito V3... {
  amount: "88",
  needsApproval: false,
  allowance: "115792089237316195423570985008687907853269984665640564039457584007913129639935",
  musdBalance: "522363991812659346997"
}

✅ Approval OK, calling depositV3...
Amount in wei: 88000000000000000000
```

#### ❌ Mensajes de Error a Buscar:

1. **Error de Aprobación:**
   ```
   ❌ Approval error: ...
   ```

2. **Error de Depósito:**
   ```
   ❌ Error en depósito: ...
   ```

3. **Error de Contrato:**
   ```
   ContractFunctionExecutionError: ...
   ```

4. **Error de Gas:**
   ```
   insufficient funds for gas
   ```

5. **Error de Red:**
   ```
   network changed
   ChainMismatchError
   ```

---

## 🐛 Posibles Problemas y Soluciones

### 1. ❌ Usuario Rechaza la Transacción

**Síntoma:**
```
User rejected the request
```

**Solución:**
- Confirma la transacción en tu wallet (MetaMask/OKX)
- Verifica que tienes suficiente BTC para gas (~0.0001 BTC)

---

### 2. ❌ Red Incorrecta

**Síntoma:**
```
ChainMismatchError: Chain ID mismatch
Expected: 31611
Current: 1
```

**Solución:**
- Cambia a **Mezo Testnet (Chain ID: 31611)** en tu wallet
- Network details:
  - **RPC**: https://testnet.mezo.org
  - **Chain ID**: 31611
  - **Symbol**: BTC

---

### 3. ❌ Gas Insuficiente

**Síntoma:**
```
insufficient funds for gas * price + value
```

**Solución:**
- Necesitas más BTC en tu wallet para pagar gas
- Mínimo recomendado: ~0.001 BTC (~$100)
- Obtén BTC testnet en: https://faucet.mezo.org

---

### 4. ❌ Contrato en Modo Emergencia

**Síntoma:**
```
ContractFunctionRevertedError: PoolInEmergencyMode()
```

**Solución:**
- El contrato V3 está pausado temporalmente
- Espera a que el admin reactive el contrato
- Revisa el estado en el Debug Panel

---

### 5. ❌ Depósito Duplicado

**Síntoma:**
```
DepositStillPending()
AlreadyHasActiveDeposit()
```

**Solución:**
- Espera a que la transacción anterior se confirme
- Revisa en: https://explorer.mezo.org
- No intentes depositar múltiples veces seguidas

---

### 6. ❌ Límite de Depósito Excedido

**Síntoma:**
```
MaximumDepositExceeded()
```

**Solución:**
- Tu depósito total (actual + nuevo) excede 100k MUSD
- Reduce el monto del depósito

---

### 7. ❌ MUSD Insuficiente (No debería ocurrir)

**Síntoma:**
```
ERC20: transfer amount exceeds balance
```

**Solución:**
- Verifica tu saldo MUSD: 522.36 MUSD ✅
- Recarga la página
- Revisa en Mezo App: https://app.mezo.org

---

## 🔧 Información de Debug para Compartir

Si el problema persiste, copia esta información:

```
=== INFORMACIÓN DE DEBUG ===
Wallet: 0xB4d5...a8D8
Network: Mezo Testnet (31611)
MUSD Balance: 522.36 MUSD
Deposit Amount: 88 MUSD
Contract: 0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393
Allowance: Unlimited
Gas Balance: [COPIA TU SALDO BTC]

=== CONSOLE ERRORS ===
[COPIA LOS ERRORES DE LA CONSOLA AQUÍ]

=== TRANSACTION HASH ===
[SI HAY UNA TX, COPIA EL HASH]
```

---

## 🚀 Próximos Pasos

1. **Abre la consola del navegador** (F12)
2. **Limpia la consola** (icono 🚫 o Ctrl+L)
3. **Intenta depositar nuevamente**
4. **Copia TODOS los mensajes** que aparezcan
5. **Comparte los logs** con el equipo de desarrollo

---

## 📞 Soporte

- **Discord**: https://discord.gg/khipuvault
- **GitHub Issues**: https://github.com/AndeLabs/khipuvault/issues
- **Email**: support@khipuvault.com

---

**Última actualización:** 2 Nov 2025  
**Versión Frontend:** V3 (UUPS)  
**Versión Contratos:** V3 (0xdfBE...)
