import { describe, it, expect } from 'vitest';
// Root relative path: packages/client/src/__tests__ -> packages/client -> vite.config.ts
import configFn from '../../vite.config';

// Basic structural validation for vite configuration to catch regressions in manual chunk logic.
describe('vite.config', () => {
  it('produces expected define + plugin + manualChunks shape', () => {
    const cfg = (configFn as any)({ mode: 'development' });
    expect(cfg.define.__CLIENT_ENV__).toBeUndefined(); // wrapped/serialized JSON, keys flattened
    expect(Object.keys(cfg.define).some(k => k === '__CLIENT_ENV__')).toBe(
      true
    );
    expect(Array.isArray(cfg.plugins)).toBe(true);
    // Simulate manualChunks function classification
    const manualChunks = cfg.build.rollupOptions.output.manualChunks;
    expect(manualChunks('/project/node_modules/react/index.js')).toBe('react');
    expect(manualChunks('/project/node_modules/@mui/material/index.js')).toBe(
      'mui'
    );
    expect(
      manualChunks('/project/node_modules/socket.io-client/dist/index.mjs')
    ).toBe('realtime');
    expect(
      manualChunks('/project/node_modules/some-other-lib/dist/index.mjs')
    ).toBe('vendor');
  });
});
