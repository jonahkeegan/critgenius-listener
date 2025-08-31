#!/usr/bin/env node
// Bridge script to invoke ESM dev-orchestration.v3.mjs functions from CJS test environment.
import('../scripts/dev-orchestration.v3.mjs').then(mod => {
  const fn = mod.topologicalOrder;
  const raw = process.argv[2];
  if (!raw) {
    console.error('Usage: node orchestration-v3-bridge.cjs <json-services>');
    process.exit(1);
  }
  const services = JSON.parse(raw);
  const order = fn(services);
  process.stdout.write(JSON.stringify(order));
}).catch(err => { console.error(err); process.exit(1); });