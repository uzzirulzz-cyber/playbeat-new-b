import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.vercel/**', '**/coverage/**'] },
  js.configs.recommended,
  {
    files: ['frontend/src/**/*.{js,jsx}'],
    ...react.configs.recommended,
    languageOptions: {
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    settings: { react: { version: 'detect' } },
    rules: { 'react/prop-types': 'off', 'react/react-in-jsx-scope': 'off', 'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }] },
  },
  {
    files: ['backend/**/*.js', 'shared/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs', globals: { ...globals.node } },
    rules: { 'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]|^_usage' }] },
  },
  {
    files: ['backend/tests/**/*.js'],
    languageOptions: { globals: { ...globals.jest } },
  },
];
