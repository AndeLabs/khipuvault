# KhipuVault - Roadmap de Producción 2026

> **Filosofía:** Web3 Puro - Zero Fricción
> **Objetivo:** Plataforma descentralizada de ahorro en Bitcoin sin configuraciones innecesarias

## 📊 Estado Actual

### ✅ Completado (85-90%)

- Smart Contracts (5 contratos totalmente funcionales)
- Backend API (20+ endpoints)
- Blockchain Indexer (eventos en tiempo real)
- Frontend Core (Individual, Cooperative, Lottery)

### 🚧 Pendiente

- Simplificar Settings
- Rotating Pool UI
- Mejorar Testing (frontend)
- Aplicar mejores prácticas 2026

---

## 🎯 Plan de 6 Semanas

### **SEMANA 1: Simplificación** (Quick Wins)

**Objetivo:** Eliminar complejidad innecesaria, mantener solo lo esencial

#### Tareas:

1. **Simplificar Settings** (2 días)
   - ❌ Eliminar: preferences/page.tsx (idioma, moneda, notificaciones)
   - ❌ Eliminar: security/page.tsx (2FA, passwords)
   - ❌ Eliminar: notifications/page.tsx (no necesario)
   - ✅ Mantener: wallets/page.tsx (gestión wallets)
   - ✅ Crear: activity/page.tsx (historial transacciones)

2. **Actualizar Wallets Page** (2 días)
   - Conectar con Wagmi useAccount(), useBalance(), useDisconnect()
   - Eliminar datos mock
   - Mostrar wallet conectada real
   - Botón desconectar funcional

3. **Crear Activity Page** (1 día)
   - Usar hook useUserTransactionHistory()
   - Mostrar historial de transacciones
   - Tabla simple con fecha, tipo, monto, estado

**Entregable:** Settings simplificado a 2 páginas funcionales

---

### **SEMANA 2: Rotating Pool UI**

**Objetivo:** Aprovechar contrato RotatingPool ya desarrollado

#### Tareas:

1. **Crear Hooks Web3** (2 días)
   - apps/web/src/hooks/web3/rotating/use-rotating-pool.ts
   - apps/web/src/hooks/web3/rotating/use-create-rotating-pool.ts
   - apps/web/src/hooks/web3/rotating/use-join-rotating-pool.ts

2. **Crear UI Page** (3 días)
   - apps/web/src/app/dashboard/rotating-pool/page.tsx
   - Features: Listar ROSCAs, crear, unirse, ver turno, historial

**Entregable:** Rotating Pool totalmente funcional

---

### **SEMANAS 3-4: Testing Comprehensivo**

**Objetivo:** Aumentar coverage de 15% a 80%+

#### Semana 3: Smart Contracts & Hooks

- Agregar invariant tests a YieldAggregatorV3
- Mejorar fuzz tests con bound() y vm.assume()
- Edge cases para RotatingPool
- Tests para hooks: cooperative, lottery, rotating

#### Semana 4: Components & Integration

- Tests de componentes: transaction-card, pool-card, forms
- Integration tests: individual-savings, cooperative-savings, prize-pool

**Entregable:** 80%+ test coverage

---

### **SEMANA 5: Mejores Prácticas 2026**

**Objetivo:** Aplicar patrones actualizados

#### Tareas:

1. **Wagmi 2.x Patterns** (2 días)
   - Agregar staleTime y gcTime
   - Usar enabled para conditional fetching
   - Actualizar nomenclatura (isPending)

2. **Next.js 15 Optimization** (2 días)
   - Maximizar Server Components
   - Agregar Suspense boundaries
   - Optimizar data fetching

3. **React Query 5 Config** (1 día)
   - Configurar defaults globales
   - Agregar prefetching

**Entregable:** Código con mejores prácticas 2026

---

### **SEMANA 6: Polish & Deploy**

**Objetivo:** Producción

#### Tareas:

1. **Security Audit** (2 días)
   - Slither audit
   - Resolver warnings críticos
   - Verificar ReentrancyGuard

2. **Performance** (1 día)
   - Bundle size optimization
   - Lazy loading

3. **Deploy** (2 días)
   - Contratos a mainnet
   - Frontend a Vercel

**Entregable:** Aplicación en producción

---

## 🔧 Mejores Prácticas

### Wagmi 2.x

```typescript
const poolData = useReadContract({
  address: CONTRACTS.individualPool,
  abi: IndividualPoolV3ABI,
  functionName: "getUserPosition",
  args: [address],
  query: {
    enabled: !!address,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  },
});
```

### Foundry Fuzz

```solidity
function testFuzz_Deposit(uint256 amount) public {
    amount = bound(amount, MIN_DEPOSIT, MAX_DEPOSIT);
    vm.assume(amount > 0);
    pool.deposit{value: amount}();
}
```

---

## 📋 Checklist de Producción

### Smart Contracts

- [x] ReentrancyGuard
- [x] Security patterns
- [ ] Invariant tests
- [ ] Slither audit clean
- [ ] Mainnet deploy

### Frontend

- [x] Wagmi 2.x
- [x] React Query 5
- [ ] Server Components
- [ ] 80% coverage
- [ ] Bundle optimized

### Backend

- [x] SIWE auth
- [x] Rate limiting
- [ ] Rotating Pool endpoint

---

## 🎯 Arquitectura Simplificada

### Settings (Solo 2)

- /dashboard/settings/wallets/
- /dashboard/settings/activity/

### Features (4 Pools)

- /dashboard/individual-savings/
- /dashboard/cooperative-savings/
- /dashboard/prize-pool/
- /dashboard/rotating-pool/ (nuevo)

### Filosofía

- ✅ Solo wallet crypto
- ✅ Sin email/password
- ✅ Sin configuraciones
- ✅ Web3 puro 100%

---

## 📚 Referencias

- [Wagmi Docs](https://wagmi.sh/)
- [Viem Docs](https://viem.sh/)
- [Next.js 15](https://nextjs.org/docs)
- [TanStack Query 5](https://tanstack.com/query/v5/docs)
- [Foundry Book](https://book.getfoundry.sh/)
- [OpenZeppelin](https://www.openzeppelin.com/solidity-contracts)

---

## 🚀 Progreso

### Semana 1: Simplificación

- [ ] Eliminar settings innecesarios
- [ ] Actualizar Wallets page
- [ ] Crear Activity page

### Semana 2: Rotating Pool

- [ ] Hooks web3
- [ ] UI page

### Semana 3-4: Testing

- [ ] Contract tests
- [ ] Frontend tests

### Semana 5: Optimización

- [ ] Wagmi patterns
- [ ] Next.js RSC

### Semana 6: Deploy

- [ ] Security audit
- [ ] Production

---

**Última actualización:** 2026-02-07  
**Versión:** 1.0  
**Estado:** Semana 1 - En progreso
