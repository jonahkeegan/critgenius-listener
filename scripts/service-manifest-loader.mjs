#!/usr/bin/env node
/**
 * Service Manifest Loader
 * Lightweight YAML loader + validation for dev orchestration.
 * Keeps dependency surface minimal (no full AJV) while enforcing required fields.
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

// Lazy load yaml only when needed to avoid cost if not used
let yaml;
async function loadYamlModule() {
  if (!yaml) {
    // Prefer js-yaml if installed; fallback to a tiny dynamic import error.
    try {
      yaml = await import('js-yaml');
    } catch (e) {
      throw new Error('Missing dependency js-yaml. Install with: pnpm add -D js-yaml');
    }
  }
  return yaml;
}

export async function loadServiceManifest(manifestPath = path.resolve(process.cwd(), 'services.yaml')) {
  const { load: yamlLoad } = await loadYamlModule();
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Service manifest not found at ${manifestPath}`);
  }
  const raw = fs.readFileSync(manifestPath, 'utf8');
  const doc = yamlLoad(raw);
  validate(doc);
  // post-process variable interpolation like ${port} inside environment values
  for (const svc of Object.values(doc.services)) {
    if (svc.environment) {
      for (const [k, v] of Object.entries(svc.environment)) {
        if (typeof v === 'string') {
          svc.environment[k] = v.replace(/\$\{port\}/g, String(svc.port));
        }
      }
    }
  }
  return doc;
}

function validate(doc) {
  const errors = [];
  const push = msg => errors.push(msg);
  if (!doc || typeof doc !== 'object') push('Root must be an object');
  if (!doc.version) push('version is required');
  if (!doc.services || typeof doc.services !== 'object') push('services section required');
  else {
    for (const [name, svc] of Object.entries(doc.services)) {
      if (typeof svc !== 'object') { push(`service ${name} must be object`); continue; }
      if (!svc.command) push(`service ${name} missing command`);
      if (typeof svc.port !== 'number') push(`service ${name} port must be number`);
      if (!svc.healthPath) push(`service ${name} missing healthPath`);
      if (typeof svc.startupTimeoutMs !== 'number') push(`service ${name} missing startupTimeoutMs`);
      if (svc.dependencies && !Array.isArray(svc.dependencies)) push(`service ${name} dependencies must be array`);
    }
  }
  if (errors.length) {
    const err = new Error('Service manifest validation failed:\n' + errors.map(e => ' - ' + e).join('\n'));
    err.validationErrors = errors;
    throw err;
  }
  return true;
}

// When executed directly, just print summary
if (import.meta.url === `file://${process.argv[1]}`) {
  loadServiceManifest().then(manifest => {
    console.log(`Loaded service manifest v${manifest.version} with ${Object.keys(manifest.services).length} services.`);
    for (const [name, svc] of Object.entries(manifest.services)) {
      console.log(` - ${name} -> port ${svc.port}, deps: ${(svc.dependencies||[]).join(',')||'∅'}`);
    }
  }).catch(err => {
    console.error(err.message);
    process.exitCode = 1;
  });
}

export default { loadServiceManifest };
