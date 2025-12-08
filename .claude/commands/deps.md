---
description: Analyze and visualize monorepo dependencies
argument-hint: package (@khipu/web|@khipu/api|@khipu/contracts|all)
---

# Dependency Analysis

Analyze the KhipuVault monorepo package dependencies:

1. **Package Structure**

   ```
   @khipu/web      → @khipu/ui, @khipu/web3, @khipu/shared
   @khipu/api      → @khipu/database, @khipu/web3, @khipu/shared
   @khipu/blockchain → @khipu/database, @khipu/web3, @khipu/shared
   @khipu/web3     → @khipu/shared
   @khipu/ui       → @khipu/shared
   @khipu/database → (standalone)
   @khipu/shared   → (standalone)
   ```

2. **Check for Issues**
   - Circular dependencies (ESLint max depth 3)
   - Missing peer dependencies
   - Version mismatches across packages
   - Unused dependencies

3. **Build Order**

   ```
   1. @khipu/shared (no deps)
   2. @khipu/database (no internal deps)
   3. @khipu/ui (depends on shared)
   4. @khipu/web3 (depends on shared)
   5. @khipu/api (depends on database, web3, shared)
   6. @khipu/blockchain (depends on database, web3, shared)
   7. @khipu/web (depends on ui, web3, shared)
   ```

4. **Commands**
   ```bash
   pnpm list --recursive --depth 1  # List all deps
   pnpm why <package>               # Why is package installed
   pnpm outdated                    # Check for updates
   ```

Analyze the current state and report any dependency issues.
