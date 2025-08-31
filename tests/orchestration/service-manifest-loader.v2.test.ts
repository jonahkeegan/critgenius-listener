import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function dump(contents: string) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-v2-'));
  const file = path.join(dir, 'services.yaml');
  fs.writeFileSync(file, contents, 'utf8');
  return file;
}
function loadViaBridge(p: string) {
  const script = path.resolve(process.cwd(), 'scripts/manifest-dump.cjs');
  const out = execFileSync('node', [script, p], { encoding: 'utf8' });
  return JSON.parse(out);
}

describe('service-manifest-loader v2 enhancements', () => {
  it('upgrades legacy v1 manifest adding defaults', () => {
    const legacy = `version: "1.0"\nservices:\n  api:\n    name: "api"\n    command: "pnpm run dev"\n    port: 4000\n    healthPath: "/health"\n    startupTimeoutMs: 5000\n`;
    const file = dump(legacy);
    const manifest = loadViaBridge(file);
    expect(manifest.version).toBe('2.0');
    expect(manifest.services.api.type).toBe('pnpm');
    expect(
      manifest.services.api.executionConfig.fallbackCommands
    ).toBeDefined();
    expect(manifest.global.defaultTimeout).toBeDefined();
  });

  it('validates new executionConfig shape (fallbackCommands array)', () => {
    const bad = `version: "2.0"\nservices:\n  svc:\n    name: "svc"\n    command: "pnpm run dev"\n    port: 5001\n    healthPath: "/health"\n    startupTimeoutMs: 5000\n    executionConfig: 123\n`;
    const file = dump(bad);
    const script = path.resolve(process.cwd(), 'scripts/manifest-dump.cjs');
    expect(() =>
      execFileSync('node', [script, file], { encoding: 'utf8' })
    ).toThrow(/executionConfig must be object/);
  });
});
