import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import type { ChildProcess } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Readable } from 'node:stream';

import { beforeEach, describe, expect, it, vi } from 'vitest';

declare global {
  // Vitest-only aggregation of coverage orchestrator failure messages

  var __coverageOrchestratorFailures: string[] | undefined;
}

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

vi.mock('../../scripts/coverage/thematic-summary.mjs', () => summaryMocks);

const spawnMock = vi.hoisted(() => vi.fn());
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

type ChildProcessOverrides = {
  exitCode?: number | null;
  error?: Error;
  autoClose?: boolean;
  closeDelayMs?: number;
  errorDelayMs?: number;
};

function scheduleCallback(callback: () => void, delayMs?: number) {
  if (typeof delayMs === 'number' && delayMs > 0) {
    setTimeout(callback, delayMs);
    return;
  }

  queueMicrotask(callback);
}

function createChildProcess(
  overrides: ChildProcessOverrides = {}
): ChildProcess {
  const child = new EventEmitter() as ChildProcess;
  child.stdout = new EventEmitter() as unknown as Readable;
  child.stderr = new EventEmitter() as unknown as Readable;

  if (overrides.error) {
    scheduleCallback(
      () => child.emit('error', overrides.error),
      overrides.errorDelayMs ?? overrides.closeDelayMs
    );
  }

  if (overrides.autoClose !== false) {
    const exitCode = overrides.exitCode ?? (overrides.error ? 1 : 0);
    scheduleCallback(
      () => child.emit('close', exitCode, null),
      overrides.closeDelayMs
    );
  }

  return child;
}

function applyOverrides(target: Record<string, unknown>, overrides?: unknown) {
  if (!overrides || typeof overrides !== 'object') {
    return target;
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
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

type RunCoverageOptions = {
  spawnImplementation?: typeof spawnMock;
};

async function runCoverage(
  target = 'thematic',
  options: RunCoverageOptions = {}
) {
  const originalArgv = process.argv;
  const originalExitCode = process.exitCode;

  process.argv = ['node', 'run-coverage.mjs', target];
  process.exitCode = 0;

  try {
    vi.resetModules();
    const coverageModule = await import(RUN_COVERAGE_MODULE);
    const {
      main: runCoverageMain,
      setSpawnImplementationForTests,
      resetSpawnImplementationForTests,
    } = coverageModule as {
      main: () => Promise<void>;
      setSpawnImplementationForTests: (
        implementation: typeof spawnMock
      ) => void;
      resetSpawnImplementationForTests: () => void;
    };

    setSpawnImplementationForTests(options.spawnImplementation ?? spawnMock);

    try {
      await runCoverageMain();
    } finally {
      resetSpawnImplementationForTests();
    }

    const exitCode =
      typeof process.exitCode === 'number' ? process.exitCode : 0;
    return exitCode;
  } finally {
    process.argv = originalArgv;
    process.exitCode = originalExitCode;
  }
}

beforeEach(() => {
  spawnMock.mockReset();
  generateSummaryMock.mockReset();
  formatSummaryMock.mockReset();

  spawnMock.mockImplementation(() => createChildProcess());

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

  it('runs coverage targets in parallel and refreshes the thematic summary', async () => {
    const processes: Array<{
      command: string;
      args: string[];
      child: ChildProcess;
    }> = [];

    spawnMock.mockImplementation((command, args) => {
      const child = createChildProcess({ autoClose: false });
      processes.push({
        command,
        args: [...(args ?? [])],
        child,
      });
      return child;
    });

    const summary = createSummary();
    generateSummaryMock.mockReturnValue(summary as never);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const runPromise = runCoverage('thematic', {
      spawnImplementation: spawnMock,
    });

    const executionOrder = getCoverageExecutionOrder();
    const targets = getCoverageTargets();

    await vi.waitFor(() => {
      expect(spawnMock).toHaveBeenCalledTimes(executionOrder.length);
      expect(processes).toHaveLength(executionOrder.length);
    });

    expect(generateSummaryMock).not.toHaveBeenCalled();

    for (const [index, key] of executionOrder.entries()) {
      const target = targets[key];
      const processCall = processes[index];
      expect(processCall).toBeDefined();
      if (!processCall) {
        continue;
      }
      expect(processCall.command.toLowerCase()).toContain('pnpm');
      expect(processCall.args).toEqual(target.command);
    }

    for (const { child } of processes) {
      child.emit('close', 0, null);
    }

    const exitCode = await runPromise;

    logSpy.mockRestore();

    expect(exitCode).toBe(0);
    expect(generateSummaryMock).toHaveBeenCalledTimes(1);
    expect(formatSummaryMock).toHaveBeenCalledTimes(1);
    expect(formatSummaryMock).toHaveBeenCalledWith(summary);
  });

  it('continues executing remaining targets when a theme fails and reports the failure', async () => {
    const executionOrder = getCoverageExecutionOrder();

    const processes: ChildProcess[] = [];
    spawnMock.mockImplementation(() => {
      const child = createChildProcess({ autoClose: false });
      processes.push(child);
      return child;
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const runPromise = runCoverage('thematic', {
      spawnImplementation: spawnMock,
    });

    await vi.waitFor(() => {
      expect(spawnMock).toHaveBeenCalledTimes(executionOrder.length);
      expect(processes).toHaveLength(executionOrder.length);
    });

    processes.forEach((child, index) => {
      const code = index === 2 ? 1 : 0;
      child.emit('close', code, null);
    });

    const exitCode = await runPromise;

    errorSpy.mockRestore();

    const failureMessages = globalThis.__coverageOrchestratorFailures ?? [];

    expect(exitCode).toBe(1);
    expect(spawnMock).toHaveBeenCalledTimes(executionOrder.length);

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
    spawnMock.mockImplementation(() => {
      const child = createChildProcess({ autoClose: false });
      queueMicrotask(() => {
        child.emit('error', new Error('command not found'));
      });
      return child;
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const exitCode = await runCoverage('workspace', {
      spawnImplementation: spawnMock,
    });

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

    const exitCode = await runCoverage('thematic', {
      spawnImplementation: spawnMock,
    });

    logSpy.mockRestore();

    expect(exitCode).toBe(0);
    expect(formatSummaryMock).toHaveBeenCalledWith(summary);
  });

  it('supports direct workspace execution without triggering all themes', async () => {
    await runCoverage('workspace', {
      spawnImplementation: spawnMock,
    });

    expect(spawnMock).toHaveBeenCalledTimes(1);

    const firstCall = spawnMock.mock.calls[0];
    expect(firstCall).toBeDefined();
    if (firstCall) {
      const [command, args] = firstCall as [string, string[]];
      expect(command.toLowerCase()).toContain('pnpm');
      expect(args).toEqual(getCoverageTargets().workspace.command);
    }
  });
});
