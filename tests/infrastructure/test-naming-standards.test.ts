import { describe, it, expect } from 'vitest';

describe('testing standards compliance', () => {
  it('has no outstanding naming or structure violations', async () => {
    const validatorModulePromise = import(
      '../../scripts/validate-testing-standards.mjs'
    ) as Promise<typeof import('../../scripts/validate-testing-standards')>;
    const validatorModule = await validatorModulePromise;
    const { collectTestingStandardsIssues } = validatorModule;
    const { issues } = await collectTestingStandardsIssues({ fix: false });
    type TestingStandardsIssue = (typeof issues)[number];

    const details = issues
      .map(
        (issue: TestingStandardsIssue) =>
          `${issue.file ?? 'unknown'} → ${issue.message}`
      )
      .join('\n');

    expect(issues, details).toHaveLength(0);
  });
});
