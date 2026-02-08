# Commit Message Quick Reference

## Format

```
<type>(<scope>): <subject>
```

## Common Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `chore` - Maintenance
- `refactor` - Code restructuring
- `test` - Tests
- `perf` - Performance
- `ci` - CI/CD changes

## Common Scopes

- `web`, `api`, `contracts`, `database`
- `auth`, `pool`, `savings`
- `config`, `deps`, `ci`

## Quick Examples

```bash
git commit -m "feat(web): add deposit modal"
git commit -m "fix(api): resolve auth issue"
git commit -m "docs: update README"
git commit -m "chore(deps): update packages"
```

## Rules

- Type must be lowercase
- Subject min 3 chars, max 100 chars
- No period at end
- Use imperative mood ("add" not "added")

## Help

```bash
pnpm commit:help  # Full guide
```

## Common Mistakes

❌ `Added feature` → ✅ `feat: add feature`
❌ `Feat: Add.` → ✅ `feat: add feature`
❌ `fix: ok` → ✅ `fix: resolve auth token issue`
