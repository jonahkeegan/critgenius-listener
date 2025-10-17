import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const WORKSPACE_ROOT = dirname(SCRIPT_DIR);
const COVERAGE_ROOT = join(WORKSPACE_ROOT, 'coverage');
const THEMATIC_SUMMARY_PATH = join(COVERAGE_ROOT, 'thematic-summary.json');
const PNPM_EXECUTABLE = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

const REQUIRED_SCRIPTS = {
  'test:coverage:workspace': 'node scripts/coverage/run-coverage.mjs workspace',
  'test:coverage:client': 'node scripts/coverage/run-coverage.mjs client',
  'test:coverage:server': 'node scripts/coverage/run-coverage.mjs server',
  'test:coverage:shared': 'node scripts/coverage/run-coverage.mjs shared',
  'test:coverage:test-utils': 'node scripts/coverage/run-coverage.mjs test-utils',
  'test:coverage:thematic': 'node scripts/coverage/run-coverage.mjs thematic',
  'test:coverage:summary': 'node scripts/coverage/print-summary.mjs',
};

const REQUIRED_DOC_HEADINGS = [
  '### Coverage Orchestration Workflow',
  '### Thematic Execution Flow',
  '### Failure Handling & Recovery',
  '### Aggregate Report Generation',
];

const TEST_FILE_PATH = join(
  WORKSPACE_ROOT,
  'tests',
  'infrastructure',
  'coverage-orchestration.test.ts'
);

const coverageConfigModulePromise = import(
  pathToFileURL(join(WORKSPACE_ROOT, 'config', 'coverage.config.mjs')).href
);

async function loadCoverageConfigModule() {
  return coverageConfigModulePromise;
}

function collectScriptIssues(manifest) {
  const issues = [];

  if (!manifest?.scripts) {
    issues.push('package.json must define a scripts object.');
    return issues;
  }

  for (const [name, command] of Object.entries(REQUIRED_SCRIPTS)) {
    if (manifest.scripts[name] !== command) {
      issues.push(`Missing or incorrect script "${name}" → "${command}"`);
    }
  }

  return issues;
}

function validateDocumentation() {
  const docPath = join(WORKSPACE_ROOT, 'docs', 'coverage-system-guide.md');
  if (!existsSync(docPath)) {
    return ['docs/coverage-system-guide.md is missing.'];
  }

  const content = readFileSync(docPath, 'utf8');
  const missingHeadings = REQUIRED_DOC_HEADINGS.filter(
    heading => !content.includes(heading)
  );

  return missingHeadings.map(
    heading => `Documentation missing expected heading: ${heading}`
  );
}

async function validateCoverageConfig() {
  try {
    const coverageConfig = await loadCoverageConfigModule();
    const order = coverageConfig.getCoverageExecutionOrder();
    const targets = coverageConfig.getCoverageTargets();

    const missingTargets = order.filter(key => !targets[key]);
    const issues = missingTargets.map(
      key => `Coverage target "${key}" not found in getCoverageTargets().`
    );

    if (!order.length) {
      issues.push('Coverage execution order is empty.');
    }

    return issues;
  } catch (error) {
    return [
      `Failed to import coverage config: ${
        error instanceof Error ? error.message : String(error)
      }`,
    ];
  }
}

async function validateSummaryGeneration() {
  try {
    const moduleUrl = pathToFileURL(
      join(WORKSPACE_ROOT, 'scripts', 'coverage', 'thematic-summary.mjs')
    ).href;
    const { generateThematicSummary, formatThematicSummary } = await import(
      moduleUrl
    );

    const tempDir = mkdtempSync(join(tmpdir(), 'coverage-orchestration-'));
    const tempFile = join(tempDir, 'summary.json');

    const summary = generateThematicSummary({ outputFile: tempFile });
    formatThematicSummary(summary);

    rmSync(tempDir, { recursive: true, force: true });
    return [];
  } catch (error) {
    return [
      `Coverage summary generation failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    ];
  }
}

function toPosixPath(value) {
  return value.replace(/\\+/g, '/');
}

async function validateThematicSummary({ enforce }) {
  if (!enforce) {
    return [];
  }

  const issues = [];
  const relativeSummaryPath = relative(WORKSPACE_ROOT, THEMATIC_SUMMARY_PATH);

  if (!existsSync(THEMATIC_SUMMARY_PATH)) {
    issues.push(
      `${relativeSummaryPath} missing; run "pnpm run test:coverage:thematic" before validation.`
    );
    return issues;
  }

  let summary;
  try {
    summary = JSON.parse(readFileSync(THEMATIC_SUMMARY_PATH, 'utf8'));
  } catch (error) {
    issues.push(
      `Failed to parse ${relativeSummaryPath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return issues;
  }

  if (!summary || typeof summary !== 'object') {
    issues.push(`${relativeSummaryPath} does not contain an object payload.`);
    return issues;
  }

  const summaryThemes = summary.themes;
  if (!summaryThemes || typeof summaryThemes !== 'object') {
    issues.push(`${relativeSummaryPath} missing "themes" section.`);
    return issues;
  }

  let coverageConfig;
  try {
    coverageConfig = await loadCoverageConfigModule();
  } catch (error) {
    issues.push(
      `Failed to import coverage config for summary validation: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return issues;
  }

  const themeThresholds = coverageConfig.getThemeThresholdMap({
    resolved: false,
  });
  const resolvedThemes = Array.isArray(coverageConfig.coverageThemes)
    ? coverageConfig.coverageThemes
    : [];

  const summaryThresholds =
    summary.thresholds && typeof summary.thresholds === 'object'
      ? summary.thresholds.themes ?? {}
      : {};

  for (const theme of resolvedThemes) {
    const record = summaryThemes[theme.key];
    if (!record || typeof record !== 'object') {
      issues.push(
        `Summary missing theme entry "${theme.key}" (expected coverage for ${theme.label}).`
      );
      continue;
    }

    const expectedSummaryPath = toPosixPath(
      relative(WORKSPACE_ROOT, theme.summaryFile)
    );
    const expectedReportsDir = toPosixPath(
      relative(WORKSPACE_ROOT, theme.reportsDirectory)
    );

    const recordedSummaryFile =
      typeof record.summaryFile === 'string' ? record.summaryFile : '';
    if (toPosixPath(recordedSummaryFile) !== expectedSummaryPath) {
      issues.push(
        `Theme "${theme.key}" summary file mismatch (expected ${expectedSummaryPath}).`
      );
    }

    const recordedReportsDirectory =
      typeof record.reportsDirectory === 'string'
        ? record.reportsDirectory
        : '';
    if (toPosixPath(recordedReportsDirectory) !== expectedReportsDir) {
      issues.push(
        `Theme "${theme.key}" reports directory mismatch (expected ${expectedReportsDir}).`
      );
    }

    if (record.status === 'missing') {
      issues.push(`Coverage summary indicates missing data for "${theme.key}".`);
    } else if (record.status === 'error') {
      issues.push(
        `Coverage summary reported an error for "${theme.key}": ${record.details ?? 'no details supplied'}`
      );
    } else if (record.meetsThresholds === false) {
      issues.push(
        `Coverage thresholds not met for "${theme.key}" (status: ${record.status}).`
      );
    }

    if (!record.coverage || typeof record.coverage !== 'object') {
      issues.push(`Theme "${theme.key}" coverage metrics missing.`);
    }

    const expectedThresholds = themeThresholds[theme.key] ?? {};
    const recordedThresholds = summaryThresholds?.[theme.key] ?? {};

    for (const metric of ['statements', 'branches', 'functions', 'lines']) {
      const expectedValue = expectedThresholds?.[metric];
      const recordedValue = recordedThresholds?.[metric];

      if (typeof expectedValue === 'number') {
        if (typeof recordedValue !== 'number') {
          issues.push(
            `Threshold entry missing for theme "${theme.key}" metric "${metric}" (expected ${expectedValue}).`
          );
          continue;
        }

        if (recordedValue !== expectedValue) {
          issues.push(
            `Threshold drift detected for theme "${theme.key}" metric "${metric}" (expected ${expectedValue}, found ${recordedValue}).`
          );
        }
      }
    }
  }

  return issues;
}

function runInfrastructureTest() {
  const result = spawnSync(
    PNPM_EXECUTABLE,
    ['vitest', 'run', 'tests/infrastructure/coverage-orchestration.test.ts'],
    {
      cwd: WORKSPACE_ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    }
  );

  if (result.error) {
    return [
      `Failed to execute coverage orchestration test: ${
        result.error.message ?? String(result.error)
      }`,
    ];
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    return [
      `coverage-orchestration.test.ts exited with status ${result.status}.`,
    ];
  }

  return [];
}

async function validate({ skipTests, enforceSummaryChecks }) {
  const issues = [];

  const manifestPath = join(WORKSPACE_ROOT, 'package.json');
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    issues.push(
      `Failed to parse package.json: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  if (manifest) {
    issues.push(...collectScriptIssues(manifest));
  }

  if (!existsSync(TEST_FILE_PATH)) {
    issues.push('tests/infrastructure/coverage-orchestration.test.ts is missing.');
  }

  issues.push(...validateDocumentation());
  issues.push(...(await validateCoverageConfig()));
  issues.push(...(await validateSummaryGeneration()));
  issues.push(...(await validateThematicSummary({ enforce: enforceSummaryChecks })));

  if (!skipTests) {
    issues.push(...runInfrastructureTest());
  }

  return { issues };
}

async function main() {
  const args = process.argv.slice(2);
  const ciMode = args.includes('--ci');
  const skipTests = ciMode || args.includes('--skip-tests');
  const { issues } = await validate({
    skipTests,
    enforceSummaryChecks: ciMode,
  });

  if (issues.length > 0) {
    console.error('[coverage] Validation failed:');
    for (const issue of issues) {
      console.error(` - ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('[coverage] Orchestration validation succeeded.');
}

await main();
