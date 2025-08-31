#!/usr/bin/env node
/**
 * Experimental Dev Orchestration v2
 * Uses service-launcher + executor registry. Retains current manifest format with optional type fields.
 * NOTE: This is incremental; original dev-orchestration.mjs remains the primary entry until promoted.
 */
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import http from 'node:http';
import { loadServiceManifest } from './service-manifest-loader.mjs';
import { launchService } from './service-launcher.mjs';

const SMOKE = process.env.ORCHESTRATION_SMOKE === 'true';

function probe({ port, path }) {
  return new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port, path, timeout: 2000 }, res => {
      const ok = (res.statusCode || 500) < 500;
      res.resume();
      resolve(ok);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function waitForService(name, svc, pollInterval) {
  const start = Date.now();
  while (Date.now() - start < svc.startupTimeoutMs) {
    const ok = await probe({ port: svc.port, path: svc.healthPath });
    if (ok) return true;
    await delay(pollInterval);
  }
  return false;
}

async function main() {
  const manifest = await loadServiceManifest();
  const ordered = Object.keys(manifest.services); // keeping simple (existing script has topo sort)
  const processes = [];
  for (const name of ordered) {
    const svc = manifest.services[name];
    const cmd = SMOKE && svc.smokeCommand ? svc.smokeCommand : svc.command;
    if (SMOKE && svc.smokeStartupTimeoutMs) svc.startupTimeoutMs = svc.smokeStartupTimeoutMs;
    console.log(`(v2) Starting ${name} -> ${cmd}`);
    const { process: child } = launchService(name, manifest, { overrideCommand: cmd });
    processes.push(child);
    const ready = await waitForService(name, svc, manifest.global.pollIntervalMs || 1000);
    if (!ready) {
      console.error(`Service ${name} failed readiness`);
      for (const p of processes) p.kill();
      process.exitCode = 1;
      return;
    }
  }
  console.log('(v2) All services ready.');
  const shutdown = () => { for (const p of processes) p.kill(); process.exit(0); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => { console.error('[v2] orchestration failed:', err); process.exitCode = 1; });