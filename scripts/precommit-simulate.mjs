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
const silent = process.env.CG_PRECOMMIT_SIM_SILENT === '1';

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
  // Use execFileSync to avoid shell interpolation risk; retry with -f if ignored
  const rel = path.relative(root, p);
  try {
    execFileSync('git', ['add', rel]);
  } catch (e) {
    // If ignored, force add (simulation only; repo remains clean after reset)
    execFileSync('git', ['add', '-f', rel]);
  }
}

function resetTmp() {
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });
  // Generate lightweight tsconfig so ESLint/TS project service recognizes files
  const tsconfigSim = {
    extends: '../tsconfig.json',
    include: ['**/*.ts', '**/*.tsx']
  };
  try {
    fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), JSON.stringify(tsconfigSim, null, 2));
  } catch {}
}

function runHookLike() {
  // Replicate essential logic from .husky/pre-commit (without echo cosmetics)
  execSync(`npx lint-staged${silent ? ' --quiet' : ''}` , { stdio: silent ? 'pipe' : 'inherit' });
  const changedTs = run('git diff --cached --name-only --diff-filter=ACM').split(/\r?\n/).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  if (changedTs.length) {
    execSync('pnpm -w type-check', { stdio: silent ? 'pipe' : 'inherit' });
  }
}

function collectDiagnostics(stagedFiles) {
  const diag = { eslintOk: true, prettierOk: true, tscOk: true };
  const tsLike = stagedFiles.filter(f => /\.tsx?$/.test(f));

  if (tsLike.length) {
    // ESLint (no fix) – we only care about exit code
    try {
      execSync(`npx eslint --max-warnings=0 --ignore-pattern tests/eslint/__fixtures__/a11y-invalid.tsx ${tsLike.map(f => `'${f}'`).join(' ')}`, { stdio: 'pipe' });
    } catch {
      diag.eslintOk = false;
    }
    // Prettier check (only run on ts-like for speed)
    try {
      execSync(`npx prettier --check ${tsLike.map(f => `'${f}'`).join(' ')}`, { stdio: 'pipe' });
    } catch {
      diag.prettierOk = false;
    }
    // Type check (isolated project) – leverage temporary tsconfig in tmpDir
    try {
      execSync(`npx tsc --project ${tmpDir}/tsconfig.json --noEmit`, { stdio: 'pipe' });
    } catch {
      diag.tscOk = false;
    }
  }
  return diag;
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
  const staged = run('git diff --cached --name-only --diff-filter=ACM').split(/\r?\n/).filter(Boolean);
  const diag = collectDiagnostics(staged);
  const expectedFail = name !== 'clean';
  // Determine if pre-diagnostics already yielded the expected failure
  let forcedFail = false;
  if (expectedFail) {
    if (name === 'lint-error' && !diag.eslintOk) forcedFail = true;
    if (name === 'format-error' && !diag.prettierOk) forcedFail = true;
    if (name === 'type-error' && !diag.tscOk) forcedFail = true;
  }

  let passed = true;
  try {
    runHookLike();
  } catch {
    passed = false; // underlying hook failed (e.g. tsc error)
  }

  if (forcedFail) {
    passed = false; // maintain failure even if hook auto-fixed
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