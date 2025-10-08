/// <reference types="vitest" />
import '../../tests/setup/install-test-globals';

import { dirname } from 'node:path';
import { fileURLToPath, URL as NodeURL } from 'node:url';
import type { PluginOption, UserConfig as ViteUserConfig } from 'vite';

import {
  assertUsesSharedConfig,
  createVitestConfig,
} from '../../vitest.shared.config';

async function importWithNodeURL<T>(load: () => Promise<T>): Promise<T> {
  const originalURL = globalThis.URL;

  try {
    (globalThis as typeof globalThis & { URL: typeof URL }).URL =
      NodeURL as unknown as typeof URL;
    return await load();
  } finally {
    (globalThis as typeof globalThis & { URL: typeof URL }).URL = originalURL;
  }
}

const { defineConfig } = (await importWithNodeURL(
  () => import('vite')
)) as typeof import('vite');
const { default: react } = (await importWithNodeURL(
  () => import('@vitejs/plugin-react')
)) as typeof import('@vitejs/plugin-react');

const packageRoot = dirname(fileURLToPath(import.meta.url));

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

const sharedConfig = createVitestConfig({
  packageRoot,
  environment: 'jsdom',
  setupFiles: [
    '../../tests/setup/common-vitest-hooks.ts',
    './src/test-setup.ts',
  ],
  tsconfigPath: `${packageRoot}/tsconfig.json`,
  coverageOverrides: {
    exclude: ['tests/**'],
  },
}) as ViteUserConfig;

const basePlugins = Array.isArray(sharedConfig.plugins)
  ? sharedConfig.plugins
  : sharedConfig.plugins
    ? [sharedConfig.plugins]
    : [];

const mergedPlugins: PluginOption[] = [...basePlugins, react()];

const mergedConfig: ViteUserConfig = {
  ...sharedConfig,
  define: {
    ...(sharedConfig.define ?? {}),
    ...clientDefine(),
  },
  plugins: mergedPlugins,
  test: {
    ...(sharedConfig.test ?? {}),
    css: true,
  },
};

export default defineConfig(assertUsesSharedConfig(mergedConfig));
