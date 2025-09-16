#!/usr/bin/env node
/**
 * Pre-commit workflow simulation & scenario tester (secure variant).
 * Restores original working logic while replacing dynamically interpolated shell
 * commands with argument-array execFileSync where user-controlled input was present.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync, execFileSync } from 'node:child_process';

const root = process.cwd();
const tmpDir = path.join(root, '.precommit-sim');
const silent = process.env.CG_PRECOMMIT_SIM_SILENT === '1';

const scenarios = /** @type {Record<string, {desc:string, mutate:()=>void}>} */ ({
  clean: { desc: 'All passing changes', mutate: () => fs.writeFileSync(path.join(tmpDir, 'clean-sample.ts'), 'export const add = (a: number, b: number) => a + b;\n') },
  'lint-error': { desc: 'ESLint violation (unused variable)', mutate: () => fs.writeFileSync(path.join(tmpDir, 'lint-error.ts'), 'const unused = 42;\nexport const ok = 1;\n') },
  'format-error': { desc: 'Formatting inconsistency', mutate: () => fs.writeFileSync(path.join(tmpDir, 'format-error.ts'), 'export const msg = "hi"\n') },
  'type-error': { desc: 'Type mismatch', mutate: () => fs.writeFileSync(path.join(tmpDir, 'type-error.ts'), 'export const broken: number = "string";\n') },
});

function runGit(args) { return execFileSync('git', args, { stdio: 'pipe' }).toString(); }
function stageFile(p) {
  const rel = path.relative(root, p);
  try { execFileSync('git', ['add', rel]); } catch { execFileSync('git', ['add', '-f', rel]); }
}
function resetTmp() {
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });
  const tsconfigSim = { extends: '../tsconfig.json', include: ['**/*.ts', '**/*.tsx'] };
  fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), JSON.stringify(tsconfigSim, null, 2));
}

function runHookLike() {
  // Safe: static command string with optional quiet flag only.
  execSync(`npx lint-staged${silent ? ' --quiet' : ''}`, { stdio: silent ? 'pipe' : 'inherit' });
  const changedTs = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACM']).split(/\r?\n/).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));
  if (changedTs.length) execSync('pnpm -w type-check', { stdio: silent ? 'pipe' : 'inherit' });
}

function collectDiagnostics(stagedFiles) {
  const diag = { eslintOk: true, prettierOk: true, tscOk: true };
  const tsLike = stagedFiles.filter(f => /\.tsx?$/.test(f));
  const binDir = path.join(root, 'node_modules', '.bin');
  const resolve = (b) => path.join(binDir, b + (process.platform === 'win32' ? '.cmd' : ''));
  if (tsLike.length) {
    try { execFileSync(resolve('eslint'), ['--max-warnings=0', '--ignore-pattern', 'tests/eslint/__fixtures__/a11y-invalid.tsx', ...tsLike], { stdio: 'pipe' }); } catch { diag.eslintOk = false; }
    try { execFileSync(resolve('prettier'), ['--check', ...tsLike], { stdio: 'pipe' }); } catch { diag.prettierOk = false; }
    try { execFileSync(resolve('tsc'), ['--project', path.join(tmpDir, 'tsconfig.json'), '--noEmit'], { stdio: 'pipe' }); } catch { diag.tscOk = false; }
  }
  return diag;
}

function simulate(name) {
  const scenario = scenarios[name];
  if (!scenario) { console.error(`Unknown scenario: ${name}`); process.exit(2); }
  console.log(`\n▶ Scenario: ${name} – ${scenario.desc}`);
  resetTmp();
  scenario.mutate();
  for (const f of fs.readdirSync(tmpDir)) stageFile(path.join(tmpDir, f));
  const staged = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACM']).split(/\r?\n/).filter(Boolean);
  const diag = collectDiagnostics(staged);
  const expectedFail = name !== 'clean';
  let forcedFail = false;
  if (expectedFail) {
    if (name === 'lint-error' && !diag.eslintOk) forcedFail = true;
    if (name === 'format-error' && !diag.prettierOk) forcedFail = true;
    if (name === 'type-error' && !diag.tscOk) forcedFail = true;
  }
  let passed = true;
  try { runHookLike(); } catch { passed = false; }
  if (forcedFail) passed = false;
  execFileSync('git', ['reset', 'HEAD', '.']);
  console.log(passed ? `✅ Scenario '${name}' passed` : `❌ Scenario '${name}' failed (expected depending on case)`);
  return passed;
}

const arg = process.argv[2];
if (arg) { const ok = simulate(arg); if (!ok && arg === 'clean') process.exit(1); process.exit(0); }

let overall = true;
for (const name of Object.keys(scenarios)) {
  const expectFail = name !== 'clean';
  const res = simulate(name);
  if (expectFail && res) { console.error(`⚠ Expected failure for scenario '${name}' but it passed.`); overall = false; }
  if (!expectFail && !res) { console.error(`⚠ Expected pass for scenario '${name}' but it failed.`); overall = false; }
}
resetTmp();
if (!overall) { console.error('❌ One or more scenario expectations not met.'); process.exit(1); }
console.log('\n🎉 All scenario expectations met.');