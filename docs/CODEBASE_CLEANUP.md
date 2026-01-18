# KhipuVault - Codebase Cleanup Report

**Date:** January 2026
**Purpose:** Document and track removal of non-functional code

---

## Summary

This document tracks placeholder code, unused files, and redundant components that were identified and cleaned up to prepare the codebase for audit and production.

---

## 1. Placeholder Pages Removed

### Settings Section

The following placeholder pages were removed from `apps/web/src/app/dashboard/settings/`:

| File                   | Original Content                 | Action      |
| ---------------------- | -------------------------------- | ----------- |
| `activity/page.tsx`    | `return <div>Actividad</div>`    | **DELETED** |
| `appearance/page.tsx`  | `return <div>Apariencia</div>`   | **DELETED** |
| `preferences/page.tsx` | `return <div>Preferencias</div>` | **DELETED** |
| `security/page.tsx`    | `return <div>Seguridad</div>`    | **DELETED** |

### Navigation Updated

File: `apps/web/src/app/dashboard/settings/layout.tsx`

Removed nav items:

- `/dashboard/settings/appearance`
- `/dashboard/settings/security`
- `/dashboard/settings/preferences`
- `/dashboard/settings/activity`

---

## 2. Empty Components Removed

| File                                         | Issue          | Action      |
| -------------------------------------------- | -------------- | ----------- |
| `apps/web/src/components/sections/stats.tsx` | Returns `null` | **DELETED** |

---

## 3. Disabled/Obsolete Tests Removed

| Directory                           | Content                  | Action      |
| ----------------------------------- | ------------------------ | ----------- |
| `packages/contracts/unit.disabled/` | Old IndividualPool.t.sol | **DELETED** |

---

## 4. Unused Hooks and Utilities Removed

The following files were found to be unused (never imported anywhere in the codebase):

| File                                            | Reason                                       | Action      |
| ----------------------------------------------- | -------------------------------------------- | ----------- |
| `hooks/web3/use-user-transactions.ts`           | Duplicate of use-user-transaction-history.ts | **DELETED** |
| `lib/blockchain/fetch-user-transactions.ts`     | Only imported by unused hook                 | **DELETED** |
| `lib/query-options/individual-pool-queries.ts`  | Query options pattern never adopted          | **DELETED** |
| `lib/query-options/cooperative-pool-queries.ts` | Query options pattern never adopted          | **DELETED** |
| `lib/query-options/lottery-pool-queries.ts`     | Query options pattern never adopted          | **DELETED** |

**Note:** The `use-user-transaction-history.ts` hook is actively used and provides the same functionality.

---

## 5. Duplicate ABIs Consolidated (Previous Session)

### Before Cleanup

Two locations contained ABIs:

- `apps/web/src/contracts/abis/` (14 files, used by frontend)
- `packages/web3/src/abis/` (5 files, partially used)

### After Cleanup

- **Kept:** `apps/web/src/contracts/abis/` (source of truth for frontend)
- **Removed:** `packages/web3/src/abis/*.json` files (only kept index.ts with re-exports)

---

## 5. Settings Pages - Final Structure

### Functional Pages (Kept)

| Path                                | Description              | Lines |
| ----------------------------------- | ------------------------ | ----- |
| `/dashboard/settings`               | Profile page             | 75    |
| `/dashboard/settings/wallets`       | Wallet management        | 155   |
| `/dashboard/settings/notifications` | Notification preferences | 105   |

### Navigation Menu (Updated)

```typescript
const settingsNav = [
  { href: "/dashboard/settings", icon: User, label: "Perfil" },
  { href: "/dashboard/settings/wallets", icon: Wallet, label: "Wallets" },
  { href: "/dashboard/settings/notifications", icon: Bell, label: "Notificaciones" },
];
```

---

## 6. Files Verified as Functional

The following were reviewed and confirmed as **functional and necessary**:

### Frontend (apps/web)

- All hooks in `src/hooks/web3/` - Functional Web3 integrations
- All components in `src/features/` - Functional feature components
- All UI components in `src/components/ui/` - shadcn components

### Backend (apps/api)

- All routes in `src/routes/` - Functional API endpoints
- All services in `src/services/` - Business logic
- All middleware in `src/middleware/` - Security and auth

### Contracts (packages/contracts)

- All V3 contracts in `src/pools/v3/` - Production contracts
- All tests in `test/` - Active test suite (207 tests)

---

## 7. Items NOT Removed (Intentional)

| Item                             | Reason to Keep                           |
| -------------------------------- | ---------------------------------------- |
| `mainnet.ts` with zero addresses | Will be updated after mainnet deployment |
| `ZERO_ADDRESS` constant          | Used for validation checks               |
| Test mock files in `test/mocks/` | Required for contract testing            |
| `.env.example` files             | Documentation for setup                  |

---

## Cleanup Commands Executed

```bash
# Remove placeholder settings pages
rm apps/web/src/app/dashboard/settings/activity/page.tsx
rm apps/web/src/app/dashboard/settings/appearance/page.tsx
rm apps/web/src/app/dashboard/settings/preferences/page.tsx
rm apps/web/src/app/dashboard/settings/security/page.tsx
rmdir apps/web/src/app/dashboard/settings/activity
rmdir apps/web/src/app/dashboard/settings/appearance
rmdir apps/web/src/app/dashboard/settings/preferences
rmdir apps/web/src/app/dashboard/settings/security

# Remove empty stats component
rm apps/web/src/components/sections/stats.tsx

# Remove disabled tests
rm -rf packages/contracts/unit.disabled

# Remove duplicate ABIs (keep frontend source, update web3 package)
# Updated packages/web3/src/abis/index.ts to re-export from apps/web

# Remove unused transaction hooks and query-options (Session 2)
rm apps/web/src/hooks/web3/use-user-transactions.ts
rm apps/web/src/lib/blockchain/fetch-user-transactions.ts
rm -rf apps/web/src/lib/query-options/

# Remove example/reference files (Session 2)
rm apps/api/src/lib/logger.example.ts
```

---

## Verification

After cleanup (January 13, 2026):

- [x] `pnpm typecheck` passes (all 4 packages)
- [x] `pnpm lint` passes (existing warnings only)
- [x] Contract tests pass (207/207, 5 skipped)
- [x] `pnpm build` passes (all 9 packages)
- [ ] All routes work in browser - pending manual verification

---

## Future Considerations

1. **Settings Pages:** If activity/appearance/preferences/security features are needed, implement them properly rather than adding placeholders.

2. **ABI Management:** Consider generating ABIs automatically from contract builds and copying to frontend during build process.

3. **Component Library:** The `@khipu/ui` package is listed as a dependency but not actively used. Either:
   - Remove from dependencies if not needed
   - Start using it by importing shared components from `@khipu/ui` instead of local `components/ui/`

4. **Network Config Summary:** `docs/NETWORK_CONFIG_SUMMARY.md` documents past work and could be archived if space optimization is needed.
