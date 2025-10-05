import type { BaselineScenarioMetrics, BaselineFile } from './baseline-manager';
import type { LatencySummary } from './latency-benchmark';

export type RegressionMetric = 'mean' | 'p95' | 'p99' | 'max';

export interface RegressionDetectionOptions {
  /**
   * Allowed percentage degradation compared to the baseline. Values above this
   * threshold are treated as regressions.
   */
  tolerancePercent?: number;
  /**
   * Hard latency ceiling in milliseconds. Any metric exceeding this ceiling is
   * flagged regardless of relative improvement or degradation.
   */
  hardLatencyThresholdMs?: number;
  /**
   * Metrics to evaluate when comparing current results with the baseline.
   * Defaults to mean, p95, p99, and max latency.
   */
  metrics?: RegressionMetric[];
  /**
   * Optional identifier for logging or reporter output. Typically matches the
   * scenario or benchmark ID.
   */
  scenarioId?: string;
}

export interface RegressionMetricDelta {
  metric: RegressionMetric;
  baselineValue: number;
  currentValue: number;
  deltaMs: number;
  deltaPercent: number;
  regression: boolean;
}

export interface RegressionResult {
  scenarioId?: string;
  regressionDetected: boolean;
  metrics: RegressionMetricDelta[];
  breaches: string[];
}

const DEFAULT_TOLERANCE_PERCENT = 10;
const DEFAULT_METRICS: RegressionMetric[] = ['mean', 'p95', 'p99', 'max'];

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function calculateMetricDelta(
  metric: RegressionMetric,
  current: LatencySummary,
  baseline: BaselineScenarioMetrics
): RegressionMetricDelta {
  const currentValue = current[metric];
  const baselineValue = baseline[metric];
  const deltaMs = currentValue - baselineValue;
  const deltaPercent = baselineValue
    ? (deltaMs / baselineValue) * 100
    : currentValue === 0
      ? 0
      : 100;

  return {
    metric,
    baselineValue,
    currentValue,
    deltaMs,
    deltaPercent,
    regression: deltaMs > 0,
  };
}

export function detectRegression(
  current: LatencySummary,
  baseline: BaselineScenarioMetrics,
  options: RegressionDetectionOptions = {}
): RegressionResult {
  const {
    tolerancePercent = DEFAULT_TOLERANCE_PERCENT,
    hardLatencyThresholdMs,
    metrics = DEFAULT_METRICS,
    scenarioId,
  } = options;

  const breaches: string[] = [];

  const comparisons = metrics.map(metric => {
    const delta = calculateMetricDelta(metric, current, baseline);

    if (delta.regression && delta.deltaPercent > tolerancePercent) {
      breaches.push(
        `${metric} degraded by ${formatPercent(delta.deltaPercent)} (baseline ${baseline[
          metric
        ].toFixed(2)}ms → current ${current[metric].toFixed(2)}ms)`
      );
    }

    if (
      hardLatencyThresholdMs !== undefined &&
      current[metric] > hardLatencyThresholdMs
    ) {
      breaches.push(
        `${metric} latency ${current[metric].toFixed(
          2
        )}ms exceeds hard threshold ${hardLatencyThresholdMs.toFixed(2)}ms`
      );
    }

    return delta;
  });

  const result: RegressionResult = {
    regressionDetected: breaches.length > 0,
    metrics: comparisons,
    breaches,
  };

  if (scenarioId !== undefined) {
    result.scenarioId = scenarioId;
  }

  return result;
}

export function detectRegressionFromBaseline(
  baselineFile: BaselineFile,
  category: string,
  scenario: string,
  current: LatencySummary,
  options: RegressionDetectionOptions = {}
): RegressionResult {
  const categoryMetrics = baselineFile.metrics[category];
  if (!categoryMetrics) {
    throw new Error(
      `Baseline missing category "${category}". Update baseline to include this category before regression checks.`
    );
  }

  const baselineScenario = categoryMetrics[scenario];
  if (!baselineScenario) {
    throw new Error(
      `Baseline missing scenario "${scenario}" in category "${category}". Update baseline before regression checks.`
    );
  }

  return detectRegression(current, baselineScenario, {
    ...options,
    scenarioId: options.scenarioId ?? scenario,
  });
}
