---
description: Quick automated security scan using Aderyn
argument-hint: (optional output path)
---

# Quick Security Scan

Run a quick automated security scan on the smart contracts using Aderyn.

## Instructions

1. Run Aderyn on the contracts:

```bash
cd /Users/munay/dev/KhipuVault/packages/contracts && aderyn . --output /Users/munay/dev/KhipuVault/security/scans/aderyn-$(date +%Y%m%d-%H%M).md 2>&1
```

2. Read the generated report and summarize:
   - Total issues found (High/Low)
   - Top 3 most critical findings
   - Quick recommendations

3. If user provided an output path argument, copy the report there.

Note: This is a quick scan. For comprehensive audits use `/security-audit all`.
