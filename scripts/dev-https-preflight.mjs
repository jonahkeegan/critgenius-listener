#!/usr/bin/env node
// Lightweight preflight to sanity-check HTTPS proxy setup in dev
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const isTrue = v => String(v).toLowerCase() === 'true';

function logSummary() {
  const httpsEnabled = isTrue(process.env.HTTPS_ENABLED || 'false');
  const vitePort = Number((httpsEnabled ? process.env.HTTPS_PORT : process.env.CLIENT_PORT) || (httpsEnabled ? 5174 : 5173));
  const proxyHttps = isTrue(process.env.DEV_PROXY_HTTPS_ENABLED || 'false');
  const targetPort = Number((proxyHttps ? process.env.DEV_PROXY_TARGET_HTTPS_PORT : process.env.DEV_PROXY_TARGET_PORT) || (proxyHttps ? 3101 : 3100));
  const rejectUnauthorized = isTrue(process.env.DEV_PROXY_REJECT_UNAUTHORIZED || 'false');
  const allowed = (process.env.DEV_PROXY_ALLOWED_HOSTS || 'localhost,127.0.0.1');
  console.log('--- Dev HTTPS Preflight ---');
  console.log(`Vite HTTPS: ${httpsEnabled} (port ${vitePort})`);
  console.log(`Proxy HTTPS: ${proxyHttps} (target port ${targetPort})`);
  console.log(`Reject Unauthorized: ${rejectUnauthorized}`);
  console.log(`Allowed Hosts: ${allowed}`);
  return { httpsEnabled, vitePort, proxyHttps };
}

function requestHealth(origin) {
  return new Promise((resolve, reject) => {
    const u = new URL('/api/health', origin);
    const lib = u.protocol === 'https:' ? https : http;
    const rejectUnauthorized = isTrue(process.env.DEV_PROXY_REJECT_UNAUTHORIZED || 'false');
    const req = lib.request(
      u,
      {
        method: 'GET',
        rejectUnauthorized,
        timeout: Number(process.env.DEV_PROXY_TIMEOUT_MS || 10000),
      },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ statusCode: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.end();
  });
}

async function main() {
  const { httpsEnabled, vitePort } = logSummary();
  const origin = `${httpsEnabled ? 'https' : 'http'}://localhost:${vitePort}`;
  try {
    const res = await requestHealth(origin);
    if (res.statusCode === 200) {
      console.log('API health via proxy: OK');
    } else {
      console.warn(`API health via proxy: Unexpected status ${res.statusCode}`);
    }
  } catch (err) {
    console.warn('API health via proxy: FAILED');
    console.warn(String(err && err.message ? err.message : err));
  }

  // WSS upgrade smoke: we don't fully connect, just attempt TLS to /socket.io
  try {
    const u = new URL('/socket.io/', origin);
    const lib = u.protocol === 'https:' ? https : http;
    const rejectUnauthorized = isTrue(process.env.DEV_PROXY_REJECT_UNAUTHORIZED || 'false');
    const agent = u.protocol === 'https:' ? new https.Agent({ rejectUnauthorized }) : undefined;
    const req = lib.request(u, { method: 'GET', headers: { Connection: 'Upgrade', Upgrade: 'websocket' }, agent });
    req.on('upgrade', (_res, _socket, _head) => {
      console.log('WSS upgrade path reachable');
      req.destroy();
    });
    req.on('response', res => {
      if ((res.statusCode || 0) >= 300) {
        console.warn(`WSS probe: got HTTP ${res.statusCode} (expected 101 on upgrade)`);
      }
      res.destroy();
    });
    req.on('error', err => {
      console.warn('WSS probe error:', String(err && err.message ? err.message : err));
    });
    req.end();
  } catch (e) {
    console.warn('WSS probe: FAILED', e instanceof Error ? e.message : e);
  }
}

main();
