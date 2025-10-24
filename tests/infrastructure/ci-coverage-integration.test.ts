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
};

type WorkflowJob = {
  steps?: WorkflowStep[];
  needs?: string | string[];
};

type WorkflowConfig = {
  jobs?: Record<string, WorkflowJob>;
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

    return parsed;
  });
}

describe('ci workflow coverage integration', () => {
  const workspaceRoot = join(__dirname, '..', '..');
  const workflowPath = join(workspaceRoot, '.github', 'workflows', 'ci.yml');
  const workflowSource = readFileSync(workflowPath, 'utf8');
  const workflowConfig = load(workflowSource) as WorkflowConfig;

  const buildJob = workflowConfig.jobs?.['build-and-validate'];
  const buildSteps = parseWorkflowSteps(buildJob);

  const coverageJob = workflowConfig.jobs?.['thematic-coverage'];
  const coverageSteps = parseWorkflowSteps(coverageJob);

  const validationJob = workflowConfig.jobs?.['validate-coverage'];
  const validationSteps = parseWorkflowSteps(validationJob);

  it('delegates thematic coverage generation to the dedicated job', () => {
    expect(
      buildSteps.some(step => step.run === 'pnpm run test:coverage:thematic')
    ).toBe(false);

    const coverageStep = coverageSteps.find(
      step => step.name === 'Run thematic coverage'
    );

    expect(coverageStep).toBeDefined();
    expect(coverageStep?.run).toBe('pnpm run test:coverage:thematic');

    const buildSharedStep = coverageSteps.find(
      step => step.name === 'Build shared package'
    );
    expect(buildSharedStep?.run).toBe(
      'pnpm --filter @critgenius/shared run build'
    );

    const buildTestUtilsStep = coverageSteps.find(
      step => step.name === 'Build test-utils package'
    );
    expect(buildTestUtilsStep?.run).toBe(
      'pnpm --filter @critgenius/test-utils run build'
    );

    const verifySummaryStep = coverageSteps.find(
      step => step.name === 'Verify thematic summary output'
    );
    expect(verifySummaryStep?.run).toContain('coverage/thematic-summary.json');
  });

  it('validates coverage after downloading the generated artifact', () => {
    expect(validationJob).toBeDefined();

    const needs = validationJob?.needs;
    if (Array.isArray(needs)) {
      expect(needs).toContain('thematic-coverage');
    } else {
      expect(needs).toBe('thematic-coverage');
    }

    const downloadStep = validationSteps.find(
      step => step.name === 'Download thematic coverage artifact'
    );
    expect(downloadStep).toBeDefined();
    const downloadUses = downloadStep?.uses;
    expect(typeof downloadUses).toBe('string');

    if (typeof downloadUses === 'string') {
      const versionMatch = downloadUses.match(
        /^actions\/download-artifact@v(?<major>\d+)(?:\b|$)/
      );
      expect(versionMatch).not.toBeNull();

      const major = Number(versionMatch?.groups?.major ?? NaN);
      expect(Number.isNaN(major)).toBe(false);
      expect(major).toBeGreaterThanOrEqual(4);
    }

    expect(downloadStep?.with?.name).toBe('thematic-coverage');
    expect(downloadStep?.with?.path).toBe('coverage');

    const validationBuildSharedStep = validationSteps.find(
      step => step.name === 'Build shared package'
    );
    expect(validationBuildSharedStep?.run).toBe(
      'pnpm --filter @critgenius/shared run build'
    );

    const validationBuildTestUtilsStep = validationSteps.find(
      step => step.name === 'Build test-utils package'
    );
    expect(validationBuildTestUtilsStep?.run).toBe(
      'pnpm --filter @critgenius/test-utils run build'
    );

    const validationStep = validationSteps.find(
      step => step.name === 'Validate coverage orchestration (CI)'
    );

    expect(validationStep).toBeDefined();
    expect(validationStep?.if).toBeUndefined();
    expect(validationStep?.run).toBe(
      'pnpm run validate:coverage-orchestration -- --ci'
    );
  });

  it('uploads coverage artifacts and reports to Codecov from the validation job', () => {
    const artifactStep = validationSteps.find(
      step => step.name === 'Upload coverage artifacts'
    );

    expect(artifactStep).toBeDefined();
    expect(artifactStep?.if).toBe('${{ always() }}');
    expect(artifactStep?.uses).toBe('actions/upload-artifact@v4');

    const artifactPathRaw = artifactStep?.with?.path;
    expect(typeof artifactPathRaw).toBe('string');

    if (typeof artifactPathRaw === 'string') {
      const artifactLines = artifactPathRaw
        .split(/\r?\n/)
        .map(entry => entry.trim())
        .filter(Boolean);

      expect(artifactLines).toContain('coverage/**/coverage-summary.json');
      expect(artifactLines).toContain('coverage/**/coverage-final.json');
      expect(artifactLines).toContain('coverage/thematic-summary.json');
    }

    const codecovStep = validationSteps.find(
      step => step.name === 'Upload coverage to Codecov'
    );

    expect(codecovStep).toBeDefined();
    expect(codecovStep?.if).toBe('${{ success() }}');
    expect(codecovStep?.uses).toBe('codecov/codecov-action@v5');

    const filesSetting = codecovStep?.with?.files;
    expect(typeof filesSetting).toBe('string');
    if (typeof filesSetting === 'string') {
      expect(filesSetting.includes('coverage/**/coverage-final.json')).toBe(
        true
      );
    }

    expect(codecovStep?.with?.flags).toBe('listener');
    expect(codecovStep?.with?.fail_ci_if_error).toBe(true);
    expect(codecovStep?.with?.token).toBe('${{ secrets.CODECOV_TOKEN }}');

    const testResultsStep = validationSteps.find(
      step => step.name === 'Upload test results to Codecov'
    );
    expect(testResultsStep?.if).toBe('${{ !cancelled() }}');
    expect(testResultsStep?.uses).toBe('codecov/test-results-action@v1');
    expect(testResultsStep?.with?.token).toBe('${{ secrets.CODECOV_TOKEN }}');
  });
});
