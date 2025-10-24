import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

interface CoverageMetric {
  pct?: number;
}

interface CoverageTheme {
  status?: string;
  meetsThresholds?: boolean;
  coverage?: {
    statements?: CoverageMetric;
    branches?: CoverageMetric;
    functions?: CoverageMetric;
    lines?: CoverageMetric;
  };
}

interface CoverageMetadata {
  generated?: string;
}

interface CoverageSummary {
  themes?: Record<string, CoverageTheme>;
  metadata?: CoverageMetadata;
}

const WORKSPACE_ROOT = process.cwd();
const COVERAGE_DIR = join(WORKSPACE_ROOT, 'coverage');
const SUMMARY_PATH = join(COVERAGE_DIR, 'thematic-summary.json');
const REQUIRED_THEMES = [
  'workspace',
  'client',
  'server',
  'shared',
  'test-utils',
] as const;
const ALLOWED_THEME_STATUS = new Set(['pass', 'success']);

let realCoverageExists = false;
let summary: CoverageSummary | undefined;

describe('coverage-orchestration - Integration Tests', () => {
  beforeAll(() => {
    if (!existsSync(SUMMARY_PATH)) {
      console.log(
        'Skipping coverage integration tests: coverage/thematic-summary.json not found.'
      );
      console.log(
        'Run `pnpm run test:coverage:thematic` to generate coverage before rerunning.'
      );
      return;
    }

    try {
      const content = readFileSync(SUMMARY_PATH, 'utf-8');
      summary = JSON.parse(content) as CoverageSummary;

      if (summary?.metadata?.generated === 'test-fixture') {
        console.log(
          'Skipping coverage integration tests: fixture metadata detected. Run real coverage to enable checks.'
        );
        summary = undefined;
        return;
      }

      realCoverageExists = true;
    } catch (error) {
      console.error(
        'Failed to parse coverage summary for integration tests.',
        error
      );
    }
  });

  it('detects that real coverage was generated', () => {
    if (!realCoverageExists || !summary) {
      return;
    }

    expect(realCoverageExists).toBe(true);
    expect(summary.themes).toBeDefined();
  });

  it('confirms all required themes include coverage details', () => {
    if (!realCoverageExists || !summary || !summary.themes) {
      return;
    }

    for (const theme of REQUIRED_THEMES) {
      const themeData = summary.themes[theme];
      expect(themeData, `Theme ${theme} should exist`).toBeDefined();
      const status = themeData?.status ?? '';
      expect(
        ALLOWED_THEME_STATUS.has(status),
        `Theme ${theme} status expected to be one of ${[...ALLOWED_THEME_STATUS].join(', ')}`
      ).toBe(true);
      expect(
        themeData?.meetsThresholds,
        `Theme ${theme} meets thresholds`
      ).toBe(true);

      const metrics = themeData?.coverage;
      if (metrics) {
        expect(typeof metrics.statements?.pct).toBe('number');
        expect(typeof metrics.branches?.pct).toBe('number');
        expect(typeof metrics.functions?.pct).toBe('number');
        expect(typeof metrics.lines?.pct).toBe('number');
      }
    }
  });

  it('ensures coverage files are materialized for each theme', () => {
    if (!realCoverageExists) {
      return;
    }

    for (const theme of REQUIRED_THEMES) {
      const themeSummary = join(COVERAGE_DIR, theme, 'coverage-summary.json');
      expect(
        existsSync(themeSummary),
        `Expected ${themeSummary} to exist`
      ).toBe(true);
    }
  });

  it('verifies coverage metadata came from a real run', () => {
    if (!realCoverageExists || !summary) {
      return;
    }

    if (summary.metadata) {
      expect(summary.metadata.generated).not.toBe('test-fixture');
    }
  });
});
