import type { ProxyOptions } from 'vite';
import http from 'node:http';
import https from 'node:https';
import { PortDiscoveryService } from './portDiscovery';
import { getProxyRegistry, resolveTargetFromEnv } from '@critgenius/shared/config/proxyRegistry';

export type DevProxyConfig = Record<string, string | ProxyOptions> | undefined;

export function buildDevProxy(
  env: Record<string, string | undefined>
): DevProxyConfig {
  const { env: keys, routes } = getProxyRegistry();
  const proxyEnabled = env[keys.enabled] !== 'false';
  if (!proxyEnabled) return undefined;
  const httpsEnabled = env[keys.httpsEnabled] === 'true';
  const rejectUnauthorized = env[keys.rejectUnauthorized] === 'true';
  const allowedHosts = (env[keys.allowedHosts] || 'localhost,127.0.0.1')
    .split(',')
    .map(h => h.trim())
    .filter(Boolean);
  const { protocol, port: proxyTargetPort } = resolveTargetFromEnv(env);
  const assemblyAIEnabled = env[keys.assemblyAIEnabled] !== 'false';
  const assemblyAIPath = env[keys.assemblyAIPath] || '/proxy/assemblyai';
  const proxyTimeout = Number(env[keys.timeoutMs] || 30000);
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
  const httpsAgent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: !rejectUnauthorized,
  });
  // Use a precise union type instead of double casting through unknown.
  const agent: http.Agent | https.Agent = httpsEnabled ? httpsAgent : httpAgent;
  const base: Record<string, ProxyOptions> = {};
  for (const r of routes) {
    if (r.optional && r.enableEnvVar && env[r.enableEnvVar] === 'false') continue;
    base[r.path] = {
      target: r.id === 'assemblyai' ? 'https://api.assemblyai.com' : proxyTargetOrigin,
      changeOrigin: true,
      ws: r.ws,
      ...(r.id !== 'assemblyai'
        ? {
            headers: { 'X-Forwarded-Proto': protocol },
            secure: !httpsEnabled ? undefined : !rejectUnauthorized,
            agent,
            timeout: proxyTimeout,
          }
        : {
            rewrite: (p: string) => p.replace(assemblyAIPath, ''),
            timeout: proxyTimeout,
          }),
    } as ProxyOptions;
  }
  if (assemblyAIEnabled) {
    base[assemblyAIPath] = {
      target: 'https://api.assemblyai.com',
      changeOrigin: true,
      ws: false,
      // Explicit parameter type to satisfy no-unsafe-member-access / implicit any guards.
      rewrite: (p: string) => p.replace(assemblyAIPath, ''),
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
  const { env: keys } = getProxyRegistry();
  const proxyEnabled = env[keys.enabled] !== 'false';
  if (!proxyEnabled) return undefined;
  const httpsEnabled = env[keys.httpsEnabled] === 'true';

  const fallbackPort = resolveTargetFromEnv(env).port;

  const autoDiscover = (env[keys.autoDiscover] ?? 'true') === 'true';
  if (!autoDiscover) {
    return buildDevProxy(env);
  }

  if (cachedDiscoveredPort) {
    return buildDevProxy({ ...env, [httpsEnabled ? 'DEV_PROXY_TARGET_HTTPS_PORT' : 'DEV_PROXY_TARGET_PORT']: String(cachedDiscoveredPort) });
  }

  const candidatesRaw = (env[keys.discoveryPorts] || '3100,3000,8080')
    .split(',')
    .map(p => Number(p.trim()))
    .filter(p => Number.isFinite(p));
  const candidatePorts = Array.from(new Set([fallbackPort, ...candidatesRaw]));
  const discoveryTimeoutMs = Number(env[keys.discoveryTimeoutMs] || 10000);
  const probeTimeoutMs = Number(env[keys.probeTimeoutMs] || 2000);

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
