import { describe, expect, test } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '..', '..');

const requiredFiles = [
  'packages/client/percy.config.yml',
  'packages/client/tests/visual/__tests__/visual-regression.test.ts',
  'packages/client/tests/visual/helpers/percy-helpers.ts',
  'packages/client/tests/visual/helpers/component-setup.ts',
  'packages/client/tests/visual/fixtures/character-data.ts',
  'packages/client/tests/visual/fixtures/speaker-data.ts',
  'packages/client/tests/visual/fixtures/transcript-data.ts',
  'packages/client/.env.percy.example',
];

describe('Percy visual testing infrastructure', () => {
  test('required files exist', () => {
    for (const relativePath of requiredFiles) {
      const absolutePath = resolve(repoRoot, relativePath);
      const message = `expected ${relativePath} to exist`;
      expect(existsSync(absolutePath), message).toBe(true);
    }
  });

  test('client package exposes visual test scripts', () => {
    const packageJsonPath = resolve(repoRoot, 'packages/client/package.json');
    expect(existsSync(packageJsonPath), 'client package.json missing').toBe(
      true
    );
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.['test:visual']).toBe(
      'playwright test --config=playwright.visual.config.ts'
    );
    expect(packageJson.scripts?.['test:visual:baseline']).toBe(
      'percy exec -- playwright test --config=playwright.visual.config.ts'
    );
  });

  test('visual regression workflow is present', () => {
    const workflowPath = resolve(
      repoRoot,
      '.github/workflows/visual-regression.yml'
    );
    expect(existsSync(workflowPath), 'Percy workflow missing').toBe(true);
  });
});
