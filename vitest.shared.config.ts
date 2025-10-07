import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { configDefaults } from 'vitest/config';
import type { UserConfig, UserConfigExport } from 'vitest/config';
import {
  createPathValidator,
  PathValidationError as DiagnosticPathValidationError,
  type DiagnosticConfig as PathDiagnosticConfig,
  type LogLevel as PathLogLevel,
  type PathNormalizationContext,
} from '@critgenius/test-utils/diagnostics';

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

type PathInput = string | URL;

const PATH_DIAGNOSTIC_CONFIG = resolvePathDiagnosticConfig();
const PATH_VALIDATOR = createPathValidator(PATH_DIAGNOSTIC_CONFIG);

interface CreateVitestConfigOptions {
  packageRoot: PathInput;
  environment: string;
  setupFiles?: PathInput[];
  tsconfigPath?: PathInput;
  globals?: boolean;
  reporters?: Reporter[];
  testOverrides?: TestConfigOverrides;
  coverageOverrides?: CoverageOverrides;
  aliasOverrides?: Record<string, PathInput>;
}

function describeInput(value: unknown): string {
  if (value instanceof URL) {
    return `URL(${value.toString()})`;
  }
  if (typeof value === 'string') {
    return `string(${value})`;
  }
  if (value === null) {
    return 'null';
  }
  return `${typeof value}`;
}

function resolvePathDiagnosticConfig(): PathDiagnosticConfig {
  const enabled = coerceBooleanFlag(process.env.DEBUG_VITEST_PATHS, false);
  const logLevel = coerceLogLevel(
    process.env.DEBUG_VITEST_PATH_LEVEL,
    enabled ? 'debug' : 'error'
  );
  const captureStackTraces = coerceBooleanFlag(
    process.env.DEBUG_VITEST_PATH_STACKS,
    enabled
  );
  const outputFile = sanitizeOutputFile(process.env.DEBUG_VITEST_PATH_OUTPUT);
  const stackFrameLimit = coerceStackFrameLimit(
    process.env.DEBUG_VITEST_PATH_STACK_DEPTH
  );

  const config: PathDiagnosticConfig = {
    enabled,
    logLevel,
    captureStackTraces,
  };

  if (outputFile) {
    config.outputFile = outputFile;
  }

  if (typeof stackFrameLimit === 'number') {
    config.stackFrameLimit = stackFrameLimit;
  }

  return config;
}

function coerceLogLevel(
  value: string | undefined,
  defaultLevel: PathLogLevel
): PathLogLevel {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return defaultLevel;
  }

  const allowed: PathLogLevel[] = ['debug', 'info', 'warn', 'error'];
  return (allowed.find(level => level === normalized) ??
    defaultLevel) as PathLogLevel;
}

function coerceBooleanFlag(
  value: string | undefined,
  defaultValue: boolean
): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === '') {
    return defaultValue;
  }

  return !['false', '0', 'no', 'off'].includes(normalized);
}

function coerceStackFrameLimit(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function sanitizeOutputFile(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed === '') {
    return undefined;
  }

  return isAbsolute(trimmed) ? trimmed : resolve(process.cwd(), trimmed);
}

function sanitizePathForLogging(path: string): string {
  const trimmed = path.trim();
  if (trimmed.length <= 260) {
    return trimmed;
  }
  return `${trimmed.slice(0, 257)}...`;
}

function logPathOperation(
  context: PathNormalizationContext,
  details: Record<string, unknown> = {}
): void {
  if (!PATH_DIAGNOSTIC_CONFIG.enabled) {
    return;
  }

  const payload: Record<string, unknown> = {
    operation: context.operation,
    inputType: context.inputType,
    inputValue: context.inputValue,
    environment: context.environment,
    timestamp: new Date(context.timestamp).toISOString(),
    environmentInfo: context.environmentInfo,
    ...details,
  };

  if (context.stackTrace.length > 0) {
    payload.stackTrace = context.stackTrace;
  }

  console.debug('[VitestPathDiagnostics]', payload);
}

function ensurePathString(input: PathInput, context: string): string {
  const validation = PATH_VALIDATOR.validate(input, context);

  if (!validation.isValid) {
    const fallbackMessage = `${context} must be a string or URL instance. Received: ${describeInput(input)}`;
    const primaryMessage = validation.errors[0];
    const message = primaryMessage
      ? `${context}: ${primaryMessage}`
      : fallbackMessage;

    throw new DiagnosticPathValidationError(
      message,
      validation.context,
      validation.originalError
    );
  }

  logPathOperation(validation.context, {
    normalizedPath: sanitizePathForLogging(validation.normalizedPath),
  });

  return validation.normalizedPath;
}

function normalizePathInput(
  input: PathInput,
  baseDirectory?: PathInput
): string {
  const baseDirectoryPath =
    baseDirectory === undefined
      ? undefined
      : ensurePathString(baseDirectory, 'baseDirectory');

  const normalizedInput = ensurePathString(input, 'Path input');
  let resolvedPath = normalizedInput;

  if (baseDirectoryPath && !isAbsolute(normalizedInput)) {
    resolvedPath = resolve(baseDirectoryPath, normalizedInput);
  }

  if (PATH_DIAGNOSTIC_CONFIG.enabled) {
    const context = PATH_VALIDATOR.captureContext(
      'normalizePathInput:result',
      resolvedPath
    );
    const details: Record<string, unknown> = {
      wasRelative: !isAbsolute(normalizedInput),
    };

    if (baseDirectoryPath) {
      details.baseDirectory = sanitizePathForLogging(baseDirectoryPath);
    }

    logPathOperation(context, details);
  }

  return resolvedPath;
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

export const __pathDiagnostics = {
  ensurePathString,
  normalizePathInput,
};

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
    tsconfigPath,
    globals = true,
    reporters = DEFAULT_REPORTERS,
    testOverrides,
    coverageOverrides,
    aliasOverrides,
  } = options;

  const normalizedPackageRoot = normalizePathInput(packageRoot);

  const resolvedTsconfigPath =
    tsconfigPath === undefined
      ? resolve(normalizedPackageRoot, 'tsconfig.json')
      : normalizePathInput(tsconfigPath, normalizedPackageRoot);

  const aliases: Record<string, string> = Object.fromEntries(
    Object.entries({
      ...resolveTsconfigAliases(resolvedTsconfigPath),
      ...(aliasOverrides ?? {}),
    }).map(([key, target]) => [
      key,
      normalizePathInput(target, normalizedPackageRoot),
    ])
  );

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
    normalizePathInput(file, normalizedPackageRoot)
  );

  const baseConfig: SharedUserConfig = {
    root: normalizedPackageRoot,
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
      coverage: applyCoverageDefaults(normalizedPackageRoot, coverageOverrides),
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
    sourceTsconfig: resolvedTsconfigPath,
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
