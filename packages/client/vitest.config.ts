/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { configDefaults as vitestConfigDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
// Minimal inline client env injection for tests to avoid pulling server/shared runtime logic.
function clientDefine() {
  const clientCfg = {
    NODE_ENV: process.env.NODE_ENV || 'test',
    CLIENT_API_BASE_URL: 'http://localhost:3001',
    CLIENT_SOCKET_URL: 'http://localhost:3001',
    CLIENT_FEATURE_FLAGS: '',
    featureFlags: [],
  };
  return { __CLIENT_ENV__: JSON.stringify(clientCfg) };
}

export default defineConfig({
  define: clientDefine(),
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    css: true,
    exclude: [...vitestConfigDefaults.exclude, 'tests/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test-setup.ts',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'dist/',
        'build/',
      ],
    },
  },
});
