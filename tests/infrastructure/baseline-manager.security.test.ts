import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  BaselineManager,
  createScenarioMetricsFromSummary,
  mergeBaselines,
} from '@critgenius/test-utils/performance';
import type {
  BaselineFile,
  BaselineMetrics,
  LatencySummary,
} from '@critgenius/test-utils/performance';

const TEST_ENVIRONMENT: BaselineFile['environment'] = {
  node: process.version,
  os: process.platform,
  arch: process.arch,
};

function createLatencySummary(): LatencySummary {
  return {
    sampleCount: 10,
    min: 1,
    max: 5,
    mean: 3,
    median: 3,
    standardDeviation: 0.5,
    p50: 3,
    p95: 4,
    p99: 5,
  };
}

function createTempBaselinePath(): {
  baselinePath: string;
  cleanup: () => void;
} {
  const directory = mkdtempSync(join(tmpdir(), 'baseline-manager-security-'));
  const baselinePath = join(directory, 'baseline.json');
  return {
    baselinePath,
    cleanup: () => {
      try {
        rmSync(directory, {
          recursive: true,
          force: true,
          maxRetries: 5,
          retryDelay: 50,
        });
      } catch (error) {
        // Windows occasionally keeps file handles open; ignore cleanup failures for non-critical temp data.
        console.warn('baseline manager cleanup warning:', error);
      }
    },
  };
}

function createEmptyMetricsContainer(): BaselineMetrics {
  return Object.create(null) as BaselineMetrics;
}

function createBaselineFixture(): BaselineFile {
  const metrics = createEmptyMetricsContainer();
  const category = Object.create(null) as BaselineMetrics[string];
  category.existingScenario = createScenarioMetricsFromSummary(
    createLatencySummary()
  );
  metrics.existingCategory = category;

  return {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: TEST_ENVIRONMENT,
    metrics,
  };
}

describe('BaselineManager prototype pollution safeguards', () => {
  it('creates prototype-less containers when updating a scenario', async () => {
    const { baselinePath, cleanup } = createTempBaselinePath();
    const manager = new BaselineManager({ baselinePath });

    try {
      const baseline = await manager.updateScenario(
        'latency',
        'transcription',
        createLatencySummary()
      );

      expect(Object.getPrototypeOf(baseline.metrics)).toBeNull();
      const latencyCategory = baseline.metrics.latency;
      expect(latencyCategory).toBeDefined();
      expect(Object.getPrototypeOf(latencyCategory!)).toBeNull();
    } finally {
      cleanup();
    }
  });

  it('rejects unsafe category names', async () => {
    const { baselinePath, cleanup } = createTempBaselinePath();
    const manager = new BaselineManager({ baselinePath });

    try {
      await expect(
        manager.updateScenario(
          '__proto__',
          'transcription',
          createLatencySummary()
        )
      ).rejects.toThrow(/unsafe baseline category/i);
    } finally {
      cleanup();
    }
  });

  it('rejects unsafe scenario names', async () => {
    const { baselinePath, cleanup } = createTempBaselinePath();
    const manager = new BaselineManager({ baselinePath });

    try {
      await expect(
        manager.updateScenario('latency', '__proto__', createLatencySummary())
      ).rejects.toThrow(/unsafe baseline scenario/i);
    } finally {
      cleanup();
    }
  });

  it('sanitizes metrics when loading an on-disk baseline', async () => {
    const { baselinePath, cleanup } = createTempBaselinePath();

    try {
      const storedBaseline: BaselineFile = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: TEST_ENVIRONMENT,
        metrics: {
          storedCategory: {
            storedScenario: createScenarioMetricsFromSummary(
              createLatencySummary()
            ),
          },
        },
      };

      writeFileSync(
        baselinePath,
        `${JSON.stringify(storedBaseline)}\n`,
        'utf8'
      );

      const manager = new BaselineManager({ baselinePath });
      const loaded = await manager.safeLoad();

      expect(Object.getPrototypeOf(loaded.metrics)).toBeNull();
      const storedCategory = loaded.metrics.storedCategory;
      expect(storedCategory).toBeDefined();
      expect(Object.getPrototypeOf(storedCategory!)).toBeNull();
    } finally {
      cleanup();
    }
  });
});

describe('mergeBaselines prototype pollution safeguards', () => {
  it('rejects override metrics with unsafe category keys', () => {
    const baseline = createBaselineFixture();

    const overrideMetrics = createEmptyMetricsContainer();
    const unsafeScenarioMap = Object.create(null) as BaselineMetrics[string];
    unsafeScenarioMap.attack = createScenarioMetricsFromSummary(
      createLatencySummary()
    );

    Object.defineProperty(overrideMetrics, '__proto__', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: unsafeScenarioMap,
    });

    expect(() =>
      mergeBaselines(baseline, {
        metrics: overrideMetrics,
      })
    ).toThrow(/unsafe override category/i);
  });

  it('rejects override metrics with unsafe scenario keys', () => {
    const baseline = createBaselineFixture();

    const overrideMetrics = createEmptyMetricsContainer();
    const unsafeScenarioMap = Object.create(null) as BaselineMetrics[string];

    Object.defineProperty(unsafeScenarioMap, '__proto__', {
      enumerable: true,
      configurable: true,
      writable: true,
      value: createScenarioMetricsFromSummary(createLatencySummary()),
    });

    overrideMetrics.safeCategory = unsafeScenarioMap;

    expect(() =>
      mergeBaselines(baseline, {
        metrics: overrideMetrics,
      })
    ).toThrow(/unsafe override scenario/i);
  });

  it('produces prototype-less merged metrics', () => {
    const baseline = createBaselineFixture();
    const overrides: Partial<BaselineFile> = {
      metrics: {
        overrideCategory: {
          overrideScenario: createScenarioMetricsFromSummary(
            createLatencySummary()
          ),
        },
      },
    };

    const merged = mergeBaselines(baseline, overrides);

    expect(Object.getPrototypeOf(merged.metrics)).toBeNull();
    const overrideCategory = merged.metrics.overrideCategory;
    expect(overrideCategory).toBeDefined();
    expect(Object.getPrototypeOf(overrideCategory!)).toBeNull();
    expect(baseline.metrics).not.toBe(merged.metrics);
    expect(baseline.metrics.overrideCategory).toBeUndefined();
  });
});
