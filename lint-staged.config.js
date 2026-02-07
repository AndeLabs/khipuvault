module.exports = {
  "*.{ts,tsx}": ["eslint --fix --max-warnings=60", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "*.sol": ["forge fmt"],
};
