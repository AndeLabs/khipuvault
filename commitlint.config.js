/**
 * Commitlint configuration for KhipuVault
 * Enforces conventional commit format: <type>(<scope>): <subject>
 *
 * Valid types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert
 *
 * Examples:
 *   ✓ feat(web): add deposit modal to individual pool
 *   ✓ fix(api): resolve JWT token expiration issue
 *   ✓ chore: update dependencies
 *   ✗ added new feature (missing type)
 *   ✗ feat add feature (missing colon)
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type enum - allowed commit types
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Code style changes (formatting, missing semi colons, etc)
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvements
        'test',     // Adding or updating tests
        'build',    // Changes to build system or external dependencies
        'ci',       // Changes to CI configuration files and scripts
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Reverts a previous commit
      ],
    ],
    // Case rules
    'type-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],

    // Length rules
    'header-max-length': [2, 'always', 100],
    'subject-min-length': [2, 'always', 3],

    // Format rules
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],

    // Scope validation (optional but recommended)
    'scope-case': [2, 'always', 'lower-case'],
    'scope-enum': [
      1, // Warning level - scope is optional but must be valid if present
      'always',
      [
        // Workspace scopes
        'web',
        'api',
        'contracts',
        'database',
        'blockchain',
        'web3',
        'ui',
        'shared',
        'docs',

        // Feature scopes
        'auth',
        'pool',
        'savings',
        'cooperative',
        'individual',
        'portfolio',
        'mezo',
        'yield',

        // Infrastructure scopes
        'ci',
        'config',
        'deps',
        'docker',
        'env',
      ],
    ],
  },
  // Custom help message for failed commits
  helpUrl: 'https://www.conventionalcommits.org/en/v1.0.0/',
  prompt: {
    messages: {
      skip: ':skip',
      max: 'upper %d chars',
      min: '%d chars at least',
      emptyWarning: 'can not be empty',
      upperLimitWarning: 'over limit',
      lowerLimitWarning: 'below limit',
    },
    questions: {
      type: {
        description: "Select the type of change that you're committing:",
        enum: {
          feat: {
            description: 'A new feature',
            title: 'Features',
            emoji: '✨',
          },
          fix: {
            description: 'A bug fix',
            title: 'Bug Fixes',
            emoji: '🐛',
          },
          docs: {
            description: 'Documentation only changes',
            title: 'Documentation',
            emoji: '📚',
          },
          style: {
            description: 'Changes that do not affect the meaning of the code',
            title: 'Styles',
            emoji: '💎',
          },
          refactor: {
            description: 'A code change that neither fixes a bug nor adds a feature',
            title: 'Code Refactoring',
            emoji: '📦',
          },
          perf: {
            description: 'A code change that improves performance',
            title: 'Performance Improvements',
            emoji: '🚀',
          },
          test: {
            description: 'Adding missing tests or correcting existing tests',
            title: 'Tests',
            emoji: '🚨',
          },
          build: {
            description: 'Changes that affect the build system or external dependencies',
            title: 'Builds',
            emoji: '🛠',
          },
          ci: {
            description: 'Changes to CI configuration files and scripts',
            title: 'Continuous Integrations',
            emoji: '⚙️',
          },
          chore: {
            description: "Other changes that don't modify src or test files",
            title: 'Chores',
            emoji: '♻️',
          },
          revert: {
            description: 'Reverts a previous commit',
            title: 'Reverts',
            emoji: '🗑',
          },
        },
      },
    },
  },
};
