#!/usr/bin/env node
/**
 * Generate docs/development-proxy.routes.md from centralized proxy registry
 * Supports --check to exit non-zero on drift.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const isCheck = process.argv.includes('--check');

async function loadProxyRegistry() {
  try {
    return await import('@critgenius/shared/config/proxyRegistry');
  } catch {
    const localPath = path.resolve(repoRoot, 'packages', 'shared', 'dist', 'config', 'proxyRegistry.js');
    const mod = await import(pathToFileURL(localPath).href);
    return mod;
  }
}

function renderMarkdown(routes, env) {
  const hdr = `# Development Proxy Routes\n\n` +
    `This file is generated from the centralized proxy registry. Do not edit manually.\n\n`;
  const envList = Object.values(env).slice().sort();
  const envMd = ['## Environment Keys', '', ...envList.map(k => `- ${k}`), ''];
  const routeRows = routes
    .slice()
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(r => `| ${r.id} | ${r.path} | ${r.ws ? 'yes' : 'no'} | ${r.optional ? 'yes' : 'no'} | ${r.enableEnvVar ?? ''} |`);
  const routesMd = [
    '## Routes',
    '',
    '| id | path | ws | optional | enableEnvVar |',
    '|---|---|---|---|---|',
    ...routeRows,
    '',
  ];
  return [hdr, ...envMd, ...routesMd].join('\n');
}

async function main() {
  const { PROXY_ENV_KEYS, PROXY_ROUTES } = await loadProxyRegistry();
  const outPath = path.resolve(repoRoot, 'docs', 'development-proxy.routes.md');
  const next = renderMarkdown(PROXY_ROUTES, PROXY_ENV_KEYS);
  const current = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : '';
  if (isCheck) {
    if (current !== next) {
      console.error('[generate-proxy-docs] Drift detected in docs/development-proxy.routes.md');
      process.exit(1);
    }
    return;
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, next);
  console.log('[generate-proxy-docs] docs/development-proxy.routes.md updated');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => {
    console.error('[generate-proxy-docs] Failed:', e && e.message ? e.message : e);
    process.exit(1);
  });
}
