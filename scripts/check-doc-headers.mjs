#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const WORKSPACE_ROOT = dirname(SCRIPT_DIR);

const EXPECTED_HEADERS = [
  {
    file: 'docs/pragmatic-infrastructure-testing-guide.md',
    tokens: [
      'Drift History',
      'Production Impact',
      'Detection Difficulty',
      'Recommendation',
    ],
  },
  {
    file: 'docs/validation-test-decision-matrix.md',
    tokens: [
      'Drift History',
      'Production Impact',
      'Detection Difficulty',
      'Recommendation',
    ],
  },
];

const failures = [];

for (const expectation of EXPECTED_HEADERS) {
  const absolutePath = join(WORKSPACE_ROOT, expectation.file);
  let content;

  try {
    content = readFileSync(absolutePath, 'utf8');
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    failures.push(
      `${relative(WORKSPACE_ROOT, absolutePath)} could not be read (${reason}).`
    );
    continue;
  }

  if (!headerExists(content, expectation.tokens)) {
    failures.push(
      `${relative(
        WORKSPACE_ROOT,
        absolutePath
      )} is missing expected table header: ${expectation.tokens.join(' | ')}`
    );
  }
}

if (failures.length > 0) {
  console.error('[docs] Decision table validation failed:');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  console.error('[docs] Ensure markdown tables retain the canonical header strings.');
  process.exitCode = 1;
  process.exit();
}

console.log('[docs] Decision table headers verified.');

function headerExists(content, tokens) {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return true;
  }

  const pattern = buildHeaderPattern(tokens);
  return pattern.test(content);
}

function buildHeaderPattern(tokens) {
  const escapedTokens = tokens.map(escapeRegex);
  const segments = escapedTokens
    .map(token => `\\|\\s*${token}\\s*`)
    .join('');
  const expression = `^${segments}\\|\\s*$`;
  return new RegExp(expression, 'm');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
