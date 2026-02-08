# Spelling Guide - KhipuVault

This project uses [cspell](https://cspell.org/) to catch spelling errors in code, comments, and documentation.

## Quick Start

```bash
# Check all files
pnpm spell:check

# Check only staged files (for pre-commit)
pnpm spell:check:changed
```

## How It Works

cspell checks spelling in:

- TypeScript/JavaScript files (.ts, .tsx, .js, .jsx)
- Solidity files (.sol)
- Markdown documentation (.md)
- JSON configuration files (.json)

It automatically ignores:

- node_modules and build outputs
- Generated files (Prisma, contracts)
- String literals and imports
- Hex addresses (0x...)
- Package names (@khipu/web3)
- Version numbers (v1.2.3)

## Adding Words to Dictionary

When cspell flags a word that is correct (project-specific term, blockchain jargon, etc.), add it to the custom dictionary:

### Option 1: Edit .cspell-custom.txt (Recommended)

```bash
# Open the custom dictionary
nano .cspell-custom.txt

# Add your word (one per line, sorted alphabetically)
myword
```

### Option 2: Add to .cspell.json

For context-specific words, add them to the `ignoreWords` array in `.cspell.json`:

```json
{
  "ignoreWords": ["typeof", "readonly", "myword"]
}
```

## Common False Positives

### Already Handled

These are automatically ignored:

- Solidity types: `uint256`, `bytes32`, `nonReentrant`
- Test functions: `beforeAll`, `afterAll`, `describe`, `expect`
- Hex values: `0xdfBEd2D3efBD2071fD407bF169b5e5533eA90393`
- Package names: `@khipu/web3`, `wagmi`, `viem`
- Short abbreviations: `tx`, `msg`, `src`, `dest`

### Need Manual Addition

If you see false positives for:

- **New blockchain terms**: Add to `.cspell-custom.txt` under "Blockchain & DeFi Terms"
- **New libraries**: Add under "Tech Stack & Tools"
- **Contract names**: Add under "Contract Names"
- **Acronyms**: Add under "Abbreviations & Acronyms"

## When to Ignore vs Fix

### Ignore (Add to Dictionary)

- Technical jargon: `DeFi`, `testnet`, `monorepo`
- Project-specific: `KhipuVault`, `Mezo`, `MUSD`
- Library names: `wagmi`, `viem`, `prisma`
- Blockchain terms: `wei`, `gwei`, `satoshi`

### Fix (Actual Typo)

- Misspelled words: `teh` → `the`, `recieve` → `receive`
- Comment typos: `// Retreive data` → `// Retrieve data`
- Documentation errors: `seperate` → `separate`

## Integration with Git Hooks

cspell runs automatically on markdown files during `git commit` via lint-staged.

**Important**: cspell does NOT block commits for code files to avoid being too noisy with:

- Variable names (`uint256`)
- Function names (`nonReentrant`)
- Package imports

Only markdown files are spell-checked during commit to maintain documentation quality.

## Configuration Files

- `.cspell.json` - Main configuration
- `.cspell-custom.txt` - Custom dictionary (project-specific words)
- `.lintstagedrc.json` - Git hook configuration

## Tips

### Check Specific Files

```bash
# Single file
cspell apps/web/src/components/Button.tsx

# Glob pattern
cspell "apps/web/**/*.tsx"

# Multiple patterns
cspell "*.md" "packages/**/*.ts"
```

### Inline Ignore

For one-off cases, use inline comments:

```typescript
// cspell:disable-next-line
const weirdVariableName = "xyz123abc";

/* cspell:disable */
// Large block of code with special terms
/* cspell:enable */
```

### File-level Ignore

Add to top of file:

```typescript
/* cspell:disable */

// Entire file ignored
```

## CI Integration

cspell does NOT run in CI by default to keep the pipeline focused on critical checks:

- ESLint (code quality)
- TypeScript (type safety)
- Vitest (tests)
- Forge (smart contracts)

To add cspell to CI, add to `.github/workflows/ci.yml`:

```yaml
- name: Spell Check
  run: pnpm spell:check
```

## Troubleshooting

### Too Many False Positives

1. Check if the word is in a regex ignore pattern in `.cspell.json`
2. Add common terms to `.cspell-custom.txt`
3. For file-specific issues, use inline `cspell:disable`

### Word Not Being Ignored

1. Verify it's in `.cspell-custom.txt` (no extra spaces or comments on same line)
2. Ensure `minWordLength: 3` threshold is met
3. Check if `caseSensitive: false` is set (should be)

### Git Hook Failing

If cspell blocks commits unexpectedly:

```bash
# Bypass for emergency
git commit --no-verify -m "fix: critical bug"

# Then fix spelling issues
pnpm spell:check
```

## Examples

### Good Variable Names (Auto-ignored)

```typescript
const txHash = "0x..."; // Short abbreviation
const msgSender = msg.sender; // Common Web3 term
const uint256Value = 123n; // Solidity type
```

### Add to Dictionary

```typescript
// Add "tBTC" to .cspell-custom.txt
const tBTCAmount = parseUnits("1.5", 18);
```

### Fix Typo

```typescript
// Before (typo)
// Retreive user balance from database

// After (fixed)
// Retrieve user balance from database
```

## Resources

- [cspell Documentation](https://cspell.org/)
- [cspell Configuration Schema](https://cspell.org/configuration/)
- [Regular Expressions in cspell](https://cspell.org/configuration/patterns/)

## Questions?

- Check `.cspell.json` for current configuration
- Review `.cspell-custom.txt` for existing terms
- Ask in team chat if unsure about adding a word
