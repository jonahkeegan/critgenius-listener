export interface TestingStandardsIssue {
  type: string;
  message: string;
  file?: string;
  fixable?: boolean;
}

export interface TestingStandardsResult {
  issues: TestingStandardsIssue[];
}

export interface TestingStandardsOptions {
  fix?: boolean;
  throwOnIssue?: boolean;
}

export declare function collectTestingStandardsIssues(
  options?: TestingStandardsOptions
): Promise<TestingStandardsResult>;

export declare function validateTestingStandards(
  options?: TestingStandardsOptions
): Promise<TestingStandardsResult>;

declare module './validate-testing-standards.mjs' {
  export {
    TestingStandardsIssue,
    TestingStandardsOptions,
    TestingStandardsResult,
    collectTestingStandardsIssues,
    validateTestingStandards,
  };
}
