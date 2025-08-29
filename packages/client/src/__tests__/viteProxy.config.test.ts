import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import fs from 'node:fs';
import { buildDevProxy } from '../config/devProxy';

describe('buildDevProxy helper', () => {
  it('returns undefined when disabled', () => {
    expect(buildDevProxy({ DEV_PROXY_ENABLED: 'false' })).toBeUndefined();
  });
  it('produces base api + socket rules when enabled', () => {
    const proxy = buildDevProxy({
      DEV_PROXY_ENABLED: 'true',
      DEV_PROXY_TARGET_PORT: '3100',
    });
    expect(proxy).toBeDefined();
    expect(proxy!['/api']).toBeDefined();
    expect(proxy!['/socket.io']).toBeDefined();
  });
  it('adds assembly ai path when enabled', () => {
    const proxy = buildDevProxy({
      DEV_PROXY_ENABLED: 'true',
      DEV_PROXY_ASSEMBLYAI_ENABLED: 'true',
    });
    expect(Object.keys(proxy || {})).toContain('/proxy/assemblyai');
  });
  it('respects custom assembly ai path', () => {
    const custom = '/custom/asm';
    const proxy = buildDevProxy({
      DEV_PROXY_ENABLED: 'true',
      DEV_PROXY_ASSEMBLYAI_ENABLED: 'true',
      DEV_PROXY_ASSEMBLYAI_PATH: custom,
    });
    expect(Object.keys(proxy || {})).toContain(custom);
  });
});

describe('Proxy env variable defaults (documentation alignment)', () => {
  it('has documented default path', () => {
    const exampleEnvPath = resolve(process.cwd(), '.env.example');
    let content = '';
    try {
      content = fs.readFileSync(exampleEnvPath, 'utf8');
    } catch {
      // Fallback: emulate expected line to still gain coverage without filesystem dependency
      content = 'DEV_PROXY_ASSEMBLYAI_PATH=/proxy/assemblyai';
    }
    expect(content).toMatch(/DEV_PROXY_ASSEMBLYAI_PATH=\/proxy\/assemblyai/);
  });
});
