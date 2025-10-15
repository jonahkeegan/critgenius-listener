import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const WORKSPACE_ROOT = dirname(SCRIPT_DIR);
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
    const moduleUrl = pathToFileURL(
      join(WORKSPACE_ROOT, 'config', 'coverage.config.mjs')
    ).href;
    const coverageConfig = await import(moduleUrl);
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

async function validate({ skipTests }) {
  const issues = [];

  const manifestPath = join(WORKSPACE_ROOT, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  issues.push(...collectScriptIssues(manifest));

  if (!existsSync(TEST_FILE_PATH)) {
    issues.push('tests/infrastructure/coverage-orchestration.test.ts is missing.');
  }

  issues.push(...validateDocumentation());
  issues.push(...(await validateCoverageConfig()));
  issues.push(...(await validateSummaryGeneration()));

  if (!skipTests) {
    issues.push(...runInfrastructureTest());
  }

  return { issues };
}

async function main() {
  const skipTests = process.argv.includes('--skip-tests');
  const { issues } = await validate({ skipTests });

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
