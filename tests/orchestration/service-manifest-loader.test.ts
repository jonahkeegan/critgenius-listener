import { describe, it, expect } from 'vitest';
import { loadServiceManifest } from '../../scripts/service-manifest-loader.mjs';
import path from 'node:path';

describe('service-manifest-loader', () => {
  it('loads services.yaml and exposes services', async () => {
    const manifest = await loadServiceManifest(
      path.resolve(process.cwd(), 'services.yaml')
    );
    expect(manifest.version).toBeDefined();
    expect(manifest.services.server).toBeDefined();
    expect(manifest.services.client.dependencies).toContain('server');
  });

  it('fails validation for missing file', async () => {
    await expect(
      loadServiceManifest(
        path.resolve(process.cwd(), 'nonexistent-services.yaml')
      )
    ).rejects.toThrow(/not found/);
  });

  it('interpolates ${port} in environment', async () => {
    const manifest = await loadServiceManifest();
    const serverEnv = manifest.services.server.environment;
    expect(serverEnv.PORT).toBe(String(manifest.services.server.port));
    expect(serverEnv.DEV_PROXY_TARGET_PORT).toBe(
      String(manifest.services.server.port)
    );
  });
});
