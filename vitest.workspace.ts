import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { UserConfigExport } from 'vitest/config';

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

function resolvePackageProjects(): Array<{ name: string; configPath: string }> {
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
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(entry => entry);
}

const packageProjects = resolvePackageProjects();

const workspaceProjects = [
  {
    extends: './vitest.config.ts',
    test: {
      name: 'workspace-infrastructure',
      reporters: ['default', 'verbose'],
      coverage: {
        reporter: ['text', 'json-summary', 'html'],
        reportsDirectory: workspaceCoverageDirectory,
      },
    },
  },
  ...packageProjects.map(project => ({
    extends: project.configPath,
    test: {
      name: project.name,
    },
  })),
];

const workspaceConfig = {
  test: {
    projects: workspaceProjects,
  },
} satisfies UserConfigExport;

export default workspaceConfig;
