/// <reference types="vitest" />

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL, URL as NodeURL } from 'node:url';
import type { PluginOption } from 'vite';
import type { UserConfig } from 'vitest/config';

import {
  assertUsesSharedConfig,
  createVitestConfig,
} from '../../vitest.shared.config';

import type { CoverageConfigModule } from '../../config/coverage.config.types';

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

const coverageConfigModule = (await import(
  pathToFileURL(join(packageRoot, '..', '..', 'config', 'coverage.config.mjs'))
    .href
)) as CoverageConfigModule;
const clientTheme = coverageConfigModule.getCoverageTheme('client');

if (!clientTheme) {
  throw new Error('Missing client coverage configuration');
}

const clientCoverageDirectory = clientTheme.reportsDirectory;
const clientCoverageThresholds = { ...clientTheme.thresholds };

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
    '../../tests/setup/install-test-globals.ts',
    '../../tests/setup/common-vitest-hooks.ts',
    './src/test-setup.ts',
  ],
  tsconfigPath: `${packageRoot}/tsconfig.json`,
  coverageOverrides: {
    exclude: ['tests/**'],
    reportsDirectory: clientCoverageDirectory,
    thresholds: clientCoverageThresholds,
  },
}) as UserConfig;

const basePlugins = Array.isArray(sharedConfig.plugins)
  ? sharedConfig.plugins
  : sharedConfig.plugins
    ? [sharedConfig.plugins]
    : [];

const mergedPlugins: PluginOption[] = [
  ...basePlugins,
  react() as unknown as PluginOption,
];

const mergedConfig: UserConfig = {
  ...sharedConfig,
  define: {
    ...(sharedConfig.define ?? {}),
    ...clientDefine(),
  },
  plugins: mergedPlugins,
  test: {
    ...(sharedConfig.test ?? {}),
    exclude: Array.from(
      new Set([
        ...((sharedConfig.test?.exclude as string[]) ?? []),
        'tests/integration/visual/**',
        'tests/visual/**',
      ])
    ),
    css: true,
  },
};

export default defineConfig(assertUsesSharedConfig(mergedConfig));
