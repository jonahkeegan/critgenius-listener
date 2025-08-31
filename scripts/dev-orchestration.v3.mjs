#!/usr/bin/env node
/**
 * Dev Orchestration v3 (Phase 3 Enhancements)
 * Features:
 *  - Topological dependency start order (with cycle detection)
 *  - Per-service restart policy (exponential backoff, max attempts, circuit breaker cooldown)
 *  - Process exit monitoring & automatic restarts
 *  - Basic health probing loop (readiness + liveness) using existing healthPath
 *  - Smoke mode compatibility (ORCHESTRATION_SMOKE=true)
 *  - Graceful shutdown (SIGINT/SIGTERM)
 *
 * Non-goals (future phases): dynamic scale out, proactive restart on repeated health probe failures,
 * structured status event emission over sockets, rich TUI.
 */
import process from 'node:process';
import { setTimeout as delay } from 'node:timers/promises';
import http from 'node:http';
import { loadServiceManifest } from './service-manifest-loader.mjs';
import { launchService } from './service-launcher.mjs';

const SMOKE = process.env.ORCHESTRATION_SMOKE === 'true';

function log(msg, obj) {
  if (obj) console.log(`[orchestrator:v3] ${msg}`, obj); else console.log(`[orchestrator:v3] ${msg}`);
}
function error(msg, obj) { if (obj) console.error(`[orchestrator:v3][err] ${msg}`, obj); else console.error(`[orchestrator:v3][err] ${msg}`); }

// --- Graph / Topology ---
function topologicalOrder(services) {
  const inDegree = new Map();
  const graph = new Map();
  for (const [name, svc] of Object.entries(services)) {
    graph.set(name, new Set());
    inDegree.set(name, 0);
  }
  for (const [name, svc] of Object.entries(services)) {
    const deps = Array.isArray(svc.dependencies) ? svc.dependencies : [];
    for (const dep of deps) {
      if (!graph.has(dep)) throw new Error(`Service ${name} depends on unknown service ${dep}`);
      // edge dep -> name
      if (!graph.get(dep).has(name)) {
        graph.get(dep).add(name);
        inDegree.set(name, (inDegree.get(name) || 0) + 1);
      }
    }
  }
  const queue = [];
  for (const [n, deg] of inDegree.entries()) if (deg === 0) queue.push(n);
  const order = [];
  while (queue.length) {
    const n = queue.shift();
    order.push(n);
    for (const nxt of graph.get(n) || []) {
      inDegree.set(nxt, inDegree.get(nxt) - 1);
      if (inDegree.get(nxt) === 0) queue.push(nxt);
    }
  }
  if (order.length !== Object.keys(services).length) {
    throw new Error('Cycle detected in service dependency graph');
  }
  return order;
}

// --- Probing ---
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

async function waitForReadiness(name, svc, pollIntervalMs) {
  const start = Date.now();
  const timeout = svc.startupTimeoutMs;
  while (Date.now() - start < timeout) {
    const ok = await probe({ port: svc.port, path: svc.healthPath });
    if (ok) return true;
    await delay(pollIntervalMs);
  }
  return false;
}

// --- Restart Policy Management ---
function calcBackoff(state, restartCfg) {
  const attempt = state.restartAttempts + 1; // next attempt number
  const base = restartCfg.baseMs || 1000;
  const max = restartCfg.maxMs || 15000;
  const delayMs = Math.min(base * Math.pow(2, attempt - 1), max);
  return { delayMs, attempt };
}

async function startService(name, manifest, orchestratorState) {
  const svc = manifest.services[name];
  const state = orchestratorState[name];
  const cmd = SMOKE && svc.smokeCommand ? svc.smokeCommand : svc.command;
  if (SMOKE && svc.smokeStartupTimeoutMs) svc.startupTimeoutMs = svc.smokeStartupTimeoutMs;
  log(`Starting service ${name} -> ${cmd}`);
  const { process: child } = launchService(name, manifest, { overrideCommand: cmd });
  state.process = child;
  state.status = 'starting';
  state.startTimestamp = Date.now();
  child.on('exit', (code, signal) => {
    state.process = null;
    state.lastExit = { code, signal, at: Date.now() };
    if (state.shuttingDown) return; // ignore during global shutdown
    scheduleRestart(name, manifest, orchestratorState, 'process-exit');
  });
  const ready = await waitForReadiness(name, svc, manifest.global.pollIntervalMs || 1000);
  if (ready) {
    state.status = 'ready';
    state.restartAttempts = 0; // reset on successful start
    log(`Service ${name} ready on port ${svc.port}`);
  } else {
    error(`Service ${name} failed readiness within ${svc.startupTimeoutMs}ms`);
    child.kill();
    state.process = null;
    scheduleRestart(name, manifest, orchestratorState, 'readiness-failed');
  }
}

function scheduleRestart(name, manifest, orchestratorState, reason) {
  const svc = manifest.services[name];
  const state = orchestratorState[name];
  const cfg = svc.restart || {};
  const maxAttempts = cfg.maxAttempts ?? 5;
  const cooldown = cfg.circuitCooldownMs ?? 60000;
  if (state.circuitOpenUntil && Date.now() < state.circuitOpenUntil) {
    log(`Circuit open for ${name}, skip restart (until ${new Date(state.circuitOpenUntil).toISOString()})`);
    return;
  }
  if (state.restartAttempts >= maxAttempts) {
    state.circuitOpenUntil = Date.now() + cooldown;
    state.restartAttempts = 0;
    error(`Circuit opened for ${name} after ${maxAttempts} failed attempts. Cooling down for ${cooldown}ms.`);
    return;
  }
  const { delayMs, attempt } = calcBackoff(state, cfg);
  state.restartAttempts = attempt;
  log(`Scheduling restart for ${name} in ${delayMs}ms (attempt ${attempt}, reason: ${reason})`);
  setTimeout(() => {
    if (state.circuitOpenUntil && Date.now() < state.circuitOpenUntil) return;
    startService(name, manifest, orchestratorState).catch(e => error(`Failed to restart ${name}`, e));
  }, delayMs).unref();
}

async function orchestrate() {
  const manifest = await loadServiceManifest();
  const order = topologicalOrder(manifest.services);
  log(`Startup order: ${order.join(' -> ')}`);
  const orchestratorState = {};
  for (const name of Object.keys(manifest.services)) {
    orchestratorState[name] = {
      status: 'idle',
      restartAttempts: 0,
      circuitOpenUntil: null,
      process: null,
      shuttingDown: false,
    };
  }
  // Start services honoring dependencies (only launch when dependencies ready)
  for (const name of order) {
    const svc = manifest.services[name];
    const deps = svc.dependencies || [];
    if (deps.length) log(`Waiting on dependencies for ${name}: ${deps.join(', ')}`);
    while (deps.some(d => orchestratorState[d].status !== 'ready')) {
      await delay(200);
    }
    await startService(name, manifest, orchestratorState);
  }
  log('All services launched (some may still initialize). Monitoring...');

  // Liveness monitoring loop (basic): if a ready service becomes unhealthy X times consecutively, restart.
  const pollInterval = manifest.global.monitorIntervalMs || 5000;
  const unhealthyCounts = new Map();
  const maxConsecutive = 3;
  const monitor = setInterval(async () => {
    for (const name of order) {
      const svc = manifest.services[name];
      const state = orchestratorState[name];
      if (state.process && state.status === 'ready') {
        const ok = await probe({ port: svc.port, path: svc.healthPath });
        if (!ok) {
          const c = (unhealthyCounts.get(name) || 0) + 1;
          unhealthyCounts.set(name, c);
          if (c >= maxConsecutive) {
            error(`Service ${name} failed health probe ${c}x -> restarting.`);
            state.process.kill();
            state.process = null;
            state.status = 'degraded';
            unhealthyCounts.set(name, 0);
            scheduleRestart(name, manifest, orchestratorState, 'health-probe-fail');
          }
        } else if (unhealthyCounts.get(name)) {
          unhealthyCounts.set(name, 0);
        }
      }
    }
  }, pollInterval);

  function shutdown() {
    log('Received shutdown signal. Terminating services...');
    clearInterval(monitor);
    for (const name of Object.keys(orchestratorState)) {
      const st = orchestratorState[name];
      st.shuttingDown = true;
      if (st.process) {
        try { st.process.kill(); } catch { /* noop */ }
      }
    }
    setTimeout(() => process.exit(0), 200).unref();
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  orchestrate().catch(e => { error('orchestration failed', e); process.exitCode = 1; });
}

export { topologicalOrder, orchestrate };
export default { orchestrate, topologicalOrder };