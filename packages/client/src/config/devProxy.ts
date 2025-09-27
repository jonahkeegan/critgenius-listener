import type { ProxyOptions } from 'vite';
import http from 'node:http';
import https from 'node:https';
import { PortDiscoveryService } from './portDiscovery';
import type { PortDiscoveryConfig, DiscoveryResult } from './portDiscovery';
import { getProxyRegistry, resolveTargetFromEnv } from '@critgenius/shared/config/proxyRegistry';

export type DevProxyConfig = Record<string, string | ProxyOptions> | undefined;

// Default fallbacks if registry types are unavailable at lint time
const DEFAULT_PROXY_ENV_KEYS = {
  enabled: 'DEV_PROXY_ENABLED',
  httpPort: 'DEV_PROXY_TARGET_PORT',
  httpsPort: 'DEV_PROXY_TARGET_HTTPS_PORT',
  httpsEnabled: 'DEV_PROXY_HTTPS_ENABLED',
  allowedHosts: 'DEV_PROXY_ALLOWED_HOSTS',
  rejectUnauthorized: 'DEV_PROXY_REJECT_UNAUTHORIZED',
  timeoutMs: 'DEV_PROXY_TIMEOUT_MS',
  assemblyAIEnabled: 'DEV_PROXY_ASSEMBLYAI_ENABLED',
  assemblyAIPath: 'DEV_PROXY_ASSEMBLYAI_PATH',
  autoDiscover: 'DEV_PROXY_AUTO_DISCOVER',
  discoveryPorts: 'DEV_PROXY_DISCOVERY_PORTS',
  discoveryTimeoutMs: 'DEV_PROXY_DISCOVERY_TIMEOUT_MS',
  probeTimeoutMs: 'DEV_PROXY_PROBE_TIMEOUT_MS',
} as const;

const DEFAULT_ROUTES: Array<{
  id: 'api' | 'ws' | 'assemblyai';
  path: string;
  ws: boolean;
  optional: boolean;
  enableEnvVar?: string;
}> = [
  { id: 'api', path: '/api', ws: false, optional: false },
  { id: 'ws', path: '/socket.io', ws: true, optional: false },
  {
    id: 'assemblyai',
    path: '/proxy/assemblyai',
    ws: false,
    optional: true,
    enableEnvVar: 'DEV_PROXY_ASSEMBLYAI_ENABLED',
  },
];

function isRecordString(x: unknown): x is Record<string, string> {
  if (typeof x !== 'object' || x === null) return false;
  const rec = x as Record<string, unknown>;
  for (const v of Object.values(rec)) {
    if (typeof v !== 'string') return false;
  }
  return true;
}

function isRouteEntry(x: unknown): x is {
  id: 'api' | 'ws' | 'assemblyai';
  path: string;
  ws: boolean;
  optional: boolean;
  enableEnvVar?: string;
} {
  if (typeof x !== 'object' || x === null) return false;
  const rec = x as Record<string, unknown>;
  const id = rec['id'];
  const path = rec['path'];
  const ws = rec['ws'];
  const optional = rec['optional'];
  if (id !== 'api' && id !== 'ws' && id !== 'assemblyai') return false;
  return (
    typeof path === 'string' &&
    typeof ws === 'boolean' &&
    typeof optional === 'boolean'
  );
}

function isProxyRegistrySummary(x: unknown): x is {
  env: Record<string, string>;
  routes: unknown[];
} {
  if (typeof x !== 'object' || x === null) return false;
  const rec = x as Record<string, unknown>;
  return isRecordString(rec['env']) && Array.isArray(rec['routes']);
}

function isDiscoveryResult(x: unknown): x is Pick<DiscoveryResult, 'discovered' | 'port'> {
  if (typeof x !== 'object' || x === null) return false;
  const rec = x as Record<string, unknown>;
  return typeof rec['discovered'] === 'boolean' && typeof rec['port'] === 'number';
}

type Upstream = { protocol: 'http' | 'https'; port: number };
function isUpstream(x: unknown): x is Upstream {
  if (typeof x !== 'object' || x === null) return false;
  const rec = x as Record<string, unknown>;
  const protocol = rec['protocol'];
  const port = rec['port'];
  if (protocol !== 'http' && protocol !== 'https') return false;
  return typeof port === 'number';
}

export function buildDevProxy(
  env: Record<string, string | undefined>
): DevProxyConfig {
  // Guard external function calls to avoid unsafe-call on potentially any-typed imports
  const maybeGetRegistry: unknown = getProxyRegistry as unknown;
  const registryUnknown: unknown =
    typeof maybeGetRegistry === 'function'
      ? (maybeGetRegistry as () => unknown)()
      : undefined;
  const keys = isProxyRegistrySummary(registryUnknown)
    ? (registryUnknown.env as Record<string, string>)
    : DEFAULT_PROXY_ENV_KEYS;
  const routes = isProxyRegistrySummary(registryUnknown)
    ? (registryUnknown.routes as unknown[]).filter(isRouteEntry)
    : DEFAULT_ROUTES;

  // Helper to safely read string env values
  const read = (key: unknown): string | undefined => {
    if (typeof key !== 'string') return undefined;
    const val = env[key];
    return typeof val === 'string' ? val : undefined;
  };
  const readBool = (key: unknown, defaultTrue = true): boolean => {
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
  const maybeResolve: unknown = resolveTargetFromEnv as unknown;
  const upstreamUnknown: unknown =
    typeof maybeResolve === 'function'
      ? (maybeResolve as (e: Record<string, string | undefined>) => unknown)(env)
      : undefined;
  let protocol: 'http' | 'https' = 'http';
  let proxyTargetPort = 3000;
  if (isUpstream(upstreamUnknown)) {
    protocol = upstreamUnknown.protocol;
    proxyTargetPort = Number.isFinite(upstreamUnknown.port)
      ? upstreamUnknown.port
      : 3000;
  }
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
  const maybeGetRegistry: unknown = getProxyRegistry as unknown;
  const registryUnknown: unknown =
    typeof maybeGetRegistry === 'function'
      ? (maybeGetRegistry as () => unknown)()
      : undefined;
  const keys = isProxyRegistrySummary(registryUnknown)
    ? (registryUnknown.env as Record<string, string>)
    : DEFAULT_PROXY_ENV_KEYS;
  const read = (key: unknown): string | undefined => {
    if (typeof key !== 'string') return undefined;
    const val = env[key];
    return typeof val === 'string' ? val : undefined;
  };
  const readBool = (key: unknown, defaultTrue = true): boolean => {
    const v = read(key);
    if (v === undefined) return defaultTrue;
    return v === 'true';
  };
  const proxyEnabled = readBool(keys.enabled);
  if (!proxyEnabled) return undefined;
  const httpsEnabled = readBool(keys.httpsEnabled, false);

  const maybeResolve: unknown = resolveTargetFromEnv as unknown;
  const upstreamUnknown: unknown =
    typeof maybeResolve === 'function'
      ? (maybeResolve as (e: Record<string, string | undefined>) => unknown)(env)
      : undefined;
  const fallbackPort = isUpstream(upstreamUnknown) && Number.isFinite(upstreamUnknown.port)
    ? upstreamUnknown.port
    : 3000;
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

  // Construct discovery service only if constructable, and ensure method presence before use
  type DiscoverySvc = { discoverBackendPort: (cfg: PortDiscoveryConfig) => Promise<unknown> };
  const maybeCtor: unknown = PortDiscoveryService as unknown;
  let svc: unknown;
  if (typeof maybeCtor === 'function') {
    const Ctor = maybeCtor as new () => unknown;
    try {
      svc = new Ctor();
    } catch {
      svc = undefined;
    }
  }
  const hasDiscovery = (obj: unknown): obj is DiscoverySvc => {
    if (typeof obj !== 'object' || obj === null) return false;
    const rec = obj as Record<string, unknown>;
    return typeof rec['discoverBackendPort'] === 'function';
  };
  if (!hasDiscovery(svc)) {
    return buildDevProxy(env);
  }
  const discoveryCfg: PortDiscoveryConfig = {
    autoDiscover: true,
    candidatePorts,
    discoveryTimeoutMs,
    probeTimeoutMs,
    fallbackPort,
    https: httpsEnabled,
  };
  const resultUnknown = await (svc as DiscoverySvc).discoverBackendPort(discoveryCfg);
  if (isDiscoveryResult(resultUnknown)) {
    if (resultUnknown.discovered) {
      cachedDiscoveredPort = resultUnknown.port;
    }
    return buildDevProxy({
      ...env,
      [httpsEnabled ? 'DEV_PROXY_TARGET_HTTPS_PORT' : 'DEV_PROXY_TARGET_PORT']:
        String(resultUnknown.port),
    });
  }
  // Fallback if result is malformed
  return buildDevProxy({
    ...env,
    [httpsEnabled ? 'DEV_PROXY_TARGET_HTTPS_PORT' : 'DEV_PROXY_TARGET_PORT']:
      String(fallbackPort),
  });
}
