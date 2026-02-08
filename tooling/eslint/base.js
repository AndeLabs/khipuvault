module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'security', 'no-secrets', '@microsoft/sdl'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:security/recommended-legacy',
  ],
  rules: {
    // TypeScript Rules - Strict but practical
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error to not break builds
    '@typescript-eslint/explicit-function-return-type': 'off', // Too strict for everyday use
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Let inference work
    '@typescript-eslint/no-non-null-assertion': 'warn', // Warn about ! operator
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    '@typescript-eslint/prefer-optional-chain': 'warn',
    '@typescript-eslint/no-floating-promises': 'error', // Critical: catch unhandled promises
    '@typescript-eslint/await-thenable': 'error', // Prevent awaiting non-promises
    '@typescript-eslint/no-misused-promises': 'error', // Prevent promise misuse
    '@typescript-eslint/ban-ts-comment': [
      'warn',
      {
        'ts-expect-error': 'allow-with-description',
        'ts-ignore': 'allow-with-description',
        'ts-nocheck': true,
        minimumDescriptionLength: 10,
      },
    ],

    // Import Rules - Keep code organized
    'import/order': [
      'warn',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling'],
          'index',
          'object',
          'type',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        },
        pathGroups: [
          {
            pattern: '@khipu/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
      },
    ],
    'import/no-duplicates': 'warn',
    'import/no-unresolved': 'error',
    'import/named': 'error',
    'import/default': 'error',
    'import/no-cycle': ['error', { maxDepth: 3 }], // Prevent circular dependencies

    // General Code Quality
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // Warn about console.log
    'no-debugger': 'error',
    'no-alert': 'warn',
    'prefer-const': 'warn',
    'no-var': 'error', // Use let/const instead
    'eqeqeq': ['error', 'always', { null: 'ignore' }], // Require === and !==
    'curly': ['warn', 'all'], // Require braces for all control statements
    'no-throw-literal': 'error', // Throw Error objects only
    'prefer-template': 'warn', // Use template literals instead of string concatenation
    'no-nested-ternary': 'warn', // Avoid complex ternaries

    // Security Rules - Core JavaScript
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // Security Plugin Rules
    'security/detect-object-injection': 'warn', // Many false positives, downgrade to warn
    'security/detect-non-literal-regexp': 'warn', // Common pattern, warn instead of error
    'security/detect-unsafe-regex': 'error', // Keep as error - can cause DoS
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn', // Backend needs this sometimes
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn', // Backend file operations
    'security/detect-non-literal-require': 'warn', // Dynamic imports may be needed
    'security/detect-possible-timing-attacks': 'warn', // Can have false positives
    'security/detect-pseudoRandomBytes': 'error', // Always use crypto.randomBytes

    // No Secrets Plugin Rules
    'no-secrets/no-secrets': ['error', { tolerance: 4.5 }], // Detect hardcoded secrets

    // Microsoft SDL Plugin Rules
    '@microsoft/sdl/no-insecure-url': 'error', // Prevent http:// URLs
    '@microsoft/sdl/no-html-method': 'error', // Prevent .html() jQuery methods
    '@microsoft/sdl/no-inner-html': 'warn', // Warn about innerHTML (allow with sanitization)
    '@microsoft/sdl/no-insecure-random': 'error', // Use crypto.randomBytes instead of Math.random
    '@microsoft/sdl/no-cookies': 'warn', // Warn about document.cookie usage
    '@microsoft/sdl/no-document-write': 'error', // Never use document.write
    '@microsoft/sdl/no-msapp-exec-unsafe': 'error', // Windows app security
    '@microsoft/sdl/no-postmessage-star-origin': 'error', // Require specific origin in postMessage
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['tsconfig.json', 'apps/*/tsconfig.json', 'packages/*/tsconfig.json'],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.next/',
    'out/',
    'coverage/',
    '*.config.js',
    '*.config.mjs',
    '.turbo/',
    '.cache/',
  ],
}
