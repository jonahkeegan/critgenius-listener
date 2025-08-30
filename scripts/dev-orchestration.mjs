#!/usr/bin/env node
/**
 * Development Orchestration Script
 * Coordinates startup of server then client with health checks and optional monitoring.
 * Non-invasive: does not replace existing individual dev scripts.
 */
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import http from 'node:http';
import process from 'node:process';
import { loadServiceManifest } from './service-manifest-loader.mjs';

// Smoke mode toggles service command substitution and timeouts where defined
const SMOKE = process.env.ORCHESTRATION_SMOKE === 'true';
let MANIFEST; // loaded lazily

async function getConfig() {
  if (!MANIFEST) MANIFEST = await loadServiceManifest();
  return MANIFEST;
}

const args = process.argv.slice(2);
const enableMonitor = args.includes('--monitor') || args.includes('-m');

/** Basic HTTP readiness probe */
function probe({ port, path }) {
  return new Promise(resolve => {
    const req = http.get({ host: '127.0.0.1', port, path, timeout: 2_000 }, res => {
      const ok = res.statusCode && res.statusCode < 500;
      res.resume();
  if (SMOKE) console.log(`[probe] ${path} -> status ${res.statusCode} ok=${ok}`);
      resolve(ok);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function waitForService(name, { port, healthPath, startupTimeoutMs }) {
  const start = Date.now();
  process.stdout.write(`⏳ Waiting for ${name} on port ${port} ...`);
  while (Date.now() - start < startupTimeoutMs) {
    const ok = await probe({ port, path: healthPath });
    if (ok) {
      process.stdout.write(`\r✅ ${name} ready on port ${port} (wait ${(Date.now()-start)}ms)\n`);
      return true;
    }
    const { global } = await getConfig();
    await delay(global.pollIntervalMs);
  }
  process.stdout.write(`\n❌ ${name} failed to become ready within ${startupTimeoutMs}ms\n`);
  return false;
}

function spawnLogged(name, commandParts, serviceDef) {
  const env = { ...process.env };
  // Interpolate service-level environment overrides
  if (serviceDef?.environment && typeof serviceDef.environment === 'object') {
    for (const [k, v] of Object.entries(serviceDef.environment)) {
      if (env[k] === undefined) env[k] = String(v);
    }
  }
  const base = typeof commandParts === 'string' ? commandParts : commandParts.command;
  const attempts = [base, `corepack ${base}`, `npx pnpm ${base.replace(/^pnpm\s+/, '')}`];
  let child;
  let lastError;
  for (const cmdString of attempts) {
    try {
      child = spawn(cmdString, { stdio: ['inherit','pipe','pipe'], env, shell: true });
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!child) throw lastError || new Error('Failed to spawn command');
  child.stdout.on('data', d => process.stdout.write(`[${name}] ${d}`));
  child.stderr.on('data', d => process.stderr.write(`[${name}][err] ${d}`));
  child.on('exit', code => {
    console.log(`[${name}] exited with code ${code}`);
  });
  return child;
}

async function orchestrate() {
  const manifest = await getConfig();
  const services = manifest.services;
  const global = manifest.global;
  console.log('🧪 CritGenius coordinated dev starting (manifest mode)...');

  // Topologically sort services by dependencies (simple DFS)
  const ordered = [];
  const temp = new Set();
  const perm = new Set();
  function visit(name) {
    if (perm.has(name)) return;
    if (temp.has(name)) throw new Error(`Cyclic dependency detected involving ${name}`);
    temp.add(name);
    const svc = services[name];
    if (!svc) throw new Error(`Service ${name} not defined in manifest`);
    for (const dep of svc.dependencies || []) visit(dep);
    perm.add(name);
    temp.delete(name);
    ordered.push(name);
  }
  for (const name of Object.keys(services)) visit(name);

  const processes = new Map();
  for (const name of ordered) {
    const svc = services[name];
    const cmd = SMOKE && svc.smokeCommand ? svc.smokeCommand : svc.command;
    if (SMOKE && svc.smokeStartupTimeoutMs) svc.startupTimeoutMs = svc.smokeStartupTimeoutMs;
    console.log(`🚀 Starting ${name} (${cmd}) ...`);
    const child = spawnLogged(name, { command: cmd }, svc);
    processes.set(name, child);
    const ready = await waitForService(name, svc);
    if (!ready) {
      child.kill();
      // kill previously started
      for (const [n,p] of processes) if (n !== name) p.kill();
      process.exitCode = 1;
      return;
    }
  }

  console.log('🌐 Dev environment ready:');
  for (const name of ordered) {
    const svc = services[name];
    console.log(`   • ${name}: http://localhost:${svc.port}${svc.healthPath}`);
  }

  if (!enableMonitor) return;
  console.log(`🩺 Monitoring enabled (${global.monitorIntervalMs}ms interval)...`);
  setInterval(async () => {
    for (const name of ordered) {
      const svc = services[name];
      const ok = await probe({ port: svc.port, path: svc.healthPath });
      if (!ok) {
        console.log(`🚨 ${name} unhealthy. Restarting...`);
        const proc = processes.get(name);
        proc && proc.kill();
        await delay(global.restartBackoffMs);
        const cmd = SMOKE && svc.smokeCommand ? svc.smokeCommand : svc.command;
        const child = spawnLogged(name, { command: cmd }, svc);
        processes.set(name, child);
      }
    }
  }, global.monitorIntervalMs);

  const shutdown = () => {
    console.log('\n🛑 Shutting down coordinated dev...');
    for (const [,proc] of processes) proc.kill();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

orchestrate().catch(err => {
  console.error('❌ Orchestration failed:', err.message);
  process.exitCode = 1;
});
