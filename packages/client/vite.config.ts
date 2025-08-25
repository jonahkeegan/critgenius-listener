import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnvironment, getClientRuntimeConfig } from '@critgenius/shared';

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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load raw env (Vite) mainly for MODE; shared loader handles deep validation.
  loadEnv(mode, process.cwd(), '');
  const define = resolveClientDefine(mode);
  const clientPort = Number(process.env.CLIENT_PORT || 5173);
  return {
    define: {
      ...Object.entries(define).reduce(
        (acc, [k, v]) => ({ ...acc, [k]: JSON.stringify(v) }),
        {}
      ),
    },
    plugins: [react()],
    server: {
      port: clientPort,
      host: true,
      open: false,
    },
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  };
});
