/**
 * Known environment variables that indicate execution within a Continuous Integration environment.
 */
const CI_ENVIRONMENT_KEYS = [
  'CI',
  'GITHUB_ACTIONS',
  'BUILD_ID',
  'BUILD_BUILDID',
  'JENKINS_URL',
  'TF_BUILD',
  'CIRCLECI',
] as const;

/**
 * Environment metadata keys that are safe to expose for diagnostics. Values are sanitized to avoid
 * leaking secrets or sensitive configuration.
 */
const ENVIRONMENT_INFO_KEYS = [
  'CI',
  'GITHUB_ACTIONS',
  'GITHUB_WORKFLOW',
  'GITHUB_RUN_ID',
  'GITHUB_RUN_NUMBER',
  'GITHUB_WORKSPACE',
  'NODE_ENV',
] as const;

type EnvironmentInfoKey = (typeof ENVIRONMENT_INFO_KEYS)[number];

type SanitizedEnvironmentInfo = Record<EnvironmentInfoKey, string>;

/**
 * Possible runtime environments detected for diagnostics.
 */
export type ExecutionEnvironment = 'ci' | 'local' | 'unknown';

/**
 * Utility responsible for detecting whether the current process is running in Continuous
 * Integration or local development, without leaking sensitive environment data.
 */
export class EnvironmentDetector {
  /**
   * Returns a high-level categorisation of the current runtime environment.
   */
  static detect(): ExecutionEnvironment {
    if (this.isCI()) {
      return 'ci';
    }

    if (this.isLocal()) {
      return 'local';
    }

    return 'unknown';
  }

  /**
   * True when any of the CI environment markers are present and truthy.
   */
  static isCI(): boolean {
    return CI_ENVIRONMENT_KEYS.some(key => this.checkEnvironmentVariable(key));
  }

  /**
   * True when the runtime indicates execution inside GitHub Actions.
   */
  static isGitHubActions(): boolean {
    return this.checkEnvironmentVariable('GITHUB_ACTIONS');
  }

  /**
   * Collects a fixed set of non-sensitive environment signals for diagnostic logging. Values for
   * sensitive keys are replaced with the literal string "set" or "unset". Only `NODE_ENV` retains
   * its actual value for better debugging, as it is considered non-sensitive in this context.
   */
  static getEnvironmentInfo(): Readonly<SanitizedEnvironmentInfo> {
    const summary = Object.create(null) as SanitizedEnvironmentInfo;

    for (const key of ENVIRONMENT_INFO_KEYS) {
      const value = process.env[key];
      if (key === 'NODE_ENV') {
        summary[key] = value ?? 'undefined';
        continue;
      }

      summary[key] = value && value !== '' ? 'set' : 'unset';
    }

    return summary;
  }

  /**
   * Internal helper that tests whether we can confidently classify the runtime as local. We treat
   * the absence of CI markers plus either an explicit `NODE_ENV` of `development` or the presence
   * of `LOCAL_DEV` / `VITEST_WORKER_ID` flags as strong signals of local execution.
   */
  private static isLocal(): boolean {
    if (this.isCI()) {
      return false;
    }

    if (this.checkEnvironmentVariable('LOCAL_DEV')) {
      return true;
    }

    const nodeEnv = process.env.NODE_ENV?.toLowerCase();
    if (nodeEnv === 'development') {
      return true;
    }

    if (nodeEnv !== 'test' && process.env.VITEST_WORKER_ID) {
      return true;
    }

    return false;
  }

  /**
   * Checks whether the provided environment variable key is set to a truthy value.
   */
  private static checkEnvironmentVariable(key: string): boolean {
    const value = process.env[key];

    if (value === undefined || value === null) {
      return false;
    }

    const normalized = String(value).toLowerCase();
    return normalized !== '' && normalized !== '0' && normalized !== 'false';
  }
}
