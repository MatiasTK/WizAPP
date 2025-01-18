// eslint.config.mjs
import pluginJs from '@eslint/js';
import tseslintPlugin from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';

export default tseslintPlugin.config(
  pluginJs.configs.recommended,
  tseslintPlugin.configs.recommended,
  tseslintPlugin.configs.strict,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.electron,
  importPlugin.flatConfigs.react,
  importPlugin.flatConfigs.typescript,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  {
    settings: {
      'import/resolver': {
        // You will also need to install and configure the TypeScript resolver
        // See also https://github.com/import-js/eslint-import-resolver-typescript#configuration
        typescript: true,
        node: true,
      },
      react: {
        version: '18.3',
      },
    },
  },
  {
    plugins: {
      reactPlugin,
    },
  },
  {
    ignores: ['**/lib'],
  }
);
