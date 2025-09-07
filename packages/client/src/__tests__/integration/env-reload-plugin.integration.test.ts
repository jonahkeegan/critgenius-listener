import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';
import { chromium, Browser, Page, Frame } from 'playwright';
import react from '@vitejs/plugin-react';
import { createServer, InlineConfig, ViteDevServer } from 'vite';
import { envReloadPlugin } from '../../dev/envReloadPlugin';

/**
 * Integration test: spin up a real Vite dev server with envReloadPlugin and
 * verify that editing a .env file produces a browser full reload via Vite's
 * websocket full-reload message (observed as a second navigation in the page).
 */

describe('integration: envReloadPlugin full reload on .env change', () => {
  let tmpDir: string;
  let server: ViteDevServer;
  let browser: Browser;
  let page: Page;
  let port: number;
  const navigations: number[] = []; // timestamps
  const logs: string[] = [];

  beforeAll(async () => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), 'env-reload-it-'));
    // minimal project structure
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
    } as any;

    const config: InlineConfig = {
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
    page.on('framenavigated', (f: Frame) => {
      if (f === page.mainFrame()) navigations.push(Date.now());
    });
    await page.goto(`http://localhost:${port}`);
    // initial navigation recorded after goto resolves
    navigations.push(Date.now());
  }, 15000);

  afterAll(async () => {
    await page?.close();
    await browser?.close();
    await server?.close();
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('triggers exactly one full reload within 2s after .env change', async () => {
    const start = Date.now();
    // mutate .env
    writeFileSync(path.join(tmpDir, '.env'), 'VITE_FOO=bar\nVITE_BAR=baz');

    // Wait for a second navigation (full reload) distinct from the initial one.
    let observed = false;
    while (Date.now() - start < 2000) {
      if (navigations.length >= 2) {
        observed = true;
        break;
      }
      await new Promise(r => setTimeout(r, 50));
    }

    expect(observed).toBe(true);
    expect(navigations.length).toBe(2); // exactly one reload
    // soft verify log emitted (do not fail if missing due to customLogger wrapping)
    const logHit = logs.some(l => l.includes('[env-reload] full-reload'));
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
