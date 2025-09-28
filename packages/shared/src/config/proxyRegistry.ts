/**
 * Centralized Dev Proxy Registry
 *
 * Single source of truth for dev proxy route definitions and their
 * environment variable dependencies. This enables:
 *  - Strong typing for route entries
 *  - Generation of docs and .env examples
 *  - Coordinated updates across client/server without hunting through files
 */

export type ProxyProtocol = 'http' | 'https';

export interface ProxyRouteEntry {
  /** Route context identifier */
  id: 'api' | 'ws' | 'assemblyai';
  /** Path prefix to mount in the dev server */
  path: string;
  /** Whether the route uses WebSocket upgrades */
  ws: boolean;
  /** Whether this route is optional and controlled by a feature flag */
  optional: boolean;
  /** Feature flag env var name to enable this route (when optional=true) */
  enableEnvVar?: string;
}

export interface ProxyEnvironmentKeys {
  /** Master enable for proxy */
  enabled: 'DEV_PROXY_ENABLED';
  /** Base HTTP target port (fallback) */
  httpPort: 'DEV_PROXY_TARGET_PORT';
  /** Base HTTPS target port */
  httpsPort: 'DEV_PROXY_TARGET_HTTPS_PORT';
  /** Use HTTPS for upstream target */
  httpsEnabled: 'DEV_PROXY_HTTPS_ENABLED';
  /** Allowlist of acceptable target hosts */
  allowedHosts: 'DEV_PROXY_ALLOWED_HOSTS';
  /** TLS rejectUnauthorized toggle for local self-signed */
  rejectUnauthorized: 'DEV_PROXY_REJECT_UNAUTHORIZED';
  /** Proxy request timeout */
  timeoutMs: 'DEV_PROXY_TIMEOUT_MS';
  /** AssemblyAI passthrough toggle */
  assemblyAIEnabled: 'DEV_PROXY_ASSEMBLYAI_ENABLED';
  /** AssemblyAI mount path */
  assemblyAIPath: 'DEV_PROXY_ASSEMBLYAI_PATH';
  /** Dynamic discovery flags */
  autoDiscover: 'DEV_PROXY_AUTO_DISCOVER';
  discoveryPorts: 'DEV_PROXY_DISCOVERY_PORTS';
  discoveryTimeoutMs: 'DEV_PROXY_DISCOVERY_TIMEOUT_MS';
  probeTimeoutMs: 'DEV_PROXY_PROBE_TIMEOUT_MS';
}

export const PROXY_ENV_KEYS: ProxyEnvironmentKeys = {
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

export const PROXY_ROUTES: readonly ProxyRouteEntry[] = [
  { id: 'api', path: '/api', ws: false, optional: false },
  { id: 'ws', path: '/socket.io', ws: true, optional: false },
  {
    id: 'assemblyai',
    path: '/proxy/assemblyai',
    ws: false,
    optional: true,
    enableEnvVar: 'DEV_PROXY_ASSEMBLYAI_ENABLED',
  },
] as const;

export interface ProxyRegistrySummary {
  routes: readonly ProxyRouteEntry[];
  env: ProxyEnvironmentKeys;
}

export function getProxyRegistry(): ProxyRegistrySummary {
  return { routes: PROXY_ROUTES, env: PROXY_ENV_KEYS };
}

/**
 * Helper: derive effective protocol and port from env
 */
export function resolveTargetFromEnv(env: Record<string, string | undefined>): {
  protocol: ProxyProtocol;
  port: number;
} {
  const httpsEnabled = env[PROXY_ENV_KEYS.httpsEnabled] === 'true';
  const protocol: ProxyProtocol = httpsEnabled ? 'https' : 'http';
  const port = Number(
    (httpsEnabled
      ? env[PROXY_ENV_KEYS.httpsPort]
      : env[PROXY_ENV_KEYS.httpPort]) ||
      env.PORT ||
      env.VITE_PORT ||
      (httpsEnabled ? 3101 : 3100)
  );
  return { protocol, port };
}
