import type { BaselineScenarioMetrics, BaselineFile } from './baseline-manager';
import type { ExpectStatic } from 'vitest';
import type {
  LatencyBenchmarkResult,
  LatencySummary,
  LatencyThreshold,
} from './latency-benchmark';
import {
  LATENCY_SUMMARY_SELECTORS,
  assertLatencyWithinThreshold,
} from './latency-benchmark';
import {
  detectRegression,
  detectRegressionFromBaseline,
  type RegressionDetectionOptions,
} from './regression-detector';

export type PerformanceTarget = LatencyThreshold;

function isLatencyBenchmarkResult(
  value: unknown
): value is LatencyBenchmarkResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'summary' in value &&
    typeof (value as { summary: unknown }).summary === 'object'
  );
}

function extractSummary(value: LatencySummary | LatencyBenchmarkResult): {
  summary: LatencySummary;
  scenarioId?: string;
} {
  if (isLatencyBenchmarkResult(value)) {
    const result: { summary: LatencySummary; scenarioId?: string } = {
      summary: value.summary,
    };

    if (value.scenarioId !== undefined) {
      result.scenarioId = value.scenarioId;
    }

    return result;
  }

  return { summary: value };
}

function formatThresholdComparison(
  summary: LatencySummary,
  threshold: LatencyThreshold
): string {
  const lines: string[] = [];
  const selectorEntries = Object.entries(threshold) as [
    keyof LatencyThreshold,
    number,
  ][];

  for (const [key, target] of selectorEntries) {
    if (target === undefined) {
      continue;
    }

    const selector = LATENCY_SUMMARY_SELECTORS[key];
    if (!selector) {
      continue;
    }

    const value = selector(summary);
    lines.push(
      `${key}: ${value.toFixed(2)}ms (threshold ${target.toFixed(2)}ms)`
    );
  }

  return lines.join('\n');
}

interface MatcherContext {
  isNot: boolean;
  equals(a: unknown, b: unknown): boolean;
  utils: {
    matcherHint(name: string, received?: string, expected?: string): string;
    printExpected(value: unknown): string;
    printReceived(value: unknown): string;
  };
}

type MatcherResult = { pass: boolean; message: () => string };

type LatencyComparable = LatencySummary | LatencyBenchmarkResult;

function ensureSummary(value: LatencyComparable): LatencySummary {
  return extractSummary(value).summary;
}

function ensureScenarioId(value: LatencyComparable): string | undefined {
  return extractSummary(value).scenarioId;
}

function buildPassMessage(name: string): string {
  return `${name} passed`;
}

export const performanceMatchers = {
  toBeWithinLatencyThreshold(
    this: MatcherContext,
    received: LatencyComparable,
    threshold: LatencyThreshold
  ): MatcherResult {
    const summary = ensureSummary(received);
    const scenarioId = ensureScenarioId(received);
    const label = scenarioId ? `scenario ${scenarioId}` : 'latency benchmark';

    try {
      assertLatencyWithinThreshold(summary, threshold, label);
      return {
        pass: !this.isNot,
        message: () =>
          this.isNot
            ? `${label} latency unexpectedly satisfied threshold.\n${formatThresholdComparison(summary, threshold)}`
            : buildPassMessage('toBeWithinLatencyThreshold'),
      };
    } catch (error) {
      const description =
        error instanceof Error ? error.message : String(error);
      return {
        pass: this.isNot,
        message: () =>
          this.isNot
            ? `Expected ${label} latency to meet threshold but matcher was used with .not. Details: ${description}`
            : description,
      };
    }
  },

  toNotRegress(
    this: MatcherContext,
    received: LatencyComparable,
    baseline: BaselineScenarioMetrics,
    options: RegressionDetectionOptions = {}
  ): MatcherResult {
    const summary = ensureSummary(received);
    const scenarioId = ensureScenarioId(received) ?? options.scenarioId;

    const regressionOptions =
      scenarioId === undefined
        ? options
        : {
            ...options,
            scenarioId,
          };

    const regression = detectRegression(summary, baseline, regressionOptions);

    const pass = !regression.regressionDetected;
    const message = regression.regressionDetected
      ? () =>
          `Performance regression detected for ${
            regression.scenarioId ?? 'scenario'
          }:\n${regression.breaches.join('\n')}`
      : () => buildPassMessage('toNotRegress');

    return this.isNot ? { pass: !pass, message } : { pass, message };
  },

  toNotRegressFromBaseline(
    this: MatcherContext,
    received: LatencyComparable,
    baselineFile: BaselineFile,
    category: string,
    scenario: string,
    options: RegressionDetectionOptions = {}
  ): MatcherResult {
    const summary = ensureSummary(received);

    try {
      const regression = detectRegressionFromBaseline(
        baselineFile,
        category,
        scenario,
        summary,
        options
      );

      const pass = !regression.regressionDetected;
      const message = regression.regressionDetected
        ? () =>
            `Performance regression detected for ${
              regression.scenarioId ?? scenario
            }:\n${regression.breaches.join('\n')}`
        : () => buildPassMessage('toNotRegressFromBaseline');

      return this.isNot ? { pass: !pass, message } : { pass, message };
    } catch (error) {
      return {
        pass: this.isNot,
        message: () => (error instanceof Error ? error.message : String(error)),
      };
    }
  },

  toMeetPerformanceTarget(
    this: MatcherContext,
    received: LatencyComparable,
    target: PerformanceTarget
  ): MatcherResult {
    const summary = ensureSummary(received);

    const metrics = Object.keys(target) as Array<keyof PerformanceTarget>;
    const failures = metrics
      .map(metric => {
        const threshold = target[metric];
        if (threshold === undefined) {
          return null;
        }

        const selector = LATENCY_SUMMARY_SELECTORS[metric];
        if (!selector) {
          return null;
        }

        const value = selector(summary);
        return value <= threshold
          ? null
          : `${metric} ${value.toFixed(2)}ms exceeds target ${threshold.toFixed(
              2
            )}ms`;
      })
      .filter((failure): failure is string => failure !== null);

    if (failures.length === 0) {
      return {
        pass: !this.isNot,
        message: () =>
          this.isNot
            ? 'Performance target met but matcher was used with .not.'
            : buildPassMessage('toMeetPerformanceTarget'),
      };
    }

    return {
      pass: this.isNot,
      message: () => failures.join('\n'),
    };
  },
};

export type PerformanceMatchers = typeof performanceMatchers;

let performanceMatchersRegistered = false;

export function registerPerformanceMatchers(): void {
  if (performanceMatchersRegistered) {
    return;
  }

  const vitestExpect = (
    globalThis as {
      expect?: ExpectStatic;
      process?: NodeJS.Process;
    }
  ).expect;

  if (!vitestExpect) {
    const processRef = (globalThis as { process?: NodeJS.Process }).process;
    if (processRef?.env?.VITEST_WORKER_ID) {
      throw new Error(
        'Vitest expect global is unavailable inside a Vitest worker. Ensure registerPerformanceMatchers runs after Vitest initialises globals.'
      );
    }
    return;
  }

  vitestExpect.extend(performanceMatchers);
  performanceMatchersRegistered = true;
}

registerPerformanceMatchers();

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeWithinLatencyThreshold(threshold: LatencyThreshold): T;
    toNotRegress(
      baseline: BaselineScenarioMetrics,
      options?: RegressionDetectionOptions
    ): T;
    toNotRegressFromBaseline(
      baselineFile: BaselineFile,
      category: string,
      scenario: string,
      options?: RegressionDetectionOptions
    ): T;
    toMeetPerformanceTarget(target: PerformanceTarget): T;
  }

  interface AsymmetricMatchersContaining {
    toBeWithinLatencyThreshold(threshold: LatencyThreshold): boolean;
    toNotRegress(
      baseline: BaselineScenarioMetrics,
      options?: RegressionDetectionOptions
    ): boolean;
    toNotRegressFromBaseline(
      baselineFile: BaselineFile,
      category: string,
      scenario: string,
      options?: RegressionDetectionOptions
    ): boolean;
    toMeetPerformanceTarget(target: PerformanceTarget): boolean;
  }
}
