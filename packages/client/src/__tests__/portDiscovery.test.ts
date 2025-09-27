import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'node:http';
import { PortDiscoveryService } from '../config/portDiscovery';

function startMockHealthServer(port: number): Promise<http.Server> {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"status":"healthy"}');
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

describe('PortDiscoveryService', () => {
  let serverA: http.Server | undefined;
  const portA = 39811; // random high port unlikely to be occupied
  beforeAll(async () => {
    serverA = await startMockHealthServer(portA);
  });
  afterAll(async () => {
    await new Promise<void>(resolve => serverA?.close(() => resolve()));
  });

  it('discovers port when first candidate is healthy', async () => {
    const svc = new PortDiscoveryService();
    const result = await svc.discoverBackendPort({
      autoDiscover: true,
      candidatePorts: [portA, 39999],
      discoveryTimeoutMs: 3000,
      probeTimeoutMs: 1000,
      fallbackPort: 39999,
      https: false,
    });
    expect(result.discovered).toBe(true);
    expect(result.port).toBe(portA);
    expect(result.probeResults.length).toBeGreaterThan(0);
    expect(result.probeResults[0]!.status).toBe('success');
  });

  it('falls back when all probes fail', async () => {
    const svc = new PortDiscoveryService();
    const fb = 40123;
    const result = await svc.discoverBackendPort({
      autoDiscover: true,
      candidatePorts: [40124, 40125],
      discoveryTimeoutMs: 1500,
      probeTimeoutMs: 500,
      fallbackPort: fb,
      https: false,
    });
    expect(result.discovered).toBe(false);
    expect(result.port).toBe(fb);
  });

  it('respects autoDiscover=false by returning fallback without probes', async () => {
    const svc = new PortDiscoveryService();
    const fb = 41234;
    const result = await svc.discoverBackendPort({
      autoDiscover: false,
      candidatePorts: [portA],
      discoveryTimeoutMs: 2000,
      probeTimeoutMs: 500,
      fallbackPort: fb,
      https: false,
    });
    expect(result.discovered).toBe(false);
    expect(result.port).toBe(fb);
    expect(result.probeResults.length).toBe(0);
  });
});
