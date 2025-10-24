import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface MinimalCoverageSummary {
  themes: Record<string, unknown>;
  thresholds?: {
    themes?: Record<string, unknown>;
  };
  metadata?: {
    generated: string;
    note: string;
  };
}

export function createMinimalThematicSummary(outputPath: string): void {
  const summary: MinimalCoverageSummary = {
    themes: {
      workspace: {
        summaryFile: 'coverage/workspace/coverage-summary.json',
        reportsDirectory: 'coverage/workspace',
        status: 'pass',
        meetsThresholds: true,
        coverage: {
          statements: { pct: 80 },
          branches: { pct: 75 },
          functions: { pct: 80 },
          lines: { pct: 80 },
        },
      },
      client: {
        summaryFile: 'coverage/client/coverage-summary.json',
        reportsDirectory: 'coverage/client',
        status: 'pass',
        meetsThresholds: true,
        coverage: {
          statements: { pct: 80 },
          branches: { pct: 75 },
          functions: { pct: 80 },
          lines: { pct: 80 },
        },
      },
      server: {
        summaryFile: 'coverage/server/coverage-summary.json',
        reportsDirectory: 'coverage/server',
        status: 'pass',
        meetsThresholds: true,
        coverage: {
          statements: { pct: 80 },
          branches: { pct: 75 },
          functions: { pct: 80 },
          lines: { pct: 80 },
        },
      },
      shared: {
        summaryFile: 'coverage/shared/coverage-summary.json',
        reportsDirectory: 'coverage/shared',
        status: 'pass',
        meetsThresholds: true,
        coverage: {
          statements: { pct: 80 },
          branches: { pct: 75 },
          functions: { pct: 80 },
          lines: { pct: 80 },
        },
      },
      'test-utils': {
        summaryFile: 'coverage/test-utils/coverage-summary.json',
        reportsDirectory: 'coverage/test-utils',
        status: 'pass',
        meetsThresholds: true,
        coverage: {
          statements: { pct: 80 },
          branches: { pct: 75 },
          functions: { pct: 80 },
          lines: { pct: 80 },
        },
      },
    },
    thresholds: {
      themes: {
        workspace: { statements: 9, branches: 9, functions: 9, lines: 9 },
        client: { statements: 50, branches: 50, functions: 50, lines: 50 },
        server: { statements: 50, branches: 50, functions: 50, lines: 50 },
        shared: { statements: 75, branches: 75, functions: 75, lines: 75 },
        'test-utils': {
          statements: 30,
          branches: 30,
          functions: 30,
          lines: 30,
        },
      },
    },
    metadata: {
      generated: 'test-fixture',
      note: 'Minimal fixture for validation testing',
    },
  };

  const dir = join(outputPath, '..');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(summary, null, 2));
}

export function ensureTestCoverageContext(workspaceRoot: string): void {
  const coverageDir = join(workspaceRoot, 'coverage');
  const summaryPath = join(coverageDir, 'thematic-summary.json');

  if (!existsSync(summaryPath)) {
    console.log(
      'Creating minimal coverage summary fixture for infrastructure tests.'
    );
    createMinimalThematicSummary(summaryPath);
  }
}
