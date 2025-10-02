import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

type PackageManifest = {
  name?: string;
};

type WorkspaceProjectExport =
  | string
  | {
      extends?: string;
      test?: {
        name?: string;
        root?: string;
      };
    };

type WorkspaceExport =
  | WorkspaceProjectExport[]
  | {
      projects?: WorkspaceProjectExport[];
      test?: {
        projects?: WorkspaceProjectExport[];
        coverage?: unknown;
        reporters?: unknown;
      };
    };

interface ResolvedWorkspaceProject {
  extends: string;
  name: string;
  root: string;
}

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(testDirectory, '../..');
const packagesRoot = path.join(workspaceRoot, 'packages');
const workspaceFilePath = path.join(workspaceRoot, 'vitest.workspace.ts');

let workspaceProjects: ResolvedWorkspaceProject[] = [];

async function importWorkspaceConfig(): Promise<WorkspaceExport> {
  const workspaceModule = await import(
    `${pathToFileURL(workspaceFilePath).href}?t=${Date.now()}`
  );
  const exported = (workspaceModule as { default?: WorkspaceExport }).default;
  return exported ?? workspaceModule;
}

async function resolveWorkspaceProjects(): Promise<ResolvedWorkspaceProject[]> {
  const config = await importWorkspaceConfig();
  const projects = Array.isArray(config)
    ? config
    : (config.projects ?? config.test?.projects ?? []);

  return projects
    .map(project => {
      if (typeof project === 'string') {
        return {
          extends: project,
          test: {},
        } as { extends: string; test: Record<string, unknown> };
      }
      return project ?? {};
    })
    .map(project => {
      const normalizedExtends = normalizePath(project.extends ?? '');
      const name =
        typeof project.test?.name === 'string' && project.test.name.length > 0
          ? project.test.name
          : resolveProjectNameFromPath(normalizedExtends);
      const resolvedRoot = resolveProjectRoot(
        normalizedExtends,
        project.test?.root
      );

      return {
        extends: normalizedExtends,
        name,
        root: resolvedRoot,
      } satisfies ResolvedWorkspaceProject;
    })
    .filter(project => project.extends.length > 0);
}

function normalizePath(input: string): string {
  return input.replace(/\\/g, '/');
}

function resolveProjectNameFromPath(projectPath: string): string {
  const sanitizedPath = projectPath.replace(/^\.\//, '');
  if (!sanitizedPath.startsWith('packages/')) {
    return '';
  }

  const packageDir = path.join(workspaceRoot, sanitizedPath);
  const manifestPath = path.join(packageDir, 'package.json');

  if (!existsSync(manifestPath)) {
    return sanitizedPath;
  }

  try {
    const manifest = JSON.parse(
      readFileSync(manifestPath, 'utf8')
    ) as PackageManifest;
    return manifest.name ?? sanitizedPath;
  } catch {
    return sanitizedPath;
  }
}

function resolveProjectRoot(projectPath: string, override: unknown): string {
  if (typeof override === 'string' && override.length > 0) {
    const isRelative = override.startsWith('.');
    const basePath = isRelative
      ? path.join(workspaceRoot, override.replace(/^\.\//, ''))
      : override;
    return path.resolve(basePath);
  }

  if (!projectPath) {
    return workspaceRoot;
  }

  const sanitizedPath = projectPath.replace(/^\.\//, '');
  if (!sanitizedPath) {
    return workspaceRoot;
  }

  const resolvedPath = sanitizedPath.endsWith('.ts')
    ? path.dirname(path.join(workspaceRoot, sanitizedPath))
    : path.join(workspaceRoot, sanitizedPath);

  return path.resolve(resolvedPath);
}

function loadExpectedPackages(): Array<{
  name: string;
  configPath: string;
  root: string;
}> {
  if (!existsSync(packagesRoot)) {
    return [];
  }

  const entries = readdirSync(packagesRoot, { withFileTypes: true });
  const packages = entries.filter(entry => entry.isDirectory());

  return packages
    .map(entry => {
      const packageDir = path.join(packagesRoot, entry.name);
      const vitestConfigPath = path.join(packageDir, 'vitest.config.ts');
      if (!existsSync(vitestConfigPath)) {
        return null;
      }

      const manifestPath = path.join(packageDir, 'package.json');
      let packageName = `packages/${entry.name}`;

      if (existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(
            readFileSync(manifestPath, 'utf8')
          ) as PackageManifest;
          packageName = manifest.name ?? packageName;
        } catch {
          packageName = `packages/${entry.name}`;
        }
      }

      return {
        name: packageName,
        configPath: normalizePath(`./packages/${entry.name}`),
        root: path.resolve(packageDir),
      };
    })
    .filter(
      (
        value
      ): value is {
        name: string;
        configPath: string;
        root: string;
      } => Boolean(value)
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

beforeAll(async () => {
  workspaceProjects = await resolveWorkspaceProjects();
});

describe('vitest workspace configuration', () => {
  it('includes the infrastructure project at the root', () => {
    const infrastructureProject = workspaceProjects.find(
      project => project.extends === './vitest.config.ts'
    );

    expect(infrastructureProject).toBeDefined();
    expect(infrastructureProject?.extends).toBe('./vitest.config.ts');
    expect(infrastructureProject?.name).toBe('workspace-infrastructure');
    expect(infrastructureProject?.root).toBe(workspaceRoot);
  });

  it('registers each workspace package with deterministic ordering', () => {
    const expectedPackages = loadExpectedPackages();

    for (const expected of expectedPackages) {
      const project = workspaceProjects.find(
        candidate => candidate.name === expected.name
      );

      expect(project, `Missing project for ${expected.name}`).toBeDefined();
      expect(project?.extends).toBe(expected.configPath);
      expect(project?.root).toBe(expected.root);
    }

    const packageNames = workspaceProjects
      .filter(project => project.name !== 'workspace-infrastructure')
      .map(project => project.name);

    const sortedNames = [...packageNames].sort((a, b) => a.localeCompare(b));
    expect(packageNames).toEqual(sortedNames);
  });

  it('only includes projects with explicit vitest configuration', () => {
    const expectedPackages = loadExpectedPackages();
    const expectedProjectCount = expectedPackages.length + 1; // +1 for root infrastructure

    expect(workspaceProjects.length).toBe(expectedProjectCount);

    for (const project of workspaceProjects) {
      if (project.name === 'workspace-infrastructure') {
        continue;
      }

      const expected = expectedPackages.find(
        candidate => candidate.name === project.name
      );

      expect(expected, `Unexpected project ${project.name}`).toBeDefined();
    }
  });

  it('configures workspace-wide coverage aggregation', () => {
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    const packageJsonRaw = readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonRaw) as {
      scripts?: Record<string, string>;
    };

    const coverageScript = packageJson.scripts?.['test:coverage'];
    expect(coverageScript).toBeDefined();
    expect(coverageScript).toContain('--config vitest.workspace.ts');
    expect(coverageScript).toContain(
      '--coverage.reportsDirectory=coverage/workspace'
    );
  });
});
