import type { EnvironmentConfig } from '@critgenius/shared';
import { environmentSchema } from '@critgenius/shared/config/environment';

type LoadEnvironmentOptions = {
  overrides?: Record<string, string | undefined>;
};

export function loadEnvironmentConfig(
  options: LoadEnvironmentOptions = {}
): EnvironmentConfig {
  const merged = {
    ...process.env,
    ...options.overrides,
  } as Record<string, unknown>;

  const parsed = environmentSchema.safeParse(merged);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const message = issue?.message ?? 'Unknown validation error';
    throw new Error(`Failed to load environment config for tests: ${message}`);
  }

  return parsed.data;
}
