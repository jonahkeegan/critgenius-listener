#!/usr/bin/env node
/**
 * Check certificate expiration for development HTTPS certs.
 * Supports mkcert & OpenSSL generated PEM certs.
 * Warns if <30 days remaining.
 */
import fs from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const CERT = process.argv[2] || path.resolve('certificates', 'dev', 'dev-cert.pem');
const THRESHOLD_DAYS = Number(process.env.CERT_WARN_DAYS || 30);

function log(msg, level='info') {
  const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️ ' : 'ℹ️ ';
  console.log(`${prefix} ${msg}`);
}

if (!fs.existsSync(CERT)) {
  log(`Certificate not found at ${CERT}`, 'warn');
  process.exit(0);
}

try {
  const out = execSync(`openssl x509 -enddate -noout -in "${CERT}"`).toString().trim();
  const match = out.match(/notAfter=(.*)/i);
  if (!match) throw new Error('Unable to parse notAfter field');
  const expiresAt = new Date(match[1]);
  const daysLeft = Math.floor((expiresAt.getTime() - Date.now()) / 86400000);
  if (daysLeft < 0) {
    log(`Certificate expired ${-daysLeft} days ago (${expiresAt.toISOString()})`, 'error');
    process.exit(2);
  }
  if (daysLeft <= THRESHOLD_DAYS) {
    log(`Certificate expires in ${daysLeft} days (${expiresAt.toISOString()}). Regenerate soon (scripts/setup-https-certs.mjs --force).`, 'warn');
  } else {
    log(`Certificate valid (${daysLeft} days remaining)`);
  }
} catch (e) {
  log(`Failed to inspect certificate: ${e instanceof Error ? e.message : String(e)}`, 'warn');
  process.exit(0);
}
