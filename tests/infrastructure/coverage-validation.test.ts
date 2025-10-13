import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, normalize, parse, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  defaultVitestCoverageExcludePatterns,
  sharedVitestConfigMarkerKey,
} from '../../vitest.shared.config';

type CoverageTarget = {
  identifier: string;
  reportsDirectory: string;
  configPath?: string;
  coverage?: Record<string, unknown> | false;
};

function detectWorkspaceRoot(): string {
  try {
    const candidate = new URL('../..', import.meta.url);
    if (candidate.protocol === 'file:') {
      return fileURLToPath(candidate);
    }
  } catch {
    // fall through to filesystem search
  }

  let current = process.cwd();
  const { root } = parse(current);

  while (true) {
    if (existsSync(join(current, 'pnpm-workspace.yaml'))) {
      return current;
    }

    if (current === root) {
      throw new Error(
        'Unable to locate workspace root for coverage validation'
      );
    }

    current = dirname(current);
  }
}

const WORKSPACE_ROOT = detectWorkspaceRoot();
const COVERAGE_ROOT = join(WORKSPACE_ROOT, 'coverage');
const WORKSPACE_MANIFEST = join(WORKSPACE_ROOT, 'pnpm-workspace.yaml');

const REQUIRED_REPORTERS = ['text', 'json-summary', 'html'] as const;

let cachedThemeThresholds: Record<string, Record<string, number>> | null = null;

async function loadThemeThresholds(): Promise<
  Record<string, Record<string, number>>
> {
  if (cachedThemeThresholds) {
    return cachedThemeThresholds;
  }

  const thematicModule = await import(
    pathToFileURL(
      join(WORKSPACE_ROOT, 'scripts', 'coverage', 'thematic-summary.mjs')
    ).href
  );

  const exported = thematicModule?.THEME_THRESHOLDS as
    | Record<string, Record<string, number>>
    | undefined;

  if (!exported) {
    throw new Error(
      'Failed to load theme thresholds from thematic summary module'
    );
  }

  cachedThemeThresholds = exported;
  return cachedThemeThresholds;
}

const PACKAGE_THEME_MAP = new Map<string, string>([
  ['@critgenius/client', 'client'],
  ['@critgenius/server', 'server'],
  ['@critgenius/shared', 'shared'],
  ['@critgenius/test-utils', 'test-utils'],
]);

function toPosixPath(value: string): string {
  return value.replace(/\\+/g, '/');
}

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

function parseWorkspaceGlobs(): string[] {
  if (!existsSync(WORKSPACE_MANIFEST)) {
    return [];
  }

  const text = readFileSync(WORKSPACE_MANIFEST, 'utf8');
  const matches = [...text.matchAll(/-\s*['"]?([^'"\s]+)['"]?/g)];
  return matches
    .map(match => match[1])
    .filter((value): value is string => typeof value === 'string');
}

function resolveWorkspacePackages(): CoverageTarget[] {
  const patterns = parseWorkspaceGlobs();
  const targets: CoverageTarget[] = [];

  for (const pattern of patterns) {
    if (!pattern.endsWith('/*')) continue;

    const baseDir = pattern.slice(0, -2);
    const basePath = join(WORKSPACE_ROOT, baseDir);
    if (!existsSync(basePath)) continue;

    for (const entry of readdirSync(basePath, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;

      const packageDir = join(basePath, entry.name);
      const configPath = join(packageDir, 'vitest.config.ts');
      if (!existsSync(configPath)) continue;

      const manifestPath = join(packageDir, 'package.json');
      let packageName = `packages/${entry.name}`;

      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
            name?: string;
          };
          if (typeof manifest.name === 'string') {
            packageName = manifest.name;
          }
        } catch {
          // ignore malformed manifest, fallback will be used
        }
      }

      const theme = PACKAGE_THEME_MAP.get(packageName) ?? entry.name;

      targets.push({
        identifier: packageName,
        configPath,
        reportsDirectory: join(COVERAGE_ROOT, theme),
      });
    }
  }

  return targets;
}

describe('coverage configuration', () => {
  it('applies shared coverage defaults consistently', async () => {
    const workspaceConfigPath = join(WORKSPACE_ROOT, 'vitest.config.ts');
    const workspaceConfig = await loadUserConfig(workspaceConfigPath);

    const themeThresholds = await loadThemeThresholds();

    expect(workspaceConfig?.[sharedVitestConfigMarkerKey]).toBe(true);

    const targets: CoverageTarget[] = [
      {
        identifier: 'workspace',
        reportsDirectory: join(COVERAGE_ROOT, 'workspace'),
        coverage: (workspaceConfig.test as Record<string, unknown> | undefined)
          ?.coverage as Record<string, unknown> | false,
      },
      ...resolveWorkspacePackages(),
    ];

    for (const target of targets) {
      if (target.configPath) {
        const config = await loadUserConfig(target.configPath);
        expect(config?.[sharedVitestConfigMarkerKey]).toBe(true);
        target.coverage = (config.test as Record<string, unknown> | undefined)
          ?.coverage as Record<string, unknown> | false;
      }

      expect(target.coverage).toBeDefined();
      expect(target.coverage).not.toBe(false);

      const coverageConfig = target.coverage as Record<string, any>;

      const reporters = Array.isArray(coverageConfig.reporter)
        ? coverageConfig.reporter
        : typeof coverageConfig.reporter === 'string'
          ? [coverageConfig.reporter]
          : [];

      expect(reporters).toEqual(
        expect.arrayContaining([...REQUIRED_REPORTERS])
      );

      const themeKey =
        target.identifier === 'workspace'
          ? 'workspace'
          : (PACKAGE_THEME_MAP.get(target.identifier) ?? target.identifier);

      const expectedThresholds =
        themeThresholds[themeKey] ?? themeThresholds.workspace;

      expect(expectedThresholds).toBeDefined();

      const thresholds = (coverageConfig.thresholds ?? {}) as Record<
        string,
        number
      >;

      for (const metric of [
        'statements',
        'branches',
        'functions',
        'lines',
      ] as const) {
        const actualValue = thresholds[metric];
        const expectedValue = expectedThresholds?.[metric];

        expect(actualValue).toBeDefined();
        expect(expectedValue).toBeDefined();

        if (
          typeof actualValue === 'number' &&
          typeof expectedValue === 'number'
        ) {
          expect(actualValue).toBeCloseTo(expectedValue);
        }
      }

      const exclude = Array.isArray(coverageConfig.exclude)
        ? coverageConfig.exclude
        : [];

      for (const pattern of defaultVitestCoverageExcludePatterns) {
        expect(exclude).toContain(pattern);
      }

      expect(coverageConfig.provider).toBe('v8');

      const reportsDirectory = coverageConfig.reportsDirectory;
      expect(typeof reportsDirectory).toBe('string');
      if (typeof reportsDirectory === 'string') {
        const normalizedActual = toPosixPath(normalize(reportsDirectory));
        const normalizedExpected = toPosixPath(
          normalize(resolve(target.reportsDirectory))
        );
        expect(normalizedActual).toBe(normalizedExpected);
      }
    }
  });
});
