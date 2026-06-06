/** Root ESLint config. Per-workspace configs extend the shared package. */
module.exports = {
  root: true,
  extends: ['@caresync/eslint-config'],
  ignorePatterns: ['apps/**', 'packages/**', 'node_modules', 'dist', '.next', 'coverage'],
};
