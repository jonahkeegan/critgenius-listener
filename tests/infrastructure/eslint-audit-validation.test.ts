import { beforeAll, describe, it, expect } from 'vitest';
import { ESLint } from 'eslint';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

type LintResult = ESLint.LintResult;

const root = path.resolve(__dirname, '..', '..');
const fixtureDirectory = path.join(root, 'tests', 'eslint', '__fixtures__');

const isSlowRunner =
  process.platform === 'win32' ||
  process.env.CI === 'true' ||
  process.env.VITEST_SLOW_RUNNER === 'true';

const ESLINT_TIMEOUT_MS = isSlowRunner ? 60000 : 20000;

let sharedEslint: ESLint;

const TEMP_FIXTURE_FOLDER = '__eslint-fixtures__';

const lintFixture = async (
  fixtureName: string,
  options?: { relativeTarget?: string }
): Promise<LintResult> => {
  const absoluteFixturePath = path.join(fixtureDirectory, fixtureName);
  const fixtureContent = fs.readFileSync(absoluteFixturePath, 'utf8');

  if (!options?.relativeTarget) {
    const [result] = await sharedEslint.lintText(fixtureContent, {
      filePath: absoluteFixturePath,
    });

    if (!result) {
      throw new Error(`ESLint did not return a result for ${fixtureName}`);
    }

    return result;
  }

  const relativeTarget = options.relativeTarget;
  const targetDirName = path.dirname(relativeTarget);
  const fileName = path.basename(relativeTarget);

  const targetIsInTempFixtureFolder =
    path.basename(targetDirName) === TEMP_FIXTURE_FOLDER;

  // Create a unique temp folder for each lint invocation so concurrent Vitest
  // projects do not race while writing disposable ESLint fixtures.
  const uniqueSegment = `${TEMP_FIXTURE_FOLDER}-${process.pid}-${randomUUID()}`;

  const uniqueRelativeDir = targetIsInTempFixtureFolder
    ? path.join(targetDirName, uniqueSegment)
    : targetDirName;

  const baseTempDir = targetIsInTempFixtureFolder
    ? path.join(root, targetDirName)
    : null;

  const uniqueTargetRelativePath = path.join(uniqueRelativeDir, fileName);

  const absoluteTarget = path.join(root, uniqueTargetRelativePath);
  const targetDir = path.dirname(absoluteTarget);

  fs.mkdirSync(targetDir, { recursive: true });
  fs.writeFileSync(absoluteTarget, fixtureContent, 'utf8');

  try {
    const [result] = await sharedEslint.lintFiles([absoluteTarget]);

    if (!result) {
      throw new Error(`ESLint did not return a result for ${relativeTarget}`);
    }

    return result;
  } finally {
    fs.rmSync(absoluteTarget, { recursive: true, force: true });

    if (targetIsInTempFixtureFolder) {
      const uniqueDir = path.dirname(absoluteTarget);
      if (fs.existsSync(uniqueDir)) {
        fs.rmSync(uniqueDir, { recursive: true, force: true });
      }

      if (baseTempDir && fs.existsSync(baseTempDir)) {
        const remaining = fs.readdirSync(baseTempDir);
        if (remaining.length === 0) {
          fs.rmSync(baseTempDir, { recursive: true, force: true });
        }
      }
    } else if (
      path.basename(targetDir) === TEMP_FIXTURE_FOLDER &&
      fs.existsSync(targetDir) &&
      fs.readdirSync(targetDir).length === 0
    ) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
  }
};

const getRuleMessages = (result: LintResult, ruleId: string) =>
  result.messages.filter(message => message.ruleId === ruleId);

const hasRule = (result: LintResult, ruleId: string) =>
  result.messages.some(message => message.ruleId === ruleId);

describe('ESLint audit validation', () => {
  beforeAll(async () => {
    sharedEslint = new ESLint({ cwd: root });
  }, ESLINT_TIMEOUT_MS);

  it('tracks the curated fixture library', () => {
    const fixtures = fs
      .readdirSync(fixtureDirectory)
      .filter(name => name.endsWith('.ts') || name.endsWith('.tsx'))
      .sort();

    expect(fixtures).toEqual([
      'a11y-invalid.tsx',
      'a11y-valid.tsx',
      'react-invalid.tsx',
      'server-patterns.ts',
      'test-relaxations.test.ts',
      'typescript-invalid.ts',
      'valid-examples.tsx',
    ]);
  });

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
    'enforces TypeScript safety rules with correct severities',
    async () => {
      const result = await lintFixture('typescript-invalid.ts');

      const unusedVars = getRuleMessages(
        result,
        '@typescript-eslint/no-unused-vars'
      );
      expect(unusedVars.length).toBeGreaterThan(0);
      expect(unusedVars.every(message => message.severity === 2)).toBe(true);

      const anyMessages = getRuleMessages(
        result,
        '@typescript-eslint/no-explicit-any'
      );
      expect(anyMessages.length).toBeGreaterThan(0);
      expect(anyMessages.every(message => message.severity === 1)).toBe(true);

      const unsafeRules = [
        '@typescript-eslint/no-unsafe-assignment',
        '@typescript-eslint/no-unsafe-call',
        '@typescript-eslint/no-unsafe-member-access',
        '@typescript-eslint/no-unsafe-argument',
        '@typescript-eslint/no-unsafe-return',
      ];

      for (const rule of unsafeRules) {
        const ruleMessages = getRuleMessages(result, rule);
        expect(ruleMessages.length).toBeGreaterThan(0);
        expect(ruleMessages.every(message => message.severity === 1)).toBe(
          true
        );
      }

      expect(
        hasRule(result, '@typescript-eslint/explicit-function-return-type')
      ).toBe(false);
    },
    ESLINT_TIMEOUT_MS
  );

  it(
    'validates React and hooks guidance while keeping JSX scope relaxed',
    async () => {
      const result = await lintFixture('react-invalid.tsx', {
        relativeTarget: path.join(
          'packages',
          'client',
          'src',
          'components',
          TEMP_FIXTURE_FOLDER,
          'react-invalid.tsx'
        ),
      });

      const jsxKeyMessages = getRuleMessages(result, 'react/jsx-key');
      expect(jsxKeyMessages.length).toBeGreaterThan(0);
      expect(jsxKeyMessages.every(message => message.severity === 2)).toBe(
        true
      );

      const hooksRules = getRuleMessages(result, 'react-hooks/rules-of-hooks');
      expect(hooksRules.length).toBeGreaterThan(0);
      expect(hooksRules.every(message => message.severity === 2)).toBe(true);

      const exhaustiveDeps = getRuleMessages(
        result,
        'react-hooks/exhaustive-deps'
      );
      expect(exhaustiveDeps.length).toBeGreaterThan(0);
      expect(exhaustiveDeps.every(message => message.severity === 1)).toBe(
        true
      );

      expect(hasRule(result, 'react/react-in-jsx-scope')).toBe(false);
      expect(hasRule(result, 'react/prop-types')).toBe(false);
    },
    ESLINT_TIMEOUT_MS
  );

  it(
    'enforces strengthened accessibility rules for component paths',
    async () => {
      const result = await lintFixture('a11y-invalid.tsx', {
        relativeTarget: path.join(
          'packages',
          'client',
          'src',
          'components',
          TEMP_FIXTURE_FOLDER,
          'a11y-fixture.tsx'
        ),
      });

      const altText = getRuleMessages(result, 'jsx-a11y/alt-text');
      expect(altText.length).toBeGreaterThan(0);
      expect(altText.every(message => message.severity === 2)).toBe(true);

      const noAutofocus = getRuleMessages(result, 'jsx-a11y/no-autofocus');
      expect(noAutofocus.length).toBeGreaterThan(0);
      expect(noAutofocus.every(message => message.severity === 2)).toBe(true);

      const focusRules = [
        'jsx-a11y/interactive-supports-focus',
        'jsx-a11y/click-events-have-key-events',
      ];

      for (const rule of focusRules) {
        const ruleMessages = getRuleMessages(result, rule);
        expect(ruleMessages.length).toBeGreaterThan(0);
        expect(ruleMessages.every(message => message.severity === 2)).toBe(
          true
        );
      }

      expect(hasRule(result, 'jsx-a11y/media-has-caption')).toBe(false);
    },
    ESLINT_TIMEOUT_MS
  );

  it(
    'relaxes unsafe TypeScript checks inside test globs',
    async () => {
      const result = await lintFixture('test-relaxations.test.ts', {
        relativeTarget: path.join(
          'packages',
          'server',
          'src',
          TEMP_FIXTURE_FOLDER,
          'fixture-relaxations.test.ts'
        ),
      });

      const disabledRules = [
        '@typescript-eslint/no-explicit-any',
        '@typescript-eslint/no-unsafe-assignment',
        '@typescript-eslint/no-unsafe-member-access',
        '@typescript-eslint/no-unsafe-call',
        '@typescript-eslint/no-unsafe-return',
      ];

      for (const rule of disabledRules) {
        expect(hasRule(result, rule)).toBe(false);
      }

      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
    },
    ESLINT_TIMEOUT_MS
  );

  it(
    'honors server overrides for console usage while keeping perf nudges as warnings',
    async () => {
      const result = await lintFixture('server-patterns.ts', {
        relativeTarget: path.join(
          'packages',
          'server',
          'src',
          TEMP_FIXTURE_FOLDER,
          'server-patterns.ts'
        ),
      });

      expect(hasRule(result, 'no-console')).toBe(false);

      const awaitMessages = getRuleMessages(result, 'no-await-in-loop');
      expect(awaitMessages.length).toBeGreaterThan(0);
      expect(awaitMessages.every(message => message.severity === 1)).toBe(true);

      const spreadWarnings = getRuleMessages(result, 'prefer-spread');
      expect(spreadWarnings.length).toBeGreaterThan(0);
      expect(spreadWarnings.every(message => message.severity === 1)).toBe(
        true
      );
    },
    ESLINT_TIMEOUT_MS
  );

  it(
    'accepts the valid fixture set without emitting warnings',
    async () => {
      const result = await lintFixture('valid-examples.tsx', {
        relativeTarget: path.join(
          'packages',
          'client',
          'src',
          'components',
          TEMP_FIXTURE_FOLDER,
          'valid-examples.tsx'
        ),
      });

      expect(result.errorCount).toBe(0);
      expect(result.warningCount).toBe(0);
      expect(result.messages.length).toBe(0);
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
