#!/usr/bin/env node
/**
 * Local HTTPS Certificate Setup Script
 *
 * Generates development certificates enabling secure context (needed for some browser APIs).
 * Preference order:
 *  1. mkcert (trusted local CA) if installed / installable
 *  2. OpenSSL self-signed fallback (untrusted until manually accepted)
 *
 * Output directory: ./certificates/dev
 * Files: dev-cert.pem, dev-key.pem
 *
 * Safe to re-run; existing certs will be skipped unless --force provided.
 */
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const FORCE = process.argv.includes('--force');
const VERBOSE = process.argv.includes('--verbose');
const CERT_DIR = path.resolve(process.cwd(), 'certificates', 'dev');
const CERT_PATH = path.join(CERT_DIR, 'dev-cert.pem');
const KEY_PATH = path.join(CERT_DIR, 'dev-key.pem');
const META_PATH = path.join(CERT_DIR, 'meta.json');

function log(msg, level = 'info') {
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️ ' : 'ℹ️ ';
  console.log(`${prefix} ${msg}`);
}

function run(cmd, args, opts = {}) {
  if (VERBOSE) log(`Running: ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { stdio: VERBOSE ? 'inherit' : 'pipe', ...opts });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    throw new Error(`${cmd} exited with code ${res.status}`);
  }
  return res.stdout?.toString() ?? '';
}

function hasCommand(command) {
  try {
    const which = process.platform === 'win32' ? 'where' : 'which';
    execSync(`${which} ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function ensureDir() {
  fs.mkdirSync(CERT_DIR, { recursive: true });
}

function fileExists(p) {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function writeMeta(meta) {
  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2));
}

function generateWithMkcert() {
  log('Attempting mkcert certificate generation');
  // mkcert -install idempotent
  run('mkcert', ['-install']);
  // mkcert localhost 127.0.0.1 ::1
  run('mkcert', ['-cert-file', CERT_PATH, '-key-file', KEY_PATH, 'localhost', '127.0.0.1', '::1']);
  writeMeta({ tool: 'mkcert', created: new Date().toISOString() });
  log('mkcert certificates created ✅');
}

function generateWithOpenSSL() {
  log('Falling back to OpenSSL self-signed certificate generation');
  // Generate key
  run('openssl', ['req', '-x509', '-nodes', '-days', '365', '-newkey', 'rsa:2048', '-keyout', KEY_PATH, '-out', CERT_PATH, '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1']);
  writeMeta({ tool: 'openssl', created: new Date().toISOString() });
  log('OpenSSL self-signed certificate created ✅ (browser trust prompts likely)');
}

function setPermissions() {
  if (os.platform() === 'win32') {
    // Best-effort: Windows ACL adjustments are complex; skip with notice.
    return;
  }
  try {
    fs.chmodSync(CERT_PATH, 0o600);
    fs.chmodSync(KEY_PATH, 0o600);
  } catch (e) {
    log(`Could not set strict permissions: ${e.message}`, 'warn');
  }
}

function main() {
  ensureDir();
  if (!FORCE && fileExists(CERT_PATH) && fileExists(KEY_PATH)) {
    log('Existing certificates detected – use --force to regenerate. Skipping.');
    return;
  }
  try {
    if (hasCommand('mkcert')) {
      generateWithMkcert();
    } else if (hasCommand('openssl')) {
      generateWithOpenSSL();
    } else {
      log('Neither mkcert nor openssl found in PATH. Please install one and re-run.', 'error');
      process.exit(1);
    }
    setPermissions();
    log(`Certificates ready:\n  CERT: ${CERT_PATH}\n  KEY:  ${KEY_PATH}`);
    log('Add / update env vars: HTTPS_ENABLED=true, HTTPS_CERT_PATH, HTTPS_KEY_PATH');
  } catch (e) {
    log(`Certificate generation failed: ${e instanceof Error ? e.message : String(e)}`, 'error');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { CERT_PATH, KEY_PATH };
