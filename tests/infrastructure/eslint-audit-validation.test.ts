import { beforeAll, describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..');

const isSlowRunner =
  process.platform === 'win32' ||
  process.env.CI === 'true' ||
  process.env.VITEST_SLOW_RUNNER === 'true';

const ESLINT_TIMEOUT_MS = isSlowRunner ? 60000 : 20000;

let sharedEslint: ESLint;

const loadFixture = (fileName: string) =>
  fs.readFileSync(
    path.join(root, 'tests', 'eslint', '__fixtures__', fileName),
    'utf8'
  );

describe('ESLint audit validation', () => {
  beforeAll(async () => {
    sharedEslint = new ESLint({ cwd: root });
  }, ESLINT_TIMEOUT_MS);

  it('has required plugins installed in devDependencies', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'utf8')
    );
    const dev = pkg.devDependencies || {};
    expect(dev['eslint']).toBeDefined();
    expect(dev['@eslint/js']).toBeDefined();
    expect(dev['typescript-eslint']).toBeDefined();
    expect(dev['eslint-plugin-react']).toBeDefined();
    expect(dev['eslint-plugin-react-hooks']).toBeDefined();
    expect(dev['eslint-plugin-jsx-a11y']).toBeDefined();
    expect(dev['eslint-config-prettier']).toBeDefined();
  });

  it('root scripts include lint:ci and package lint scripts exist', () => {
    const rootPkg = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'utf8')
    );
    expect(rootPkg.scripts['lint:ci']).toBeDefined();

    const packages = ['client', 'server', 'shared', 'test-utils'];
    for (const name of packages) {
      const pkgPath = path.join(root, 'packages', name, 'package.json');
      const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      expect(pkgJson.scripts['lint']).toBeDefined();
      expect(pkgJson.scripts['lint:fix']).toBeDefined();
    }
  });

  it(
    'eslint flat config exposes expected a11y/ts/react rules',
    async () => {
      const fixturePath = path.join(
        root,
        'tests',
        'eslint',
        '__fixtures__',
        'a11y-invalid.tsx'
      );
      const [result] = await sharedEslint.lintText(
        loadFixture('a11y-invalid.tsx'),
        {
          filePath: fixturePath,
        }
      );

      const ruleIds = new Set(
        (result?.messages || [])
          .map(message => message.ruleId)
          .filter((rule): rule is string => Boolean(rule))
      );

      expect(ruleIds.has('jsx-a11y/alt-text')).toBe(true);
      expect(ruleIds.has('jsx-a11y/no-autofocus')).toBe(true);
      const interactionRules = [
        'jsx-a11y/click-events-have-key-events',
        'jsx-a11y/interactive-supports-focus',
      ];
      expect(interactionRules.some(rule => ruleIds.has(rule))).toBe(true);
    },
    ESLINT_TIMEOUT_MS
  );

  it(
    'server overrides allow console and warn on await in loop',
    async () => {
      const serverSnippet = `
        async function run(ids: number[]) {
          for (const id of ids) {
            await Promise.resolve(id);
          }
          console.log('ok');
        }

        void run([1, 2, 3]);
      `;
      const serverFilePath = path.join(
        root,
        'packages',
        'server',
        'src',
        'index.ts'
      );
      const [result] = await sharedEslint.lintText(serverSnippet, {
        filePath: serverFilePath,
      });

      const ruleIds = (result?.messages || [])
        .map(message => message.ruleId)
        .filter((rule): rule is string => Boolean(rule));

      expect(ruleIds.includes('no-console')).toBe(false);
      expect(ruleIds.includes('no-await-in-loop')).toBe(true);
    },
    ESLINT_TIMEOUT_MS
  );

  it('lint-ci script enforces zero warnings', () => {
    const lintCiScript = fs.readFileSync(
      path.join(root, 'scripts', 'lint-ci.mjs'),
      'utf8'
    );
    // Expect exit on warnings or errors (allow any spacing / condition grouping)
    expect(lintCiScript).toMatch(/warningCount\s*>\s*0/);
    expect(lintCiScript).toMatch(/errorCount\s*>\s*0/);
    expect(lintCiScript).toMatch(/process\.exit\(1\)/);
  });
});
