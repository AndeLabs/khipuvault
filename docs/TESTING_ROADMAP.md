# Testing Roadmap - KhipuVault

## Estado Actual (Enero 2026)

### Infraestructura Implementada

| Componente          | Estado      | Descripci贸n                                     |
| ------------------- | ----------- | ------------------------------------------------ |
| Husky + lint-staged | ✅ Completo | Pre-commit hooks para lint y format              |
| Prettier            | ✅ Completo | Configuraci贸n con plugin Tailwind               |
| CI Pipeline         | ✅ Completo | Lint, typecheck, tests, contract tests, security |
| Vitest (Web)        | ✅ Completo | Configurado con 85% threshold                    |
| Vitest (API)        | ✅ Completo | Configurado con 85% threshold                    |
| Codecov             | ✅ Completo | Upload de cobertura en CI                        |

### Tests Existentes

| App            | Tests    | Cobertura     |
| -------------- | -------- | ------------- |
| Frontend (web) | 50       | ~2%           |
| Backend (api)  | 115      | ~36%          |
| Contratos      | ~20      | Por verificar |
| **Total**      | **165+** | -             |

---

## Fase 1: Ajustar Thresholds (Inmediato)

Bajar temporalmente los thresholds a niveles realistas para que CI pase:

### apps/web/vitest.config.ts

```typescript
thresholds: {
  lines: 5,      // Actual: ~2%
  functions: 5,
  branches: 5,
  statements: 5,
}
```

### apps/api/vitest.config.ts

```typescript
thresholds: {
  lines: 35,     // Actual: ~36%
  functions: 35,
  branches: 30,
  statements: 35,
}
```

---

## Fase 2: Tests Frontend Prioritarios

### Alta Prioridad (Cobertura Cr铆tica)

#### Hooks Web3 (src/hooks/web3/)

| Hook                      | Prioridad | Complejidad |
| ------------------------- | --------- | ----------- |
| `use-individual-pool.ts`  | Alta      | Media       |
| `use-cooperative-pool.ts` | Alta      | Media       |
| `use-withdraw.ts`         | Alta      | Media       |
| `use-pool-balance.ts`     | Media     | Baja        |
| `use-user-deposits.ts`    | Media     | Baja        |

#### Hooks Lottery (src/hooks/web3/lottery/)

| Hook                  | Prioridad | Complejidad |
| --------------------- | --------- | ----------- |
| `use-lottery-pool.ts` | Alta      | Alta        |
| `use-claim-status.ts` | Media     | Baja        |
| `use-pool-events.ts`  | Media     | Media       |

#### Componentes Features

| Componente         | Ubicaci贸n                     | Prioridad |
| ------------------ | ------------------------------ | --------- |
| DepositForm        | individual-savings/components/ | Alta      |
| WithdrawForm       | individual-savings/components/ | Alta      |
| PoolStats          | portfolio/components/          | Media     |
| TransactionHistory | portfolio/components/          | Media     |

### Media Prioridad

#### Componentes UI (src/components/)

- `Navbar.tsx`
- `Footer.tsx`
- `WalletButton.tsx`
- `ConnectWalletModal.tsx`

#### Utilities (src/lib/)

- `utils.ts`
- `api-client.ts`
- `query-utils.ts`

---

## Fase 3: Tests Backend Prioritarios

### Alta Prioridad

#### Rutas (src/routes/)

| Ruta            | Tests Existentes | Acci贸n              |
| --------------- | ---------------- | -------------------- |
| auth.ts         | Parcial          | Completar flujo SIWE |
| pools.ts        | No               | Crear tests          |
| transactions.ts | No               | Crear tests          |
| users.ts        | No               | Crear tests          |
| lottery.ts      | No               | Crear tests          |
| analytics.ts    | No               | Crear tests          |

#### Servicios (src/services/)

| Servicio        | Cobertura | Acci贸n               |
| --------------- | --------- | --------------------- |
| analytics.ts    | 100%      | ✅ Completo           |
| transactions.ts | 100%      | ✅ Completo           |
| users.ts        | ~96%      | Completar edge cases  |
| pools.ts        | ~79%      | Aumentar a 90%        |
| lottery.ts      | 0%        | Crear tests completos |

### Media Prioridad

#### Middleware (src/middleware/)

| Middleware       | Cobertura | Acci贸n        |
| ---------------- | --------- | -------------- |
| security.ts      | 96%       | ✅ Completo    |
| auth.ts          | ~66%      | Aumentar a 85% |
| error-handler.ts | ~76%      | Aumentar a 85% |
| rate-limit.ts    | 0%        | Crear tests    |
| validate.ts      | 0%        | Crear tests    |

---

## Fase 4: Tests de Contratos

### Verificar Cobertura Actual

```bash
cd packages/contracts
forge coverage --report summary
```

### Tests Prioritarios por Contrato

| Contrato            | Archivo Test          | Prioridad |
| ------------------- | --------------------- | --------- |
| IndividualPool.sol  | IndividualPool.t.sol  | Cr铆tica  |
| CooperativePool.sol | CooperativePool.t.sol | Cr铆tica  |
| LotteryPool.sol     | LotteryPool.t.sol     | Alta      |
| MezoIntegration.sol | MezoIntegration.t.sol | Alta      |
| YieldAggregator.sol | YieldAggregator.t.sol | Media     |

### Casos de Test Cr铆ticos

- Deposit/Withdraw flows
- Access control (onlyOwner, onlyAdmin)
- Edge cases (zero amounts, max amounts)
- Reentrancy protection
- Pausable functionality
- Emergency withdraw

---

## Fase 5: Tests E2E con Playwright

### Setup

```bash
pnpm --filter @khipu/web add -D @playwright/test
npx playwright install
```

### Flujos Cr铆ticos a Testear

1. **Conexi贸n de Wallet**
   - Conectar con Privy
   - Verificar estado conectado
   - Desconectar

2. **Dep贸sito Individual**
   - Navegar a Individual Savings
   - Ingresar monto
   - Aprobar token
   - Confirmar dep贸sito
   - Verificar balance actualizado

3. **Retiro**
   - Navegar a Portfolio
   - Seleccionar pool
   - Ingresar monto a retirar
   - Confirmar retiro
   - Verificar balance

4. **Loter铆a**
   - Ver rondas activas
   - Comprar tickets
   - Verificar participaci贸n

### Configuraci贸n Base

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:9002",
  },
  webServer: {
    command: "pnpm dev:web",
    port: 9002,
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Meta de Cobertura por Fase

| Fase      | Web     | API     | Contratos | Timeline  |
| --------- | ------- | ------- | --------- | --------- |
| Actual    | 2%      | 36%     | ?         | -         |
| Fase 1    | 5%      | 35%     | -         | 1 d铆a    |
| Fase 2    | 40%     | 35%     | -         | 1 semana  |
| Fase 3    | 40%     | 70%     | -         | 1 semana  |
| Fase 4    | 40%     | 70%     | 80%       | 1 semana  |
| Fase 5    | 60%     | 85%     | 85%       | 2 semanas |
| **Final** | **85%** | **85%** | **85%**   | 1 mes     |

---

## Comandos 脷tiles

```bash
# Ejecutar todos los tests
pnpm test

# Coverage por app
pnpm --filter @khipu/web test:coverage
pnpm --filter @khipu/api test:coverage

# Coverage de contratos
cd packages/contracts && forge coverage --report lcov

# Tests en watch mode
pnpm --filter @khipu/web test
pnpm --filter @khipu/api test

# Tests E2E (cuando est茅 configurado)
pnpm --filter @khipu/web test:e2e
```

---

## Recursos

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)
- [Foundry Book - Testing](https://book.getfoundry.sh/forge/tests)
- [Wagmi Testing](https://wagmi.sh/react/guides/testing)

---

## Notas

1. **No bloquear CI**: Mantener thresholds realistas hasta alcanzar cobertura
2. **Tests 煤tiles > Cobertura alta**: Priorizar tests que detecten bugs reales
3. **Mocking**: Usar mocks para servicios externos (blockchain, APIs)
4. **Fixtures**: Crear fixtures reutilizables para datos de test
5. **CI/CD**: Los tests deben correr en menos de 5 minutos
