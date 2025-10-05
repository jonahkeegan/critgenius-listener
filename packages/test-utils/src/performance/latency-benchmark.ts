import { performance } from 'node:perf_hooks';

export type HighResolutionTimer = () => number;

export interface LatencySample {
  iteration: number;
  durationMs: number;
}

export interface LatencySummary {
  sampleCount: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  standardDeviation: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface LatencyBenchmarkOptions {
  /**
   * Unique identifier for the scenario being measured. Used when reporting or
   * comparing against baselines.
   */
  scenarioId?: string;
  /**
   * Number of warmup iterations to execute before collecting measurements. A
   * warm cache and stabilized JIT helps produce more deterministic metrics.
   */
  warmupIterations?: number;
  /**
   * Number of measured iterations. Higher values improve statistical
   * significance but will increase runtime.
   */
  measurementIterations?: number;
  /**
   * Hook executed before each iteration (warmup + measured). Useful for
   * priming stateful dependencies.
   */
  beforeEach?: () => void | Promise<void>;
  /**
   * Hook executed after each iteration (warmup + measured). Useful for cleanup
   * or asserting invariant restoration between measurements.
   */
  afterEach?: () => void | Promise<void>;
  /**
   * Custom timer implementation. Defaults to `performance.now()` when omitted.
   */
  timer?: HighResolutionTimer;
  /**
   * Optional callback invoked after every measured iteration with the raw
   * latency sample.
   */
  onSample?: (sample: LatencySample) => void;
}

export interface LatencyBenchmarkResult {
  scenarioId?: string;
  startedAt: number;
  completedAt: number;
  warmupIterations: number;
  measurementIterations: number;
  samples: LatencySample[];
  summary: LatencySummary;
}

export interface LatencyThreshold {
  /** Maximum acceptable mean latency in milliseconds. */
  mean?: number;
  /** Maximum acceptable p95 latency in milliseconds. */
  p95?: number;
  /** Maximum acceptable p99 latency in milliseconds. */
  p99?: number;
  /** Maximum acceptable maximum latency in milliseconds. */
  max?: number;
}

const DEFAULT_WARMUP_ITERATIONS = 10;
const DEFAULT_MEASUREMENT_ITERATIONS = 50;

function resolveTimer(timer?: HighResolutionTimer): HighResolutionTimer {
  if (timer) {
    return timer;
  }

  return () => performance.now();
}

function calculatePercentile(
  sortedSamples: number[],
  percentile: number
): number {
  if (sortedSamples.length === 0) {
    return 0;
  }

  if (percentile <= 0) {
    return sortedSamples[0]!;
  }

  if (percentile >= 100) {
    return sortedSamples[sortedSamples.length - 1]!;
  }

  const rank = (percentile / 100) * (sortedSamples.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);

  if (lowerIndex === upperIndex) {
    return sortedSamples[lowerIndex]!;
  }

  const weight = rank - lowerIndex;
  const lowerValue = sortedSamples[lowerIndex]!;
  const upperValue = sortedSamples[upperIndex]!;
  return lowerValue * (1 - weight) + upperValue * weight;
}

function calculateStandardDeviation(samples: number[], mean: number): number {
  if (samples.length <= 1) {
    return 0;
  }

  const variance =
    samples.reduce((accumulator, value) => {
      const diff = value - mean;
      return accumulator + diff * diff;
    }, 0) /
    (samples.length - 1);

  return Math.sqrt(variance);
}

export function summarizeLatency(samples: number[]): LatencySummary {
  if (samples.length === 0) {
    return {
      sampleCount: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      standardDeviation: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const sampleCount = sorted.length;
  const min = sorted[0]!;
  const max = sorted[sorted.length - 1]!;
  const sum = sorted.reduce((accumulator, value) => accumulator + value, 0);
  const mean = sum / sampleCount;
  const median = calculatePercentile(sorted, 50);
  const standardDeviation = calculateStandardDeviation(sorted, mean);

  return {
    sampleCount,
    min,
    max,
    mean,
    median,
    standardDeviation,
    p50: calculatePercentile(sorted, 50),
    p95: calculatePercentile(sorted, 95),
    p99: calculatePercentile(sorted, 99),
  };
}

export async function measureLatency(
  operation: () => unknown | Promise<unknown>,
  options: LatencyBenchmarkOptions = {}
): Promise<LatencyBenchmarkResult> {
  const {
    scenarioId,
    warmupIterations = DEFAULT_WARMUP_ITERATIONS,
    measurementIterations = DEFAULT_MEASUREMENT_ITERATIONS,
    beforeEach,
    afterEach,
    timer,
    onSample,
  } = options;

  if (measurementIterations <= 0) {
    throw new Error('measurementIterations must be greater than zero.');
  }

  const resolvedTimer = resolveTimer(timer);

  for (let iteration = 0; iteration < warmupIterations; iteration += 1) {
    if (beforeEach) {
      await beforeEach();
    }
    await operation();
    if (afterEach) {
      await afterEach();
    }
  }

  const samples: LatencySample[] = [];
  const startedAt = Date.now();

  for (let iteration = 0; iteration < measurementIterations; iteration += 1) {
    if (beforeEach) {
      await beforeEach();
    }

    const iterationStart = resolvedTimer();
    await operation();
    const iterationEnd = resolvedTimer();
    const durationMs = iterationEnd - iterationStart;

    const sample: LatencySample = {
      iteration,
      durationMs,
    };

    samples.push(sample);

    if (afterEach) {
      await afterEach();
    }

    if (onSample) {
      onSample(sample);
    }
  }

  const completedAt = Date.now();
  const summary = summarizeLatency(samples.map(sample => sample.durationMs));

  const result: LatencyBenchmarkResult = {
    startedAt,
    completedAt,
    warmupIterations,
    measurementIterations,
    samples,
    summary,
  };

  if (scenarioId !== undefined) {
    result.scenarioId = scenarioId;
  }

  return result;
}

export function assertLatencyWithinThreshold(
  summary: LatencySummary,
  threshold: LatencyThreshold,
  scenarioLabel = 'latency benchmark'
): void {
  if (threshold.mean !== undefined && summary.mean > threshold.mean) {
    throw new Error(
      `${scenarioLabel} mean latency ${summary.mean.toFixed(
        2
      )}ms exceeded threshold ${threshold.mean.toFixed(2)}ms`
    );
  }

  if (threshold.p95 !== undefined && summary.p95 > threshold.p95) {
    throw new Error(
      `${scenarioLabel} p95 latency ${summary.p95.toFixed(
        2
      )}ms exceeded threshold ${threshold.p95.toFixed(2)}ms`
    );
  }

  if (threshold.p99 !== undefined && summary.p99 > threshold.p99) {
    throw new Error(
      `${scenarioLabel} p99 latency ${summary.p99.toFixed(
        2
      )}ms exceeded threshold ${threshold.p99.toFixed(2)}ms`
    );
  }

  if (threshold.max !== undefined && summary.max > threshold.max) {
    throw new Error(
      `${scenarioLabel} max latency ${summary.max.toFixed(
        2
      )}ms exceeded threshold ${threshold.max.toFixed(2)}ms`
    );
  }
}

export type LatencySummarySelector = (summary: LatencySummary) => number;

export const LATENCY_SUMMARY_SELECTORS: Record<
  keyof LatencyThreshold,
  LatencySummarySelector
> = {
  mean: summary => summary.mean,
  p95: summary => summary.p95,
  p99: summary => summary.p99,
  max: summary => summary.max,
};
