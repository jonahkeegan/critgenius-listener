import { EnvironmentDetector } from '../diagnostics/environment-detector.js';
import { describeIf, testIf } from './conditionalTestRunner.js';

type Requirement = {
  requireCI?: boolean;
  requireLocal?: boolean;
  disallowCI?: boolean;
  requiredEnvVars?: readonly string[];
};

function evaluateRequirements(requirements: Requirement): {
  allowed: boolean;
  reason?: string;
} {
  const execution = EnvironmentDetector.detect();

  if (requirements.requireCI && execution !== 'ci') {
    return { allowed: false, reason: 'requires CI environment' };
  }

  if (requirements.requireLocal && execution !== 'local') {
    return { allowed: false, reason: 'requires local environment' };
  }

  if (requirements.disallowCI && execution === 'ci') {
    return { allowed: false, reason: 'disabled in CI' };
  }

  if (requirements.requiredEnvVars?.length) {
    const missing = requirements.requiredEnvVars.filter(
      key => !process.env[key]
    );
    if (missing.length > 0) {
      return {
        allowed: false,
        reason: `missing environment variables: ${missing.join(', ')}`,
      };
    }
  }

  return { allowed: true };
}

export function environmentAwareTest(
  name: Parameters<typeof testIf>[1],
  requirements: Requirement,
  factory: Parameters<typeof testIf>[2]
): void {
  const evaluation = evaluateRequirements(requirements);
  const options = evaluation.reason ? { reason: evaluation.reason } : undefined;
  testIf(evaluation.allowed, name, factory, options ?? {});
}

export function environmentAwareDescribe(
  name: Parameters<typeof describeIf>[1],
  requirements: Requirement,
  factory: Parameters<typeof describeIf>[2]
): void {
  const evaluation = evaluateRequirements(requirements);
  const options = evaluation.reason ? { reason: evaluation.reason } : undefined;
  describeIf(evaluation.allowed, name, factory, options ?? {});
}
