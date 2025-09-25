import { defineConfig, loadEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import { loadEnvironment, getClientRuntimeConfig } from '@critgenius/shared';
import { getProxyRegistry, resolveTargetFromEnv } from '@critgenius/shared/config/proxyRegistry';
import { buildDevProxy, buildDevProxyWithDiscovery } from './src/config/devProxy';
import { envReloadPlugin } from './src/dev/envReloadPlugin';

// Build-time environment resolution (Node context) – guarded for safety
function resolveClientDefine(mode: string) {
  const nodeEnv =
    mode === 'production'
      ? 'production'
      : process.env.NODE_ENV || mode || 'development';
  process.env.NODE_ENV = nodeEnv; // ensure loader picks correct schema
  let envConfig: ReturnType<typeof loadEnvironment> | undefined;
  try {
    envConfig = loadEnvironment();
  } catch {
    // In client build we don't want to crash for missing server-only secrets; we fall back.
  }
  // Provide a typed empty fallback rather than using 'as any' to preserve type safety
  const emptyEnv: Partial<ReturnType<typeof loadEnvironment>> = {};
  const clientCfg = getClientRuntimeConfig(envConfig || emptyEnv);
  return { __CLIENT_ENV__: clientCfg };
}

// Manual chunking strategy: produce stable, cache-friendly groupings for frequently updated UI
// code vs rarely changing vendor dependencies. Keeps react/mui/socket.io isolated to optimize
// browser caching across deploys.
function createManualChunks(id: string): string | undefined {
  if (!id.includes('node_modules')) return undefined;
  if (id.includes('react')) return 'react';
  if (id.includes('@mui')) return 'mui';
  if (id.includes('socket.io-client')) return 'realtime';
  // Group remaining large deps into a generic vendor bucket; rely on Rollup hashing for cache bust.
  return 'vendor';
}

// https://vitejs.dev/config/
export default defineConfig(async ({ mode, command }) => {
  // Load raw env (Vite) mainly for MODE; shared loader handles deep validation.
  loadEnv(mode, process.cwd(), '');
  const define = resolveClientDefine(mode);
  const clientPort = Number(process.env.CLIENT_PORT || 5173);
  const httpsEnabled = (process.env.HTTPS_ENABLED || 'false').toString() === 'true';
  const httpsCert = process.env.HTTPS_CERT_PATH;
  const httpsKey = process.env.HTTPS_KEY_PATH;
  const httpsPort = Number(process.env.HTTPS_PORT || 5174);

  // Align protocol decisions with centralized proxy registry (single source of truth)
  // Touch the proxy registry to ensure config alignment (single source of truth)
  getProxyRegistry();
  const upstream = resolveTargetFromEnv(
    process.env as Record<string, string | undefined>
  );
  // Prefer dynamic discovery when running dev server; build remains sync
  const devProxy =
    command === 'serve'
      ? await buildDevProxyWithDiscovery(
          process.env as Record<string, string | undefined>
        )
      : buildDevProxy(process.env as Record<string, string | undefined>);

  // HTTPS options: only enable when explicitly requested and cert files exist
  let httpsOptions: { cert: Buffer; key: Buffer } | undefined;
  if (httpsEnabled && httpsCert && httpsKey) {
    try {
      const certExists = fs.existsSync(httpsCert);
      const keyExists = fs.existsSync(httpsKey);
      if (certExists && keyExists) {
        httpsOptions = {
          cert: fs.readFileSync(httpsCert),
          key: fs.readFileSync(httpsKey),
        };
      } else {
        console.warn(
          '[vite:https] HTTPS requested but certificate files missing – falling back to HTTP.'
        );
      }
    } catch (e) {
      console.warn(
        '[vite:https] Failed to load certificates – falling back to HTTP:',
        e instanceof Error ? e.message : e
      );
    }
  }

  const config: UserConfig = {
    define: {
      ...Object.entries(define).reduce(
        (acc, [k, v]) => ({ ...acc, [k]: JSON.stringify(v) }),
        {}
      ),
      __UPSTREAM_PROTOCOL__: JSON.stringify(upstream.protocol),
      __UPSTREAM_PORT__: JSON.stringify(upstream.port),
      'import.meta.vitest': 'undefined',
    },
    plugins: [
      react(),
      envReloadPlugin({
        // Prefer explicit, type-safe configuration; env var fallback remains supported.
        extraWatchPaths: [
          // Example shared configs or sibling packages; adjust as needed.
          // '../server/.env',
          // '../shared/config/app.json',
        ],
      }),
    ],
    server: {
      port: httpsEnabled ? httpsPort : clientPort,
      host: true,
      open: false,
      // HMR-over-WSS when server HTTPS is active; avoids mixed-content issues
      hmr: {
        overlay: true,
        protocol: httpsOptions ? 'wss' : 'ws',
        host: 'localhost',
        port: httpsEnabled ? httpsPort : clientPort,
      },
      watch: {
        // Exclude build output + tests from triggering unnecessary reloads
        ignored: ['**/dist/**', '**/coverage/**'],
      },
      ...(devProxy ? { proxy: devProxy } : {}),
      ...(httpsOptions ? { https: httpsOptions } : {}),
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      target: 'es2022',
      cssMinify: 'esbuild',
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks: createManualChunks,
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@mui/material', 'socket.io-client'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    cacheDir: path.resolve(__dirname, '../../node_modules/.vite/client'),
    esbuild: {
      jsx: 'automatic',
      jsxDev: mode !== 'production',
    },
  };
  // In test mode (vitest), avoid watching overhead; vitest sets command='serve' but NODE_ENV='test'
  if (process.env.VITEST && config.server) {
    // Narrow watching entirely in vitest context to eliminate fs watcher overhead
    config.server = {
      ...config.server,
      watch: { ignored: ['**/*'] },
    };
  }
  return config;
});

// Plugin now imported from dedicated module for direct unit testing.
