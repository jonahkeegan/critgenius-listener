import { existsSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { pathToFileURL } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

import type {
  CoverageConfigModule,
  CoverageTheme,
  CoverageThresholds,
} from '../../config/coverage.config.types';

let coverageThemes: ReadonlyArray<CoverageTheme>;
let configuredThemeThresholds: Record<string, CoverageThresholds>;

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

const coverageConfigPromise = import(
  pathToFileURL(join(WORKSPACE_ROOT, 'config', 'coverage.config.mjs')).href
) as Promise<CoverageConfigModule>;

beforeAll(async () => {
  const coverageConfig = await coverageConfigPromise;
  coverageThemes = coverageConfig.coverageThemes;
  configuredThemeThresholds = coverageConfig.getThemeThresholdMap({
    resolved: false,
  });
});

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
    for (const theme of coverageThemes) {
      if (!theme.packageDir) {
        continue;
      }

      const expectedThresholds = configuredThemeThresholds[theme.key];
      expect(expectedThresholds).toBeDefined();
      if (!expectedThresholds) {
        throw new Error(`Missing thresholds for theme: ${theme.key}`);
      }
      const configPath = join(
        WORKSPACE_ROOT,
        'packages',
        theme.packageDir,
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
    const workspaceThresholds = configuredThemeThresholds.workspace;
    expect(workspaceThresholds).toBeDefined();
    if (!workspaceThresholds) {
      throw new Error('Missing workspace thresholds');
    }

    expect(thresholds).toEqual(workspaceThresholds);
  });

  it('keeps thematic summary thresholds in sync with package tiers', async () => {
    const thematicModule = await import(
      pathToFileURL(
        join(WORKSPACE_ROOT, 'scripts', 'coverage', 'thematic-summary.mjs')
      ).href
    );

    const exportedThresholds = thematicModule.THEME_THRESHOLDS as
      | Record<string, Record<string, number>>
      | undefined;

    expect(exportedThresholds).toBeDefined();
    if (!exportedThresholds) {
      throw new Error('theme thresholds export missing');
    }

    expect(exportedThresholds).toEqual(configuredThemeThresholds);
  });
});
