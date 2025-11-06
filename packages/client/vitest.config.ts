/// <reference types="vitest" />

import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL, URL as NodeURL } from 'node:url';
import { type PluginOption } from 'vite';
import { defineConfig, type UserConfig } from 'vitest/config';

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

const sharedConfigExport = createVitestConfig({
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
});

const sharedConfig = sharedConfigExport as unknown as UserConfig;

const sharedPlugins = sharedConfig.plugins;

const basePlugins: PluginOption[] = Array.isArray(sharedPlugins)
  ? (sharedPlugins as PluginOption[])
  : sharedPlugins
    ? [sharedPlugins as PluginOption]
    : [];

const mergedPlugins: PluginOption[] = [...basePlugins, react() as PluginOption];

const mergedConfig: UserConfig = {
  ...sharedConfig,
  define: {
    ...(sharedConfig.define ?? {}),
    ...clientDefine(),
  },
  plugins: mergedPlugins as unknown as NonNullable<UserConfig['plugins']>,
  test: {
    ...(sharedConfig.test ?? {}),
    css: true,
  },
};

// @ts-expect-error - Duplicate Vite installations in node_modules cause incompatible Plugin types.
// The config is structurally valid and works at runtime. This is a known pnpm hoisting issue.
assertUsesSharedConfig(mergedConfig);

export default defineConfig(mergedConfig);
