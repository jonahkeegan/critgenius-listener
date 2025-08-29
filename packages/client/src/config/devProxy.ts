import type { ProxyOptions } from 'vite';

export type DevProxyConfig = Record<string, string | ProxyOptions> | undefined;

export function buildDevProxy(
  env: Record<string, string | undefined>
): DevProxyConfig {
  const proxyEnabled = env.DEV_PROXY_ENABLED !== 'false';
  if (!proxyEnabled) return undefined;
  const proxyTargetPort = Number(
    env.DEV_PROXY_TARGET_PORT || env.PORT || env.VITE_PORT || 3100
  );
  const assemblyAIEnabled = env.DEV_PROXY_ASSEMBLYAI_ENABLED !== 'false';
  const assemblyAIPath = env.DEV_PROXY_ASSEMBLYAI_PATH || '/proxy/assemblyai';
  const proxyTimeout = Number(env.DEV_PROXY_TIMEOUT_MS || 30000);
  const proxyTargetOrigin = `http://localhost:${proxyTargetPort}`;
  const base: Record<string, ProxyOptions> = {
    '/api': {
      target: proxyTargetOrigin,
      changeOrigin: true,
      ws: false,
      timeout: proxyTimeout,
    },
    '/socket.io': {
      target: proxyTargetOrigin,
      changeOrigin: true,
      ws: true,
      secure: false,
      timeout: proxyTimeout,
    },
  };
  if (assemblyAIEnabled) {
    base[assemblyAIPath] = {
      target: 'https://api.assemblyai.com',
      changeOrigin: true,
      ws: false,
      rewrite: p => p.replace(assemblyAIPath, ''),
      timeout: proxyTimeout,
    } as ProxyOptions;
  }
  return base;
}

export default buildDevProxy;
