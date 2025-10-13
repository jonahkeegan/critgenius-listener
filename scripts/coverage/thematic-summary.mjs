import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = dirname(dirname(MODULE_DIR));
const COVERAGE_ROOT = join(WORKSPACE_ROOT, 'coverage');

const DEFAULT_THRESHOLDS = {
  statements: 90,
  branches: 90,
  functions: 90,
  lines: 90,
};

export const THEME_THRESHOLDS = {
  workspace: {
    statements: 30,
    branches: 30,
    functions: 30,
    lines: 30,
  },
  client: {
    statements: 50,
    branches: 50,
    functions: 50,
    lines: 50,
  },
  server: {
    statements: 50,
    branches: 50,
    functions: 50,
    lines: 50,
  },
  shared: {
    statements: 75,
    branches: 75,
    functions: 75,
    lines: 75,
  },
  'test-utils': {
    statements: 30,
    branches: 30,
    functions: 30,
    lines: 30,
  },
};

const THEMES = [
  {
    key: 'workspace',
    label: 'Workspace Aggregate',
    summaryFile: join(COVERAGE_ROOT, 'workspace', 'coverage-summary.json'),
    reportsDirectory: join(COVERAGE_ROOT, 'workspace'),
  },
  {
    key: 'client',
    label: 'Client (Frontend)',
    summaryFile: join(COVERAGE_ROOT, 'client', 'coverage-summary.json'),
    reportsDirectory: join(COVERAGE_ROOT, 'client'),
  },
  {
    key: 'server',
    label: 'Server (Backend)',
    summaryFile: join(COVERAGE_ROOT, 'server', 'coverage-summary.json'),
    reportsDirectory: join(COVERAGE_ROOT, 'server'),
  },
  {
    key: 'shared',
    label: 'Shared (Core Logic)',
    summaryFile: join(COVERAGE_ROOT, 'shared', 'coverage-summary.json'),
    reportsDirectory: join(COVERAGE_ROOT, 'shared'),
  },
  {
    key: 'test-utils',
    label: 'Test Utilities',
    summaryFile: join(COVERAGE_ROOT, 'test-utils', 'coverage-summary.json'),
    reportsDirectory: join(COVERAGE_ROOT, 'test-utils'),
  },
];

function ensureCoverageRoot() {
  if (!existsSync(COVERAGE_ROOT)) {
    mkdirSync(COVERAGE_ROOT, { recursive: true });
  }
}

function readThemeSummary(theme) {
  if (!existsSync(theme.summaryFile)) {
    return null;
  }

  try {
    const raw = readFileSync(theme.summaryFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function extractMetric(summary, metric) {
  if (!summary || typeof summary !== 'object') {
    return null;
  }

  const bucket = summary.total?.[metric];
  if (!bucket) {
    return null;
  }

  const { total = 0, covered = 0, pct = 0 } = bucket;
  return { total, covered, pct };
}

function evaluateTheme(theme, summaryData) {
  if (!summaryData) {
    return {
      status: 'missing',
      coverage: null,
      meetsThresholds: false,
      details: 'coverage-summary.json not found',
    };
  }

  if (summaryData.error) {
    return {
      status: 'error',
      coverage: null,
      meetsThresholds: false,
      details: summaryData.error,
    };
  }

  const coverage = {
    statements: extractMetric(summaryData, 'statements'),
    branches: extractMetric(summaryData, 'branches'),
    functions: extractMetric(summaryData, 'functions'),
    lines: extractMetric(summaryData, 'lines'),
  };

  const resolvedThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...(THEME_THRESHOLDS[theme.key] ?? {}),
  };

  const meetsThresholds = Object.entries(coverage).every(([metric, data]) => {
    if (!data) return false;
    const threshold = resolvedThresholds[metric];
    return typeof threshold === 'number' ? data.pct >= threshold : true;
  });

  return {
    status: meetsThresholds ? 'pass' : 'fail',
    coverage,
    meetsThresholds,
    details: null,
    thresholds: resolvedThresholds,
  };
}

export function generateThematicSummary(options = {}) {
  const { outputFile = join(COVERAGE_ROOT, 'thematic-summary.json') } = options;

  ensureCoverageRoot();

  const themes = {};

  for (const theme of THEMES) {
    const summaryData = readThemeSummary(theme);
    const evaluation = evaluateTheme(theme, summaryData);

    themes[theme.key] = {
      label: theme.label,
      summaryFile: relative(WORKSPACE_ROOT, theme.summaryFile),
      reportsDirectory: relative(WORKSPACE_ROOT, theme.reportsDirectory),
      status: evaluation.status,
      meetsThresholds: evaluation.meetsThresholds,
      details: evaluation.details,
      coverage: evaluation.coverage,
      thresholds: evaluation.thresholds,
    };
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    thresholds: {
      default: { ...DEFAULT_THRESHOLDS },
      themes: Object.fromEntries(
        Object.entries(THEME_THRESHOLDS).map(([key, value]) => [key, { ...value }])
      ),
    },
    themes,
  };

  writeFileSync(outputFile, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

export function formatThematicSummary(summary) {
  const header = ['Theme', 'Statements', 'Branches', 'Functions', 'Lines', 'Status'];

  const rows = [header];

  for (const theme of THEMES) {
    const record = summary.themes[theme.key];

    const formatCell = metric => {
      const data = record.coverage?.[metric];
      if (!data) {
        return 'n/a';
      }
      return `${data.pct.toFixed(1)}% (${data.covered}/${data.total})`;
    };

    rows.push([
      theme.label,
      formatCell('statements'),
      formatCell('branches'),
      formatCell('functions'),
      formatCell('lines'),
      record.status.toUpperCase(),
    ]);
  }

  const columnWidths = rows[0].map((_, columnIndex) =>
    rows.reduce((max, row) => Math.max(max, row[columnIndex].length), 0)
  );

  const formatRow = row =>
    row
      .map((cell, index) => cell.padEnd(columnWidths[index], ' '))
      .join(' | ');

  return rows.map(formatRow).join('\n');
}