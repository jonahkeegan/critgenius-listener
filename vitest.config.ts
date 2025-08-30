import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.{test,spec}.ts', 'tests/**/*.spec.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
});
