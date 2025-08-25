export {};
import { describe, it, expect } from 'vitest';
import { clientEnv, getClientConfig, hasFeature } from './environment';

describe('client environment config', () => {
  it('provides defaults when injection missing', () => {
    const cfg = getClientConfig();
    expect(cfg.CLIENT_API_BASE_URL).toBeTruthy();
    expect(Array.isArray(cfg.featureFlags)).toBe(true);
  });

  it('reads injected feature flags', () => {
    (
      globalThis as typeof globalThis & { __CLIENT_ENV__?: any }
    ).__CLIENT_ENV__ = {
      CLIENT_FEATURE_FLAGS: 'a,b,c',
      CLIENT_API_BASE_URL: 'http://x',
      CLIENT_SOCKET_URL: 'http://x',
      NODE_ENV: 'test',
    };
    const cfg = getClientConfig();
    expect(cfg.featureFlags).toEqual(['a', 'b', 'c']);
    expect(hasFeature('b')).toBe(true);
  });

  it('exports singleton clientEnv', () => {
    expect(clientEnv).toBeDefined();
  });
});
