---
description: Validate environment configuration across all apps
---

# Environment Validation

Check that all required environment variables are configured:

1. Check root `.env`:
   - DATABASE_URL
   - RPC_URL

2. Check `apps/web/.env.local`:
   - NEXT_PUBLIC_API_URL
   - NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID
   - NEXT_PUBLIC_CHAIN_ID

3. Check `apps/api/.env`:
   - DATABASE_URL
   - JWT_SECRET
   - CORS_ORIGIN
   - RPC_URL

4. Verify each `.env.example` file exists and list any missing variables.

5. Check for common issues:
   - Trailing whitespace in values
   - Missing quotes around values with spaces
   - Incorrect URLs

Report which files exist, which are missing, and any configuration issues found.
