#!/usr/bin/env node
/**
 * Generate .env.example entries for proxy-related keys from the centralized registry
 * Supports --check to exit non-zero if changes would be made (drift guard).
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
    return await import(pathToFileURL(localPath).href);
  }
}

function formatEnvLines(keys) {
  // Deterministic order
  const ordered = Object.values(keys).slice().sort();
  const header = [
    '# --- Proxy Registry Managed Section (do not edit manually) ---',
    '# These variables are managed by scripts/generate-proxy-env-example.mjs',
    '# Update the proxy registry in packages/shared if you need changes.',
  ];
  const lines = ordered.map(k => {
    let placeholder = 'value';
    switch (k) {
      case 'DEV_PROXY_ENABLED':
        placeholder = 'true';
        break;
      case 'DEV_PROXY_TARGET_PORT':
        placeholder = '3100';
        break;
      case 'DEV_PROXY_TARGET_HTTPS_PORT':
        placeholder = '3101';
        break;
      case 'DEV_PROXY_TIMEOUT_MS':
        placeholder = '30000';
        break;
      case 'DEV_PROXY_AUTO_DISCOVER':
        placeholder = 'true';
        break;
      case 'DEV_PROXY_DISCOVERY_PORTS':
        placeholder = '3100,3000,8080';
        break;
      case 'DEV_PROXY_DISCOVERY_TIMEOUT_MS':
        placeholder = '10000';
        break;
      case 'DEV_PROXY_PROBE_TIMEOUT_MS':
        placeholder = '2000';
        break;
      case 'DEV_PROXY_HTTPS_ENABLED':
        placeholder = 'false';
        break;
      case 'DEV_PROXY_REJECT_UNAUTHORIZED':
        placeholder = 'false';
        break;
      case 'DEV_PROXY_ALLOWED_HOSTS':
        placeholder = 'localhost,127.0.0.1';
        break;
      case 'DEV_PROXY_ASSEMBLYAI_ENABLED':
        placeholder = 'true';
        break;
      case 'DEV_PROXY_ASSEMBLYAI_PATH':
        placeholder = '/proxy/assemblyai';
        break;
      default:
        break;
    }
    return `${k}=${placeholder}`;
  });
  return [...header, ...lines, '# --- End Managed Section ---', ''].join('\n');
}

function upsertManagedSection(original, managedBlock) {
  const begin = '# --- Proxy Registry Managed Section (do not edit manually) ---';
  const end = '# --- End Managed Section ---';
  const startIdx = original.indexOf(begin);
  const endIdx = original.indexOf(end);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = original.slice(0, startIdx);
    const after = original.slice(endIdx + end.length);
    return `${before}${managedBlock}${after}`;
  }
  // Append at the end with a separating newline
  const trimmed = original.endsWith('\n') ? original : original + '\n';
  return `${trimmed}${managedBlock}`;
}

async function main() {
  const { PROXY_ENV_KEYS } = await loadProxyRegistry();
  const envExamplePath = path.resolve(repoRoot, '.env.example');
  const current = fs.readFileSync(envExamplePath, 'utf8');
  const managed = formatEnvLines(PROXY_ENV_KEYS);
  const next = upsertManagedSection(current, managed);
  if (isCheck) {
    if (next !== current) {
      console.error('[generate-proxy-env-example] Drift detected in .env.example');
      process.exit(1);
    }
    return;
  }
  if (next !== current) {
    fs.writeFileSync(envExamplePath, next);
    console.log('[generate-proxy-env-example] .env.example updated');
  } else {
    console.log('[generate-proxy-env-example] .env.example up-to-date');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => {
    console.error('[generate-proxy-env-example] Failed:', e && e.message ? e.message : e);
    process.exit(1);
  });
}
