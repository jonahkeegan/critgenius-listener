import type { ProxyOptions } from 'vite';
import http from 'node:http';
import https from 'node:https';
import { PortDiscoveryService } from './portDiscovery';

export type DevProxyConfig = Record<string, string | ProxyOptions> | undefined;

export function buildDevProxy(
  env: Record<string, string | undefined>
): DevProxyConfig {
  const proxyEnabled = env.DEV_PROXY_ENABLED !== 'false';
  if (!proxyEnabled) return undefined;
  const httpsEnabled = env.DEV_PROXY_HTTPS_ENABLED === 'true';
  const rejectUnauthorized = env.DEV_PROXY_REJECT_UNAUTHORIZED === 'true';
  const allowedHosts = (env.DEV_PROXY_ALLOWED_HOSTS || 'localhost,127.0.0.1')
    .split(',')
    .map(h => h.trim())
    .filter(Boolean);
  const proxyTargetPort = Number(
    (httpsEnabled
      ? env.DEV_PROXY_TARGET_HTTPS_PORT
      : env.DEV_PROXY_TARGET_PORT) || env.PORT || env.VITE_PORT || (httpsEnabled ? 3101 : 3100)
  );
  const assemblyAIEnabled = env.DEV_PROXY_ASSEMBLYAI_ENABLED !== 'false';
  const assemblyAIPath = env.DEV_PROXY_ASSEMBLYAI_PATH || '/proxy/assemblyai';
  const proxyTimeout = Number(env.DEV_PROXY_TIMEOUT_MS || 30000);
  const protocol = httpsEnabled ? 'https' : 'http';
  const host = 'localhost';
  if (!allowedHosts.includes(host)) {
    // Refuse to build proxy to disallowed target host
    console.warn(
      `[devProxy] Host '${host}' not in DEV_PROXY_ALLOWED_HOSTS; proxy disabled.`
    );
    return undefined;
  }
  const proxyTargetOrigin = `${protocol}://${host}:${proxyTargetPort}`;

  // Keep-alive agents for better streaming performance
  const httpAgent = new http.Agent({ keepAlive: true });
  const httpsAgent = new https.Agent({ keepAlive: true, rejectUnauthorized: !rejectUnauthorized });
  const agent = httpsEnabled ? (httpsAgent as unknown as http.Agent) : httpAgent;
  const base: Record<string, ProxyOptions> = {
    '/api': {
      target: proxyTargetOrigin,
      changeOrigin: true,
      ws: false,
      headers: { 'X-Forwarded-Proto': protocol },
      secure: !httpsEnabled ? undefined : !rejectUnauthorized,
      agent,
      timeout: proxyTimeout,
    },
    '/socket.io': {
      target: proxyTargetOrigin,
      changeOrigin: true,
      ws: true,
      headers: { 'X-Forwarded-Proto': protocol },
      secure: !httpsEnabled ? undefined : !rejectUnauthorized,
      agent,
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

// Simple in-memory cache for the discovered backend port during a dev session
let cachedDiscoveredPort: number | undefined;

export async function buildDevProxyWithDiscovery(
  env: Record<string, string | undefined>
): Promise<DevProxyConfig> {
  const proxyEnabled = env.DEV_PROXY_ENABLED !== 'false';
  if (!proxyEnabled) return undefined;
  const httpsEnabled = env.DEV_PROXY_HTTPS_ENABLED === 'true';

  const fallbackPort = Number(
    (httpsEnabled
      ? env.DEV_PROXY_TARGET_HTTPS_PORT
      : env.DEV_PROXY_TARGET_PORT) || env.PORT || env.VITE_PORT || (httpsEnabled ? 3101 : 3100)
  );

  const autoDiscover = (env.DEV_PROXY_AUTO_DISCOVER ?? 'true') === 'true';
  if (!autoDiscover) {
    return buildDevProxy(env);
  }

  if (cachedDiscoveredPort) {
    return buildDevProxy({ ...env, [httpsEnabled ? 'DEV_PROXY_TARGET_HTTPS_PORT' : 'DEV_PROXY_TARGET_PORT']: String(cachedDiscoveredPort) });
  }

  const candidatesRaw = (env.DEV_PROXY_DISCOVERY_PORTS || '3100,3000,8080')
    .split(',')
    .map(p => Number(p.trim()))
    .filter(p => Number.isFinite(p));
  const candidatePorts = Array.from(new Set([fallbackPort, ...candidatesRaw]));
  const discoveryTimeoutMs = Number(env.DEV_PROXY_DISCOVERY_TIMEOUT_MS || 10000);
  const probeTimeoutMs = Number(env.DEV_PROXY_PROBE_TIMEOUT_MS || 2000);

  const svc = new PortDiscoveryService();
  const result = await svc.discoverBackendPort({
    autoDiscover: true,
    candidatePorts,
    discoveryTimeoutMs,
    probeTimeoutMs,
    fallbackPort,
    https: httpsEnabled,
  });
  if (result.discovered) {
    cachedDiscoveredPort = result.port;
  }
  return buildDevProxy({
    ...env,
    [httpsEnabled ? 'DEV_PROXY_TARGET_HTTPS_PORT' : 'DEV_PROXY_TARGET_PORT']:
      String(result.port),
  });
}
