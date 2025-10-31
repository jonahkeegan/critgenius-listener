import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { InlineConfig, PreviewServer } from 'vite';

let server: PreviewServer | null = null;
let baseUrl: string | null = null;
let referenceCount = 0;
let activeBuildOutputDir: string | null = null;

const PREVIEW_READY_TIMEOUT_MS = 30000;
const PREVIEW_READY_POLL_INTERVAL_MS = 250;

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(currentDir, '../../..');

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

function resolveBuildOutputDir(port: number): string {
  const outDirRoot = path.resolve(clientRoot, 'dist-e2e');
  return path.resolve(outDirRoot, `preview-${port}`);
}

async function createViteServer(
  port: number,
  outDir: string
): Promise<PreviewServer> {
  const { build, preview } = await import('vite');
  const inlineConfig: InlineConfig = {
    root: clientRoot,
    configFile: path.resolve(clientRoot, 'vite.config.ts'),
    mode: 'production',
    logLevel: 'error',
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: false,
      minify: false,
      target: 'es2019',
    },
    preview: {
      port,
      strictPort: true,
      host: '127.0.0.1',
      open: false,
    },
  };

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  if (!process.env.VITE_E2E) {
    process.env.VITE_E2E = 'true';
  }

  await fs.rm(outDir, { recursive: true, force: true });
  await build(inlineConfig);
  return await preview(inlineConfig);
}

async function delay(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForPreviewReady(url: string): Promise<void> {
  const deadline = Date.now() + PREVIEW_READY_TIMEOUT_MS;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        return;
      }
      lastError = new Error(`Preview responded with status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(PREVIEW_READY_POLL_INTERVAL_MS);
  }

  const reason =
    lastError instanceof Error
      ? lastError.message
      : typeof lastError === 'string'
        ? lastError
        : 'unknown error';

  throw new Error(`Timed out waiting for preview server at ${url}: ${reason}`);
}

export async function startClientAppServer(): Promise<string> {
  if (server && baseUrl) {
    referenceCount += 1;
    return baseUrl;
  }

  const port = await allocatePort();
  const outDir = resolveBuildOutputDir(port);
  server = await createViteServer(port, outDir);
  baseUrl = `http://127.0.0.1:${port}`;
  activeBuildOutputDir = outDir;
  await waitForPreviewReady(baseUrl);
  referenceCount = 1;

  return baseUrl;
}

export async function stopClientAppServer(): Promise<void> {
  if (!server) {
    baseUrl = null;
    referenceCount = 0;
    return;
  }

  referenceCount = Math.max(0, referenceCount - 1);
  if (referenceCount > 0) {
    return;
  }

  await server.close();
  server = null;
  baseUrl = null;
  if (activeBuildOutputDir) {
    await fs.rm(activeBuildOutputDir, { recursive: true, force: true });
    activeBuildOutputDir = null;
  }
}

export function getClientRoot(): string {
  return clientRoot;
}
