---
description: Reset database to clean state with fresh seed data
---

# Database Reset

Reset the KhipuVault database to a clean state:

1. Stop any running services that use the database
2. Drop and recreate the database:
   ```bash
   pnpm docker:down
   pnpm docker:up
   ```
3. Wait for PostgreSQL to be ready (5 seconds)
4. Push the schema:
   ```bash
   pnpm db:push
   ```
5. Seed initial data:
   ```bash
   pnpm db:seed
   ```

Report the final state and any errors encountered.
