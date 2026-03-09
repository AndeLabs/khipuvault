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
    '@typescript-eslint/no-floating-promises': 'warn',
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/return-await': 'warn',
    // Allow || for defaults with potentially falsy values
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    // Allow non-null assertions where we know the value exists
    '@typescript-eslint/no-non-null-assertion': 'warn',
    // Allow awaiting non-promises
    '@typescript-eslint/await-thenable': 'warn',
    // Blockchain indexer needs await in loops for sequential processing
    'no-await-in-loop': 'off',
    // Allow async functions without await (common in event handlers)
    'require-await': 'off',
    // Import order - disable to avoid noise (already formatted)
    'import/order': 'off',
    // Curly braces - allow single-line ifs
    'curly': 'off',
    // Allow process.exit in CLI tools
    'no-process-exit': 'off',
  },
}
