import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const WORKSPACE_ROOT = dirname(SCRIPT_DIR);
const DEFAULT_COVERAGE_ROOT = join(WORKSPACE_ROOT, 'coverage');
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

function findCoverageSummaryFiles(rootDirectory) {
  if (!rootDirectory || !existsSync(rootDirectory)) {
    return [];
  }

  const stack = [rootDirectory];
  const results = [];
  const visited = new Set();

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch (error) {
      continue;
    }

    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') {
        continue;
      }

      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(entryPath);
        continue;
      }

      if (entry.isFile() && entry.name === 'coverage-summary.json') {
        results.push(entryPath);
      }
    }
  }

  return results.sort((a, b) => a.localeCompare(b));
}

async function validateThematicSummary({ enforce, summaryPath, coverageRoot }) {
  if (!enforce) {
    return [];
  }

  const issues = [];
  const relativeSummaryPath = relative(WORKSPACE_ROOT, summaryPath);
  const relativeCoverageRoot = relative(WORKSPACE_ROOT, coverageRoot);

  console.log(
    `[coverage] Checking coverage summary at ${relativeSummaryPath || './'}.`
  );

  if (!existsSync(summaryPath)) {
    const candidates = findCoverageSummaryFiles(coverageRoot).map(candidate =>
      toPosixPath(relative(WORKSPACE_ROOT, candidate))
    );

    issues.push(
      `Expected coverage summary at ${relativeSummaryPath} but the file was not found.`
    );

    if (candidates.length > 0) {
      issues.push(
        `Detected coverage-summary.json files: ${candidates.join(', ')}`
      );
    } else {
      issues.push(
        `No coverage-summary.json files found under ${
          relativeCoverageRoot || './'
        }. Ensure the coverage job ran and artifacts were downloaded.`
      );
    }

    issues.push(
      'Tip: run "pnpm run test:coverage:thematic" (or the coverage job in CI) before invoking this validator.'
    );
    return issues;
  }

  let summary;
  try {
    summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
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

  const availableThemeKeys = Object.keys(summaryThemes);

  for (const theme of resolvedThemes) {
    const record = summaryThemes[theme.key];
    if (!record || typeof record !== 'object') {
      issues.push(
        `Summary missing theme entry "${theme.key}" (available themes: ${
          availableThemeKeys.length > 0
            ? availableThemeKeys.join(', ')
            : 'none'
        }).`
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

async function validate({
  skipTests,
  enforceSummaryChecks,
  summaryPath,
  coverageRoot,
}) {
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
  issues.push(
    ...(await validateThematicSummary({
      enforce: enforceSummaryChecks,
      summaryPath,
      coverageRoot,
    }))
  );

  if (!skipTests) {
    issues.push(...runInfrastructureTest());
  }

  return { issues };
}

function parseCliArgs(args) {
  const options = {
    ci: false,
    skipTestsFlag: false,
    coverageDir: null,
    summaryFile: null,
    passthrough: [],
  };

  const readValue = (arg, index, name) => {
    const equalsIndex = arg.indexOf('=');

    if (equalsIndex >= 0) {
      const value = arg.slice(equalsIndex + 1).trim();
      if (value.length === 0) {
        throw new Error(`Missing value for ${name}.`);
      }

      return { value, consumedNext: false };
    }

    const next = args[index + 1];
    if (!next || next.startsWith('--')) {
      throw new Error(`Missing value for ${name}.`);
    }

    return { value: next, consumedNext: true };
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];

    if (arg === '--ci') {
      options.ci = true;
      continue;
    }

    if (arg === '--skip-tests') {
      options.skipTestsFlag = true;
      continue;
    }

    if (arg.startsWith('--coverage-dir')) {
      const { value, consumedNext } = readValue(arg, i, '--coverage-dir');
      options.coverageDir = value;
      if (consumedNext) {
        i += 1;
      }
      continue;
    }

    if (arg.startsWith('--summary-file')) {
      const { value, consumedNext } = readValue(arg, i, '--summary-file');
      options.summaryFile = value;
      if (consumedNext) {
        i += 1;
      }
      continue;
    }

    options.passthrough.push(arg);
  }

  return options;
}

async function main() {
  const args = process.argv.slice(2);

  const parseResult = (() => {
    try {
      return parseCliArgs(args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[coverage] ${message}`);
      process.exit(1);
    }
  })();

  const ciMode = parseResult.ci;
  const skipTests = ciMode || parseResult.skipTestsFlag;
  const coverageRoot = parseResult.coverageDir
    ? resolve(WORKSPACE_ROOT, parseResult.coverageDir)
    : DEFAULT_COVERAGE_ROOT;
  const summaryPath = parseResult.summaryFile
    ? resolve(WORKSPACE_ROOT, parseResult.summaryFile)
    : join(coverageRoot, 'thematic-summary.json');

  const { issues } = await validate({
    skipTests,
    enforceSummaryChecks: ciMode,
    summaryPath,
    coverageRoot,
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
