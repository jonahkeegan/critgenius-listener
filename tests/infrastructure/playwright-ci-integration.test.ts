import { describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const repoRoot = resolve(process.cwd());

async function loadFile(relativePath: string): Promise<string> {
  const filePath = resolve(repoRoot, relativePath);
  return await readFile(filePath, 'utf-8');
}

describe('Playwright CI Integration', () => {
  it('defines all Playwright browser projects', async () => {
    const content = await loadFile('packages/client/playwright.config.ts');
    const expectedProjects = [
      'chromium-desktop',
      'chromium-tablet',
      'chromium-mobile',
      'firefox-desktop',
      'edge-desktop',
      'webkit-desktop',
    ];

    for (const project of expectedProjects) {
      expect(content).toContain(project);
    }
  });

  it('registers the e2e-tests job in CI workflow', async () => {
    const content = await loadFile('.github/workflows/ci.yml');

    expect(content).toContain('e2e-tests:');
    expect(content).toContain('needs: build-and-validate');
    expect(content).toContain('playwright test');
  });

  it('configures the CI browser matrix with artifact uploads', async () => {
    const content = await loadFile('.github/workflows/ci.yml');
    const matrixBrowsers = [
      'chromium-desktop',
      'chromium-tablet',
      'chromium-mobile',
      'firefox-desktop',
      'edge-desktop',
      'webkit-desktop',
    ];

    expect(content).toContain('strategy:');
    expect(content).toContain('matrix:');
    expect(content).toContain('browser:');

    for (const browser of matrixBrowsers) {
      expect(content).toContain(`- ${browser}`);
    }

    expect(content).toContain('upload-artifact@v4');
    expect(content).toContain('playwright-results');
    expect(content).toContain('playwright-report');
  });
});
