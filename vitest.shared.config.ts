import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { configDefaults } from 'vitest/config';
import type { UserConfig, UserConfigExport } from 'vitest/config';

const require = createRequire(fileURLToPath(import.meta.url));

const SHARED_MARKER_KEY = '__critgeniusSharedVitestConfig';

const DEFAULT_INCLUDE_PATTERNS = [
  'src/**/*.{test,spec}.{ts,tsx}',
  'src/**/__tests__/**/*.{test,spec}.{ts,tsx}',
  'tests/**/*.{test,spec}.{ts,tsx}',
  'tests/**/*.integration.test.{ts,tsx}',
  'tests/**/*.e2e.test.{ts,tsx}',
  'tests/**/*.perf.test.{ts,tsx}',
];

const DEFAULT_EXCLUDE_PATTERNS = [
  ...configDefaults.exclude,
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.tmp/**',
];

const DEFAULT_TEST_TIMEOUT_MS = 300_000;
const DEFAULT_HOOK_TIMEOUT_MS = 300_000;
const DEFAULT_TEARDOWN_TIMEOUT_MS = 120_000;

const DEFAULT_COVERAGE_EXCLUDE = [
  '**/src/test-setup.ts',
  '**/__tests__/**/*.{d.ts,config.ts}',
  '**/__mocks__/**',
  '**/__fixtures__/**',
  '**/tests/fixtures/**',
  '**/*.d.ts',
  '**/*.config.{ts,js}',
  '**/vitest.*.config.{ts,js}',
  '**/dist/**',
];

type Reporter = string | { new (...args: unknown[]): unknown };

interface CoverageSettings {
  reporter?: string[];
  reportsDirectory?: string;
  exclude?: string[];
  thresholds?: CoverageThresholds;
}

interface SharedTestOptions {
  globals?: boolean;
  environment?: string;
  setupFiles?: string[];
  include?: string[];
  exclude?: string[];
  reporters?: Reporter[];
  isolate?: boolean;
  clearMocks?: boolean;
  mockReset?: boolean;
  restoreMocks?: boolean;
  unstubEnvs?: boolean;
  unstubGlobals?: boolean;
  testTimeout?: number;
  hookTimeout?: number;
  teardownTimeout?: number;
  css?: boolean | Record<string, unknown>;
  coverage?: CoverageSettings | false;
}

type SharedUserConfig = UserConfig & { test: SharedTestOptions };

type SharedConfigMetadata = {
  [SHARED_MARKER_KEY]: true;
  sourceTsconfig: string;
};

const DEFAULT_REPORTERS: Reporter[] = ['default', 'verbose'];

type TestConfigOverrides = Partial<SharedTestOptions>;

type CoverageThresholds = {
  statements?: number;
  branches?: number;
  functions?: number;
  lines?: number;
};

type CoverageOverrides = CoverageSettings;

interface CreateVitestConfigOptions {
  packageRoot: string;
  environment: string;
  setupFiles?: string[];
  tsconfigPath?: string;
  globals?: boolean;
  reporters?: Reporter[];
  testOverrides?: TestConfigOverrides;
  coverageOverrides?: CoverageOverrides;
  aliasOverrides?: Record<string, string>;
}

interface TsconfigLike {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string[]>;
  };
  extends?: string;
}

interface ResolvedTsconfig {
  compilerOptions?: {
    baseUrl?: string;
    paths?: Record<string, string>;
  };
}

/**
 * Remove both line (//) and block (/** * /) comments from JSONC content without
 * disturbing string literals.
 */
function stripJsonComments(input: string): string {
  let insideString = false;
  let insideSingleLineComment = false;
  let insideMultiLineComment = false;
  let result = '';

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (insideSingleLineComment) {
      if (char === '\n' || char === '\r') {
        insideSingleLineComment = false;
        result += char;
      }
      continue;
    }

    if (insideMultiLineComment) {
      if (char === '*' && nextChar === '/') {
        insideMultiLineComment = false;
        i += 1;
      }
      continue;
    }

    if (!insideString && char === '/' && nextChar === '/') {
      insideSingleLineComment = true;
      i += 1;
      continue;
    }

    if (!insideString && char === '/' && nextChar === '*') {
      insideMultiLineComment = true;
      i += 1;
      continue;
    }

    const previousChar = i > 0 ? input[i - 1] : undefined;

    if (char === '"' && previousChar !== '\\') {
      insideString = !insideString;
    }

    result += char;
  }

  return result;
}

function resolveExtendsPath(
  reference: string,
  fromDirectory: string
): string | null {
  if (!reference) {
    return null;
  }

  if (reference.startsWith('.') || reference.startsWith('..')) {
    const candidate = resolve(fromDirectory, reference);
    return candidate.endsWith('.json') ? candidate : `${candidate}.json`;
  }

  try {
    return require.resolve(reference);
  } catch (error) {
    console.warn(
      `Unable to resolve extended tsconfig at "${reference}":`,
      error
    );
    return null;
  }
}

function resolveAliasTargets(
  paths: Record<string, string[]> | undefined,
  tsconfigDir: string,
  baseUrl: string
): Record<string, string> {
  const resolved: Record<string, string> = {};
  if (!paths) {
    return resolved;
  }

  for (const [key, value] of Object.entries(paths)) {
    const target = value?.[0];
    if (!target) {
      continue;
    }

    const normalizedTarget = normalizeAliasTarget(target);
    const absoluteTarget = resolve(tsconfigDir, baseUrl, normalizedTarget);
    resolved[key] = absoluteTarget;
  }

  return resolved;
}

function loadTsconfigRecursively(
  tsconfigPath: string,
  visited: Set<string> = new Set()
): ResolvedTsconfig {
  const normalizedPath = resolve(tsconfigPath);

  if (visited.has(normalizedPath)) {
    throw new Error(
      `Circular tsconfig "extends" detected while processing ${tsconfigPath}`
    );
  }

  visited.add(normalizedPath);

  if (!existsSync(normalizedPath)) {
    throw new Error(`Unable to locate tsconfig at ${normalizedPath}`);
  }

  const fileContent = readFileSync(normalizedPath, 'utf8');
  const parsed = JSON.parse(stripJsonComments(fileContent)) as TsconfigLike;
  const tsconfigDir = dirname(normalizedPath);

  const baseConfig: ResolvedTsconfig = parsed.extends
    ? loadTsconfigRecursively(
        resolveExtendsPath(parsed.extends, dirname(normalizedPath)) ??
          parsed.extends,
        visited
      )
    : {};

  const baseCompilerOptions = baseConfig.compilerOptions ?? {};
  const basePaths = baseCompilerOptions.paths ?? {};
  const currentBaseUrl = parsed.compilerOptions?.baseUrl ?? '.';
  const currentPaths = resolveAliasTargets(
    parsed.compilerOptions?.paths,
    tsconfigDir,
    currentBaseUrl
  );

  return {
    compilerOptions: {
      baseUrl:
        parsed.compilerOptions?.baseUrl ?? baseCompilerOptions.baseUrl ?? '.',
      paths: {
        ...basePaths,
        ...currentPaths,
      },
    },
  };
}

function normalizeAliasTarget(target: string): string {
  if (target.endsWith('/*')) {
    return target.slice(0, -2);
  }
  return target;
}

export function resolveTsconfigAliases(
  tsconfigPath: string
): Record<string, string> {
  const config = loadTsconfigRecursively(tsconfigPath);
  const paths = config.compilerOptions?.paths ?? {};
  const tsconfigDir = dirname(resolve(tsconfigPath));
  const baseUrl = config.compilerOptions?.baseUrl ?? '.';

  const aliasEntries = Object.entries(paths).map(([key, value]) => {
    const sanitizedKey = key.endsWith('/*') ? key.slice(0, -2) : key;
    const candidate = Array.isArray(value) ? value[0] : value;
    if (!candidate) {
      return null;
    }
    const normalizedTarget = normalizeAliasTarget(candidate);
    const resolvedPath = resolve(tsconfigDir, baseUrl, normalizedTarget);
    return [sanitizedKey, resolvedPath] as const;
  });

  const aliases: Record<string, string> = {};
  for (const entry of aliasEntries) {
    if (!entry) continue;
    const [aliasKey, aliasPath] = entry;
    aliases[aliasKey] = aliasPath;
  }

  const testUtilsAlias = aliases['@critgenius/test-utils'];
  if (testUtilsAlias && !aliases['@critgenius/test-utils/performance']) {
    const normalizedBase = testUtilsAlias.endsWith('.ts')
      ? dirname(testUtilsAlias)
      : testUtilsAlias;
    aliases['@critgenius/test-utils/performance'] = resolve(
      normalizedBase,
      'performance',
      'index.ts'
    );
  }

  return aliases;
}

function applyCoverageDefaults(
  packageRoot: string,
  overrides?: CoverageOverrides
): CoverageSettings {
  const defaultThresholds: Required<CoverageThresholds> = {
    statements: 90,
    branches: 90,
    functions: 90,
    lines: 90,
  };

  const coverage: CoverageSettings = {
    reporter: overrides?.reporter ?? ['text', 'json-summary', 'html'],
    reportsDirectory:
      overrides?.reportsDirectory ?? resolve(packageRoot, 'coverage'),
    exclude: Array.from(
      new Set([...(overrides?.exclude ?? []), ...DEFAULT_COVERAGE_EXCLUDE])
    ),
    thresholds: {
      ...defaultThresholds,
      ...(overrides?.thresholds ?? {}),
    },
  };

  return coverage;
}

export function createVitestConfig(
  options: CreateVitestConfigOptions
): UserConfigExport {
  const {
    packageRoot,
    environment,
    setupFiles = [],
    tsconfigPath = resolve(packageRoot, 'tsconfig.json'),
    globals = true,
    reporters = DEFAULT_REPORTERS,
    testOverrides,
    coverageOverrides,
    aliasOverrides,
  } = options;

  const aliases = {
    ...resolveTsconfigAliases(tsconfigPath),
    ...(aliasOverrides ?? {}),
  };

  if (
    aliases['@critgenius/test-utils'] &&
    !aliases['@critgenius/test-utils/performance']
  ) {
    const testUtilsBase = aliases['@critgenius/test-utils'];
    const normalizedBase = testUtilsBase.endsWith('.ts')
      ? dirname(testUtilsBase)
      : testUtilsBase;

    aliases['@critgenius/test-utils/performance'] = resolve(
      normalizedBase,
      'performance',
      'index.ts'
    );
  }

  const normalizedSetupFiles = setupFiles.map(file =>
    file.startsWith('file:') ? file : resolve(packageRoot, file)
  );

  const baseConfig: SharedUserConfig = {
    root: packageRoot,
    resolve: {
      alias: aliases,
    },
    test: {
      globals,
      environment,
      setupFiles: normalizedSetupFiles,
      include: DEFAULT_INCLUDE_PATTERNS,
      exclude: DEFAULT_EXCLUDE_PATTERNS,
      reporters,
      isolate: true,
      clearMocks: true,
      mockReset: true,
      restoreMocks: true,
      unstubEnvs: true,
      unstubGlobals: true,
      testTimeout: DEFAULT_TEST_TIMEOUT_MS,
      hookTimeout: DEFAULT_HOOK_TIMEOUT_MS,
      teardownTimeout: DEFAULT_TEARDOWN_TIMEOUT_MS,
      coverage: applyCoverageDefaults(packageRoot, coverageOverrides),
    },
  };

  if (process.env.DEBUG_VITEST_ALIASES === 'true') {
    console.log('[vitest config] alias mapping for', packageRoot, aliases);
  }

  if (testOverrides) {
    baseConfig.test = {
      ...baseConfig.test,
      ...testOverrides,
    };

    if (testOverrides.coverage && baseConfig.test.coverage) {
      const coverageFromOverrides = testOverrides.coverage;
      if (coverageFromOverrides && typeof coverageFromOverrides === 'object') {
        const existingCoverage = baseConfig.test.coverage;
        if (existingCoverage && typeof existingCoverage === 'object') {
          const mergedThresholds = {
            ...(existingCoverage as { thresholds?: CoverageThresholds })
              .thresholds,
            ...(coverageFromOverrides as { thresholds?: CoverageThresholds })
              .thresholds,
          } as CoverageThresholds;

          const mergedExclude = Array.from(
            new Set([
              ...((existingCoverage as { exclude?: string[] }).exclude ?? []),
              ...((coverageFromOverrides as { exclude?: string[] }).exclude ??
                []),
            ])
          );

          baseConfig.test.coverage = {
            ...existingCoverage,
            ...coverageFromOverrides,
            exclude: mergedExclude,
            thresholds: mergedThresholds,
          };
        } else {
          baseConfig.test.coverage = coverageFromOverrides;
        }
      }
    }
  }

  const configWithMetadata = Object.assign(baseConfig, {
    [SHARED_MARKER_KEY]: true as const,
    sourceTsconfig: tsconfigPath,
  } satisfies SharedConfigMetadata);

  return configWithMetadata;
}

function hasSharedConfigMetadata(
  value: unknown
): value is SharedConfigMetadata {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<SharedConfigMetadata>;

  return candidate[SHARED_MARKER_KEY] === true;
}

export function assertUsesSharedConfig<T extends UserConfigExport>(
  config: T
): T {
  if (!hasSharedConfigMetadata(config)) {
    throw new Error(
      'Vitest configuration must be created via createVitestConfig() from vitest.shared.config.ts.\n' +
        'Ensure that package-level vitest.config.ts files import and invoke assertUsesSharedConfig.'
    );
  }
  return config;
}

export const sharedVitestConfigMarkerKey = SHARED_MARKER_KEY;
export const defaultVitestIncludePatterns = [...DEFAULT_INCLUDE_PATTERNS];
export const defaultVitestExcludePatterns = [...DEFAULT_EXCLUDE_PATTERNS];
export const defaultVitestCoverageExcludePatterns = [
  ...DEFAULT_COVERAGE_EXCLUDE,
];
