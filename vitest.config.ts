import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, URL as NodeURL } from 'node:url';
import type { UserConfig } from 'vitest/config';

import {
  assertUsesSharedConfig,
  createVitestConfig,
  defaultVitestExcludePatterns,
  defaultVitestIncludePatterns,
} from './vitest.shared.config';

type PackageManifest = {
  name?: string;
};

const workspaceRoot = dirname(fileURLToPath(import.meta.url));
const packagesRoot = join(workspaceRoot, 'packages');
const workspaceCoverageDirectory = join(workspaceRoot, 'coverage', 'workspace');

const rootTestIncludePatterns = defaultVitestIncludePatterns.filter(pattern =>
  pattern.startsWith('tests/')
);

const rootTestExcludePatterns = Array.from(
  new Set([...defaultVitestExcludePatterns, 'packages/**'])
);

function loadPackageName(manifestPath: string, fallback: string): string {
  if (!existsSync(manifestPath)) {
    return fallback;
  }

  try {
    const manifest = JSON.parse(
      readFileSync(manifestPath, 'utf8')
    ) as PackageManifest;
    return manifest.name ?? fallback;
  } catch {
    return fallback;
  }
}

function resolvePackageProjects(): Array<{ name: string; configPath: string }> {
  if (!existsSync(packagesRoot)) {
    return [];
  }

  const entries = readdirSync(packagesRoot, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const packageDir = join(packagesRoot, entry.name);
      const vitestConfigPath = join(packageDir, 'vitest.config.ts');

      if (!existsSync(vitestConfigPath)) {
        return null;
      }

      const manifestPath = join(packageDir, 'package.json');
      const packageName = loadPackageName(
        manifestPath,
        `packages/${entry.name}`
      );

      return {
        name: packageName,
        configPath: `./packages/${entry.name}/vitest.config.ts`.replace(
          /\\/g,
          '/'
        ),
      };
    })
    .filter((value): value is { name: string; configPath: string } =>
      Boolean(value)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function importVitestConfigModule() {
  const originalURL = globalThis.URL;

  try {
    // Node 18 lacks the WHATWG URL implementation Vitest expects, so temporarily
    // swap in the Node.js URL polyfill before importing its config helpers.
    (globalThis as typeof globalThis & { URL: typeof URL }).URL =
      NodeURL as unknown as typeof URL;
    return await import('vitest/config');
  } finally {
    (globalThis as typeof globalThis & { URL: typeof URL }).URL = originalURL;
  }
}

const { defineConfig } = await importVitestConfigModule();

const baseConfigExport = assertUsesSharedConfig(
  createVitestConfig({
    packageRoot: workspaceRoot,
    environment: 'node',
    setupFiles: ['tests/setup/common-vitest-hooks.ts'],
    tsconfigPath: `${workspaceRoot}/tsconfig.json`,
    testOverrides: {
      include: rootTestIncludePatterns,
      exclude: rootTestExcludePatterns,
    },
    coverageOverrides: {
      reportsDirectory: workspaceCoverageDirectory,
      thresholds: {
        statements: 30,
        branches: 30,
        functions: 30,
        lines: 30,
      },
    },
  })
);

const baseConfig = (await Promise.resolve(baseConfigExport)) as UserConfig;

const packageProjects = resolvePackageProjects();

if (!baseConfig.test) {
  baseConfig.test = {};
}

baseConfig.test.name = 'workspace-infrastructure';

if (baseConfig.test.coverage && typeof baseConfig.test.coverage === 'object') {
  baseConfig.test.coverage = {
    ...baseConfig.test.coverage,
    reportsDirectory: workspaceCoverageDirectory,
  };
}

baseConfig.test.projects = packageProjects.map(project => ({
  extends: project.configPath,
  test: {
    name: project.name,
  },
}));

export default defineConfig(baseConfig);
