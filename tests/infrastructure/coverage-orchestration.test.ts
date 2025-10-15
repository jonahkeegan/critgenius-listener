import { readFileSync } from 'node:fs';
import type { SpawnSyncReturns } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { beforeEach, describe, expect, it, vi } from 'vitest';

declare global {
  // Vitest-only aggregation of coverage orchestrator failure messages

  var __coverageOrchestratorFailures: string[] | undefined;
}

const childProcessMock = vi.hoisted(() => ({
  spawnSync: vi.fn(),
}));

const summaryMocks = vi.hoisted(() => ({
  generateThematicSummary: vi.fn(),
  formatThematicSummary: vi.fn(),
  THEME_THRESHOLDS: {},
}));

const MODULE_PATH = fileURLToPath(import.meta.url);
const MODULE_DIR = dirname(MODULE_PATH);
const WORKSPACE_ROOT = resolve(MODULE_DIR, '..', '..');
const RUN_COVERAGE_MODULE = pathToFileURL(
  join(WORKSPACE_ROOT, 'scripts', 'coverage', 'run-coverage.mjs')
).href;

vi.mock('node:child_process', () => ({
  ...childProcessMock,
  default: childProcessMock,
}));

vi.mock('../../scripts/coverage/thematic-summary.mjs', () => summaryMocks);

const spawnSyncMock = vi.mocked(childProcessMock.spawnSync);
const generateSummaryMock = vi.mocked(summaryMocks.generateThematicSummary);
const formatSummaryMock = vi.mocked(summaryMocks.formatThematicSummary);

const coverageConfigModule = await import(
  pathToFileURL(join(WORKSPACE_ROOT, 'config', 'coverage.config.mjs')).href
);

const {
  coverageThemes,
  defaultCoverageThresholds,
  getCoverageExecutionOrder,
  getCoverageTargets,
  getThemeThresholdMap,
} = coverageConfigModule;

const RESOLVED_THRESHOLDS = getThemeThresholdMap({ resolved: true });
const UNRESOLVED_THRESHOLDS = getThemeThresholdMap({ resolved: false });

type SpawnResultOverrides = {
  status?: number | null;
  error?: Error;
};

function createSpawnResult(
  overrides: SpawnResultOverrides = {}
): SpawnSyncReturns<Buffer> {
  return {
    pid: 0,
    output: [null, Buffer.alloc(0), Buffer.alloc(0)],
    stdout: Buffer.alloc(0),
    stderr: Buffer.alloc(0),
    status: overrides.status ?? 0,
    signal: null,
    error: overrides.error,
  } satisfies SpawnSyncReturns<Buffer>;
}

function applyOverrides(target: Record<string, unknown>, overrides?: unknown) {
  if (!overrides || typeof overrides !== 'object') {
    return target;
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (
        typeof target[key] !== 'object' ||
        target[key] === null ||
        Array.isArray(target[key])
      ) {
        target[key] = {};
      }
      applyOverrides(target[key] as Record<string, unknown>, value);
      continue;
    }

    target[key] = value as unknown;
  }

  return target;
}

function createSummary(overrides?: Record<string, unknown>) {
  const summary = {
    generatedAt: new Date().toISOString(),
    thresholds: {
      default: {
        statements: defaultCoverageThresholds.statements,
        branches: defaultCoverageThresholds.branches,
        functions: defaultCoverageThresholds.functions,
        lines: defaultCoverageThresholds.lines,
      },
      themes: {} as Record<string, Record<string, number>>,
    },
    themes: {} as Record<string, Record<string, unknown>>,
  } satisfies Record<string, unknown>;

  for (const theme of coverageThemes) {
    summary.thresholds.themes[theme.key] = {
      ...(UNRESOLVED_THRESHOLDS[theme.key] ?? {}),
    } as Record<string, number>;

    summary.themes[theme.key] = {
      label: theme.label,
      summaryFile: relative(WORKSPACE_ROOT, theme.summaryFile),
      reportsDirectory: relative(WORKSPACE_ROOT, theme.reportsDirectory),
      status: 'pass',
      meetsThresholds: true,
      details: null,
      thresholds: {
        ...(RESOLVED_THRESHOLDS[theme.key] ?? {}),
      },
      coverage: {
        statements: { total: 50, covered: 50, pct: 100 },
        branches: { total: 50, covered: 50, pct: 100 },
        functions: { total: 50, covered: 50, pct: 100 },
        lines: { total: 50, covered: 50, pct: 100 },
      },
    };
  }

  return applyOverrides(summary, overrides);
}

async function runCoverage(target = 'thematic') {
  const originalArgv = process.argv;
  const originalExitCode = process.exitCode;

  process.argv = ['node', 'run-coverage.mjs', target];
  process.exitCode = 0;

  try {
    vi.resetModules();
    await import(RUN_COVERAGE_MODULE);
    const exitCode =
      typeof process.exitCode === 'number' ? process.exitCode : 0;
    return exitCode;
  } finally {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
  }
}

beforeEach(() => {
  spawnSyncMock.mockReset();
  generateSummaryMock.mockReset();
  formatSummaryMock.mockReset();

  spawnSyncMock.mockImplementation(() => createSpawnResult());

  const summary = createSummary();
  generateSummaryMock.mockReturnValue(summary as never);
  formatSummaryMock.mockReturnValue('table');

  if ('__coverageOrchestratorFailures' in globalThis) {
    globalThis.__coverageOrchestratorFailures = undefined;
  }
});

describe('coverage orchestration infrastructure', () => {
  it('defines all required coverage scripts in the workspace manifest', () => {
    const manifestPath = join(WORKSPACE_ROOT, 'package.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };

    const expectedScripts: Record<string, string> = {
      'test:coverage:workspace':
        'node scripts/coverage/run-coverage.mjs workspace',
      'test:coverage:client': 'node scripts/coverage/run-coverage.mjs client',
      'test:coverage:server': 'node scripts/coverage/run-coverage.mjs server',
      'test:coverage:shared': 'node scripts/coverage/run-coverage.mjs shared',
      'test:coverage:test-utils':
        'node scripts/coverage/run-coverage.mjs test-utils',
      'test:coverage:thematic':
        'node scripts/coverage/run-coverage.mjs thematic',
      'test:coverage:summary': 'node scripts/coverage/print-summary.mjs',
    };

    expect(manifest.scripts).toBeDefined();

    for (const [script, command] of Object.entries(expectedScripts)) {
      expect(manifest.scripts?.[script]).toBe(command);
    }
  });

  it('aligns execution order with coverage configuration metadata', () => {
    const executionOrder = getCoverageExecutionOrder();
    const targets = getCoverageTargets();

    const expectedOrder: string[] = [];
    for (const theme of coverageThemes) {
      if (theme.coverageCommand && theme.includeInThematic !== false) {
        expectedOrder.push(theme.key);
      }
    }

    expect(executionOrder).toEqual(expectedOrder);
    expect(Object.keys(targets)).toEqual(expectedOrder);

    for (const key of expectedOrder) {
      const target = targets[key];
      expect(Array.isArray(target.command)).toBe(true);
      expect(typeof target.description).toBe('string');
    }
  });

  it('runs coverage targets sequentially and refreshes the thematic summary', async () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    spawnSyncMock.mockImplementation((command, args) => {
      calls.push({ command, args: [...(args ?? [])] });
      return createSpawnResult();
    });

    const summary = createSummary();
    generateSummaryMock.mockReturnValue(summary as never);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const exitCode = await runCoverage('thematic');

    logSpy.mockRestore();

    const executionOrder = getCoverageExecutionOrder();
    const targets = getCoverageTargets();

    expect(exitCode).toBe(0);
    expect(calls).toHaveLength(executionOrder.length);

    for (const [index, key] of executionOrder.entries()) {
      const target = targets[key];
      const call = calls[index];
      expect(call).toBeDefined();
      if (!call) continue;
      expect(call.command.toLowerCase()).toContain('pnpm');
      expect(call.args).toEqual(target.command);
    }

    expect(generateSummaryMock).toHaveBeenCalledTimes(1);
    expect(formatSummaryMock).toHaveBeenCalledTimes(1);
    expect(formatSummaryMock).toHaveBeenCalledWith(summary);
  });

  it('continues executing remaining targets when a theme fails and reports the failure', async () => {
    const executionOrder = getCoverageExecutionOrder();

    let callIndex = 0;
    spawnSyncMock.mockImplementation(() => {
      const result =
        callIndex === 2
          ? createSpawnResult({ status: 1 })
          : createSpawnResult();
      callIndex += 1;
      return result;
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const exitCode = await runCoverage('thematic');

    errorSpy.mockRestore();

    const failureMessages = globalThis.__coverageOrchestratorFailures ?? [];

    expect(exitCode).toBe(1);
    expect(spawnSyncMock).toHaveBeenCalledTimes(executionOrder.length);

    if (errorSpy.mock.calls.length > 0) {
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[coverage] .* failed with exit code 1/)
      );
    } else {
      expect(failureMessages).toContainEqual(
        expect.stringMatching(/\[coverage] .* failed with exit code 1/)
      );
    }
  });

  it('surfaces spawn errors with descriptive diagnostics', async () => {
    spawnSyncMock.mockImplementation(() =>
      createSpawnResult({ status: null, error: new Error('command not found') })
    );

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const exitCode = await runCoverage('workspace');

    errorSpy.mockRestore();

    const failureMessages = globalThis.__coverageOrchestratorFailures ?? [];

    expect(exitCode).toBe(1);
    if (errorSpy.mock.calls.length > 0) {
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('command not found')
      );
    } else {
      expect(failureMessages).toContainEqual(
        expect.stringContaining('command not found')
      );
    }
  });

  it('handles missing coverage artifacts without aborting execution', async () => {
    const summary = createSummary({
      themes: {
        shared: {
          status: 'missing',
          meetsThresholds: false,
          coverage: null,
          details: 'coverage-summary.json not found',
        },
        server: {
          status: 'error',
          meetsThresholds: false,
          coverage: null,
          details: 'unexpected JSON content',
        },
      },
    });

    generateSummaryMock.mockReturnValue(summary as never);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const exitCode = await runCoverage('thematic');

    logSpy.mockRestore();

    expect(exitCode).toBe(0);
    expect(formatSummaryMock).toHaveBeenCalledWith(summary);
  });

  it('supports direct workspace execution without triggering all themes', async () => {
    spawnSyncMock.mockImplementation(() => createSpawnResult());

    await runCoverage('workspace');

    expect(spawnSyncMock).toHaveBeenCalledTimes(1);

    const firstCall = spawnSyncMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (firstCall) {
      const [command, args] = firstCall as [string, string[]];
      expect(command.toLowerCase()).toContain('pnpm');
      expect(args).toEqual(getCoverageTargets().workspace.command);
    }
  });
});
