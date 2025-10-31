import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('playwright parallelization configuration', () => {
  const playwrightConfigPath = resolve(
    __dirname,
    '../../packages/client/playwright.config.ts'
  );
  const workflowPath = resolve(__dirname, '../../.github/workflows/ci.yml');
  const clientPackageJsonPath = resolve(
    __dirname,
    '../../packages/client/package.json'
  );
  const guidePath = resolve(
    __dirname,
    '../../docs/playwright-parallelization-guide.md'
  );

  it('ensures the Playwright config enables parallel execution', () => {
    expect(existsSync(playwrightConfigPath)).toBe(true);
    const configContent = readFileSync(playwrightConfigPath, 'utf8');

    expect(configContent).toContain("import { cpus } from 'node:os';");
    expect(configContent).toContain('fullyParallel: true');
    expect(configContent).toContain('workers: getWorkerCount()');
    expect(configContent).toContain('retries: process.env.CI ? 2 : 0');
    expect(configContent).toContain('shard: getShardConfig()');
  });

  it('validates retry and shard helpers are defined', () => {
    const configContent = readFileSync(playwrightConfigPath, 'utf8');

    expect(configContent).toMatch(
      /const getWorkerCount\s*=\s*\(\):\s*number\s*=>\s*\{/
    );
    expect(configContent).toMatch(
      /const getShardConfig\s*=\s*\(\)\s*(?::\s*[^=]+)?=>\s*\{/
    );
    expect(configContent).toMatch(/throw new Error\(\n\s+`Invalid SHARD value/);
  });

  it('wires Playwright parallelization into CI', () => {
    expect(existsSync(workflowPath)).toBe(true);
    const workflowContent = readFileSync(workflowPath, 'utf8');

    expect(workflowContent).toContain('e2e-tests:');
    expect(workflowContent).toContain(
      'name: E2E Tests - ${{ matrix.browser }}'
    );
    expect(workflowContent).toContain('matrix:');
    expect(workflowContent).toContain('browser: edge-desktop');
    expect(workflowContent).toContain(
      'pnpm --filter @critgenius/client exec -- playwright test'
    );
    expect(workflowContent).toContain('Prepare artifact suffix');
  });

  it('exposes browser helpers in the client package', () => {
    expect(existsSync(clientPackageJsonPath)).toBe(true);
    const packageJson = JSON.parse(
      readFileSync(clientPackageJsonPath, 'utf8')
    ) as { scripts?: Record<string, string> };

    expect(packageJson.scripts?.['test:browser:chromium']).toBe(
      'playwright test --project=chromium-desktop'
    );
    expect(packageJson.scripts?.['test:browser:firefox']).toBe(
      'playwright test --project=firefox-desktop'
    );
    expect(packageJson.scripts?.['test:browser:edge']).toBe(
      'playwright test --project=edge-desktop'
    );
    expect(packageJson.scripts?.['test:browser:webkit']).toBe(
      'playwright test --project=webkit-desktop'
    );
    expect(packageJson.scripts?.['test:browser:shard']).toBe(
      'playwright test --shard=$SHARD'
    );
  });

  it('documents the parallelization strategy', () => {
    expect(existsSync(guidePath)).toBe(true);
    const guideContent = readFileSync(guidePath, 'utf8');

    expect(guideContent).toContain('Worker Allocation Strategy');
    expect(guideContent).toContain('Sharded Execution (Large Suites)');
    expect(guideContent).toContain('CI Matrix Behavior');
  });
});
