#!/usr/bin/env node
/**
 * Verification script for Firefox sandbox configuration
 * Validates that sandbox disabling is conditional on CI environment
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, '../packages/client/playwright.config.ts');
const configContent = readFileSync(configPath, 'utf-8');

console.log('🔍 Verifying Firefox sandbox configuration...\n');

// Check for conditional sandbox disabling
const hasConditionalSandbox = configContent.includes('...(process.env.CI');
const hasConditionalEnv = configContent.includes('env: process.env.CI');
const hasSecurityNote = configContent.includes('Security note:');

console.log('✓ Checking for conditional sandbox preferences:', hasConditionalSandbox ? '✅' : '❌');
console.log('✓ Checking for conditional environment variables:', hasConditionalEnv ? '✅' : '❌');
console.log('✓ Checking for security documentation:', hasSecurityNote ? '✅' : '❌');

if (hasConditionalSandbox && hasConditionalEnv && hasSecurityNote) {
  console.log('\n✅ Firefox sandbox configuration is properly conditionalized for CI\n');
  console.log('Security benefits:');
  console.log('  • Local development maintains Firefox sandbox protection');
  console.log('  • CI environments disable sandbox only when necessary');
  console.log('  • Configuration follows principle of least privilege\n');
  process.exit(0);
} else {
  console.error('\n❌ Firefox sandbox configuration verification failed\n');
  console.error('Issues found:');
  if (!hasConditionalSandbox) {
    console.error('  • Sandbox preferences are not conditional on CI environment');
  }
  if (!hasConditionalEnv) {
    console.error('  • Environment variables are not conditional on CI environment');
  }
  if (!hasSecurityNote) {
    console.error('  • Missing security documentation/rationale');
  }
  console.error('');
  process.exit(1);
}
