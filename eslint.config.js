import eslint from '@eslint/js';
import perfectionist from 'eslint-plugin-perfectionist';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: ['dist/**', 'coverage/**', '.mastra/**', 'vitest.config.js'],
  },
  // Base rules for all files
  eslint.configs.recommended,
  // TypeScript specific configuration - only for .ts files
  {
    extends: [...tseslint.configs.strict, ...tseslint.configs.stylistic],
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  // Perfectionist for all files
  perfectionist.configs['recommended-natural'],
  {
    rules: {},
  },
  // Disable object sorting for schema files
  {
    files: ['**/*.schema.ts'],
    rules: {},
  },
  // Test files specific configuration
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    plugins: {},
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
);
