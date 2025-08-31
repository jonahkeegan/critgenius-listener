import { describe, it, expect } from 'vitest';

interface DevProxyConfig {
  enabled: boolean;
  targetPort: number;
  assembly: boolean;
}

function buildMappings(cfg: DevProxyConfig) {
  if (!cfg.enabled) return {} as Record<string, string>;
  const out: Record<string, string> = {
    '/api': `http://localhost:${cfg.targetPort}`,
  };
  if (cfg.assembly) out['/proxy/assemblyai'] = 'https://api.assemblyai.com';
  return out;
}

describe('dev proxy mapping purity', () => {
  it('excludes assembly when disabled', () => {
    const map = buildMappings({
      enabled: true,
      targetPort: 3100,
      assembly: false,
    });
    expect(map['/proxy/assemblyai']).toBeUndefined();
  });
  it('includes assembly when enabled', () => {
    const map = buildMappings({
      enabled: true,
      targetPort: 3100,
      assembly: true,
    });
    expect(map['/proxy/assemblyai']).toBe('https://api.assemblyai.com');
  });
});
