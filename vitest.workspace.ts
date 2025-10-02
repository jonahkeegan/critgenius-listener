import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

type PackageManifest = {
  name?: string;
};

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));
const packagesRoot = path.join(workspaceRoot, 'packages');
const workspaceCoverageDirectory = path.join(
  workspaceRoot,
  'coverage',
  'workspace'
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

function resolvePackageProjects(): string[] {
  if (!existsSync(packagesRoot)) {
    return [];
  }

  const entries = readdirSync(packagesRoot, { withFileTypes: true });

  return entries
    .filter(entry => entry.isDirectory())
    .map(entry => {
      const packageDir = path.join(packagesRoot, entry.name);
      const vitestConfigPath = path.join(packageDir, 'vitest.config.ts');

      if (!existsSync(vitestConfigPath)) {
        return null;
      }

      const manifestPath = path.join(packageDir, 'package.json');
      const packageName = loadPackageName(
        manifestPath,
        `packages/${entry.name}`
      );

      const projectPath = `./packages/${entry.name}`.replace(/\\/g, '/');

      return {
        name: packageName,
        path: projectPath,
      };
    })
    .filter((value): value is { name: string; path: string } => Boolean(value))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(entry => entry.path);
}

const packageProjects = resolvePackageProjects();

const rootProject = {
  extends: './vitest.config.ts',
  test: {
    name: 'workspace-infrastructure',
  },
};

export default defineConfig({
  test: {
    reporters: ['default', 'verbose'],
    coverage: {
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: workspaceCoverageDirectory,
    },
    projects: [rootProject, ...packageProjects],
  },
});
