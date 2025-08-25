/**
 * @fileoverview Client environment accessor
 * Pulls the pre-injected (Vite define) safe environment values.
 * Falls back to reasonable defaults during tests.
 */

// During build we inject __CLIENT_ENV__ via Vite define. In tests this may be undefined.
// Global typing declared in ../global.d.ts (GlobalWithClientEnv ambient interface).

export interface ClientRuntimeConfig {
  NODE_ENV: string;
  CLIENT_API_BASE_URL: string;
  CLIENT_SOCKET_URL: string;
  CLIENT_FEATURE_FLAGS: string;
  featureFlags: string[];
}

function resolveNodeEnv(): string {
  const envObj: unknown =
    typeof process !== 'undefined' ? process.env : undefined;
  if (envObj) {
    const val = (envObj as Record<string, unknown>).NODE_ENV;
    if (typeof val === 'string' && val.length > 0) {
      return val;
    }
  }
  return 'development';
}

const defaultConfig: ClientRuntimeConfig = {
  NODE_ENV: resolveNodeEnv(),
  CLIENT_API_BASE_URL: 'http://localhost:3001',
  CLIENT_SOCKET_URL: 'http://localhost:3001',
  CLIENT_FEATURE_FLAGS: '',
  featureFlags: [],
};

export function getClientConfig(): ClientRuntimeConfig {
  const g: unknown = globalThis;
  const raw = (g as GlobalWithClientEnv).__CLIENT_ENV__;
  if (!raw || typeof raw !== 'object') return defaultConfig;
  const flagsRaw =
    typeof raw.CLIENT_FEATURE_FLAGS === 'string'
      ? raw.CLIENT_FEATURE_FLAGS
      : '';
  const flags = flagsRaw
    .split(',')
    .map(f => f.trim())
    .filter(Boolean);
  return { ...defaultConfig, ...raw, featureFlags: flags };
}

export const clientEnv = getClientConfig();

export function hasFeature(flag: string): boolean {
  return getClientConfig().featureFlags.includes(flag);
}

export default clientEnv;
