import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Import from built source; tests run in ts with tsconfig path
import { loadEnvironment } from './environmentLoader.js';

const root = process.cwd();
const baseEnv = path.resolve(root, '.env');
const devEnv = path.resolve(root, '.env.development');

function write(p: string, content: string) {
  fs.writeFileSync(p, content);
}

function rm(p: string) {
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

describe('dotenv preload precedence', () => {
  const oldEnv = { ...process.env };
  beforeEach(() => {
    // Reset env and ensure files are absent
    process.env = { ...oldEnv };
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.NODE_ENV;
    rm(baseEnv);
    rm(devEnv);
  });
  afterEach(() => {
    rm(baseEnv);
    rm(devEnv);
    process.env = oldEnv;
  });

  it('loads .env then overrides with .env.development', () => {
    write(baseEnv, 'PORT=1234\nHOST=base.local\n');
    write(devEnv, 'PORT=5678\n');
    process.env.NODE_ENV = 'development';
    // Ensure required dev-only flags are present
    process.env.HOT_RELOAD = 'true';
    process.env.WATCH_FILES = 'true';
    process.env.DEV_PROXY_ENABLED = 'true';
    process.env.DEV_PROXY_ASSEMBLYAI_ENABLED = 'true';

    // Minimal required keys so validation passes
    write(
      baseEnv,
      fs.readFileSync(baseEnv, 'utf8') +
        'ASSEMBLYAI_API_KEY=key\nMONGODB_URI=mongodb://localhost:27017/db\nREDIS_URL=redis://localhost:6379\nJWT_SECRET=dev\n'
    );

    const cfg = loadEnvironment();
    expect(cfg.PORT).toBe(5678); // env-specific overrides base
    expect(cfg.HOST).toBe('base.local'); // carries from base
    expect(cfg.NODE_ENV).toBe('development');
  });
});
