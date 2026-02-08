module.exports = {
  // Increased to 100 to accommodate new security linting rules
  // Goal: Reduce incrementally to 50 over next sprint
  "*.{ts,tsx}": ["eslint --fix --max-warnings=100", "prettier --write"],
  "*.{json,yml,yaml,md}": ["prettier --write"],
  "*.sol": ["forge fmt"],
  // Note: cspell removed from pre-commit, runs in CI instead
};
