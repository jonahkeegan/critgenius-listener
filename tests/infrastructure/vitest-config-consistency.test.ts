import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

import {
  defaultVitestCoverageExcludePatterns,
  defaultVitestExcludePatterns,
  defaultVitestIncludePatterns,
  resolveTsconfigAliases,
  sharedVitestConfigMarkerKey,
  __pathDiagnostics,
} from '../../vitest.shared.config';
import { PathValidationError } from '@critgenius/test-utils/diagnostics';
import type { UserConfigExport } from 'vitest/config';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(testDirectory, '../..');
const { ensurePathString } = __pathDiagnostics;

type VitestConfigExport =
  | UserConfigExport
  | Promise<UserConfigExport>
  | ((env: {
      command: 'serve' | 'build';
      mode: string;
    }) => UserConfigExport | Promise<UserConfigExport>);

interface ConfigCase {
  name: string;
  root: string;
  tsconfigPath: string;
  configPath: string;
}

const CONFIG_CASES: ConfigCase[] = [
  {
    name: 'workspace',
    root: workspaceRoot,
    tsconfigPath: path.join(workspaceRoot, 'tsconfig.json'),
    configPath: path.join(workspaceRoot, 'vitest.config.ts'),
  },
  {
    name: '@critgenius/client',
    root: path.join(workspaceRoot, 'packages/client'),
    tsconfigPath: path.join(workspaceRoot, 'packages/client/tsconfig.json'),
    configPath: path.join(workspaceRoot, 'packages/client/vitest.config.ts'),
  },
  {
    name: '@critgenius/server',
    root: path.join(workspaceRoot, 'packages/server'),
    tsconfigPath: path.join(workspaceRoot, 'packages/server/tsconfig.json'),
    configPath: path.join(workspaceRoot, 'packages/server/vitest.config.ts'),
  },
  {
    name: '@critgenius/shared',
    root: path.join(workspaceRoot, 'packages/shared'),
    tsconfigPath: path.join(workspaceRoot, 'packages/shared/tsconfig.json'),
    configPath: path.join(workspaceRoot, 'packages/shared/vitest.config.ts'),
  },
];

type ResolvedConfig = {
  resolve?: {
    alias?: unknown;
  };
  test?: {
    include?: string[];
    exclude?: string[];
    coverage?: {
      thresholds?: Record<string, number>;
      exclude?: string[];
    };
  };
  [sharedVitestConfigMarkerKey]?: boolean;
  [key: string]: unknown;
};

let resolvedCases: Array<ConfigCase & { resolved: ResolvedConfig }> = [];

async function resolveConfig(
  config: VitestConfigExport
): Promise<ResolvedConfig> {
  if (typeof config === 'function') {
    const result = await config({ command: 'build', mode: 'test' });
    return result as ResolvedConfig;
  }
  if (
    config &&
    typeof (config as PromiseLike<ResolvedConfig>).then === 'function'
  ) {
    const result = await (config as PromiseLike<ResolvedConfig>);
    return result as ResolvedConfig;
  }
  return config as ResolvedConfig;
}

function toConfigPath(input: string | URL | { href: string }): string {
  if (input instanceof URL) {
    return fileURLToPath(input);
  }

  if (typeof input === 'object' && input !== null && 'href' in input) {
    const href = (input as { href: string }).href;
    return fileURLToPath(new URL(href));
  }

  if (typeof input !== 'string') {
    throw new TypeError(`Unsupported config path input type: ${typeof input}`);
  }

  const trimmed = input.trim();

  if (trimmed.startsWith('file://')) {
    try {
      return fileURLToPath(new URL(trimmed));
    } catch (error) {
      throw new TypeError(
        `Unable to convert file URL string to path: ${trimmed}. ${String(error)}`
      );
    }
  }

  return trimmed;
}

async function loadConfig(
  configFile: string | URL
): Promise<VitestConfigExport> {
  const configPath = toConfigPath(configFile);
  const url = `${pathToFileURL(configPath).href}?t=${Date.now()}`;
  const module = await import(url);
  return (module as { default?: VitestConfigExport }).default ?? module;
}

beforeAll(async () => {
  resolvedCases = await Promise.all(
    CONFIG_CASES.map(async testCase => {
      const exportedConfig = await loadConfig(testCase.configPath);
      const resolved = await resolveConfig(exportedConfig);
      return { ...testCase, resolved };
    })
  );
});

function toAliasRecord(alias: unknown): Record<string, string> {
  if (!alias) return {};
  if (Array.isArray(alias)) {
    const out: Record<string, string> = {};
    for (const entry of alias) {
      if (
        entry &&
        typeof entry === 'object' &&
        'find' in entry &&
        'replacement' in entry &&
        typeof (entry as { find: unknown }).find === 'string'
      ) {
        out[(entry as { find: string }).find] = String(
          (entry as { replacement: unknown }).replacement
        );
      }
    }
    return out;
  }
  return { ...(alias as Record<string, string>) };
}

function normalizePathValue(value: unknown, context: string): string {
  if (value instanceof URL) {
    return fileURLToPath(value);
  }

  if (typeof value === 'string') {
    if (value.startsWith('file://')) {
      try {
        return fileURLToPath(new URL(value));
      } catch (error) {
        throw new TypeError(
          `${context} received an invalid file URL string: ${value}. ${String(error)}`
        );
      }
    }

    return value;
  }

  throw new TypeError(
    `${context} must resolve to a filesystem path string or file URL. Received ${String(
      value
    )}`
  );
}

function normalizePaths(
  record: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      path.resolve(normalizePathValue(value, `alias mapping for ${key}`)),
    ])
  );
}

describe('vitest config consistency', () => {
  const rootIncludePatterns = defaultVitestIncludePatterns.filter(pattern =>
    pattern.startsWith('tests/')
  );
  const rootExcludePatterns = new Set([
    ...defaultVitestExcludePatterns,
    'packages/**',
  ]);

  it('marks every config as using the shared factory', () => {
    for (const testCase of resolvedCases) {
      expect(testCase.resolved[sharedVitestConfigMarkerKey]).toBe(true);
    }
  });

  it('applies unified include and exclude patterns', () => {
    for (const testCase of resolvedCases) {
      const include = new Set(testCase.resolved.test?.include ?? []);
      const exclude = new Set(testCase.resolved.test?.exclude ?? []);

      if (testCase.name === 'workspace') {
        expect(include).toEqual(new Set(rootIncludePatterns));
        expect(exclude).toEqual(rootExcludePatterns);
      } else {
        expect(include).toEqual(new Set(defaultVitestIncludePatterns));
        expect(exclude).toEqual(new Set(defaultVitestExcludePatterns));
      }
    }
  });

  it('enforces 90 percent coverage thresholds with shared exclusions', () => {
    for (const testCase of resolvedCases) {
      const coverage = testCase.resolved.test?.coverage;
      expect(
        coverage,
        `${testCase.name} missing coverage config`
      ).toBeDefined();

      const thresholds =
        coverage && 'thresholds' in coverage ? coverage.thresholds : undefined;
      expect(
        thresholds,
        `${testCase.name} missing coverage thresholds`
      ).toBeDefined();
      expect(thresholds).toMatchObject({
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      });

      const exclude = new Set(
        (coverage as { exclude?: string[] }).exclude ?? []
      );
      for (const pattern of defaultVitestCoverageExcludePatterns) {
        expect(exclude.has(pattern)).toBe(true);
      }
    }
  });

  it('keeps resolve aliases aligned with TypeScript path mappings', () => {
    for (const testCase of resolvedCases) {
      const actualAlias = normalizePaths(
        toAliasRecord(testCase.resolved.resolve?.alias)
      );
      const expectedAlias = normalizePaths(
        resolveTsconfigAliases(testCase.tsconfigPath)
      );

      expect(actualAlias).toEqual(expectedAlias);
    }
  });
});

describe('toConfigPath diagnostics', () => {
  it('converts URL instances into absolute path strings', () => {
    const configUrl = pathToFileURL(
      path.join(workspaceRoot, 'vitest.config.ts')
    );
    const result = toConfigPath(configUrl);
    expect(result).toBe(fileURLToPath(configUrl));
  });

  it('rejects invalid file URL strings and surfaces TypeError', () => {
    expect(() => toConfigPath('file://')).toThrow(TypeError);
  });

  it('rejects unsupported input types and preserves diagnostic context', () => {
    expect(() => toConfigPath(123 as unknown as URL)).toThrow(TypeError);

    try {
      ensurePathString('', 'vitest-config-validation');
      expect.fail('Expected ensurePathString to throw PathValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(PathValidationError);
      const validationError = error as PathValidationError;
      expect(validationError.context.operation).toBe(
        'vitest-config-validation'
      );
    }
  });
});
