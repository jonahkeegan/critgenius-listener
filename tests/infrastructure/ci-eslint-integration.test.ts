import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { load } from 'js-yaml';

type WorkflowStep = {
  name?: string;
  run?: string;
  uses?: string;
  if?: string;
  with?: Record<string, unknown>;
  continueOnError?: boolean | string;
};

type WorkflowJob = {
  steps?: WorkflowStep[];
  needs?: string | string[];
};

type WorkflowConfig = {
  jobs?: Record<string, WorkflowJob>;
};

type LintCiManifest = {
  scripts?: Record<string, string>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseWorkflowSteps(job: WorkflowJob | undefined): WorkflowStep[] {
  if (!job || !Array.isArray(job.steps)) {
    return [];
  }

  return job.steps.map((step, index) => {
    if (!isRecord(step)) {
      throw new TypeError(`Workflow step at index ${index} must be an object`);
    }

    const parsed: WorkflowStep = {};

    if (typeof step.name === 'string') {
      parsed.name = step.name;
    }

    if (typeof step.run === 'string') {
      parsed.run = step.run;
    }

    if (typeof step.uses === 'string') {
      parsed.uses = step.uses;
    }

    if (typeof step.if === 'string') {
      parsed.if = step.if;
    }

    if (isRecord(step.with)) {
      parsed.with = step.with;
    }

    const rawContinueOnError = (step as Record<string, unknown>)[
      'continue-on-error'
    ];
    if (
      typeof rawContinueOnError === 'boolean' ||
      typeof rawContinueOnError === 'string'
    ) {
      parsed.continueOnError = rawContinueOnError;
    }

    return parsed;
  });
}

describe('ci workflow eslint integration', () => {
  const workspaceRoot = join(__dirname, '..', '..');
  const workflowPath = join(workspaceRoot, '.github', 'workflows', 'ci.yml');
  const workflowSource = readFileSync(workflowPath, 'utf8');
  const workflowConfig = load(workflowSource) as WorkflowConfig;

  const lintCiPath = join(workspaceRoot, 'scripts', 'lint-ci.mjs');
  const lintCiSource = readFileSync(lintCiPath, 'utf8');

  const packageJsonPath = join(workspaceRoot, 'package.json');
  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, 'utf8')
  ) as LintCiManifest;

  const eslintConfigPath = join(workspaceRoot, 'eslint.config.js');
  const eslintConfigSource = readFileSync(eslintConfigPath, 'utf8');

  const buildJob = workflowConfig.jobs?.['build-and-validate'];
  const buildSteps = parseWorkflowSteps(buildJob);

  it('runs lint:ci without error suppression and after build preparation', () => {
    expect(buildJob).toBeDefined();

    const lintStepIndex = buildSteps.findIndex(
      step => step.run === 'pnpm run lint:ci'
    );
    expect(lintStepIndex).toBeGreaterThanOrEqual(0);

    const buildSharedIndex = buildSteps.findIndex(
      step => step.run === 'pnpm --filter @critgenius/shared run build'
    );
    const buildTestUtilsIndex = buildSteps.findIndex(
      step => step.run === 'pnpm --filter @critgenius/test-utils run build'
    );

    expect(buildSharedIndex).toBeGreaterThanOrEqual(0);
    expect(buildTestUtilsIndex).toBeGreaterThanOrEqual(0);
    expect(lintStepIndex).toBeGreaterThan(buildSharedIndex);
    expect(lintStepIndex).toBeGreaterThan(buildTestUtilsIndex);

    const lintStep = buildSteps[lintStepIndex];
    expect(lintStep?.continueOnError ?? false).toBe(false);
    expect(lintStep?.if).toBeUndefined();
    expect(lintStep?.run).toBe('pnpm run lint:ci');

    const suppressionPatterns = [/\|\|\s*true/, /\|\|\s*echo/, /set\s+\+e/];
    for (const pattern of suppressionPatterns) {
      expect(lintStep?.run?.match(pattern)).toBeNull();
    }
  });

  it('ensures lint:ci exits with a non-zero status on warnings or errors', () => {
    expect(lintCiSource).toContain('errorCount');
    expect(lintCiSource).toContain('warningCount');
    expect(lintCiSource).toMatch(/errorCount\s*>\s*0/);
    expect(lintCiSource).toMatch(/warningCount\s*>\s*0/);
    expect(lintCiSource).toMatch(/process\.exit\(1\)/);
  });

  it('wires lint:ci through package.json', () => {
    expect(packageJson.scripts).toBeDefined();
    const lintCommand = packageJson.scripts?.['lint:ci'];
    expect(lintCommand).toBe('node scripts/lint-ci.mjs');
  });

  it('keeps accessibility linting active in CI runs', () => {
    expect(eslintConfigSource).toContain('jsx-a11y');
    expect(eslintConfigSource).toContain("files: ['**/*.{jsx,tsx}']");
    expect(eslintConfigSource).toContain(
      "files: ['packages/client/src/components/**/*.{tsx,jsx}']"
    );

    expect(lintCiSource).toContain('packages/*/src/**/*.{ts,tsx,js,jsx}');
  });
});
