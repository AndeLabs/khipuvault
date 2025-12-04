module.exports = {
  extends: [
    './base.js',
    'next/core-web-vitals', // This already includes react and react-hooks
    'plugin:react/recommended',
  ],
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    // React Core Rules
    'react/react-in-jsx-scope': 'off', // Not needed in Next.js 13+
    'react/prop-types': 'off', // We use TypeScript for prop validation
    'react/display-name': 'warn',
    'react/no-unescaped-entities': 'warn',
    'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
    'react/jsx-key': ['error', { checkFragmentShorthand: true }], // Require key prop in lists
    'react/no-array-index-key': 'warn', // Avoid using index as key
    'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
    'react/self-closing-comp': 'warn', // Use self-closing tags when no children
    'react/jsx-boolean-value': ['warn', 'never'], // Omit boolean prop value when true
    'react/jsx-fragments': ['warn', 'syntax'], // Prefer <> over <Fragment>
    'react/no-danger': 'warn', // Warn about dangerouslySetInnerHTML
    'react/no-unstable-nested-components': ['error', { allowAsProps: true }],

    // React Hooks Rules
    'react-hooks/rules-of-hooks': 'error', // Critical: enforce rules of hooks
    'react-hooks/exhaustive-deps': 'warn', // Warn about missing dependencies

    // Next.js Specific Rules
    '@next/next/no-html-link-for-pages': 'error', // Use next/link for internal links
    '@next/next/no-img-element': 'warn', // Prefer next/image over <img>
    '@next/next/no-page-custom-font': 'warn', // Use next/font
    '@next/next/no-sync-scripts': 'error', // Scripts should be async
    '@next/next/no-title-in-document-head': 'error', // Use next/head
    '@next/next/no-document-import-in-page': 'error',
    '@next/next/no-head-import-in-document': 'error',

    // Performance & Best Practices
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }], // Warn about console.log in frontend
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksVoidReturn: {
          attributes: false, // Allow async event handlers in JSX
        },
      },
    ],

    // Accessibility (a11y) - Basic rules
    'jsx-a11y/alt-text': 'warn',
    'jsx-a11y/anchor-is-valid': 'warn',
    'jsx-a11y/aria-props': 'warn',
    'jsx-a11y/aria-proptypes': 'warn',
    'jsx-a11y/aria-unsupported-elements': 'warn',
    'jsx-a11y/role-has-required-aria-props': 'warn',
    'jsx-a11y/role-supports-aria-props': 'warn',
  },
  overrides: [
    {
      // Relax rules for test files
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/__tests__/**'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'react/display-name': 'off',
      },
    },
    {
      // Configuration files
      files: ['*.config.js', '*.config.ts', '*.config.mjs', 'next.config.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-commonjs': 'off',
      },
    },
    {
      // App directory - Server Components
      files: ['app/**/page.tsx', 'app/**/layout.tsx', 'app/**/loading.tsx', 'app/**/error.tsx'],
      rules: {
        'react-hooks/rules-of-hooks': 'off', // Server Components don't use hooks
      },
    },
  ],
}
