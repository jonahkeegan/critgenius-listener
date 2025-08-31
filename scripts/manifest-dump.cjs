#!/usr/bin/env node
/* Manifest dump bridge (CJS) */
/* eslint-disable no-console */
(async () => {
  try {
    const target = process.argv[2];
    const { loadServiceManifest } = await import('./service-manifest-loader.mjs');
    const manifest = await loadServiceManifest(target);
    process.stdout.write(JSON.stringify(manifest));
  } catch (err) {
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(1);
  }
})();