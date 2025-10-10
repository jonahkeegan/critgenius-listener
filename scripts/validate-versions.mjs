#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const CWD = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CWD, '..');
const POLICY_PATH = join(REPO_ROOT, 'config', 'tooling-version-policy.json');
const REPORT_DIR = join(REPO_ROOT, 'artifacts');
const REPORT_PATH = join(REPORT_DIR, 'version-validation.json');

const DEFAULT_COMPARISON = 'minimum';

function createLogger(debug = false) {
  const sanitize = value => {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 180) {
        return `${trimmed.slice(0, 177)}...`;
      }
      if (/passw|secret|token/i.test(trimmed)) {
        return '[redacted]';
      }
      return trimmed;
    }
    if (Array.isArray(value)) {
      return value.slice(0, 10).map(item => sanitize(item));
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value).slice(0, 10);
      return Object.fromEntries(entries.map(([key, val]) => [key, sanitize(val)]));
    }
    return value;
  };

  const emit = (level, message, context) => {
    if (!debug && level === 'debug') {
      return;
    }
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? sanitize(context) : undefined,
    };
    const serialized = JSON.stringify(payload, null, debug ? 2 : undefined);
    if (level === 'error') {
      console.error(serialized);
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  };

  return {
    debug: (message, context) => emit('debug', message, context),
    info: (message, context) => emit('info', message, context),
    warn: (message, context) => emit('warn', message, context),
    error: (message, context) => emit('error', message, context),
  };
}

const defaultIO = {
  readFile: (path, encoding = 'utf8') => readFile(path, encoding),
  writeFile: (path, data) => writeFile(path, data),
  mkdir: (path, options) => mkdir(path, { recursive: true, ...(options ?? {}) }),
  exec: (cmd, args, options = {}) =>
    new Promise((resolveExec, rejectExec) => {
      execFile(cmd, args, { cwd: REPO_ROOT, ...options }, (error, stdout, stderr) => {
        if (error) {
          rejectExec({ error, stdout, stderr });
          return;
        }
        resolveExec({ stdout, stderr });
      });
    }),
};

function normalizePath(file) {
  return file.replace(/\\/g, '/');
}

function globToRegExp(glob) {
  const specialChars = /[.+^${}()|[\]\\]/g;
  const sanitized = glob
    .replace(specialChars, '\\$&')
    .replace(/\*\*/g, '__DOUBLE_STAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__DOUBLE_STAR__/g, '.*');
  return new RegExp(`^${sanitized}$`);
}

function fileMatches(file, pattern) {
  const normalized = normalizePath(file);
  if (pattern === '*') {
    return true;
  }
  const regex = globToRegExp(pattern.startsWith('/') ? pattern.slice(1) : pattern);
  return regex.test(normalized);
}

async function loadPolicy(io = defaultIO) {
  const raw = await io.readFile(POLICY_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.tools)) {
    throw new Error('Tooling version policy must define an array of tools.');
  }
  return parsed.tools;
}

async function getChangedFiles({ mode, baseRef }, io = defaultIO, logger = createLogger()) {
  const gitArgs = (() => {
    if (mode === 'ci') {
      const base = baseRef || process.env.GITHUB_BASE_REF || 'origin/main';
      return ['diff', '--name-only', `${base}...HEAD`];
    }
    if (mode === 'staged') {
      return ['diff', '--name-only', '--cached'];
    }
    return ['diff', '--name-only'];
  })();

  try {
    const { stdout } = await io.exec('git', gitArgs);
    return stdout
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
  } catch (err) {
    logger.warn('Failed to read git diff; defaulting to full policy validation.', {
      mode,
      gitArgs,
      error: err?.error?.message ?? err?.message,
    });
    return [];
  }
}

function selectToolsForValidation(tools, changedFiles, options = {}) {
  const { forceAll = false } = options;
  if (forceAll || changedFiles.length === 0) {
    return tools;
  }

  return tools.filter(tool => {
    const patterns = tool.detection?.fileGlobs ?? [];
    if (patterns.length === 0) {
      return false;
    }
    return changedFiles.some(file => patterns.some(pattern => fileMatches(file, pattern)));
  });
}

export function parseVersion(value) {
  if (!value) {
    return null;
  }
  const match = String(value).match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) {
    return null;
  }
  const major = Number(match[1]);
  const minor = Number(match[2] ?? '0');
  const patch = Number(match[3] ?? '0');
  return { major, minor, patch, raw: String(value) };
}

export function compareVersions(a, b) {
  const partsA = [a.major, a.minor, a.patch];
  const partsB = [b.major, b.minor, b.patch];
  for (let i = 0; i < partsA.length; i += 1) {
    if (partsA[i] > partsB[i]) return 1;
    if (partsA[i] < partsB[i]) return -1;
  }
  return 0;
}

export function evaluateComparison({ comparison, expected, actualValue }) {
  const trimmed = actualValue?.trim?.() ?? '';
  if (comparison === 'exact') {
    if (!trimmed) {
      return { ok: false, detail: 'No version value detected.' };
    }
    if (trimmed === expected) {
      return { ok: true };
    }
    if (trimmed.endsWith(`@${expected}`) || trimmed.includes(expected)) {
      return { ok: true };
    }
    return { ok: false, detail: `Expected version ${expected} but found ${trimmed}` };
  }

  const minimum = expected || '';
  const actualParsed = parseVersion(trimmed);
  const minimumParsed = parseVersion(minimum);
  if (!actualParsed || !minimumParsed) {
    return { ok: false, detail: 'Unable to parse semantic versions for comparison.' };
  }
  const result = compareVersions(actualParsed, minimumParsed);
  if (result < 0) {
    return {
      ok: false,
      detail: `Detected version ${actualParsed.major}.${actualParsed.minor}.${actualParsed.patch} is below minimum ${minimumParsed.major}.${minimumParsed.minor}.${minimumParsed.patch}`,
    };
  }
  return { ok: true };
}

async function readJsonFile(path, io = defaultIO) {
  try {
    const raw = await io.readFile(path, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to read JSON file at ${path}: ${error.message}`);
  }
}

async function readTextFile(path, io = defaultIO) {
  try {
    const raw = await io.readFile(path, 'utf8');
    return raw;
  } catch (error) {
    throw new Error(`Failed to read file at ${path}: ${error.message}`);
  }
}

function getValueAtPath(object, segments) {
  return segments.reduce((acc, segment) => (acc && acc[segment] !== undefined ? acc[segment] : undefined), object);
}

async function validateVersionSources(tool, io, logger, cache) {
  const outcomes = [];
  const issues = [];
  const sources = tool.versionSources ?? [];
  const expectedMinimum = tool.expected?.minimum || tool.expected?.version;
  for (const source of sources) {
    const filePath = join(REPO_ROOT, source.file);
    try {
      if (source.type === 'json') {
        if (!cache.json[filePath]) {
          cache.json[filePath] = await readJsonFile(filePath, io);
        }
        const jsonData = cache.json[filePath];
        const actualValue = getValueAtPath(jsonData, source.propertyPath) ?? '';
        const comparison = source.comparison || DEFAULT_COMPARISON;
        const result = evaluateComparison({
          comparison,
          expected: comparison === 'exact' ? tool.expected.version : expectedMinimum,
          actualValue: String(actualValue),
        });
        outcomes.push({
          file: source.file,
          type: source.type,
          propertyPath: source.propertyPath,
          actual: String(actualValue ?? ''),
          expected: comparison === 'exact' ? tool.expected.version : expectedMinimum,
          comparison,
          ok: result.ok,
          detail: result.detail,
        });
        if (!result.ok) {
          issues.push({
            tool: tool.id,
            file: source.file,
            detail: result.detail,
          });
        }
      } else if (source.type === 'text-includes') {
        if (!cache.text[filePath]) {
          cache.text[filePath] = await readTextFile(filePath, io);
        }
        const text = cache.text[filePath];
        const ok = text.includes(source.snippet);
        outcomes.push({
          file: source.file,
          type: source.type,
          snippet: source.snippet,
          ok,
        });
        if (!ok) {
          issues.push({
            tool: tool.id,
            file: source.file,
            detail: `Snippet not found: ${source.snippet}`,
          });
        }
      }
    } catch (error) {
      if (source.required !== false) {
        issues.push({
          tool: tool.id,
          file: source.file,
          detail: error.message,
        });
      }
      logger.debug('Version source validation encountered an error', {
        tool: tool.id,
        file: source.file,
        error: error.message,
      });
    }
  }
  return { issues, outcomes };
}

async function executeCliChecks(tool, io, logger) {
  const results = [];
  const issues = [];
  const checks = tool.cliChecks ?? [];
  if (checks.length === 0) {
    return { results, issues };
  }
  const expectedMinimum = tool.expected?.minimum || tool.expected?.version;
  for (const check of checks) {
    try {
      const [cmd, ...args] = check.command;
      const { stdout } = await io.exec(cmd, args, { shell: false });
      const output = stdout.trim();
      const result = evaluateComparison({
        comparison: check.comparison || DEFAULT_COMPARISON,
        expected: check.comparison === 'exact' ? tool.expected.version : expectedMinimum,
        actualValue: output,
      });
      results.push({
        command: check.command.join(' '),
        output,
        comparison: check.comparison || DEFAULT_COMPARISON,
        ok: result.ok,
        detail: result.detail,
      });
      if (!result.ok && check.allowFailure !== true) {
        issues.push({
          tool: tool.id,
          file: 'runtime',
          detail: result.detail ?? 'CLI check failed',
        });
      }
    } catch (error) {
      const stderr = error?.stderr?.toString?.().trim?.();
      const detail = stderr ? stderr.split('\n').slice(-3).join(' ') : error?.error?.message ?? 'Unknown CLI failure';
      if (check.allowFailure !== true) {
        issues.push({
          tool: tool.id,
          file: 'runtime',
          detail,
        });
      }
      results.push({
        command: check.command.join(' '),
        output: detail,
        comparison: check.comparison || DEFAULT_COMPARISON,
        ok: false,
        detail,
      });
      logger.debug('CLI check failed', {
        tool: tool.id,
        command: check.command.join(' '),
        detail,
      });
    }
  }
  return { results, issues };
}

function buildToolSummary(tool, versionOutcomes, cliOutcomes) {
  const issues = [...versionOutcomes.issues, ...cliOutcomes.issues];
  return {
    id: tool.id,
    displayName: tool.displayName,
    category: tool.category,
    expected: tool.expected,
    versionSources: versionOutcomes.outcomes,
    cliChecks: cliOutcomes.results,
    remediation: tool.remediation ?? [],
    status: issues.length === 0 ? 'pass' : 'fail',
    issues,
  };
}

async function validateTools(tools, io, logger) {
  const summaries = [];
  const issues = [];
  const cache = { json: {}, text: {} };

  for (const tool of tools) {
    const versionOutcomes = await validateVersionSources(tool, io, logger, cache);
    const cliOutcomes = await executeCliChecks(tool, io, logger);
    const summary = buildToolSummary(tool, versionOutcomes, cliOutcomes);
    summaries.push(summary);
    issues.push(...summary.issues);
  }

  return { summaries, issues };
}

function buildReport({ mode, changedFiles, toolsEvaluated, summaries, issues }) {
  return {
    generatedAt: new Date().toISOString(),
    mode,
    changedFiles,
    toolsEvaluated: toolsEvaluated.map(tool => tool.id),
    failures: issues,
    summaries,
  };
}

async function writeReport(report, io, logger) {
  await io.mkdir(REPORT_DIR);
  await io.writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  logger.debug('Version validation report written', { path: REPORT_PATH });
}

export async function runValidation(options = {}) {
  const {
    mode = 'staged',
    baseRef,
    forceAll = false,
    debug = false,
    io = defaultIO,
    writeArtifacts = true,
  } = options;

  const logger = createLogger(debug);
  const tools = await loadPolicy(io);
  const changedFiles = await getChangedFiles({ mode, baseRef }, io, logger);
  const selectedTools = selectToolsForValidation(tools, changedFiles, {
    forceAll,
  });

  logger.info('Version validation targeting tools', {
    mode,
    totalTools: tools.length,
    selectedTools: selectedTools.map(tool => tool.id),
    changedFiles: forceAll ? 'forced' : changedFiles,
  });

  const { summaries, issues } = await validateTools(selectedTools, io, logger);
  const report = buildReport({
    mode,
    changedFiles,
    toolsEvaluated: selectedTools,
    summaries,
    issues,
  });

  if (writeArtifacts) {
    await writeReport(report, io, logger);
  }

  return {
    report,
    hasFailures: issues.length > 0,
    issues,
  };
}

export { loadPolicy, selectToolsForValidation, getChangedFiles, validateTools };

function parseFlags(argv) {
  const flags = new Set();
  const options = {};
  const extra = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--pre-commit') {
      flags.add('pre-commit');
    } else if (arg === '--ci-mode') {
      flags.add('ci');
    } else if (arg === '--all') {
      flags.add('all');
    } else if (arg === '--debug') {
      flags.add('debug');
    } else if (arg === '--base-ref') {
      options.baseRef = argv[i + 1];
      i += 1;
    } else {
      extra.push(arg);
    }
  }
  return { flags, options, extra };
}

async function runCli() {
  const { flags, options } = parseFlags(process.argv.slice(2));
  const mode = flags.has('ci') ? 'ci' : flags.has('pre-commit') ? 'staged' : 'diff';
  const forceAll = flags.has('all');
  const debug = flags.has('debug');

  try {
    const result = await runValidation({
      mode,
      baseRef: options.baseRef,
      forceAll,
      debug,
      writeArtifacts: true,
    });

    if (result.hasFailures) {
      console.error('❌ Version mismatch detected. See artifacts/version-validation.json for details.');
      result.issues.forEach(issue => {
        console.error(` - [${issue.tool}] ${issue.file}: ${issue.detail}`);
      });
      const firstFail = result.report?.summaries?.find(summary => summary.status === 'fail');
      if (firstFail) {
        console.error('\nRemediation suggestions:');
        for (const step of firstFail.remediation ?? []) {
          console.error(` • ${step.label}: ${step.command}`);
        }
      }
      process.exitCode = 1;
    } else {
      console.log('✅ Tooling versions verified.');
    }
  } catch (error) {
    console.error('Version validation failed with an unexpected error.');
    console.error(error?.message ?? error);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}
