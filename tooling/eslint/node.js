module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    // Node.js specific rules
    'no-console': 'off', // Allow console in Node.js environments
    'no-process-exit': 'warn', // Prefer proper error handling over process.exit
    'no-path-concat': 'error', // Use path.join() instead of __dirname + '/foo'

    // Async/await patterns in Node.js
    'require-await': 'warn', // Warn if async function has no await
    'no-return-await': 'off', // Disabled - conflicts with @typescript-eslint rule
    '@typescript-eslint/return-await': ['error', 'in-try-catch'], // Better handling of promises in try-catch

    // Imports for Node.js
    'import/no-commonjs': 'off', // Allow CommonJS in Node.js
    'import/no-nodejs-modules': 'off', // Allow Node.js built-in modules
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],

    // TypeScript specific for Node.js
    '@typescript-eslint/no-var-requires': 'warn', // Prefer import over require

    // Security - Critical for backend
    'no-process-env': 'off', // Allow process.env (needed for configuration)

    // Performance
    'no-await-in-loop': 'warn', // Warn about potential performance issues

    // Error Handling
    'handle-callback-err': 'error', // Ensure errors in callbacks are handled
    'no-new-require': 'error', // Disallow new require()
  },
  overrides: [
    {
      // Relax rules for test files and test setup
      files: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        '**/test/**',
        '**/tests/**',
        '**/setup.ts',
        '**/vitest.setup.ts',
      ],
      env: {
        jest: true,
        node: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-console': 'off',
        'no-undef': 'off', // Vitest/Jest globals handled by types
      },
    },
    {
      // Configuration files
      files: ['*.config.js', '*.config.ts', '*.config.mjs'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-commonjs': 'off',
      },
    },
  ],
}
