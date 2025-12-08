---
description: Initialize development environment from scratch
---

# Development Setup

Set up the complete KhipuVault development environment:

1. Check prerequisites:
   - Node.js 20+ installed
   - pnpm installed
   - Docker running

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start PostgreSQL:

   ```bash
   pnpm docker:up
   ```

4. Initialize database:

   ```bash
   pnpm db:generate
   pnpm db:push
   pnpm db:seed
   ```

5. Start development servers:
   ```bash
   pnpm dev
   ```

Run each step and report any errors. If Docker isn't running, remind the user to start Docker Desktop first.
