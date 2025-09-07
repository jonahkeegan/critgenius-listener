/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'client-integration',
    include: ['src/__tests__/integration/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
    isolate: true,
    bail: 1,
    maxConcurrency: 1,
    sequence: { shuffle: false },
    reporters: ['default'],
    environment: 'node',
  },
});
