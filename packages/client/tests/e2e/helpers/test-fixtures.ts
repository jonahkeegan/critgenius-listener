import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { InlineConfig, PreviewServer } from 'vite';

let server: PreviewServer | null = null;
let baseUrl: string | null = null;
let referenceCount = 0;

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(currentDir, '../../..');
const buildOutputDir = path.resolve(clientRoot, 'dist-e2e');

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

async function createViteServer(port: number): Promise<PreviewServer> {
  const { build, preview } = await import('vite');
  const inlineConfig: InlineConfig = {
    root: clientRoot,
    configFile: path.resolve(clientRoot, 'vite.config.ts'),
    mode: 'production',
    logLevel: 'error',
    build: {
      outDir: buildOutputDir,
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

  await fs.rm(buildOutputDir, { recursive: true, force: true });
  await build(inlineConfig);
  return await preview(inlineConfig);
}

export async function startClientAppServer(): Promise<string> {
  if (server && baseUrl) {
    referenceCount += 1;
    return baseUrl;
  }

  const port = await allocatePort();
  server = await createViteServer(port);
  const resolvedPort = port;
  baseUrl = `http://127.0.0.1:${resolvedPort}`;
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
}

export function getClientRoot(): string {
  return clientRoot;
}
