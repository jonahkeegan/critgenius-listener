import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

import { describe, expect, it, vi } from 'vitest';

const TEST_FILE_PATH = fileURLToPath(import.meta.url);
const WORKSPACE_ROOT = dirname(dirname(dirname(TEST_FILE_PATH)));
const TEST_COVERAGE_KEY = 'client-posix-fixture';
const TEST_COVERAGE_DIR = join(WORKSPACE_ROOT, 'coverage', TEST_COVERAGE_KEY);
const TEST_SUMMARY_FILE = join(TEST_COVERAGE_DIR, 'coverage-summary.json');
const DEFAULT_THRESHOLDS = {
  statements: 90,
  branches: 90,
  functions: 90,
  lines: 90,
};
const THEME_THRESHOLDS = {
  statements: 50,
  branches: 50,
  functions: 50,
  lines: 50,
};

vi.mock('../../config/coverage.config.mjs', () => {
  const theme = {
    key: 'client',
    label: 'Client (Frontend)',
    summaryFile: TEST_SUMMARY_FILE,
    reportsDirectory: TEST_COVERAGE_DIR,
    thresholds: THEME_THRESHOLDS,
    coverageCommand: ['vitest', 'run'],
  };

  const unresolvedThresholds = { client: { ...THEME_THRESHOLDS } };
  const resolvedThresholds = { client: { ...THEME_THRESHOLDS } };

  return {
    coverageThemes: [theme],
    defaultCoverageThresholds: { ...DEFAULT_THRESHOLDS },
    getThemeThresholdMap: ({ resolved } = { resolved: true }) =>
      resolved ? resolvedThresholds : unresolvedThresholds,
  };
});

describe('thematic summary path normalization', () => {
  it('emits POSIX-style relative paths in the summary output', async () => {
    rmSync(TEST_COVERAGE_DIR, { recursive: true, force: true });
    mkdirSync(TEST_COVERAGE_DIR, { recursive: true });

    const coveragePayload = {
      total: {
        statements: { total: 1, covered: 1, pct: 100 },
        branches: { total: 1, covered: 1, pct: 100 },
        functions: { total: 1, covered: 1, pct: 100 },
        lines: { total: 1, covered: 1, pct: 100 },
      },
    } satisfies Record<string, unknown>;

    writeFileSync(TEST_SUMMARY_FILE, JSON.stringify(coveragePayload), 'utf8');

    vi.resetModules();

    const moduleUrl = pathToFileURL(
      join(WORKSPACE_ROOT, 'scripts', 'coverage', 'thematic-summary.mjs')
    ).href;
    const { generateThematicSummary } = await import(moduleUrl);

    const outputFile = join(
      tmpdir(),
      `${TEST_COVERAGE_KEY}-summary-${Date.now()}.json`
    );

    const summary = generateThematicSummary({ outputFile });

    expect(summary.themes.client.summaryFile).toBe(
      `coverage/${TEST_COVERAGE_KEY}/coverage-summary.json`
    );
    expect(summary.themes.client.reportsDirectory).toBe(
      `coverage/${TEST_COVERAGE_KEY}`
    );

    rmSync(TEST_COVERAGE_DIR, { recursive: true, force: true });
    rmSync(outputFile, { force: true });
  });
});
