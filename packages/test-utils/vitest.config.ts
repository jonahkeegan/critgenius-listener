import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // tests in this package run under node
    globals: true,
    isolate: true,
    // limit test file scanning to relevant patterns to avoid scanning workspace
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    coverage: {
      provider: 'v8', // fastest, works well on Node 20
      reporter: ['json', 'lcov', 'text-summary'],
      reportsDirectory: 'coverage',
      all: true,
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.*', 'tests/**', 'node_modules/**', 'dist/**'],
      // ensure the json reporter creates coverage-final.json that your aggregator expects
      // vitest + v8 produces `coverage-*.json` and `coverage-final.json` (with reporter json)
    },
  },
});
