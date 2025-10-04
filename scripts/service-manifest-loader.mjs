#!/usr/bin/env node
/** Service Manifest Loader (v2 with legacy upgrade) */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

let yaml;
async function loadYamlModule() {
  if (!yaml) {
    try { yaml = await import('js-yaml'); }
    catch { throw new Error('Missing dependency js-yaml. Install with: pnpm add -D js-yaml'); }
  }
  return yaml;
}

export async function loadServiceManifest(manifestPath = path.resolve(process.cwd(), 'services.yaml')) {
  const { load: yamlLoad } = await loadYamlModule();
  if (!fs.existsSync(manifestPath)) throw new Error(`Service manifest not found at ${manifestPath}`);
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const doc = yamlLoad(raw);
  upgradeLegacy(doc);
  validate(doc);
  for (const svc of Object.values(doc.services)) {
    if (svc && typeof svc === 'object' && svc.environment) {
      if (!svc.type) svc.type = 'pnpm';
      for (const [k, v] of Object.entries(svc.environment)) {
        if (typeof v === 'string') svc.environment[k] = v.replace(/\$\{port\}/g, String(svc.port));
      }
      // Auto-injected convenience environment variables (Phase 2 compatibility layer)
      // These replaced the previously mis-indented root-level YAML keys.
      try {
        if (!('SERVICE_NAME' in svc.environment)) svc.environment.SERVICE_NAME = svc.name || 'unknown-service';
        const globalDefault = doc.global && doc.global.defaultTimeout != null ? String(doc.global.defaultTimeout) : undefined;
        if (globalDefault) {
          if (!('TIMEOUT' in svc.environment)) svc.environment.TIMEOUT = globalDefault;
          if (!('DEV_PROXY_TIMEOUT_MS' in svc.environment)) svc.environment.DEV_PROXY_TIMEOUT_MS = globalDefault;
        }
      } catch { /* no-op protective */ }
    }
  }
  return doc;
}

function validate(doc) {
  const errors = [];
  const push = m => errors.push(m);
  if (!doc || typeof doc !== 'object') push('Root must be an object');
  if (!doc.version) push('version is required');
  if (!doc.services || typeof doc.services !== 'object') push('services section required');
  if (doc.global && typeof doc.global !== 'object') push('global must be object');
  if (doc.services && typeof doc.services === 'object') {
    for (const [name, svc] of Object.entries(doc.services)) {
      if (!svc || typeof svc !== 'object') { push(`service ${name} must be object`); continue; }
      if (!svc.command) push(`service ${name} missing command`);
      if (typeof svc.port !== 'number') push(`service ${name} port must be number`);
      if (!svc.healthPath) push(`service ${name} missing healthPath`);
      if (typeof svc.startupTimeoutMs !== 'number') push(`service ${name} missing startupTimeoutMs`);
      if (svc.dependencies && !Array.isArray(svc.dependencies)) push(`service ${name} dependencies must be array`);
      if (svc.type && typeof svc.type !== 'string') push(`service ${name} type must be string`);
      if (svc.executionConfig && typeof svc.executionConfig !== 'object') push(`service ${name} executionConfig must be object`);
      if (svc.executionConfig && svc.executionConfig.fallbackCommands && !Array.isArray(svc.executionConfig.fallbackCommands)) push(`service ${name} executionConfig.fallbackCommands must be array`);
    }
  }
  if (errors.length) {
    const err = new Error('Service manifest validation failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    err.validationErrors = errors; throw err;
  }
  return true;
}

function upgradeLegacy(doc) {
  if (!doc || typeof doc !== 'object') return doc;
  if (!doc.version || doc.version.startsWith('1.')) {
    doc.version = '2.0';
    if (!doc.global) doc.global = {};
    if (doc.global.defaultTimeout === undefined) doc.global.defaultTimeout = 30000;
    for (const svc of Object.values(doc.services || {})) {
      if (svc && typeof svc === 'object') {
        if (!svc.type) svc.type = 'pnpm';
        if (!svc.executionConfig) svc.executionConfig = { fallbackCommands: ['pnpm', 'corepack pnpm', 'npx pnpm'] };
      }
    }
  }
  return doc;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  let manifestOverride;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === '--manifest' || value === '-m') {
      manifestOverride = args[index + 1];
      index += 1;
      continue;
    }

    if (!value.startsWith('-') && manifestOverride === undefined) {
      manifestOverride = value;
    }
  }

  const resolvedManifestPath = manifestOverride
    ? path.resolve(process.cwd(), manifestOverride)
    : undefined;

  loadServiceManifest(resolvedManifestPath).then(manifest => {
    console.log(`Loaded service manifest v${manifest.version} with ${Object.keys(manifest.services).length} services.`);
    for (const [name, svc] of Object.entries(manifest.services)) {
      console.log(` - ${name} -> port ${svc.port}, deps: ${(svc.dependencies||[]).join(',')||'∅'}`);
    }
  }).catch(err => { console.error(err.message); process.exitCode = 1; });
}

export default { loadServiceManifest };
