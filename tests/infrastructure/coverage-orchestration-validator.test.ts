import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ensureTestCoverageContext } from './test-fixtures/coverage-test-helpers';

const WORKSPACE_ROOT = process.cwd();
const SCRIPT_PATH = join(
  WORKSPACE_ROOT,
  'scripts',
  'validate-coverage-orchestration.mjs'
);
const COVERAGE_DIR = join(WORKSPACE_ROOT, 'coverage');
const BASE_SUMMARY_PATH = join(COVERAGE_DIR, 'thematic-summary.json');

describe('validate-coverage-orchestration.mjs - Basic Validation', () => {
  let fixtureCreated = false;

  beforeAll(() => {
    const existingSummary = existsSync(BASE_SUMMARY_PATH);
    ensureTestCoverageContext(WORKSPACE_ROOT);
    fixtureCreated = !existingSummary;
  });

  afterAll(() => {
    if (fixtureCreated) {
      console.log(
        'Coverage validation fixture created for tests remains available for future runs.'
      );
    }
  });

  it('succeeds with a valid thematic summary structure', () => {
    const result = spawnSync(
      process.execPath,
      [
        SCRIPT_PATH,
        '--skip-tests',
        '--summary-file',
        BASE_SUMMARY_PATH,
        '--coverage-dir',
        COVERAGE_DIR,
      ],
      {
        cwd: WORKSPACE_ROOT,
        encoding: 'utf-8',
      }
    );

    expect(result.status).toBe(0);
    expect(result.stderr).not.toContain('Validation failed');
  });

  it('emits a warning when a theme is missing in non-strict mode but continues', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'coverage-validator-'));
    const tempSummaryPath = join(tempDir, 'summary.json');

    const summary = JSON.parse(readFileSync(BASE_SUMMARY_PATH, 'utf-8'));
    delete summary.themes.workspace;
    writeFileSync(tempSummaryPath, JSON.stringify(summary, null, 2));

    const result = spawnSync(
      process.execPath,
      [
        SCRIPT_PATH,
        '--skip-tests',
        '--summary-file',
        tempSummaryPath,
        '--coverage-dir',
        COVERAGE_DIR,
      ],
      {
        cwd: WORKSPACE_ROOT,
        encoding: 'utf-8',
      }
    );

    rmSync(tempDir, { recursive: true, force: true });

    expect(result.status).toBe(0);
    expect(result.stderr).toContain('[coverage] Warnings:');
    expect(result.stderr).toContain('Summary missing theme entry "workspace"');
  });

  it('fails in strict mode when a required theme is missing', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'coverage-validator-ci-'));
    const tempSummaryPath = join(tempDir, 'summary.json');

    const summary = JSON.parse(readFileSync(BASE_SUMMARY_PATH, 'utf-8'));
    delete summary.themes.workspace;
    writeFileSync(tempSummaryPath, JSON.stringify(summary, null, 2));

    const result = spawnSync(
      process.execPath,
      [
        SCRIPT_PATH,
        '--skip-tests',
        '--summary-file',
        tempSummaryPath,
        '--coverage-dir',
        COVERAGE_DIR,
        '--ci',
      ],
      {
        cwd: WORKSPACE_ROOT,
        encoding: 'utf-8',
      }
    );

    rmSync(tempDir, { recursive: true, force: true });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Validation failed');
    expect(result.stderr).toContain('Summary missing theme entry "workspace"');
  });
});
