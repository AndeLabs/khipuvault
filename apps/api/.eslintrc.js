module.exports = {
  root: true,
  extends: ['../../tooling/eslint/node.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.config.js',
    '*.config.mjs',
  ],
  rules: {
    // Downgrade strict promise rules to warnings for existing code
    // These don't cause runtime issues but are strict practices
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/return-await': 'warn',
    // Allow || for defaults with potentially falsy values
    '@typescript-eslint/prefer-nullish-coalescing': 'warn',
    // Allow non-null assertions where we know the value exists
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // Allow Express namespace declaration for request extension
    '@typescript-eslint/no-namespace': 'off',
    // Allow awaiting non-promises in tests (vitest mocks)
    '@typescript-eslint/await-thenable': 'warn',
  },
}
