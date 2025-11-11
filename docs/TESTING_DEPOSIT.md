# 🧪 Testing Guide - New Deposit Flow V3

## ✅ Checklist para Testing

### Pre-requisitos
- [ ] Wallet conectada a Mezo Testnet (Chain ID: 31611)
- [ ] Tener MUSD en wallet (mínimo 10 MUSD)
- [ ] Tener BTC para gas (~0.001 BTC)
- [ ] Solo una wallet extension activa (MetaMask o OKX)

---

## 📋 Test Cases

### Test 1: Depósito Normal (Usuario ya tiene approval)

**Setup:**
- Usuario tiene 100+ MUSD
- Ya aprobó MUSD previamente

**Pasos:**
1. Abrir https://khipuvault.vercel.app/dashboard/individual-savings
2. Ver saldo MUSD correctamente
3. Ingresar "50" en el input
4. Click "Depositar 50 MUSD"
5. Wallet popup aparece (1 confirmación)
6. Confirmar transacción
7. Ver estado "Depositando..."
8. Ver estado "Confirmando depósito..."
9. Ver pantalla de éxito

**Resultado Esperado:**
```
✅ Solo 1 confirmación en wallet
✅ Progreso claro: "Paso 2 de 2"
✅ Link a explorer visible
✅ Pantalla de éxito con monto correcto
✅ Saldo actualizado después
```

---

### Test 2: Depósito con Approval Necesaria (Primera vez)

**Setup:**
- Usuario tiene 100+ MUSD
- NO ha aprobado MUSD nunca

**Pasos:**
1. Abrir https://khipuvault.vercel.app/dashboard/individual-savings
2. Ingresar "50" en el input
3. Click "Depositar 50 MUSD"
4. Wallet popup aparece (aprobación)
5. Confirmar aprobación
6. Ver estado "Aprobando MUSD..."
7. Ver estado "Confirmando aprobación..."
8. **AUTO-CONTINÚA** - Wallet popup aparece (depósito)
9. Confirmar depósito
10. Ver estado "Depositando..."
11. Ver estado "Confirmando depósito..."
12. Ver pantalla de éxito

**Resultado Esperado:**
```
✅ 2 confirmaciones en wallet (approve + deposit)
✅ Progreso claro: "Paso 1 de 2" → "Paso 2 de 2"
✅ NO requiere refresh entre pasos
✅ Auto-continúa después de approval
✅ Pantalla de éxito con monto correcto
```

---

### Test 3: Usuario Rechaza Aprobación

**Pasos:**
1. Ingresar "50" en el input
2. Click "Depositar 50 MUSD"
3. Wallet popup aparece (aprobación)
4. **Rechazar** en wallet

**Resultado Esperado:**
```
✅ Pantalla de error
✅ Mensaje: "Rechazaste la transacción en tu wallet"
✅ Botón "Reintentar" visible
✅ Click en "Reintentar" vuelve a estado inicial
```

---

### Test 4: Usuario Rechaza Depósito

**Pasos:**
1. Ingresar "50" en el input
2. Click "Depositar 50 MUSD"
3. Si necesita approval, aprobar
4. Wallet popup aparece (depósito)
5. **Rechazar** en wallet

**Resultado Esperado:**
```
✅ Pantalla de error
✅ Mensaje: "Rechazaste la transacción en tu wallet"
✅ Botón "Reintentar" visible
```

---

### Test 5: Validaciones

**Test 5a: Monto menor al mínimo**
```
Input: "5" MUSD
Expected: ✅ Error: "El mínimo es 10 MUSD"
```

**Test 5b: Monto mayor al saldo**
```
Input: "10000" MUSD (más de lo que tiene)
Expected: ✅ Error: "No tienes suficiente MUSD"
```

**Test 5c: Sin wallet conectada**
```
Estado: Wallet desconectada
Expected: ✅ Botón "Depositar" disabled
```

**Test 5d: Gas insuficiente**
```
Setup: Wallet con MUSD pero sin BTC
Expected: ✅ Error: "No tienes suficiente BTC para pagar el gas"
```

---

### Test 6: Links a Explorer

**Pasos:**
1. Durante "Aprobando..." ver link a explorer
2. Click en link
3. Verificar que abre Mezo Explorer con tx correcta
4. Durante "Depositando..." ver link a explorer
5. Click en link
6. Verificar que abre Mezo Explorer con tx correcta

**Resultado Esperado:**
```
✅ Links aparecen durante confirmación
✅ Links abren en nueva pestaña
✅ URLs correctas: https://explorer.mezo.org/tx/0x...
```

---

### Test 7: Hacer Otro Depósito

**Pasos:**
1. Completar depósito exitosamente
2. Ver pantalla de éxito
3. Click "Hacer otro depósito"
4. Ver formulario inicial de nuevo
5. Input vacío y listo para nuevo depósito

**Resultado Esperado:**
```
✅ Vuelve a estado inicial
✅ Input limpio
✅ Balance actualizado
```

---

## 🐛 Bugs a Reportar

Si encuentras alguno de estos, reportar inmediatamente:

### Críticos (P0):
- [ ] Transacción falla pero muestra "éxito"
- [ ] MUSD desaparece de wallet pero no se deposita
- [ ] Estado colgado sin forma de salir
- [ ] Wallet popup nunca aparece

### Altos (P1):
- [ ] Saldo no se actualiza después de depósito
- [ ] Link a explorer no funciona
- [ ] Error no se muestra claramente
- [ ] Botón "Reintentar" no funciona

### Medios (P2):
- [ ] Texto confuso o poco claro
- [ ] Animaciones no funcionan
- [ ] UI rota en mobile
- [ ] Colores difíciles de leer

---

## 📊 Métricas de Éxito

| Métrica | Target | Actual |
|---------|--------|--------|
| **Tiempo hasta primer depósito** | <60 seg | ___ |
| **Clicks requeridos** | 2-3 | ___ |
| **Tasa de error** | <5% | ___ |
| **Claridad del feedback** | 9/10 | ___ |
| **Usuarios que completan** | >90% | ___ |

---

## 🔍 Debugging

### Console Logs a Buscar

**Durante el flujo normal:**
```javascript
💰 Starting deposit: { amount, wei, allowance, balance }
🔑 Need approval...  // Solo si es primera vez
✅ Approval confirmed! Refetching allowance...
🚀 Proceeding with deposit...
✅ Deposit confirmed!
```

**Durante errores:**
```javascript
❌ Approve error: ...
❌ Deposit error: ...
❌ Error: ...
```

### Estados Posibles

```
idle → Formulario visible, esperando input
approving → Usuario confirmando en wallet (aprobación)
waitingApproval → Esperando confirmación blockchain (aprobación)
depositing → Usuario confirmando en wallet (depósito)
waitingDeposit → Esperando confirmación blockchain (depósito)
success → ✅ Todo listo
error → ❌ Algo falló
```

---

## ✅ Checklist Final

Antes de marcar como "Production Ready":

- [ ] Test 1 (Normal) pasa ✅
- [ ] Test 2 (Con approval) pasa ✅
- [ ] Test 3 (Rechazo approval) pasa ✅
- [ ] Test 4 (Rechazo deposit) pasa ✅
- [ ] Test 5 (Validaciones) todas pasan ✅
- [ ] Test 6 (Explorer links) pasa ✅
- [ ] Test 7 (Otro depósito) pasa ✅
- [ ] No bugs críticos (P0) ✅
- [ ] UI clara y profesional ✅
- [ ] Mobile funciona correctamente ✅

---

## 📝 Template de Reporte de Bug

```markdown
**Bug ID:** #XXX
**Severidad:** P0/P1/P2
**Test Case:** Test X - [nombre]

**Pasos para Reproducir:**
1. ...
2. ...
3. ...

**Resultado Esperado:**
...

**Resultado Actual:**
...

**Screenshots/Video:**
[adjuntar]

**Console Logs:**
```
[pegar logs]
```

**Información de Sistema:**
- Browser: Chrome/Firefox/etc
- Wallet: MetaMask/OKX
- Network: Mezo Testnet (31611)
- Saldo: XXX MUSD
```

---

**Happy Testing! 🚀**

Si todo pasa, ¡tenemos un flujo de depósito production-ready!
