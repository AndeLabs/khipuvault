# Semgrep Quick Reference

Free SAST (Static Application Security Testing) for KhipuVault

## Quick Commands

```bash
# Run with auto-detected rules (recommended)
pnpm security:semgrep

# Run with custom KhipuVault rules
pnpm security:semgrep:custom

# CI/CD mode (fails on findings)
pnpm security:semgrep:ci
```

## What Semgrep Checks

### Critical Issues (ERROR)

- Code injection (eval, Function constructor)
- SQL injection patterns
- Hardcoded secrets
- Weak crypto (MD5, SHA-1)
- BigInt → Number precision loss
- Solidity tx.origin usage
- Reentrancy patterns
- Unchecked low-level calls

### Warnings

- XSS via dangerouslySetInnerHTML
- console.log in production
- TypeScript `any` usage
- @ts-ignore usage
- Missing input validation

### Info

- Environment variable exposure
- Unhandled promises
- CORS configuration

## Configuration Files

- `.semgrep.yml` - Custom rules for KhipuVault
- `.semgrepignore` - Excluded paths
- `SEMGREP_USAGE.md` - Full documentation

## Example Output

```
┌──── ○○○ ────────────────────────────────────────────┐
│ Semgrep found 3 findings                             │
└──────────────────────────────────────────────────────┘

  apps/api/src/routes/auth.ts
     ❯❯❱ typescript-avoid-any
        Avoid using 'any' type

        12┆ const userData: any = req.body;
```

## Suppress False Positives

```typescript
// nosemgrep: rule-id
const legitimateCase: any = externalAPI.getData();
```

## CI/CD Integration

Already integrated in `.github/workflows/security.yml`:

- Runs on every PR and push to main
- Uploads results to GitHub Security tab
- Generates JSON reports

## Pro Tips

1. Run before committing:

   ```bash
   pnpm security:semgrep:custom
   ```

2. Fix ERROR-level findings first

3. Focus on security issues before style issues

4. Combine with other tools:
   - Snyk for dependencies
   - Slither for Solidity
   - Shannon/Aderyn for deep audits

## Resources

- Full docs: `SEMGREP_USAGE.md`
- Semgrep docs: https://semgrep.dev/docs/
- Community rules: https://semgrep.dev/explore

## Installation (Optional)

```bash
# macOS
brew install semgrep

# pip
pip install semgrep

# Or use via npx (no install needed)
npx semgrep --config auto .
```

## Common Issues

### "command not found: semgrep"

Install Semgrep CLI or use `npx semgrep` instead

### Too slow

- Check `.semgrepignore` excludes build folders
- Scan specific directory: `semgrep --config auto apps/api`
- Use custom rules: `pnpm security:semgrep:custom`

### Too many findings

1. Fix ERROR level first
2. Review context for false positives
3. Add `// nosemgrep` for legitimate cases
4. Adjust rule severity in `.semgrep.yml`
