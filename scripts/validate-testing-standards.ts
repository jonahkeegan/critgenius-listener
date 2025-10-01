import type {
  TestingStandardsOptions,
  TestingStandardsResult,
} from './validate-testing-standards.d';
export type {
  TestingStandardsIssue,
  TestingStandardsOptions,
  TestingStandardsResult,
} from './validate-testing-standards.d';

const modulePromise = import('./validate-testing-standards.mjs');

export async function collectTestingStandardsIssues(
  options?: TestingStandardsOptions
): Promise<TestingStandardsResult> {
  const module = await modulePromise;
  return module.collectTestingStandardsIssues(options);
}

export async function validateTestingStandards(
  options?: TestingStandardsOptions
): Promise<TestingStandardsResult> {
  const module = await modulePromise;
  return module.validateTestingStandards(options);
}
