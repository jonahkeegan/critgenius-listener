/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.{ts,js}',
        '**/*.spec.{ts,js}',
        'dist/',
        'build/',
        'scripts/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/constants': resolve(__dirname, './src/constants'),
      '@/interfaces': resolve(__dirname, './src/interfaces'),
    },
  },
});
//# sourceMappingURL=vitest.config.js.map
