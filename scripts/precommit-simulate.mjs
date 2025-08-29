#!/usr/bin/env node
/**
 * Pre-commit workflow simulation & scenario tester.
 * Generates temporary working copies of files to simulate staged changes and invokes
 * the same logic (lint + format + conditional type-check) without creating commits.
 *
 * Scenarios covered:
 *  - clean: All passes
 *  - lint-error: Introduce an ESLint error
 *  - format-error: Introduce formatting deviation
 *  - type-error: Introduce a TypeScript type error
 *
 * Usage:
 *   node scripts/precommit-simulate.mjs [scenario]
 * If no scenario passed, all scenarios are executed.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';

const root = process.cwd();
const tmpDir = path.join(root, '.precommit-sim');

const scenarios = /** @type {Record<string, {desc:string, mutate:()=>void}>} */ ({
  clean: {
    desc: 'All passing changes',
    mutate: () => {
      const file = path.join(tmpDir, 'clean-sample.ts');
      fs.writeFileSync(file, 'export const add = (a: number, b: number) => a + b;\n');
    },
  },
  'lint-error': {
    desc: 'ESLint violation (unused variable)',
    mutate: () => {
      const file = path.join(tmpDir, 'lint-error.ts');
      fs.writeFileSync(file, 'const unused = 42;\nexport const ok = 1;\n');
    },
  },
  'format-error': {
    desc: 'Formatting inconsistency (double quotes, no semicolon maybe tolerated)',
    mutate: () => {
      const file = path.join(tmpDir, 'format-error.ts');
      fs.writeFileSync(file, 'export const msg = "hi"\n');
    },
  },
  'type-error': {
    desc: 'TypeScript type mismatch',
    mutate: () => {
      const file = path.join(tmpDir, 'type-error.ts');
  // Deliberate genuine type error (no 'as any' escape hatch)
  fs.writeFileSync(file, 'export const broken: number = "string";\n');
    },
  },
});

const run = (cmd) => execSync(cmd, { stdio: 'pipe' }).toString();

function stageFile(p) {
  // Use execFileSync to avoid shell interpolation risk
  execFileSync('git', ['add', path.relative(root, p)]);
}

function resetTmp() {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });
}

function runHookLike() {
  // Replicate essential logic from .husky/pre-commit (without echo cosmetics)
  execSync('npx lint-staged', { stdio: 'inherit' });
  const changedTs = run('git diff --cached --name-only --diff-filter=ACM').split(/\r?\n/).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  if (changedTs.length) {
    execSync('pnpm -w type-check', { stdio: 'inherit' });
  }
}

function simulate(name) {
  const scenario = scenarios[name];
  if (!scenario) {
    console.error(`Unknown scenario: ${name}`);
    process.exit(2);
  }
  console.log(`\n▶ Scenario: ${name} – ${scenario.desc}`);
  resetTmp();
  scenario.mutate();
  // Stage created files
  for (const f of fs.readdirSync(tmpDir)) {
    stageFile(path.join(tmpDir, f));
  }
  let passed = true;
  try {
    runHookLike();
  } catch (e) {
    passed = false;
  }
  // Unstage tmp changes to leave repo clean
  execSync('git reset HEAD .');
  console.log(passed ? `✅ Scenario '${name}' passed` : `❌ Scenario '${name}' failed (expected depending on case)`);
  return passed;
}

const arg = process.argv[2];
if (arg) {
  const success = simulate(arg);
  if (!success && arg === 'clean') process.exit(1);
  process.exit(0);
}

let overall = true;
for (const name of Object.keys(scenarios)) {
  const expectedFail = name !== 'clean';
  const result = simulate(name);
  if (expectedFail && result) {
    console.error(`⚠ Expected failure for scenario '${name}' but it passed.`);
    overall = false;
  }
  if (!expectedFail && !result) {
    console.error(`⚠ Expected pass for scenario '${name}' but it failed.`);
    overall = false;
  }
}

resetTmp();
if (!overall) {
  console.error('❌ One or more scenario expectations not met.');
  process.exit(1);
}
console.log('\n🎉 All scenario expectations met.');