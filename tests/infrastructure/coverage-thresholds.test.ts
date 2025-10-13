import { existsSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

const EXPECTED_THEME_THRESHOLDS: Record<string, Record<string, number>> = {
  workspace: {
    statements: 30,
    branches: 30,
    functions: 30,
    lines: 30,
  },
  client: {
    statements: 50,
    branches: 50,
    functions: 50,
    lines: 50,
  },
  server: {
    statements: 50,
    branches: 50,
    functions: 50,
    lines: 50,
  },
  shared: {
    statements: 75,
    branches: 75,
    functions: 75,
    lines: 75,
  },
  'test-utils': {
    statements: 30,
    branches: 30,
    functions: 30,
    lines: 30,
  },
};

const EXPECTED_PACKAGE_THRESHOLDS: Record<string, Record<string, number>> = {
  client: EXPECTED_THEME_THRESHOLDS.client!,
  server: EXPECTED_THEME_THRESHOLDS.server!,
  shared: EXPECTED_THEME_THRESHOLDS.shared!,
  'test-utils': EXPECTED_THEME_THRESHOLDS['test-utils']!,
};

function detectWorkspaceRoot(): string {
  let current = process.cwd();
  const { root } = parse(current);

  while (true) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) {
      return current;
    }

    if (current === root) {
      throw new Error(
        'Unable to locate workspace root for coverage threshold validation'
      );
    }

    current = dirname(current);
  }
}

const WORKSPACE_ROOT = detectWorkspaceRoot();

async function loadUserConfig(
  configPath: string
): Promise<Record<string, unknown>> {
  const module = await import(pathToFileURL(configPath).href);
  const exported = module.default ?? module;
  const resolved = await Promise.resolve(exported);

  if (typeof resolved === 'function') {
    return resolved({ command: 'build', mode: 'test' });
  }

  return resolved;
}

describe('tiered coverage thresholds', () => {
  it('defines explicit thresholds for each package configuration', async () => {
    for (const [packageName, expectedThresholds] of Object.entries(
      EXPECTED_PACKAGE_THRESHOLDS
    )) {
      const configPath = join(
        WORKSPACE_ROOT,
        'packages',
        packageName,
        'vitest.config.ts'
      );

      const config = await loadUserConfig(configPath);
      const coverage = (config.test as Record<string, unknown> | undefined)
        ?.coverage as Record<string, unknown> | undefined;

      expect(coverage).toBeDefined();

      const thresholds = (coverage?.thresholds ?? {}) as Record<string, number>;
      expect(thresholds).toEqual(expectedThresholds);
    }
  });

  it('configures workspace aggregate thresholds explicitly', async () => {
    const configPath = join(WORKSPACE_ROOT, 'vitest.config.ts');
    const config = await loadUserConfig(configPath);

    const coverage = (config.test as Record<string, unknown> | undefined)
      ?.coverage as Record<string, unknown> | undefined;

    expect(coverage).toBeDefined();

    const thresholds = (coverage?.thresholds ?? {}) as Record<string, number>;
    expect(thresholds).toEqual(EXPECTED_THEME_THRESHOLDS.workspace);
  });

  it('keeps thematic summary thresholds in sync with package tiers', async () => {
    const thematicModule = await import(
      pathToFileURL(
        join(WORKSPACE_ROOT, 'scripts', 'coverage', 'thematic-summary.mjs')
      ).href
    );

    const themeThresholds = thematicModule.THEME_THRESHOLDS as
      | Record<string, Record<string, number>>
      | undefined;

    expect(themeThresholds).toBeDefined();
    if (!themeThresholds) {
      throw new Error('theme thresholds export missing');
    }

    expect(themeThresholds).toEqual(EXPECTED_THEME_THRESHOLDS);
  });
});
