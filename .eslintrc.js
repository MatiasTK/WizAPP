module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['import'],
  rules: {
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    'no-await-in-loop': 'off',
  },
};
