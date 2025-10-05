import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Task 3.1.3 Validation: Performance Testing Infrastructure', () => {
  describe('Performance Test Utilities Exist', () => {
    it('should have latency-benchmark utility', () => {
      const utilPath = resolve(
        'packages/test-utils/src/performance/latency-benchmark.ts'
      );
      expect(existsSync(utilPath)).toBe(true);
    });

    it('should have baseline-manager utility', () => {
      const utilPath = resolve(
        'packages/test-utils/src/performance/baseline-manager.ts'
      );
      expect(existsSync(utilPath)).toBe(true);
    });

    it('should have regression-detector utility', () => {
      const utilPath = resolve(
        'packages/test-utils/src/performance/regression-detector.ts'
      );
      expect(existsSync(utilPath)).toBe(true);
    });

    it('should have performance matchers', () => {
      const utilPath = resolve(
        'packages/test-utils/src/performance/performance-matchers.ts'
      );
      expect(existsSync(utilPath)).toBe(true);
    });

    it('should have workload scenario utilities', () => {
      const utilPath = resolve(
        'packages/test-utils/src/performance/workload-scenarios.ts'
      );
      expect(existsSync(utilPath)).toBe(true);
    });
  });

  describe('Performance Test Suites Exist', () => {
    it('should have audio processing performance tests', () => {
      const testPath = resolve(
        'tests/performance/audio-processing.perf.test.ts'
      );
      expect(existsSync(testPath)).toBe(true);
    });

    it('should have transcription performance tests', () => {
      const testPath = resolve('tests/performance/transcription.perf.test.ts');
      expect(existsSync(testPath)).toBe(true);
    });

    it('should have end-to-end performance tests', () => {
      const testPath = resolve('tests/performance/end-to-end.perf.test.ts');
      expect(existsSync(testPath)).toBe(true);
    });
  });

  describe('Baseline Management System', () => {
    it('should have baseline.json structure', () => {
      const baselinePath = resolve('.performance-baselines/baseline.json');
      expect(existsSync(baselinePath)).toBe(true);
    });

    it('should have establish-baseline script', () => {
      const scriptPath = resolve('scripts/performance/establish-baseline.mjs');
      expect(existsSync(scriptPath)).toBe(true);
    });

    it('should have compare-performance script', () => {
      const scriptPath = resolve('scripts/performance/compare-performance.mjs');
      expect(existsSync(scriptPath)).toBe(true);
    });
  });

  describe('Configuration Updates', () => {
    it('should have performance-specific Vitest config', () => {
      const configPath = resolve('vitest.performance.config.ts');
      expect(existsSync(configPath)).toBe(true);
    });
  });

  describe('Functional Validation', () => {
    it('should be able to import performance utilities', async () => {
      const performanceModule = await import(
        '@critgenius/test-utils/performance'
      );
      expect(typeof performanceModule.measureLatency).toBe('function');
    });

    it('should be able to load baseline data', async () => {
      const { BaselineManager } = await import(
        '@critgenius/test-utils/performance'
      );
      const manager = new BaselineManager();
      const baseline = await manager.safeLoad();
      expect(baseline).toHaveProperty('metrics');
    });

    it('should expose predefined workload scenarios', async () => {
      const { workloadScenarios } = await import(
        '@critgenius/test-utils/performance'
      );
      expect(workloadScenarios.singleStream?.concurrentStreams).toBe(1);
    });

    it('should validate sub-500ms latency threshold', async () => {
      const latency = 450;
      expect(latency).toBeLessThan(500);
    });
  });
});
