# ESLint Configuration

Centralized ESLint configuration for the KhipuVault monorepo.

## Overview

This package provides shared ESLint configurations that enforce code quality, consistency, and best practices across the entire monorepo.

## Configurations

### Base Configuration (`base.js`)

The base configuration is used by all packages and includes:

- **TypeScript Rules**: Strict but practical TypeScript linting
  - Warns about explicit `any` usage (doesn't break builds)
  - Catches unhandled promises and async errors
  - Enforces proper TypeScript patterns

- **Import Rules**: Organized and consistent imports
  - Alphabetically sorted imports
  - Groups: builtin → external → internal → parent/sibling → index
  - Special handling for `@khipu/*` internal packages
  - Prevents circular dependencies

- **Code Quality**: General best practices
  - Warns about console.log (allows console.warn, console.error, console.info)
  - Enforces === over ==
  - Requires const over let when possible
  - Prevents var usage

- **Security Rules**: Basic security protections
  - Prevents eval() and similar dangerous patterns
  - Enforces proper error handling

### Node.js Configuration (`node.js`)

Extends base configuration with Node.js-specific rules:

- Allows console usage (common in backend)
- Enforces proper async/await patterns
- Warns about performance issues (await in loops)
- Relaxed rules for test and config files

**Usage:**

```js
module.exports = {
  extends: ["../../tooling/eslint/node.js"],
  parserOptions: {
    project: "./tsconfig.json",
  },
};
```

### Next.js Configuration (`nextjs.js`)

Extends base configuration with React and Next.js-specific rules:

- **React Rules**: Component best practices
  - No missing keys in lists
  - Proper hook usage
  - Self-closing tags
  - No inline components

- **Next.js Rules**: Framework-specific optimizations
  - Use next/link for internal navigation
  - Use next/image instead of img tags
  - Proper Next.js patterns

- **Accessibility**: Basic a11y rules
  - Alt text for images
  - Proper ARIA attributes
  - Valid anchor tags

- **Special Overrides**:
  - Server Components (app directory) - disables hooks rules
  - Test files - relaxed TypeScript rules
  - Config files - allows CommonJS

**Usage:**

```js
module.exports = {
  extends: ["../../tooling/eslint/nextjs.js"],
  parserOptions: {
    project: "./tsconfig.json",
  },
};
```

## Rule Severity Philosophy

- **error**: Critical issues that can cause bugs or security problems
  - Unhandled promises
  - Circular dependencies
  - Security vulnerabilities
  - Missing keys in React lists

- **warn**: Best practices that should be followed but won't break builds
  - Explicit any usage
  - Import ordering
  - Console.log statements
  - Optional chaining opportunities

## Running ESLint

### From Root

```bash
# Lint all packages
pnpm lint

# Lint specific package
pnpm lint --filter=@khipu/api
pnpm lint --filter=@khipu/web
```

### From Individual Package

```bash
# In apps/api or apps/web
pnpm lint

# Auto-fix issues
pnpm lint --fix
```

## Auto-fixing Issues

Many issues can be automatically fixed:

```bash
# Fix all auto-fixable issues
pnpm lint --fix

# Fix specific package
pnpm --filter=@khipu/api lint --fix
```

## Ignoring Patterns

Common ignore patterns are already configured:

- `node_modules/`
- `dist/`, `build/`, `.next/`, `out/`
- `coverage/`
- `*.config.js`, `*.config.mjs`
- `.turbo/`, `.cache/`

## Dependencies

This configuration includes:

- `@typescript-eslint/eslint-plugin` - TypeScript-specific rules
- `@typescript-eslint/parser` - TypeScript parser for ESLint
- `eslint-plugin-import` - Import/export linting
- `eslint-plugin-react` - React-specific rules
- `eslint-plugin-react-hooks` - React Hooks rules
- `eslint-plugin-jsx-a11y` - Accessibility rules
- `eslint-config-next` - Next.js ESLint config

## Customization

To customize rules for a specific package, add overrides to the package's `.eslintrc.js`:

```js
module.exports = {
  extends: ["../../tooling/eslint/node.js"],
  parserOptions: {
    project: "./tsconfig.json",
  },
  rules: {
    // Override specific rules
    "no-console": "off",
  },
};
```

## Troubleshooting

### Plugin conflicts

If you see plugin conflicts, ensure you're not duplicating plugin declarations between configs.

### Import resolution issues

Make sure your `tsconfig.json` has proper path mappings configured.

### Performance issues

ESLint with TypeScript rules can be slow on large codebases. Consider:

- Using `.eslintignore` for large generated files
- Running ESLint on changed files only in CI
- Enabling ESLint caching: `--cache`

## Editor Integration

### VSCode

Install the ESLint extension and add to `.vscode/settings.json`:

```json
{
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

### Other Editors

Most modern editors have ESLint plugins available. Refer to your editor's documentation.
