import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, dirname, relative, sep } from 'node:path';
import { readdir, stat, rm, mkdir } from 'node:fs/promises';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const PACKAGE_CONFIG = [
  {
    name: '@critgenius/client',
    root: resolve(workspaceRoot, 'packages/client'),
    requiredTestDirs: ['tests/integration', 'tests/fixtures', 'tests/helpers', 'tests/e2e'],
  },
  {
    name: '@critgenius/server',
    root: resolve(workspaceRoot, 'packages/server'),
    requiredTestDirs: ['tests/integration', 'tests/fixtures', 'tests/helpers'],
  },
  {
    name: '@critgenius/shared',
    root: resolve(workspaceRoot, 'packages/shared'),
    requiredTestDirs: ['tests/integration', 'tests/fixtures', 'tests/helpers'],
  },
];

function pathSegments(value) {
  return value.split(/[\\/]+/u);
}

const SKIP_DIRECTORIES = new Set(['node_modules', 'dist', 'build', 'coverage', '.turbo', '.cache']);

function isEnoent(error) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT');
}

async function walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (isEnoent(error)) {
      return [];
    }
    throw error;
  }
  const results = [];

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (SKIP_DIRECTORIES.has(entry.name)) continue;
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      try {
        results.push(...(await walk(entryPath)));
      } catch (error) {
        if (isEnoent(error)) {
          continue;
        }
        throw error;
      }
      continue;
    }
    results.push(entryPath);
  }

  return results;
}

function isIntegrationTest(filePath) {
  return /\.integration\.test\.[tj]sx?$/u.test(filePath);
}

function isE2eTest(filePath) {
  return /\.e2e\.test\.[tj]sx?$/u.test(filePath);
}

function isUnitTest(filePath) {
  return /\.test\.[tj]sx?$/u.test(filePath) && !isIntegrationTest(filePath) && !isE2eTest(filePath);
}

function isSpecPattern(filePath) {
  return /\.spec\.[tj]sx?$/u.test(filePath);
}

function isSpecTestPattern(filePath) {
  return /\.spec\.test\.[tj]sx?$/u.test(filePath);
}

function ensureRelativeToWorkspace(filePath) {
  // Defensive coding: some file traversal APIs may yield paths containing null bytes (\u0000).
  // Only use the segment before the first null byte to avoid unexpected truncation issues downstream.
  return relative(workspaceRoot, filePath).split('\u0000')[0];
}

async function ensureDirectoriesExist({ fix }) {
  const issues = [];

  for (const pkg of PACKAGE_CONFIG) {
    for (const dir of pkg.requiredTestDirs) {
      const absolute = resolve(pkg.root, dir);
      try {
        const stats = await stat(absolute);
        if (!stats.isDirectory()) {
          issues.push({
            type: 'structure',
            message: `Expected directory ${dir} for ${pkg.name} to be a folder`,
            file: ensureRelativeToWorkspace(absolute),
          });
        }
      } catch (error) {
        issues.push({
          type: 'structure',
          message: `Missing directory ${dir} for ${pkg.name}`,
          file: ensureRelativeToWorkspace(absolute),
        });
        if (fix) {
          await mkdir(absolute, { recursive: true });
        }
      }
    }
  }

  return issues;
}

function validateNaming({ filePath, relativePath }) {
  const messages = [];
  const normalized = relativePath.split(sep).join('/');

  if (isSpecTestPattern(normalized)) {
    messages.push({
      type: 'naming',
      message: 'Deprecated pattern *.spec.test detected',
      file: normalized,
      fixable: true,
    });
    return messages;
  }

  if (isSpecPattern(normalized) && !isE2eTest(normalized)) {
    messages.push({
      type: 'naming',
      message: 'Deprecated pattern *.spec detected',
      file: normalized,
      fixable: true,
    });
  }

  if (isIntegrationTest(normalized) && !normalized.includes('/tests/integration/')) {
    messages.push({
      type: 'naming',
      message: 'Integration tests must live under tests/integration/',
      file: normalized,
      fixable: true,
    });
  }

  if (isE2eTest(normalized) && !normalized.includes('/tests/e2e/')) {
    messages.push({
      type: 'naming',
      message: 'E2E tests must live under tests/e2e/',
      file: normalized,
      fixable: true,
    });
  }

  if (isUnitTest(normalized) && normalized.includes('/tests/')) {
    const segments = pathSegments(normalized);
    if (!segments.includes('__tests__')) {
      messages.push({
        type: 'naming',
        message: 'Unit tests under tests/ should be categorized (integration/helpers/fixtures)',
        file: normalized,
      });
    }
  }

  return messages;
}

async function collectFileIssues({ fix }) {
  const issues = [];
  const rootsToScan = [resolve(workspaceRoot, 'packages'), resolve(workspaceRoot, 'tests')];

  for (const root of rootsToScan) {
    const files = await walk(root);
    for (const absolute of files) {
      if (!/\.(test|spec)\.[tj]sx?$/u.test(absolute)) continue;
      const relativePath = ensureRelativeToWorkspace(absolute);
      const violations = validateNaming({ filePath: absolute, relativePath });
      issues.push(...violations);

      for (const violation of violations) {
        if (fix && violation.fixable) {
          await rm(absolute, { force: true });
        }
      }
    }
  }

  return issues;
}

export async function collectTestingStandardsIssues(options = {}) {
  const fix = Boolean(options.fix);
  const structureIssues = await ensureDirectoriesExist({ fix });
  const fileIssues = await collectFileIssues({ fix });

  return {
    issues: [...structureIssues, ...fileIssues],
  };
}

export async function validateTestingStandards(options = {}) {
  const { issues } = await collectTestingStandardsIssues(options);
  if (!issues.length) {
    return { issues };
  }

  if (options.throwOnIssue === false) {
    return { issues };
  }

  const message = issues
    .map(issue => `• [${issue.type}] ${issue.file ?? 'unknown'} → ${issue.message}`)
    .join('\n');
  throw new Error(`Testing standards validation failed:\n${message}`);
}

async function runCli() {
  const fix = process.argv.includes('--fix');
  const throwOnIssue = !process.argv.includes('--no-strict');
  const result = await collectTestingStandardsIssues({ fix });

  if (result.issues.length) {
    for (const issue of result.issues) {
      console.error(`• [${issue.type}] ${issue.file ?? 'unknown'} → ${issue.message}`);
    }
    if (throwOnIssue) {
      process.exitCode = fix ? 0 : 1;
    }
    return;
  }

  console.log('✅ Testing standards look good');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
