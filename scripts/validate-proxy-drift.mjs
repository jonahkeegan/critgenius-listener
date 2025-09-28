#!/usr/bin/env node
/**
 * Drift guard validator for proxy registry alignment.
 * - Ensures docs and .env.example are up to date (via --check generators)
 * - Sanity checks Vite config uses getProxyRegistry/resolveTargetFromEnv and server.hmr
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function runNode(script, args = []) {
  const res = spawnSync(process.execPath, [script, ...args], { stdio: 'pipe' });
  return { code: res.status ?? 0, out: String(res.stdout || ''), err: String(res.stderr || '') };
}

function checkGenerators() {
  const scripts = [
    path.resolve(repoRoot, 'scripts', 'generate-proxy-env-example.mjs'),
    path.resolve(repoRoot, 'scripts', 'generate-proxy-docs.mjs'),
  ];
  let failed = false;
  for (const s of scripts) {
    const { code, err } = runNode(s, ['--check']);
    if (code !== 0) {
      console.error(`[validate-proxy-drift] Generator drift: ${path.basename(s)}\n${err}`);
      failed = true;
    }
  }
  return !failed;
}

function checkViteConfig() {
  const vitePath = path.resolve(repoRoot, 'packages', 'client', 'vite.config.ts');
  const src = fs.readFileSync(vitePath, 'utf8');
  const requiresRegistry = src.includes("@critgenius/shared/config/proxyRegistry")
    && src.includes('getProxyRegistry(')
    && src.includes('resolveTargetFromEnv(');
  const hasHmr = src.includes('server: {') && src.includes('hmr: {');
  if (!requiresRegistry) {
    console.error('[validate-proxy-drift] Vite config must use proxy registry helpers');
    return false;
  }
  if (!hasHmr) {
    console.error('[validate-proxy-drift] Vite config must configure server.hmr explicitly');
    return false;
  }
  return true;
}

function main() {
  const okGen = checkGenerators();
  const okVite = checkViteConfig();
  if (!okGen || !okVite) process.exit(1);
  console.log('[validate-proxy-drift] OK');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
