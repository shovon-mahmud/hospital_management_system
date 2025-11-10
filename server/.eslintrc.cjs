module.exports = {
  env: { node: true, es2022: true, jest: true },
  extends: ['eslint:recommended','plugin:import/recommended','prettier'],
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  rules: {
    'import/no-unresolved': 0
  }
};
