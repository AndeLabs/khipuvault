---
description: Scaffold a new feature across the full stack
argument-hint: feature-name
---

# Add New Feature: $ARGUMENTS

Create the scaffolding for a new feature in KhipuVault.

## Steps

1. **Analyze Requirements**
   - What data models are needed?
   - What API endpoints are required?
   - What UI components are needed?
   - What smart contract interactions (if any)?

2. **Database Layer** (if needed)
   - Add models to `packages/database/prisma/schema.prisma`
   - Generate Prisma client: `pnpm db:generate`
   - Push schema: `pnpm db:push`

3. **API Layer** (apps/api)
   - Create route: `src/routes/$ARGUMENTS.ts`
   - Create service: `src/services/$ARGUMENTS.ts`
   - Add Zod validation schemas
   - Register in `src/index.ts`

4. **Web3 Layer** (if blockchain interaction needed)
   - Add hooks: `packages/web3/src/hooks/`
   - Export from barrel file

5. **Frontend** (apps/web)
   - Create feature folder: `src/features/$ARGUMENTS/`
   - Add components, hooks, and types
   - Add to navigation if needed

6. **Tests**
   - API tests
   - Component tests
   - Integration tests

Ask clarifying questions about the feature requirements before proceeding.
