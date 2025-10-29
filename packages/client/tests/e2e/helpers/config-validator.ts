import type { FullConfig } from '@playwright/test';

type ReporterEntry =
  | string
  | readonly [string]
  | readonly [string, Record<string, unknown>]
  | { name?: unknown };

type NormalizedConfig = FullConfig & {
  projects: Array<{
    testDir?: string;
    outputDir?: string;
  }>;
  outputDir?: string;
  testDir?: string;
  reporter?: ReporterEntry[] | ReporterEntry;
};

function extractReporterName(entry: ReporterEntry): string | null {
  if (typeof entry === 'string') {
    return entry;
  }

  if (Array.isArray(entry) && typeof entry[0] === 'string') {
    return entry[0];
  }

  if (entry && typeof entry === 'object' && 'name' in entry) {
    const name = (entry as { name?: unknown }).name;
    return typeof name === 'string' ? name : null;
  }

  return null;
}

function getReporterEntries(config: NormalizedConfig): ReporterEntry[] {
  const reporterField = config.reporter;
  if (!reporterField) {
    return [];
  }
  const entriesArray = Array.isArray(reporterField)
    ? [...reporterField]
    : [reporterField];
  return entriesArray as ReporterEntry[];
}

export function validatePlaywrightConfig(config: FullConfig): void {
  const normalized = config as NormalizedConfig;
  const projects = normalized.projects ?? [];
  if (!Array.isArray(projects) || projects.length === 0) {
    throw new Error(
      'Playwright configuration has no browser projects defined.\nFix: Add at least one project to packages/client/playwright.config.ts'
    );
  }

  const projectTestDirs = projects
    .map(project => project.testDir ?? normalized.testDir)
    .filter((dir): dir is string => typeof dir === 'string' && dir.length > 0);

  if (projectTestDirs.length === 0) {
    throw new Error(
      'Playwright configuration resolved without a test directory.\nFix: Ensure testDir is defined in packages/client/playwright.config.ts'
    );
  }

  const projectOutputDirs = projects
    .map(project => project.outputDir ?? normalized.outputDir)
    .filter((dir): dir is string => typeof dir === 'string' && dir.length > 0);

  if (projectOutputDirs.length === 0) {
    throw new Error(
      'Playwright configuration resolved without an outputDir.\nFix: Set outputDir in packages/client/playwright.config.ts or project overrides'
    );
  }

  const reporterEntries = getReporterEntries(normalized);
  const reporterNames = reporterEntries
    .map(entry => extractReporterName(entry))
    .filter((name): name is string => Boolean(name));

  const requiredReporters: string[] = ['html', 'json'];
  const missingReporters = requiredReporters.filter(
    requiredName => !reporterNames.includes(requiredName)
  );

  if (missingReporters.length > 0) {
    const formattedMissing = missingReporters
      .map(name => `  - ${name}`)
      .join('\n');
    const current =
      reporterNames.length > 0 ? reporterNames.join(', ') : 'none';
    throw new Error(
      `Playwright configuration missing required reporters.\n  Current: ${current}\n  Missing:\n${formattedMissing}\n\nFix: Add the reporters to packages/client/playwright.config.ts`
    );
  }
}
