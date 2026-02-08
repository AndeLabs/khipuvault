# Commit Message Convention

KhipuVault uses [Conventional Commits](https://www.conventionalcommits.org/) to maintain a clean and semantic commit history.

## Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

## Types

| Type       | Description                             | Example                                      |
| ---------- | --------------------------------------- | -------------------------------------------- |
| `feat`     | New feature                             | `feat(web): add deposit modal`               |
| `fix`      | Bug fix                                 | `fix(api): resolve JWT expiration`           |
| `docs`     | Documentation changes                   | `docs: update API documentation`             |
| `style`    | Code style/formatting (no logic change) | `style(contracts): format Solidity files`    |
| `refactor` | Code refactoring (no feature/fix)       | `refactor(blockchain): simplify listener`    |
| `perf`     | Performance improvements                | `perf(web): optimize React Query cache`      |
| `test`     | Adding or updating tests                | `test(contracts): add pool withdrawal tests` |
| `build`    | Build system/dependency changes         | `build: update to pnpm 9`                    |
| `ci`       | CI/CD configuration changes             | `ci: add Slither to GitHub Actions`          |
| `chore`    | Other changes (tooling, configs)        | `chore: update dependencies`                 |
| `revert`   | Revert a previous commit                | `revert: undo feat(web): add modal`          |

## Scopes (Optional)

### Workspace Scopes

- `web` - Frontend application
- `api` - Backend API
- `contracts` - Smart contracts
- `database` - Database/Prisma
- `blockchain` - Event indexer
- `web3` - Web3 package
- `ui` - UI components
- `shared` - Shared utilities
- `docs` - Documentation

### Feature Scopes

- `auth` - Authentication
- `pool` - Pool contracts/features
- `savings` - Savings features
- `cooperative` - Cooperative pools
- `individual` - Individual pools
- `portfolio` - Portfolio views
- `mezo` - Mezo integration
- `yield` - Yield features

### Infrastructure Scopes

- `ci` - CI/CD
- `config` - Configuration
- `deps` - Dependencies
- `docker` - Docker setup
- `env` - Environment

## Rules

### Required

- ✅ Type must be lowercase (e.g., `feat` not `Feat`)
- ✅ Subject must not be empty
- ✅ Subject must be at least 3 characters
- ✅ Subject must not end with a period
- ✅ Header must be max 100 characters

### Optional but Recommended

- Scope should be lowercase if present
- Scope should be from the predefined list (warning if not)
- Subject should be in imperative mood ("add" not "added")

## Examples

### Good Examples ✅

```bash
feat(web): add deposit modal to individual pool
fix(api): resolve JWT token expiration issue
docs: update smart contract deployment guide
refactor(contracts): simplify pool withdrawal logic
test(blockchain): add event listener integration tests
chore: update dependencies to latest versions
ci: add commitlint to pre-commit hooks
perf(web): optimize React Query cache strategy
```

### Bad Examples ❌

```bash
Added new feature              # Missing type and colon
feat add feature               # Missing colon after type
Feat(web): Add modal           # Type/subject should be lowercase
feat(web): added modal.        # Should use imperative mood, no period
fix: a                         # Subject too short
feat(web): this is a very long commit message that exceeds the maximum allowed character limit of 100 characters
```

## Tips

1. **Use imperative mood**: "add" not "added", "fix" not "fixed"
2. **Be concise**: Keep subject under 100 characters
3. **Use scope**: Helps identify which part of the codebase changed
4. **Body for context**: Use commit body for detailed explanations
5. **Reference issues**: Add "Closes #123" in footer when applicable

## Testing Your Commit

The commit-msg hook will automatically validate your message. If it fails:

1. Read the error message carefully
2. Fix the commit message format
3. Try again

Example error:

```
⧗   input: Added new feature
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
✖   found 2 problems, 0 warnings
```

## Bypass (Not Recommended)

If you absolutely need to bypass the check (strongly discouraged):

```bash
git commit --no-verify -m "emergency fix"
```

**Note**: This will also bypass lint-staged checks, so use with extreme caution.

## More Information

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Why Use Conventional Commits?](https://www.conventionalcommits.org/en/v1.0.0/#why-use-conventional-commits)
