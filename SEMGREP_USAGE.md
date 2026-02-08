# Semgrep Static Application Security Testing (SAST)

Semgrep is configured for free static analysis security testing across the KhipuVault monorepo.

## Quick Start

```bash
# Run with automatic rule detection (recommended)
pnpm security:semgrep

# Run with custom KhipuVault-specific rules
pnpm security:semgrep:custom

# Run for CI/CD with JSON output
pnpm security:semgrep:ci
```

## Installation

Semgrep CLI is free and doesn't require registration. Install globally or use via npx:

```bash
# Install globally (recommended)
brew install semgrep  # macOS
pip install semgrep   # pip

# Or use without installation
npx semgrep --config auto .
```

## Available Commands

### `pnpm security:semgrep`

Runs Semgrep with automatic rule detection. This uses Semgrep's free community rulesets:

- `p/javascript` - JavaScript security patterns
- `p/typescript` - TypeScript security patterns
- `p/react` - React/JSX security patterns
- `p/nodejs` - Node.js security patterns
- `p/security-audit` - General security audit rules
- Auto-detects languages and applies relevant rules

**Use this for:** Regular security scans and CI/CD integration

### `pnpm security:semgrep:custom`

Runs custom KhipuVault-specific rules from `.semgrep.yml`:

- Custom Web3/blockchain security patterns
- CLAUDE.md anti-pattern enforcement
- Project-specific code quality rules
- Solidity smart contract security

**Use this for:** Enforcing project-specific coding standards

### `pnpm security:semgrep:ci`

Runs Semgrep for CI/CD pipelines:

- Uses `--error` flag to fail on findings
- Outputs JSON report to `semgrep-report.json`
- Suitable for automated gates

**Use this for:** CI/CD pipeline integration

## Configuration Files

### `.semgrep.yml`

Custom security rules tailored for KhipuVault:

- **JavaScript/TypeScript Security**: eval, hardcoded secrets, SQL injection, XSS
- **TypeScript Best Practices**: any usage, @ts-ignore warnings
- **Web3/Blockchain**: BigInt conversions, tx.origin, reentrancy
- **Express/API**: missing validation, open redirects, CORS
- **Solidity**: tx.origin auth, reentrancy, floating pragma, unchecked calls
- **CLAUDE.md Enforcement**: console.log, any types, BigInt conversions

### `.semgrepignore`

Excludes non-source directories:

- `node_modules/`, build outputs (`.next/`, `dist/`, `out/`)
- Generated code (`typechain/`, `artifacts/`, `prisma/migrations/`)
- Test fixtures and mocks
- Environment files and secrets
- Lock files and logs

## Detected Vulnerability Types

### Critical (ERROR)

- Code injection (eval, Function constructor)
- SQL injection via string concatenation
- Hardcoded secrets and credentials
- Weak cryptographic algorithms (MD5, SHA-1, DES)
- BigInt to Number precision loss (Web3)
- Solidity tx.origin authentication
- Solidity reentrancy patterns
- Unchecked low-level calls

### High (WARNING)

- XSS via dangerouslySetInnerHTML
- console.log in production code
- Missing input validation in Express routes
- Open redirect vulnerabilities
- TypeScript any usage
- @ts-ignore without @ts-expect-error
- Solidity floating pragma in production

### Medium (INFO)

- Missing CORS configuration
- Environment variable exposure risks
- Unhandled Web3 promises

## Example Output

```
┌──── ○○○ ───────────────────────────────────────────────────────────┐
│ Semgrep found 5 findings                                            │
└─────────────────────────────────────────────────────────────────────┘

  apps/api/src/routes/auth.ts
     ❯❯❱ typescript-avoid-any
        Avoid using 'any' type as specified in CLAUDE.md anti-patterns

        12┆ const userData: any = req.body;
           ⋮┆----------------------------------------

  apps/web/src/features/portfolio/Portfolio.tsx
     ❯❯❱ console-log-in-production
        console.log should not be used in production code

        45┆ console.log('Portfolio data:', data);
           ⋮┆----------------------------------------

  packages/contracts/src/IndividualPool.sol
     ❯❯❱ solidity-reentrancy-pattern
        Possible reentrancy vulnerability detected

        89┆ payable(msg.sender).transfer(amount);
        90┆ totalDeposits -= amount;
           ⋮┆----------------------------------------
```

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/security.yml`:

```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  semgrep:
    name: Semgrep SAST
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Install Semgrep
        run: pip install semgrep

      - name: Run Semgrep
        run: semgrep --config auto --error .

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: semgrep-results
          path: semgrep-report.json
```

### GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
semgrep:
  stage: test
  image: returntocorp/semgrep
  script:
    - semgrep --config auto --error .
  artifacts:
    when: always
    paths:
      - semgrep-report.json
    reports:
      sast: semgrep-report.json
```

## Best Practices

### 1. Run Before Every Commit

Add to pre-commit hook or run manually:

```bash
pnpm security:semgrep:custom
```

### 2. Fix High-Severity Issues First

Focus on ERROR-level findings before WARNING-level.

### 3. Suppress False Positives

Add inline comments for legitimate use cases:

```typescript
// nosemgrep: typescript-avoid-any
const dynamicData: any = externalAPI.getData();
```

### 4. Update Rules Regularly

Custom rules in `.semgrep.yml` should evolve with the codebase.

### 5. Combine with Other Tools

Use Semgrep alongside:

- **Snyk**: Dependency vulnerabilities (`pnpm security:snyk:test`)
- **Shannon/Aderyn**: Smart contract audits (`pnpm security:scan`)
- **npm audit**: Package vulnerabilities (`pnpm security:audit`)

## Project-Specific Rules

### Web3/Blockchain Security

- **BigInt Precision**: Catches `Number(bigIntValue)` conversions
- **tx.origin Auth**: Detects dangerous authentication patterns
- **Reentrancy**: Basic state-after-call pattern detection

### CLAUDE.md Enforcement

- **console.log**: Enforces Pino logger usage
- **TypeScript any**: Enforces proper typing
- **@ts-ignore**: Prevents silent error suppression

### Express API Security

- **Input Validation**: Detects missing Zod validation
- **CORS Config**: Ensures proper CORS setup
- **Open Redirects**: Catches unvalidated redirects

## Troubleshooting

### "command not found: semgrep"

Install Semgrep CLI:

```bash
brew install semgrep  # macOS
pip install semgrep   # Linux/Windows
```

### Too many false positives

1. Review findings in context
2. Suppress legitimate cases with `// nosemgrep: rule-id`
3. Adjust rule severity in `.semgrep.yml`
4. Add patterns to `.semgrepignore`

### Slow scans

1. Ensure `.semgrepignore` excludes build artifacts
2. Use `--config .semgrep.yml` instead of `--config auto` for faster scans
3. Scan specific directories: `semgrep --config auto apps/api`

## Resources

- **Semgrep Documentation**: https://semgrep.dev/docs/
- **Community Rules**: https://semgrep.dev/explore
- **Custom Rule Writing**: https://semgrep.dev/docs/writing-rules/overview
- **Pattern Syntax**: https://semgrep.dev/docs/writing-rules/pattern-syntax

## Comparison with Other SAST Tools

| Feature          | Semgrep                  | Snyk Code           | SonarQube         |
| ---------------- | ------------------------ | ------------------- | ----------------- |
| **Free Tier**    | Unlimited local scans    | Limited scans/month | Community edition |
| **Languages**    | 30+ including Solidity   | 10+ mainstream      | 25+ mainstream    |
| **Custom Rules** | Easy YAML syntax         | No                  | Complex XML       |
| **Speed**        | Fast                     | Medium              | Slow              |
| **Web3 Support** | Good (with custom rules) | Limited             | None              |
| **CI/CD**        | Easy integration         | Easy integration    | Requires server   |

**Recommendation**: Use Semgrep for free local SAST, Snyk for dependency scanning, Shannon/Aderyn for deep Solidity audits.

## License

Semgrep CLI is free and open source (LGPL 2.1). No registration required for local use.
