import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

type PackageManifest = {
  name?: string;
};

type ProjectEntry =
  | string
  | {
      extends?: string;
      test?: {
        name?: string;
      };
    };

interface RootVitestConfig {
  root?: string;
  test?: {
    name?: string;
    coverage?: {
      reportsDirectory?: string;
    };
    projects?: ProjectEntry[];
  };
}

interface NormalizedProject {
  extends: string;
  name: string;
}

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(testDirectory, '../..');
const packagesRoot = path.join(workspaceRoot, 'packages');
const rootConfigPath = path.join(workspaceRoot, 'vitest.config.ts');

let rootConfig: RootVitestConfig;
let normalizedProjects: NormalizedProject[] = [];

async function importRootConfig(): Promise<RootVitestConfig> {
  const module = await import(
    `${pathToFileURL(rootConfigPath).href}?t=${Date.now()}`
  );
  const exported = (module as { default?: RootVitestConfig }).default;
  return (exported ?? module) as RootVitestConfig;
}

function normalizeProject(
  entry: ProjectEntry | undefined
): NormalizedProject | null {
  if (!entry) {
    return null;
  }

  if (typeof entry === 'string') {
    return {
      extends: entry.replace(/\\/g, '/'),
      name: '',
    } satisfies NormalizedProject;
  }

  const extendsPath = (entry.extends ?? '').replace(/\\/g, '/');
  if (!extendsPath) {
    return null;
  }

  const name =
    typeof entry.test?.name === 'string' && entry.test.name.length > 0
      ? entry.test.name
      : resolveProjectNameFromPath(extendsPath);

  return {
    extends: extendsPath,
    name,
  } satisfies NormalizedProject;
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

function loadExpectedPackages(): Array<{ name: string; configPath: string }> {
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
    .sort((a, b) => a.name.localeCompare(b.name));
}

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

beforeAll(async () => {
  rootConfig = await importRootConfig();
  const projects = rootConfig.test?.projects ?? [];
  normalizedProjects = projects
    .map(project => normalizeProject(project))
    .filter((project): project is NormalizedProject => project !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
});

describe('vitest root configuration', () => {
  it('labels the infrastructure project at the root', () => {
    expect(rootConfig.root).toBe(workspaceRoot);
    expect(rootConfig.test?.name).toBe('workspace-infrastructure');
  });

  it('includes package-level projects with deterministic ordering', () => {
    const expectedPackages = loadExpectedPackages();

    expect(normalizedProjects.length).toBe(expectedPackages.length);

    for (const expected of expectedPackages) {
      const project = normalizedProjects.find(
        candidate => candidate.name === expected.name
      );

      expect(project, `Missing project for ${expected.name}`).toBeDefined();
      expect(project?.extends).toBe(expected.configPath);
    }

    const names = normalizedProjects.map(project => project.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });

  it('only lists packages that provide explicit vitest configuration', () => {
    const expectedPackages = loadExpectedPackages();
    const expectedNames = new Set(expectedPackages.map(pkg => pkg.name));

    for (const project of normalizedProjects) {
      expect(expectedNames.has(project.name)).toBe(true);
    }
  });

  it('configures workspace-wide coverage aggregation via root config and scripts', () => {
    const expectedCoverageDir = path.join(
      workspaceRoot,
      'coverage',
      'workspace'
    );
    expect(rootConfig.test?.coverage?.reportsDirectory).toBe(
      expectedCoverageDir
    );

    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    const packageJsonRaw = readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonRaw) as {
      scripts?: Record<string, string>;
    };

    const coverageScript = packageJson.scripts?.['test:coverage'];
    expect(coverageScript).toBe('pnpm test:coverage:workspace');
  });
});
