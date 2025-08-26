import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

// Flat config using typescript-eslint helper
export default tseslint.config(
  // Base recommended JS + TS rules
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Global language + React settings
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        global: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    settings: { react: { version: 'detect' } },
  },

  // TypeScript rule tuning
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        // Enable the lightweight project service so type-aware rules (no-unsafe-*) function
        // without needing explicit tsconfig listing (typescript-eslint v8+ flat config)
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },

  // Test files: relax strict unsafe/any rules for ergonomics
  {
    files: [
      '**/*.test.{ts,tsx,js,jsx}',
      '**/__tests__/**/*.{ts,tsx,js,jsx}',
      '**/test-setup.{ts,js}',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  // React + Accessibility configuration
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Additional accessibility tightening (project emphasis)
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-is-valid': 'off',
      'jsx-a11y/no-autofocus': 'error',
      'jsx-a11y/no-redundant-roles': 'off',
      'jsx-a11y/media-has-caption': 'off',
    },
  },

  // Focused component-level accessibility strictness (UI components)
  {
    files: ['packages/client/src/components/**/*.{tsx,jsx}'],
    rules: {
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
    },
  },

  // Prettier last to disable stylistic conflicts
  prettier,

  // Server performance-oriented overrides
  {
    files: ['packages/server/src/**/*.ts'],
    rules: {
      'no-console': 'off',
      'no-await-in-loop': 'warn',
      'prefer-spread': 'warn',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '**/*.d.ts',
      '**/*.js',
      '**/vitest.config.ts',
      // Exclude shared tests from typed linting due to tsconfig excludes
      'packages/shared/src/**/*.test.ts',
      '*.config.js',
      '*.config.mjs',
      '.husky/**',
      'pnpm-lock.yaml',
    ],
  }
);
