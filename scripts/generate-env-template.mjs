#!/usr/bin/env node
/**
 * Generate a canonical .env.example from the shared Zod environment schema.
 * - Organizes variables by logical categories
 * - Fills sensible defaults using development schema parsing
 * - Masks secrets with placeholders
 * - Avoids duplication with the managed Proxy Registry section
 *
 * Usage:
 *   node scripts/generate-env-template.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const isCheck = process.argv.includes('--check');

async function loadSharedEnvironment() {
  // Try normal import via workspace alias; fall back to built dist
  try {
    return await import('@critgenius/shared/config/environment');
  } catch {
    const localPath = path.resolve(
      repoRoot,
      'packages',
      'shared',
      'dist',
      'config',
      'environment.js'
    );
    return await import(pathToFileURL(localPath).href);
  }
}

async function loadProxyRegistry() {
  try {
    return await import('@critgenius/shared/config/proxyRegistry');
  } catch {
    const localPath = path.resolve(
      repoRoot,
      'packages',
      'shared',
      'dist',
      'config',
      'proxyRegistry.js'
    );
    return await import(pathToFileURL(localPath).href);
  }
}

function maskIfSecret(key, value) {
  const secretLike = new Set([
    'ASSEMBLYAI_API_KEY',
    'JWT_SECRET',
    'CRITGENIUS_ECOSYSTEM_API_KEY',
    'CRITGENIUS_SERVICE_TOKEN',
    'REDIS_PASSWORD',
    'SLACK_WEBHOOK_URL',
    'DISCORD_WEBHOOK_URL',
    'SSL_CERT_PATH',
    'SSL_KEY_PATH',
    'HTTPS_CERT_PATH',
    'HTTPS_KEY_PATH',
  ]);
  if (secretLike.has(key)) {
    switch (key) {
      case 'ASSEMBLYAI_API_KEY':
        return 'your_assemblyai_api_key_here';
      case 'JWT_SECRET':
        return 'your-super-secret-jwt-key-change-this-in-production';
      default:
        return '';
    }
  }
  return value;
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatHeader() {
  return [
    '# CritGenius Listener – Example Environment Variables',
    '# This file is generated. Run: pnpm generate:env',
    '# Copy to .env and adjust values for your environment.',
    '',
  ].join('\n');
}

function formatCategoryHeader(cat) {
  return [`# ${titleCase(cat)} Configuration`, ''].join('\n');
}

function formatProxyManagedBlock(keys) {
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
  const trimmed = original.endsWith('\n') ? original : original + '\n';
  return `${trimmed}${managedBlock}`;
}

async function main() {
  const envExamplePath = path.resolve(repoRoot, '.env.example');
  const original = fs.existsSync(envExamplePath)
    ? fs.readFileSync(envExamplePath, 'utf8')
    : '';

  const [{ schemaCategories, developmentEnvironmentSchema }, { PROXY_ENV_KEYS }] = await Promise.all([
    loadSharedEnvironment(),
    loadProxyRegistry(),
  ]);

  // Seed minimal required vars for development to let Zod fill defaults
  const seed = {
    NODE_ENV: 'development',
    ASSEMBLYAI_API_KEY: 'your_assemblyai_api_key_here',
    MONGODB_URI: 'mongodb://localhost:27017/critgenius-listener',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'dev-jwt-secret-change-in-production',
  };
  let devDefaults;
  try {
    devDefaults = developmentEnvironmentSchema.parse(seed);
  } catch {
    // Fallback to seed only
    devDefaults = seed;
  }

  const proxyKeys = new Set(Object.values(PROXY_ENV_KEYS));

  // Build content
  const lines = [];
  lines.push(formatHeader());

  const categoryOrder = [
    'node',
    'development',
    'assemblyai',
    'database',
    'ecosystem',
    'security',
    'audio',
    'session',
    'export',
    'dataRetention',
    'privacy',
    'logging',
    'performance',
    'monitoring',
    'testing',
    'production',
    'client',
  ].filter(cat => schemaCategories[cat]);

  const emitted = new Set();
  for (const cat of categoryOrder) {
    const schema = schemaCategories[cat];
    const keys = Object.keys(schema.shape);
    const printable = keys.filter(k => !proxyKeys.has(k));
    if (printable.length === 0) continue;
    lines.push(formatCategoryHeader(cat));
    for (const key of printable) {
      if (emitted.has(key)) continue;
      emitted.add(key);
      const val = devDefaults[key] !== undefined ? String(devDefaults[key]) : '';
      lines.push(`${key}=${maskIfSecret(key, val)}`);
    }
    lines.push('');
  }

  // Append managed Proxy section as the canonical source for those keys
  const managedBlock = formatProxyManagedBlock(PROXY_ENV_KEYS);
  const draft = lines.join('\n');
  const withManaged = upsertManagedSection(draft, managedBlock);

  if (isCheck) {
    if (withManaged !== original) {
      console.error('[generate-env-template] Drift detected in .env.example');
      process.exit(1);
    }
    return;
  }

  if (withManaged !== original) {
    fs.writeFileSync(envExamplePath, withManaged);
    console.log('[generate-env-template] .env.example updated');
  } else {
    console.log('[generate-env-template] .env.example up-to-date');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(e => {
    console.error('[generate-env-template] Failed:', e && e.message ? e.message : e);
    process.exit(1);
  });
}
