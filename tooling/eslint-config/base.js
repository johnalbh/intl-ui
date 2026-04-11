import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Shared ESLint flat config for @intl-ui packages.
 *
 * Usage in a package:
 *
 *   // packages/<name>/eslint.config.js
 *   import baseConfig from '@intl-ui/eslint-config/base';
 *   export default baseConfig;
 */
export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.config.{js,mjs,cjs,ts}',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  tseslint.configs.stylistic,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      // Type-safety: require explicit type imports for clean ESM/CJS dual builds.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'off',

      // Allow underscored args/vars to be unused (common in callbacks).
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Enforce a coherent code style across packages.
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // Explicit parameter type annotations are documentation in a public library;
      // they show up in editor hovers. Allow even when inferable from defaults.
      '@typescript-eslint/no-inferrable-types': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
    },
  },
  {
    // Test files: looser rules so authoring stays ergonomic.
    files: ['**/*.test.ts', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
