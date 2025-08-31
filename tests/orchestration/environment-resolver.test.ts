import { describe, it, expect } from 'vitest';
import { resolveEnvironment } from '../../scripts/environment/resolver.mjs';

describe('environment resolver', () => {
  it('interpolates port, env, service and global tokens', () => {
    const manifest = {
      global: { defaultTimeout: 12345 },
      services: {},
    };
    const service = {
      name: 'server',
      port: 3100,
      environment: {
        PORT: '${port}',
        SERVICE: '${service.name}',
        TIMEOUT: '${global.defaultTimeout}',
        NODE_ENV: '${env.NODE_ENV}',
      },
    };
    const env = resolveEnvironment(service, manifest, {
      processEnv: { NODE_ENV: 'development' },
    });
    expect(env.PORT).toBe('3100');
    expect(env.SERVICE).toBe('server');
    expect(env.TIMEOUT).toBe('12345');
    expect(env.NODE_ENV).toBe('development');
  });
});
