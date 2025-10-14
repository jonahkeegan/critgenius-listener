import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = dirname(CONFIG_DIRECTORY);
const COVERAGE_ROOT = join(WORKSPACE_ROOT, 'coverage');

function cloneThresholds(thresholds) {
  return {
    statements: thresholds.statements,
    branches: thresholds.branches,
    functions: thresholds.functions,
    lines: thresholds.lines,
  };
}

function freezeCommand(command) {
  return command ? Object.freeze([...command]) : undefined;
}

function createTheme(config) {
  const { thresholds, coverageCommand, ...rest } = config;

  return Object.freeze({
    ...rest,
    thresholds: Object.freeze(cloneThresholds(thresholds)),
    coverageCommand: freezeCommand(coverageCommand),
  });
}

export const defaultCoverageThresholds = Object.freeze({
  statements: 90,
  branches: 90,
  functions: 90,
  lines: 90,
});

export const coverageThemes = Object.freeze([
  createTheme({
    key: 'workspace',
    label: 'Workspace Aggregate',
    description: 'Workspace aggregate coverage',
    workspaceRelativeConfigPath: 'vitest.config.ts',
    configPath: join(WORKSPACE_ROOT, 'vitest.config.ts'),
    reportsDirectory: join(COVERAGE_ROOT, 'workspace'),
    summaryFile: join(COVERAGE_ROOT, 'workspace', 'coverage-summary.json'),
    thresholds: {
      statements: 30,
      branches: 30,
      functions: 30,
      lines: 30,
    },
    coverageCommand: ['vitest', 'run', '--coverage'],
  }),
  createTheme({
    key: 'client',
    label: 'Client (Frontend)',
    description: '@critgenius/client coverage',
    workspaceRelativeConfigPath: 'packages/client/vitest.config.ts',
    configPath: join(WORKSPACE_ROOT, 'packages', 'client', 'vitest.config.ts'),
    packageDir: 'client',
    packageName: '@critgenius/client',
    reportsDirectory: join(COVERAGE_ROOT, 'client'),
    summaryFile: join(COVERAGE_ROOT, 'client', 'coverage-summary.json'),
    thresholds: {
      statements: 50,
      branches: 50,
      functions: 50,
      lines: 50,
    },
    coverageCommand: [
      'vitest',
      'run',
      '--config',
      'packages/client/vitest.config.ts',
      '--coverage',
    ],
  }),
  createTheme({
    key: 'server',
    label: 'Server (Backend)',
    description: '@critgenius/server coverage',
    workspaceRelativeConfigPath: 'packages/server/vitest.config.ts',
    configPath: join(WORKSPACE_ROOT, 'packages', 'server', 'vitest.config.ts'),
    packageDir: 'server',
    packageName: '@critgenius/server',
    reportsDirectory: join(COVERAGE_ROOT, 'server'),
    summaryFile: join(COVERAGE_ROOT, 'server', 'coverage-summary.json'),
    thresholds: {
      statements: 50,
      branches: 50,
      functions: 50,
      lines: 50,
    },
    coverageCommand: [
      'vitest',
      'run',
      '--config',
      'packages/server/vitest.config.ts',
      '--coverage',
    ],
  }),
  createTheme({
    key: 'shared',
    label: 'Shared (Core Logic)',
    description: '@critgenius/shared coverage',
    workspaceRelativeConfigPath: 'packages/shared/vitest.config.ts',
    configPath: join(WORKSPACE_ROOT, 'packages', 'shared', 'vitest.config.ts'),
    packageDir: 'shared',
    packageName: '@critgenius/shared',
    reportsDirectory: join(COVERAGE_ROOT, 'shared'),
    summaryFile: join(COVERAGE_ROOT, 'shared', 'coverage-summary.json'),
    thresholds: {
      statements: 75,
      branches: 75,
      functions: 75,
      lines: 75,
    },
    coverageCommand: [
      'vitest',
      'run',
      '--config',
      'packages/shared/vitest.config.ts',
      '--coverage',
    ],
  }),
  createTheme({
    key: 'test-utils',
    label: 'Test Utilities',
    description: '@critgenius/test-utils coverage',
    workspaceRelativeConfigPath: 'packages/test-utils/vitest.config.ts',
    configPath: join(
      WORKSPACE_ROOT,
      'packages',
      'test-utils',
      'vitest.config.ts'
    ),
    packageDir: 'test-utils',
    packageName: '@critgenius/test-utils',
    reportsDirectory: join(COVERAGE_ROOT, 'test-utils'),
    summaryFile: join(COVERAGE_ROOT, 'test-utils', 'coverage-summary.json'),
    thresholds: {
      statements: 30,
      branches: 30,
      functions: 30,
      lines: 30,
    },
    coverageCommand: [
      'vitest',
      'run',
      '--config',
      'packages/test-utils/vitest.config.ts',
      '--coverage',
    ],
  }),
]);

function resolveThemeThresholds(theme, { resolved }) {
  const base = resolved ? defaultCoverageThresholds : null;
  const overrides = theme.thresholds ?? {};

  if (!resolved) {
    return cloneThresholds(overrides);
  }

  return {
    statements:
      overrides.statements ?? base.statements,
    branches: overrides.branches ?? base.branches,
    functions: overrides.functions ?? base.functions,
    lines: overrides.lines ?? base.lines,
  };
}

export function getCoverageTheme(key) {
  return coverageThemes.find(theme => theme.key === key) ?? null;
}

export function getThemeThresholdMap(options = {}) {
  const { resolved = true } = options;

  return coverageThemes.reduce((acc, theme) => {
    acc[theme.key] = resolveThemeThresholds(theme, { resolved });
    return acc;
  }, {});
}

export function getCoverageTargets() {
  return coverageThemes.reduce((acc, theme) => {
    if (!theme.coverageCommand) {
      return acc;
    }

    acc[theme.key] = {
      description: theme.description,
      command: [...theme.coverageCommand],
    };

    return acc;
  }, {});
}

export function getCoverageExecutionOrder() {
  return coverageThemes
    .filter(theme => theme.coverageCommand && theme.includeInThematic !== false)
    .map(theme => theme.key);
}

export function getThemesMetadata() {
  return coverageThemes.map(theme => ({
    key: theme.key,
    label: theme.label,
    summaryFile: theme.summaryFile,
    reportsDirectory: theme.reportsDirectory,
  }));
}

export function getWorkspaceRoot() {
  return WORKSPACE_ROOT;
}

export function getCoverageRoot() {
  return COVERAGE_ROOT;
}
