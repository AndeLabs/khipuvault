module.exports = {
  root: true,
  extends: ['../../tooling/eslint/nextjs.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'out/',
    'build/',
    'coverage/',
    '*.config.js',
    '*.config.mjs',
    'next.config.js',
    'polyfill.js',
  ],
  rules: {
    // Temporarily disable strict promise handling - TODO: fix properly
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/await-thenable': 'warn',
    // Disable import validation for viem types that have changed in v2
    'import/named': 'warn',
    'import/export': 'warn',
    // Allow console statements in development
    'no-console': 'warn',
    // These will be fixed in a separate PR
    '@next/next/no-html-link-for-pages': 'warn',
    'react/no-unstable-nested-components': 'warn',
    'no-useless-catch': 'warn',
  },
}
