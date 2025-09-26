import type { ProxyOptions } from 'vite';
import http from 'node:http';
import https from 'node:https';
import { PortDiscoveryService } from './portDiscovery';
import { getProxyRegistry, resolveTargetFromEnv } from '@critgenius/shared/config/proxyRegistry';

export type DevProxyConfig = Record<string, string | ProxyOptions> | undefined;

export function buildDevProxy(
  env: Record<string, string | undefined>
): DevProxyConfig {
  const registry: ReturnType<typeof getProxyRegistry> = getProxyRegistry();
  const keys = registry.env;
  const routes = registry.routes;

  // Helper to safely read string env values
  const read = (key: string): string | undefined => {
    const val = env[key];
    return typeof val === 'string' ? val : undefined;
  };
  const readBool = (key: string, defaultTrue = true): boolean => {
    const v = read(key);
    if (v === undefined) return defaultTrue;
    return v === 'true';
  };

  const proxyEnabled = readBool(keys.enabled); // default true unless explicitly 'false'
  if (!proxyEnabled) return undefined;
  const httpsEnabled = readBool(keys.httpsEnabled, false);
  const rejectUnauthorized = readBool(keys.rejectUnauthorized, true) === true;
  const allowedHostsRaw = read(keys.allowedHosts) || 'localhost,127.0.0.1';
  const allowedHosts = allowedHostsRaw
    .split(',')
    .map(h => h.trim())
    .filter(Boolean);
  const upstream = resolveTargetFromEnv(env);
  const protocol = upstream.protocol;
  const proxyTargetPort = upstream.port;
  const assemblyAIEnabled = readBool(keys.assemblyAIEnabled, true);
  const assemblyAIPath = read(keys.assemblyAIPath) || '/proxy/assemblyai';
  const proxyTimeout = Number(read(keys.timeoutMs) || 30000);
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
  for (const route of routes) {
    const { id, path: routePath, ws, optional, enableEnvVar } = route;
    if (optional && enableEnvVar && read(enableEnvVar) === 'false') continue;
    const isAssembly = id === 'assemblyai';
    base[routePath] = {
      target: isAssembly ? 'https://api.assemblyai.com' : proxyTargetOrigin,
      changeOrigin: true,
      ws,
      ...(isAssembly
        ? {
            rewrite: (p: string) => p.replace(assemblyAIPath, ''),
            timeout: proxyTimeout,
          }
        : {
            headers: { 'X-Forwarded-Proto': protocol },
            secure: !httpsEnabled ? undefined : !rejectUnauthorized,
            agent,
            timeout: proxyTimeout,
          }),
    } satisfies ProxyOptions;
  }
  if (assemblyAIEnabled) {
    base[assemblyAIPath] = {
      target: 'https://api.assemblyai.com',
      changeOrigin: true,
      ws: false,
      rewrite: (p: string) => p.replace(assemblyAIPath, ''),
      timeout: proxyTimeout,
    } satisfies ProxyOptions;
  }
  return base;
}

export default buildDevProxy;

// Simple in-memory cache for the discovered backend port during a dev session
let cachedDiscoveredPort: number | undefined;

export async function buildDevProxyWithDiscovery(
  env: Record<string, string | undefined>
): Promise<DevProxyConfig> {
  const registry: ReturnType<typeof getProxyRegistry> = getProxyRegistry();
  const keys = registry.env;
  const read = (key: string): string | undefined => {
    const val = env[key];
    return typeof val === 'string' ? val : undefined;
  };
  const readBool = (key: string, defaultTrue = true): boolean => {
    const v = read(key);
    if (v === undefined) return defaultTrue;
    return v === 'true';
  };
  const proxyEnabled = readBool(keys.enabled);
  if (!proxyEnabled) return undefined;
  const httpsEnabled = readBool(keys.httpsEnabled, false);

  const fallbackPort = resolveTargetFromEnv(env).port;
  const autoDiscover = readBool(keys.autoDiscover, true);
  if (!autoDiscover) return buildDevProxy(env);

  if (cachedDiscoveredPort) {
    return buildDevProxy({
      ...env,
      [httpsEnabled ? 'DEV_PROXY_TARGET_HTTPS_PORT' : 'DEV_PROXY_TARGET_PORT']:
        String(cachedDiscoveredPort),
    });
  }

  const candidatesRaw = (read(keys.discoveryPorts) || '3100,3000,8080')
    .split(',')
    .map(p => Number(p.trim()))
    .filter(p => Number.isFinite(p));
  const candidatePorts = Array.from(new Set([fallbackPort, ...candidatesRaw]));
  const discoveryTimeoutMs = Number(read(keys.discoveryTimeoutMs) || 10000);
  const probeTimeoutMs = Number(read(keys.probeTimeoutMs) || 2000);

  const svc: PortDiscoveryService = new PortDiscoveryService();
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
