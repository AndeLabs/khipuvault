# Deploy Readiness Check

Check deployment readiness for **$ARGUMENTS** environment (testnet/mainnet).

## Pre-Deployment Checklist

### 1. Code Quality

Run the full quality suite:

```bash
pnpm lint --max-warnings 0
pnpm typecheck
pnpm test
```

### 2. Smart Contracts

For contract deployments:

```bash
cd packages/contracts
forge clean
forge build
forge test --gas-report
```

Check for:

- All tests passing
- No compiler warnings
- Gas costs within acceptable limits

### 3. Environment Variables

Verify all required environment variables are set:

**For Testnet:**

- `DATABASE_URL` - PostgreSQL connection
- `RPC_URL` - Mezo testnet RPC (https://rpc.test.mezo.org)
- `JWT_SECRET` - Authentication secret
- `DEPLOYER_PRIVATE_KEY` - Contract deployer wallet

**For Mainnet:**

- All testnet vars plus:
- Production database URL
- Mainnet RPC URL
- Multisig wallet addresses

### 4. Database

Check database migrations:

```bash
pnpm db:generate
pnpm db:push --dry-run
```

### 5. Build Verification

```bash
pnpm build
```

### 6. Security Review

Before mainnet deployment:

- [ ] Smart contract audit completed
- [ ] No critical/high findings open
- [ ] All secrets in environment variables (not code)
- [ ] Rate limiting configured
- [ ] CORS properly configured

## Output

Report deployment readiness with:

- **READY**: All checks pass
- **BLOCKED**: List specific blockers
- **WARNING**: List non-critical issues

Include specific commands to fix any issues found.
