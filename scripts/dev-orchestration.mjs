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

// Derive ports (allow env override, fallback to schema defaults)
const SMOKE = process.env.ORCHESTRATION_SMOKE === 'true';
const CONFIG = {
  server: { command: SMOKE ? "node scripts/mock-health-server.mjs" : "pnpm --filter @critgenius/server run dev", port: Number(process.env.PORT) || 3100, healthPath: '/api/health', startupTimeoutMs: SMOKE ? 15_000 : 30_000 },
  client: { command: "pnpm --filter @critgenius/client run dev", port: 5173, healthPath: '/', startupTimeoutMs: 20_000 },
  pollIntervalMs: 1_000,
  monitorIntervalMs: 5_000,
  restartBackoffMs: 2_000,
};

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
    await delay(CONFIG.pollIntervalMs);
  }
  process.stdout.write(`\n❌ ${name} failed to become ready within ${startupTimeoutMs}ms\n`);
  return false;
}

function spawnLogged(name, commandParts) {
  const env = { ...process.env };
  if (name === 'server') {
    if (!env.PORT) env.PORT = String(CONFIG.server.port);
    // Inject minimal required env vars for smoke test so server validation passes without real services.
    if (SMOKE) {
      env.ASSEMBLYAI_API_KEY = env.ASSEMBLYAI_API_KEY || 'DEV_PLACEHOLDER_KEY_ABCDEFGHIJKLMNOPQRSTUVWXYZ123456';
      env.MONGODB_URI = env.MONGODB_URI || 'mongodb://localhost:27017/critgenius';
      env.REDIS_URL = env.REDIS_URL || 'redis://localhost:6379/0';
      env.JWT_SECRET = env.JWT_SECRET || 'dev_jwt_secret_placeholder_please_change';
            env.NODE_ENV = 'development';
            env.HOT_RELOAD = 'true';
            env.WATCH_FILES = 'true';
            env.DEV_PROXY_ENABLED = 'true';
            env.DEV_PROXY_ASSEMBLYAI_ENABLED = 'true';
            env.DEV_PROXY_TARGET_PORT = String(CONFIG.server.port);
            env.DEV_PROXY_TIMEOUT_MS = '30000';
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
  console.log('🧪 CritGenius coordinated dev starting...');
  let server = spawnLogged('server', { command: CONFIG.server.command });
  if (SMOKE) console.log(`[orchestrator] Spawned server with PORT=${process.env.PORT || '(injected '+CONFIG.server.port+')'}`);
  const serverReady = await waitForService('server', CONFIG.server);
  if (!serverReady) {
    server.kill();
    process.exitCode = 1;
    return;
  }
  let client = spawnLogged('client', { command: CONFIG.client.command });
  const clientReady = await waitForService('client', CONFIG.client);
  if (!clientReady) {
    client.kill();
    server.kill();
    process.exitCode = 1;
    return;
  }

  console.log('🌐 Dev environment ready:');
  console.log(`   ⚡ Server: http://localhost:${CONFIG.server.port}`);
  console.log(`   🎨 Client: http://localhost:${CONFIG.client.port}`);

  if (!enableMonitor) return; // passive mode ends here (process persists via child stdio inherit)

  console.log('🩺 Monitoring enabled (5s interval)...');
  setInterval(async () => {
    const sOk = await probe({ port: CONFIG.server.port, path: CONFIG.server.healthPath });
    const cOk = await probe({ port: CONFIG.client.port, path: CONFIG.client.healthPath });
    if (!sOk) {
      console.log('🚨 Server unhealthy. Restarting...');
      server.kill();
      await delay(CONFIG.restartBackoffMs);
  server = spawnLogged('server', { command: CONFIG.server.command });
    }
    if (!cOk) {
      console.log('🚨 Client unhealthy. Restarting...');
      client.kill();
      await delay(CONFIG.restartBackoffMs);
  client = spawnLogged('client', { command: CONFIG.client.command });
    }
  }, CONFIG.monitorIntervalMs);

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n🛑 Shutting down coordinated dev...');
    server.kill();
    client.kill();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

orchestrate();
