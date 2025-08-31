import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import http from 'node:http';

function probe(port: number, path: string) {
  return new Promise<boolean>(resolve => {
    const req = http.get(
      { host: '127.0.0.1', port, path, timeout: 1500 },
      res => {
        res.resume();
        resolve((res.statusCode ?? 500) < 500);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

const run = process.env.ORCHESTRATION_SMOKE === 'true';

describe.skipIf(!run)('dev orchestration script (smoke)', () => {
  it('starts server before client and both become healthy', async () => {
    const child = spawn('node', ['scripts/dev-orchestration.mjs'], {
      cwd: process.cwd(),
    });

    // Wait up to 35s for server
    let serverReady = false;
    for (let i = 0; i < 35 && !serverReady; i++) {
      serverReady = await probe(3100, '/api/health');
      if (!serverReady) await delay(1000);
    }
    expect(serverReady).toBe(true);

    // After server ready, allow up to 25s for client (vite root path)
    let clientReady = false;
    for (let i = 0; i < 25 && !clientReady; i++) {
      clientReady = await probe(5173, '/');
      if (!clientReady) await delay(1000);
    }
    expect(clientReady).toBe(true);

    child.kill();
  }, 70_000);
});
