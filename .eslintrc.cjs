module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    '@electron-toolkit/eslint-config-ts/recommended',
    '@electron-toolkit/eslint-config-prettier'
  ],
  settings: {
    react: {
      version: '18.3.1'
    }
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off'
  }
}
