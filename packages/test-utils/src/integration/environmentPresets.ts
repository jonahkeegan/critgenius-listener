export type EnvironmentPreset = {
  name: string;
  description?: string;
  values: Readonly<Record<string, string>>;
};

export type AppliedEnvironmentPreset = {
  preset: EnvironmentPreset;
  restore: () => void;
};

/** Preset matching a minimal local development experience. */
export const localDevelopmentPreset: EnvironmentPreset = {
  name: 'localDevelopment',
  description:
    'Applies development defaults suitable for local integration testing without hitting live services.',
  values: Object.freeze({
    NODE_ENV: 'test',
    LOCAL_DEV: 'true',
    PORT: '43100',
    CLIENT_PORT: '43101',
    ASSEMBLYAI_API_KEY: 'assemblyai-testkey-00000000000000000000000000000000',
    MOCK_ASSEMBLYAI: 'true',
    MONGODB_URI: 'mongodb://localhost:27017/critgenius-test',
    REDIS_URL: 'redis://localhost:6379/0',
    JWT_SECRET: 'integration-test-secret',
  }),
};

/** Preset that mirrors common CI environment expectations. */
export const ciPreset: EnvironmentPreset = {
  name: 'ci',
  description:
    'Provides deterministic CI environment markers for reproducible integration runs.',
  values: Object.freeze({
    CI: 'true',
    GITHUB_ACTIONS: 'true',
    NODE_ENV: 'test',
    PORT: '53200',
    CLIENT_PORT: '53201',
    ASSEMBLYAI_API_KEY: 'assemblyai-testkey-11111111111111111111111111111111',
    MOCK_ASSEMBLYAI: 'true',
    MONGODB_URI: 'mongodb://localhost:27017/critgenius-ci',
    REDIS_URL: 'redis://localhost:6379/1',
    JWT_SECRET: 'integration-test-secret',
  }),
};

/** Preset enabling explicit AssemblyAI mock mode flags. */
export const mockAssemblyAIPreset: EnvironmentPreset = {
  name: 'mockAssemblyAI',
  description:
    'Ensures AssemblyAI connectors run against in-memory mocks only.',
  values: Object.freeze({
    MOCK_ASSEMBLYAI: 'true',
    ASSEMBLYAI_API_KEY: 'assemblyai-testkey-22222222222222222222222222222222',
  }),
};

const PRESET_REGISTRY = new Map<string, EnvironmentPreset>([
  [localDevelopmentPreset.name, localDevelopmentPreset],
  [ciPreset.name, ciPreset],
  [mockAssemblyAIPreset.name, mockAssemblyAIPreset],
]);

/**
 * Resolves an environment preset reference into a concrete preset. String values look up the
 * registry, while custom preset objects are returned as-is.
 */
export function resolveEnvironmentPreset(
  preset: EnvironmentPreset | string | undefined
): EnvironmentPreset {
  if (!preset) {
    return localDevelopmentPreset;
  }

  if (typeof preset === 'string') {
    const resolved = PRESET_REGISTRY.get(preset);
    if (!resolved) {
      throw new Error(`Unknown environment preset: ${preset}`);
    }
    return resolved;
  }

  return preset;
}

/**
 * Applies a preset to `process.env`, returning a handle that restores the previous environment
 * when invoked.
 */
export function applyEnvironmentPreset(
  preset: EnvironmentPreset
): AppliedEnvironmentPreset {
  const previousValues = new Map<string, string | undefined>();

  for (const [key, value] of Object.entries(preset.values)) {
    if (!previousValues.has(key)) {
      previousValues.set(key, process.env[key]);
    }

    process.env[key] = value;
  }

  return {
    preset,
    restore: () => {
      for (const [key, value] of previousValues.entries()) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    },
  };
}

/**
 * Combines multiple presets into a single preset. Later presets win when the same key is defined
 * multiple times. Useful for composing scenario-specific overrides.
 */
export function mergePresets(
  name: string,
  ...presets: EnvironmentPreset[]
): EnvironmentPreset {
  const merged: Record<string, string> = {};
  for (const preset of presets) {
    Object.assign(merged, preset.values);
  }

  return {
    name,
    values: Object.freeze({ ...merged }),
  };
}
