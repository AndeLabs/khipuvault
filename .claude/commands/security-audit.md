---
description: Security audit for smart contracts and backend code
argument-hint: target (contracts|api|web|all)
---

# Security Audit

Perform a security review of KhipuVault code using automated tools and manual analysis.

## Automated Tools Available

### Smart Contracts (Solidity)
1. **Aderyn** (Cyfrin) - Rust-based static analyzer with 63 detectors
   ```bash
   cd packages/contracts && aderyn . --output security/scans/aderyn-$(date +%Y%m%d).md
   ```

2. **Slither** (Trail of Bits) - Python-based with 92+ detectors
   ```bash
   cd packages/contracts && slither . --json security/scans/slither-$(date +%Y%m%d).json
   ```

### General Code (TypeScript/JavaScript)
3. **Semgrep** - Security scanner with 5000+ rules
   ```bash
   semgrep scan --config auto apps/ packages/ --output security/scans/semgrep-$(date +%Y%m%d).json
   ```

## Smart Contract Security Checklist

Check for:
- Reentrancy vulnerabilities
- Integer overflow/underflow (Solidity 0.8+ safe, but verify)
- Access control issues
- Unchecked external calls
- Front-running opportunities
- Gas griefing vectors
- Centralization risks
- Flash loan attack vectors
- Price oracle manipulation
- CEI pattern compliance

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

## Instructions

For the argument provided (or all if none):
1. Run available automated scanners
2. Review the generated reports
3. Perform manual code review for complex logic
4. Generate a summary with:
   - Critical vulnerabilities
   - High-risk issues
   - Medium-risk issues
   - Best practice recommendations
5. Save reports to `security/scans/`
