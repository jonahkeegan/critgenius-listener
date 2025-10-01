import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';

import { envReloadPlugin } from '../../src/dev/envReloadPlugin';

/**
 * Integration test: spin up a real Vite dev server with envReloadPlugin and
 * verify that editing a .env file produces a browser full reload via Vite's
 * websocket full-reload message (observed as a second navigation in the page).
 */

const runIntegration = process.env.RUN_CLIENT_IT === 'true';
const describeMaybe = runIntegration ? describe : describe.skip;

describeMaybe('integration: envReloadPlugin full reload on .env change', () => {
  let tmpDir: string;
  let server: any;
  let browser: any;
  let page: any;
  let port: number;
  const navigations: number[] = [];
  const logs: string[] = [];

  beforeAll(async () => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), 'env-reload-it-'));
    writeFileSync(
      path.join(tmpDir, 'index.html'),
      '<!doctype html><html><head><title>IT</title></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>'
    );
    const srcDir = path.join(tmpDir, 'src');
    mkdirSync(srcDir, { recursive: true });
    writeFileSync(
      path.join(srcDir, 'main.ts'),
      "document.getElementById('app')!.textContent = 'Initial';"
    );
    writeFileSync(path.join(tmpDir, '.env'), 'VITE_FOO=bar');

    port = await allocatePort();

    const customLogger = {
      info(msg: string) {
        logs.push(msg);
      },
      warn(msg: string) {
        logs.push('WARN:' + msg);
      },
      error(msg: string) {
        logs.push('ERROR:' + msg);
      },
      clearScreen: false,
      hasWarned: false,
    } as const;

    const { default: react } = await import('@vitejs/plugin-react');
    const { createServer } = await import('vite');
    const { chromium } = await import('playwright');

    const config: Record<string, unknown> = {
      root: tmpDir,
      logLevel: 'silent',
      server: { port, strictPort: true },
      customLogger,
      plugins: [react(), envReloadPlugin({ rootDir: tmpDir })],
    };

    server = await createServer(config);
    await server.listen();

    browser = await chromium.launch();
    page = await browser.newPage();
    page.on('framenavigated', (frame: any) => {
      if (frame === page.mainFrame()) navigations.push(Date.now());
    });
    await page.goto(`http://localhost:${port}`);
    navigations.push(Date.now());
  }, 15_000);

  afterAll(async () => {
    await page?.close();
    await browser?.close();
    await server?.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('triggers exactly one full reload within 2s after .env change', async () => {
    const start = Date.now();
    writeFileSync(path.join(tmpDir, '.env'), 'VITE_FOO=bar\nVITE_BAR=baz');

    let observed = false;
    while (Date.now() - start < 2000) {
      if (navigations.length >= 2) {
        observed = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    expect(observed).toBe(true);
    expect(navigations.length).toBe(2);
    const logHit = logs.some(entry =>
      entry.includes('[env-reload] full-reload')
    );
    if (!logHit) {
      console.warn(
        '[integration] Expected env-reload log not observed; collected logs:',
        logs
      );
    }
  });
});

async function allocatePort(): Promise<number> {
  return await new Promise<number>(resolve => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const address = srv.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      srv.close(() => resolve(port));
    });
  });
}
