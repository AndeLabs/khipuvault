---
description: Security audit for smart contracts and backend code
argument-hint: target (contracts|api|web|all)
---

# Security Audit

Perform a security review of KhipuVault code:

## Smart Contract Security (packages/contracts)

Check for:

- Reentrancy vulnerabilities
- Integer overflow/underflow (Solidity 0.8+ safe, but verify)
- Access control issues
- Unchecked external calls
- Front-running opportunities
- Gas griefing vectors
- Centralization risks

## Backend Security (apps/api)

Check for:

- SQL injection (Prisma parameterized queries)
- Authentication bypass
- Authorization flaws
- Rate limiting
- Input validation (Zod schemas)
- CORS configuration
- JWT security

## Frontend Security (apps/web)

Check for:

- XSS vulnerabilities
- CSP headers configuration
- Wallet connection security
- Private key exposure risks

For the argument provided (or all if none), analyze the code and report:

1. Critical vulnerabilities
2. High-risk issues
3. Medium-risk issues
4. Best practice recommendations
