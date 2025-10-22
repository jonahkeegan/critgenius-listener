import { beforeAll, describe, expect, it } from 'vitest';
import { ESLint } from 'eslint';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..');
const packagesRoot = path.join(root, 'packages');

const PACKAGE_NAMES = ['client', 'server', 'shared', 'test-utils'] as const;

const CONFIG_FILENAMES = new Set([
  'eslint.config.js',
  'eslint.config.cjs',
  'eslint.config.mjs',
  'eslint.config.ts',
  '.eslintrc',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.mjs',
  '.eslintrc.json',
  '.eslintrc.yaml',
  '.eslintrc.yml',
]);

const CONFIG_BASENAME_PREFIXES = ['.eslintrc'];

const LINT_TIMEOUT_MS = 120_000;

let sharedEslint: ESLint;

const findPackageConfigFiles = (startDir: string): string[] => {
  const queue = [startDir];
  const matches: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Skip nested node_modules to avoid unnecessary traversal.
        if (entry.name === 'node_modules') {
          continue;
        }
        queue.push(path.join(current, entry.name));
        continue;
      }

      const candidate = entry.name;
      if (CONFIG_FILENAMES.has(candidate)) {
        matches.push(path.join(current, candidate));
        continue;
      }

      // Protect against variations like .eslintrc.custom.json
      for (const prefix of CONFIG_BASENAME_PREFIXES) {
        if (candidate.startsWith(prefix)) {
          matches.push(path.join(current, candidate));
          break;
        }
      }
    }
  }

  return matches.sort();
};

const lintPackageSources = async (
  packageName: (typeof PACKAGE_NAMES)[number]
) => {
  const target = path.join('packages', packageName, 'src');
  const results = await sharedEslint.lintFiles([target]);

  const fileCount = results.length;
  const errorCount = results.reduce((sum, item) => sum + item.errorCount, 0);
  const warningCount = results.reduce(
    (sum, item) => sum + item.warningCount,
    0
  );

  return { errorCount, warningCount, fileCount };
};

const expectPathIgnoredState = async (filePath: string, expected: boolean) => {
  const isIgnored = await sharedEslint.isPathIgnored(filePath);
  if (isIgnored !== expected) {
    throw new Error(
      `Expected ${path.relative(root, filePath)} to be ${expected ? '' : 'not '}ignored`
    );
  }
};

describe('ESLint package configuration verification', () => {
  beforeAll(async () => {
    sharedEslint = new ESLint({
      cwd: root,
      errorOnUnmatchedPattern: false,
      overrideConfig: {
        ignores: ['**/__eslint-fixtures__/**'],
      },
    });
  });

  it('relies exclusively on the root flat config across packages', () => {
    const configs = findPackageConfigFiles(packagesRoot);
    expect(configs).toEqual([]);
  });

  it(
    'successfully lints each package source tree with zero warnings',
    async () => {
      const packagesWithCounts: Array<{
        name: (typeof PACKAGE_NAMES)[number];
        fileCount: number;
        errorCount: number;
        warningCount: number;
      }> = [];

      for (const packageName of PACKAGE_NAMES) {
        const { errorCount, warningCount, fileCount } =
          await lintPackageSources(packageName);

        expect(fileCount).toBeGreaterThan(0);
        expect(errorCount).toBe(0);
        expect(warningCount).toBe(0);

        packagesWithCounts.push({
          name: packageName,
          fileCount,
          errorCount,
          warningCount,
        });
      }

      // Sanity check to ensure we assessed the expected packages.
      expect(packagesWithCounts.map(({ name }) => name).sort()).toEqual(
        [...PACKAGE_NAMES].sort()
      );
    },
    LINT_TIMEOUT_MS
  );

  it('applies ignore patterns without skipping primary source files', async () => {
    await expectPathIgnoredState(
      path.join(root, 'packages', 'client', 'src', 'App.tsx'),
      false
    );
    await expectPathIgnoredState(
      path.join(root, 'packages', 'server', 'src', 'index.ts'),
      false
    );
    await expectPathIgnoredState(
      path.join(root, 'packages', 'shared', 'src', 'version.ts'),
      false
    );
    await expectPathIgnoredState(
      path.join(root, 'packages', 'test-utils', 'src', 'index.ts'),
      false
    );

    await expectPathIgnoredState(
      path.join(root, 'packages', 'shared', 'src', 'version.test.ts'),
      true
    );
    await expectPathIgnoredState(
      path.join(root, 'packages', 'client', 'dist', 'bundle.js'),
      true
    );
    await expectPathIgnoredState(
      path.join(root, 'coverage', 'lcov.info'),
      true
    );
    await expectPathIgnoredState(path.join(root, 'pnpm-lock.yaml'), true);
    await expectPathIgnoredState(
      path.join(root, 'packages', 'shared', 'src', 'index.d.ts'),
      true
    );
  });
});
