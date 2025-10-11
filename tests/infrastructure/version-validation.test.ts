import { describe, it, expect } from 'vitest';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const testDir = dirname(fileURLToPath(import.meta.url));
const helperPath = join(testDir, 'helpers', 'validate-versions-runner.mjs');

async function runHelper<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const { stdout, stderr } = await execFileAsync(
    'node',
    [helperPath, action, JSON.stringify(payload)],
    {
      cwd: join(testDir, '..', '..'),
    }
  );

  if (stderr && stderr.trim().length > 0) {
    throw new Error(`helper emitted stderr: ${stderr}`);
  }

  const trimmed = stdout.trim();
  if (!trimmed) {
    throw new Error('helper returned empty stdout');
  }

  return JSON.parse(trimmed) as T;
}

describe('version comparison helpers', () => {
  it('parses semantic versions with missing patch components', async () => {
    const result = await runHelper<{
      major: number;
      minor: number;
      patch: number;
    }>('parseVersion', {
      value: '18',
    });
    expect(result).toMatchObject({ major: 18, minor: 0, patch: 0 });

    const minorOnly = await runHelper<{
      major: number;
      minor: number;
      patch: number;
    }>('parseVersion', {
      value: '18.2',
    });
    expect(minorOnly).toMatchObject({ major: 18, minor: 2, patch: 0 });

    const full = await runHelper<{
      major: number;
      minor: number;
      patch: number;
    }>('parseVersion', {
      value: '18.20.4',
    });
    expect(full).toMatchObject({ major: 18, minor: 20, patch: 4 });
  });

  it('evaluates minimum version comparisons', async () => {
    const success = await runHelper<{ ok: boolean }>('evaluateComparison', {
      comparison: 'minimum',
      expected: '18.0.0',
      actualValue: '>=18.0.0',
    });
    expect(success.ok).toBe(true);

    const failure = await runHelper<{ ok: boolean }>('evaluateComparison', {
      comparison: 'minimum',
      expected: '18.0.0',
      actualValue: '16.0.0',
    });
    expect(failure.ok).toBe(false);
  });

  it('evaluates exact comparisons', async () => {
    const match = await runHelper<{ ok: boolean }>('evaluateComparison', {
      comparison: 'exact',
      expected: '8.15.8',
      actualValue: 'pnpm@8.15.8',
    });
    expect(match.ok).toBe(true);

    const mismatch = await runHelper<{ ok: boolean }>('evaluateComparison', {
      comparison: 'exact',
      expected: '8.15.8',
      actualValue: '8.14.0',
    });
    expect(mismatch.ok).toBe(false);
  });

  it('compares versions lexicographically', async () => {
    const diffOne = await runHelper<number>('compareVersions', {
      a: { major: 18, minor: 20, patch: 4 },
      b: { major: 18, minor: 0, patch: 0 },
    });
    expect(diffOne).toBeGreaterThan(0);

    const diffTwo = await runHelper<number>('compareVersions', {
      a: { major: 18, minor: 0, patch: 0 },
      b: { major: 17, minor: 9, patch: 0 },
    });
    expect(diffTwo).toBeGreaterThan(0);
  });
});

describe('runValidation with stubbed IO', () => {
  it('passes when versions align with policy', async () => {
    const result = await runHelper<{ hasFailures: boolean }>('runValidation', {
      scenario: 'aligned',
    });
    expect(result.hasFailures).toBe(false);
  });

  it('fails when package manager version is downgraded', async () => {
    const result = await runHelper<{
      hasFailures: boolean;
      issues: Array<{ tool: string }>;
    }>('runValidation', { scenario: 'downgraded' });
    expect(result.hasFailures).toBe(true);
    expect(
      result.issues.some((issue: { tool: string }) => issue.tool === 'pnpm')
    ).toBe(true);
  });
});
