import { defineConfig, loadEnv, type UserConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import fs from 'node:fs';
import { loadEnvironment, getClientRuntimeConfig } from '@critgenius/shared';
import { buildDevProxy } from './src/config/devProxy';

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

// Dev-only plugin: watch .env* changes and trigger a full page reload so updated client-safe
// variables (after validation) become visible without manual restart. Kept intentionally simple
// and privacy-aware (never logs values).
function envReloadPlugin(): Plugin {
  return {
    name: 'env-reload',
    apply: 'serve',
    configureServer(server) {
      const candidates = ['.env', '.env.local', '.env.development'];
      const root = process.cwd();
      const watched: string[] = [];
      candidates.forEach(file => {
        const p = path.resolve(root, file);
        if (fs.existsSync(p)) {
          watched.push(p);
          fs.watchFile(p, { interval: 700 }, () => {
            server.ws.send({ type: 'full-reload', path: '*' });
          });
        }
      });
      // Cleanup on server close to avoid leaking watchers during restarts (HMR / plugin reload)
      const close = () => {
        watched.forEach(p => fs.unwatchFile(p));
      };
      server.httpServer?.once('close', close);
    },
  };
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
export default defineConfig(({ mode }) => {
  // Load raw env (Vite) mainly for MODE; shared loader handles deep validation.
  loadEnv(mode, process.cwd(), '');
  const define = resolveClientDefine(mode);
  const clientPort = Number(process.env.CLIENT_PORT || 5173);
  const devProxy = buildDevProxy(
    process.env as Record<string, string | undefined>
  );
  const config: UserConfig = {
    define: {
      ...Object.entries(define).reduce(
        (acc, [k, v]) => ({ ...acc, [k]: JSON.stringify(v) }),
        {}
      ),
      'import.meta.vitest': 'undefined',
    },
    plugins: [react(), envReloadPlugin()],
    server: {
      port: clientPort,
      host: true,
      open: false,
      hmr: { overlay: true },
      watch: {
        // Exclude build output + tests from triggering unnecessary reloads
        ignored: ['**/dist/**', '**/coverage/**'],
      },
      ...(devProxy ? { proxy: devProxy } : {}),
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
