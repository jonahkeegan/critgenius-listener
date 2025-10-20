import { existsSync, mkdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import type { LatencySummary } from './latency-benchmark';

export interface BaselineScenarioMetrics {
  mean: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
  min: number;
  standardDeviation: number;
  sampleCount: number;
  unit: 'ms';
}

export type BaselineMetrics = Record<
  string,
  Record<string, BaselineScenarioMetrics>
>;

export interface BaselineEnvironment {
  node: string;
  os: NodeJS.Platform;
  arch: string;
  [key: string]: string;
}

export interface BaselineFile {
  version: string;
  timestamp: string;
  environment: BaselineEnvironment;
  metrics: BaselineMetrics;
}

export interface BaselineManagerOptions {
  baselinePath?: string;
}

const DEFAULT_BASELINE_PATH = resolve(
  process.cwd(),
  '.performance-baselines/baseline.json'
);

const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

function assertSafeObjectKey(value: string, target: string): void {
  if (UNSAFE_OBJECT_KEYS.has(value)) {
    throw new Error(`Refusing to use unsafe ${target} name: "${value}"`);
  }
}

export class BaselineMissingError extends Error {
  constructor(baselinePath: string) {
    super(
      `Performance baseline not found at ${baselinePath}. Run the baseline establishment script to create one.`
    );
  }
}

export class BaselineManager {
  private readonly baselinePath: string;

  constructor(options: BaselineManagerOptions = {}) {
    this.baselinePath = options.baselinePath
      ? resolve(options.baselinePath)
      : DEFAULT_BASELINE_PATH;
  }

  get path(): string {
    return this.baselinePath;
  }

  async load(): Promise<BaselineFile> {
    let fileContents: string;
    try {
      fileContents = await readFile(this.baselinePath, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
        throw new BaselineMissingError(this.baselinePath);
      }
      throw error;
    }

    const parsed = JSON.parse(fileContents) as BaselineFile;

    if (!parsed.metrics) {
      throw new Error('Baseline file is missing metrics data.');
    }

    return {
      ...parsed,
      metrics: cloneMetricsWithValidation(
        parsed.metrics,
        'baseline category',
        'baseline scenario'
      ),
    };
  }

  async save(baseline: BaselineFile): Promise<void> {
    const directory = dirname(this.baselinePath);
    if (!existsSync(directory)) {
      mkdirSync(directory, { recursive: true });
    }

    const serialized = JSON.stringify(baseline, null, 2);
    await writeFile(this.baselinePath, `${serialized}\n`, 'utf8');
  }

  async updateScenario(
    category: string,
    scenario: string,
    summary: LatencySummary
  ): Promise<BaselineFile> {
    assertSafeObjectKey(category, 'baseline category');
    assertSafeObjectKey(scenario, 'baseline scenario');

    const baseline = await this.safeLoad();

    const metrics: BaselineScenarioMetrics = {
      mean: summary.mean,
      p50: summary.p50,
      p95: summary.p95,
      p99: summary.p99,
      max: summary.max,
      min: summary.min,
      standardDeviation: summary.standardDeviation,
      sampleCount: summary.sampleCount,
      unit: 'ms',
    };

    if (!Object.prototype.hasOwnProperty.call(baseline.metrics, category)) {
      baseline.metrics[category] = createEmptyScenarioMetricsContainer();
    }

    const categoryMetrics = baseline.metrics[category]!;
    categoryMetrics[scenario] = metrics;
    baseline.timestamp = new Date().toISOString();

    await this.save(baseline);

    return baseline;
  }

  async safeLoad(): Promise<BaselineFile> {
    try {
      return await this.load();
    } catch (error) {
      if (error instanceof BaselineMissingError) {
        return this.createInitialBaseline();
      }
      throw error;
    }
  }

  private createInitialBaseline(): BaselineFile {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        os: process.platform,
        arch: process.arch,
      },
      metrics: createEmptyMetricsContainer(),
    };
  }
}

export function createScenarioMetricsFromSummary(
  summary: LatencySummary
): BaselineScenarioMetrics {
  return {
    mean: summary.mean,
    p50: summary.p50,
    p95: summary.p95,
    p99: summary.p99,
    max: summary.max,
    min: summary.min,
    standardDeviation: summary.standardDeviation,
    sampleCount: summary.sampleCount,
    unit: 'ms',
  };
}

export function mergeBaselines(
  baseline: BaselineFile,
  overrides: Partial<BaselineFile>
): BaselineFile {
  const sanitizedBaselineMetrics = cloneMetricsWithValidation(
    baseline.metrics,
    'baseline category',
    'baseline scenario'
  );

  const sanitizedOverrideMetrics = overrides.metrics
    ? cloneMetricsWithValidation(
        overrides.metrics,
        'override category',
        'override scenario'
      )
    : undefined;

  if (sanitizedOverrideMetrics) {
    for (const category of Object.keys(sanitizedOverrideMetrics)) {
      const existingCategory = sanitizedBaselineMetrics[category];
      const targetCategory = existingCategory
        ? existingCategory
        : createEmptyScenarioMetricsContainer();

      if (!existingCategory) {
        Object.defineProperty(sanitizedBaselineMetrics, category, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: targetCategory,
        });
      }

      const overrideScenarios = sanitizedOverrideMetrics[category]!;
      for (const scenario of Object.keys(overrideScenarios)) {
        Object.defineProperty(targetCategory, scenario, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: overrideScenarios[scenario]!,
        });
      }
    }
  }

  return {
    ...baseline,
    ...overrides,
    environment: {
      ...baseline.environment,
      ...(overrides.environment ?? {}),
    },
    metrics: sanitizedBaselineMetrics,
  };
}

function createEmptyMetricsContainer(): BaselineMetrics {
  const container: BaselineMetrics = {};
  Object.setPrototypeOf(container, null);
  return container;
}

function createEmptyScenarioMetricsContainer(): Record<
  string,
  BaselineScenarioMetrics
> {
  const container: Record<string, BaselineScenarioMetrics> = {};
  Object.setPrototypeOf(container, null);
  return container;
}

function mapScenarioMetricsToRecord(
  metricsMap: Map<string, BaselineScenarioMetrics>
): Record<string, BaselineScenarioMetrics> {
  const record = createEmptyScenarioMetricsContainer();

  for (const [scenario, metrics] of metricsMap.entries()) {
    record[scenario] = metrics;
  }

  return record;
}

function mapCategoryMetricsToRecord(
  categoryMaps: Map<string, Map<string, BaselineScenarioMetrics>>
): BaselineMetrics {
  const record = createEmptyMetricsContainer();

  for (const [category, metricsMap] of categoryMaps.entries()) {
    record[category] = mapScenarioMetricsToRecord(metricsMap);
  }

  return record;
}

function cloneMetricsWithValidation(
  source: BaselineMetrics | undefined,
  categoryContext: string,
  scenarioContext: string
): BaselineMetrics {
  const categoryMaps = new Map<string, Map<string, BaselineScenarioMetrics>>();

  if (!source) {
    return createEmptyMetricsContainer();
  }

  assertSafePrototypeChain(source, `${categoryContext} container`);

  for (const category of Object.keys(source)) {
    assertSafeObjectKey(category, categoryContext);
    const rawCategoryMetrics = source[category];

    if (
      rawCategoryMetrics !== undefined &&
      (typeof rawCategoryMetrics !== 'object' || rawCategoryMetrics === null)
    ) {
      throw new Error(
        `Invalid ${categoryContext} metrics structure for "${category}".`
      );
    }

    const safeCategoryMetrics = new Map<string, BaselineScenarioMetrics>();

    if (rawCategoryMetrics) {
      assertSafePrototypeChain(
        rawCategoryMetrics,
        `${scenarioContext} container for ${categoryContext} "${category}"`
      );
      for (const scenario of Object.keys(rawCategoryMetrics)) {
        assertSafeObjectKey(scenario, scenarioContext);
        const metricsCandidate = rawCategoryMetrics[scenario];

        if (!isBaselineScenarioMetrics(metricsCandidate)) {
          throw new Error(
            `Invalid ${scenarioContext} metrics structure for "${scenario}".`
          );
        }

        const sanitizedMetrics: BaselineScenarioMetrics = {
          mean: metricsCandidate.mean,
          p50: metricsCandidate.p50,
          p95: metricsCandidate.p95,
          p99: metricsCandidate.p99,
          max: metricsCandidate.max,
          min: metricsCandidate.min,
          standardDeviation: metricsCandidate.standardDeviation,
          sampleCount: metricsCandidate.sampleCount,
          unit: metricsCandidate.unit,
        };

        safeCategoryMetrics.set(scenario, sanitizedMetrics);
      }
    }
    categoryMaps.set(category, safeCategoryMetrics);
  }

  return mapCategoryMetricsToRecord(categoryMaps);
}

function assertSafePrototypeChain(value: object, context: string): void {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const prototype = Object.getPrototypeOf(value);
  if (prototype && prototype !== Object.prototype) {
    throw new Error(`Unsafe prototype chain detected in ${context}.`);
  }
}

function isBaselineScenarioMetrics(
  value: unknown
): value is BaselineScenarioMetrics {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    isFiniteNumber(candidate.mean) &&
    isFiniteNumber(candidate.p50) &&
    isFiniteNumber(candidate.p95) &&
    isFiniteNumber(candidate.p99) &&
    isFiniteNumber(candidate.max) &&
    isFiniteNumber(candidate.min) &&
    isFiniteNumber(candidate.standardDeviation) &&
    isFiniteNumber(candidate.sampleCount) &&
    candidate.unit === 'ms'
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
