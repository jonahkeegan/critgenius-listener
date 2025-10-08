import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

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

  it('fails validation for missing file', async () => {
    const { loadServiceManifest } = await import(
      pathToFileURL(
        path.resolve(process.cwd(), 'scripts/service-manifest-loader.mjs')
      ).href
    );

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'missing-manifest-'));
    const missingPath = path.join(tempDir, 'services.yaml');

    try {
      await expect(loadServiceManifest(missingPath)).rejects.toThrow(
        /not found/
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('supports --manifest flag when run directly', () => {
    const script = path.resolve(
      process.cwd(),
      'scripts/service-manifest-loader.mjs'
    );

    expect(() =>
      execFileSync('node', [
        script,
        '--manifest',
        path.resolve(process.cwd(), 'services.yaml'),
      ])
    ).not.toThrow();
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
