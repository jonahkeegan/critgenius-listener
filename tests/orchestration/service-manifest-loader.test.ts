import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

function loadViaBridge(p?: string) {
  const script = path.resolve(process.cwd(), 'scripts/manifest-dump.cjs');
  const args = p ? [script, p] : [script];
  const out = execFileSync('node', args, { encoding: 'utf8' });
  return JSON.parse(out);
}

describe('service-manifest-loader', () => {
  it('loads services.yaml and exposes services', () => {
    const manifest = loadViaBridge(
      path.resolve(process.cwd(), 'services.yaml')
    );
    expect(manifest.version).toBeDefined();
    expect(manifest.services.server).toBeDefined();
    expect(manifest.services.client.dependencies).toContain('server');
  });

  it('fails validation for missing file', () => {
    const script = path.resolve(process.cwd(), 'scripts/manifest-dump.cjs');
    expect(() =>
      execFileSync(
        'node',
        [script, path.resolve(process.cwd(), 'nonexistent-services.yaml')],
        { encoding: 'utf8' }
      )
    ).toThrow(/not found/);
  });

  it('interpolates ${port} in environment', () => {
    const manifest = loadViaBridge(
      path.resolve(process.cwd(), 'services.yaml')
    );
    const serverEnv = manifest.services.server.environment;
    expect(serverEnv.PORT).toBe(String(manifest.services.server.port));
    expect(serverEnv.DEV_PROXY_TARGET_PORT).toBe(
      String(manifest.services.server.port)
    );
    // injected convenience vars
    expect(serverEnv.SERVICE_NAME).toBe(manifest.services.server.name);
    expect(serverEnv.TIMEOUT).toBe(String(manifest.global.defaultTimeout));
    expect(serverEnv.DEV_PROXY_TIMEOUT_MS).toBe(
      String(manifest.global.defaultTimeout)
    );
  });
});
