# KhipuVault - Plan de Trabajo

## 🎯 SEMANA 1: Simplificación (ACTUAL)

### Día 1-2: Limpiar Settings

- [ ] Eliminar `/dashboard/settings/preferences/`
- [ ] Eliminar `/dashboard/settings/security/`
- [ ] Eliminar `/dashboard/settings/notifications/`
- [ ] Actualizar `/dashboard/settings/page.tsx` (solo 2 links)

### Día 3-4: Wallets Page (Datos Reales)

- [ ] Importar `useAccount`, `useBalance`, `useDisconnect` de Wagmi
- [ ] Reemplazar address mock por `address` real
- [ ] Reemplazar balance mock por `balance?.formatted`
- [ ] Conectar botón "Desconectar" con `disconnect()`
- [ ] Mostrar connector name real (`connector?.name`)

### Día 5: Activity Page

- [ ] Crear `/dashboard/settings/activity/page.tsx`
- [ ] Usar hook `useUserTransactionHistory(address)`
- [ ] Tabla con: fecha, tipo, monto, status
- [ ] Filtros por tipo (deposit, withdraw, claim)

---

## 🎯 SEMANA 2: Rotating Pool UI

### Día 1-2: Hooks Web3

- [ ] Crear `/hooks/web3/rotating/use-rotating-pool.ts`
- [ ] Crear `/hooks/web3/rotating/use-create-rotating-pool.ts`
- [ ] Crear `/hooks/web3/rotating/use-join-rotating-pool.ts`
- [ ] Crear `/hooks/web3/rotating/index.ts` (barrel export)

### Día 3-5: UI Page

- [ ] Crear `/dashboard/rotating-pool/page.tsx`
- [ ] Card: Crear nuevo ROSCA (modal)
- [ ] Lista: ROSCAs activos (cards)
- [ ] Card detalle: Mi turno, próximo pago, miembros
- [ ] Botón: Unirse a ROSCA
- [ ] Historial: Distribuciones pasadas

---

## 🎯 SEMANA 3: Testing Contratos

### Contratos (3 días)

- [ ] Invariant test: `YieldAggregatorV3`
- [ ] Fuzz mejorado: `RotatingPool` (bound, assume)
- [ ] Edge cases: todos los contratos
- [ ] Slither: correr y resolver warnings

### Hooks (4 días)

- [ ] Test: `use-cooperative-pool.test.ts`
- [ ] Test: `use-lottery-pool.test.ts`
- [ ] Test: `use-rotating-pool.test.ts`
- [ ] Test: `use-claim-yields.test.ts`

---

## 🎯 SEMANA 4: Testing Frontend

### Componentes (3 días)

- [ ] Test: `transaction-card.test.tsx`
- [ ] Test: `pool-card.test.tsx`
- [ ] Test: `deposit-form.test.tsx`
- [ ] Test: `wallet-connection-button.test.tsx`

### Integration (3 días)

- [ ] Test: `individual-savings.test.tsx`
- [ ] Test: `cooperative-savings.test.tsx`
- [ ] Test: `prize-pool.test.tsx`

---

## 🎯 SEMANA 5: Mejores Prácticas

### Wagmi (2 días)

- [ ] Agregar `staleTime: 1000 * 60 * 5` a todos los hooks
- [ ] Agregar `gcTime: 1000 * 60 * 30` a todos los hooks
- [ ] Agregar `enabled: !!address` donde corresponda
- [ ] Renombrar `isLoading` → `isPending`

### Next.js (2 días)

- [ ] Convertir layouts a Server Components
- [ ] Agregar `<Suspense>` boundaries
- [ ] Mover data fetching a server side donde sea posible

### React Query (1 día)

- [ ] Config global con defaults
- [ ] Prefetching en hover (pool cards)

---

## 🎯 SEMANA 6: Deploy

### Security (2 días)

- [ ] `slither . --exclude-dependencies`
- [ ] Resolver warnings críticos
- [ ] Verificar ReentrancyGuard

### Performance (1 día)

- [ ] Medir bundle size
- [ ] Lazy loading components pesados
- [ ] Lighthouse audit (target: 90+)

### Deploy (2 días)

- [ ] Deploy contratos a Mezo mainnet
- [ ] Actualizar `deployed.json`
- [ ] Deploy frontend a Vercel
- [ ] Verificar CI/CD passing

---

## 📊 Métricas

| Métrica                   | Actual | Target |
| ------------------------- | ------ | ------ |
| Test Coverage (Frontend)  | 15%    | 80%+   |
| Test Coverage (Contratos) | 100%   | 100%   |
| Settings Pages            | 4      | 2      |
| Pool Features             | 3      | 4      |
| Bundle Size               | ?      | <500KB |
| Lighthouse                | ?      | 90+    |

---

## 🔥 Quick Reference

### Comandos Útiles

```bash
# Testing
pnpm test                    # Run all tests
pnpm test:watch              # Watch mode
pnpm test:coverage           # Coverage report

# Contratos
cd packages/contracts
forge test -vvv              # Run tests verbose
forge test --gas-report      # Gas report
slither . --exclude-dependencies

# Frontend
cd apps/web
pnpm dev                     # Dev server
pnpm build                   # Production build
pnpm typecheck               # Check types
```

### Archivos Clave

```
apps/web/src/app/dashboard/settings/
apps/web/src/hooks/web3/
packages/contracts/src/
packages/contracts/test/
```

---

**Estado:** Semana 1 en progreso  
**Próximo:** Simplificar Settings
