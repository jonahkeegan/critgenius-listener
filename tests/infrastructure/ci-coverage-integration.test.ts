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
  const job = workflowConfig.jobs?.['build-and-validate'];
  const steps = parseWorkflowSteps(job);

  it('runs the thematic coverage suite after unit tests', () => {
    const unitIndex = steps.findIndex(step => step.name === 'Unit tests');
    const coverageIndex = steps.findIndex(
      step => step.name === 'Coverage (thematic suite)'
    );

    expect(unitIndex).toBeGreaterThanOrEqual(0);
    expect(coverageIndex).toBeGreaterThan(unitIndex);

    const coverageStep = steps[coverageIndex];
    expect(coverageStep?.run).toBe('pnpm run test:coverage:thematic');
  });

  it('enforces coverage validation even when prior steps fail', () => {
    const validationStep = steps.find(
      step => step.name === 'Validate coverage orchestration (CI)'
    );

    expect(validationStep).toBeDefined();
    expect(validationStep?.if).toBe('${{ always() }}');
    expect(validationStep?.run).toBe(
      'pnpm run validate:coverage-orchestration -- --ci'
    );
  });

  it('uploads coverage artifacts and reports to Codecov', () => {
    const artifactStep = steps.find(
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

    const codecovStep = steps.find(
      step => step.name === 'Upload coverage to Codecov'
    );

    expect(codecovStep).toBeDefined();
    expect(codecovStep?.if).toBe('${{ success() }}');
    expect(codecovStep?.uses).toBe('codecov/codecov-action@v4');

    const filesSetting = codecovStep?.with?.files;
    expect(typeof filesSetting).toBe('string');
    if (typeof filesSetting === 'string') {
      expect(filesSetting.includes('coverage/**/coverage-final.json')).toBe(
        true
      );
    }

    expect(codecovStep?.with?.flags).toBe('listener');
    expect(codecovStep?.with?.fail_ci_if_error).toBe(true);
  });
});
