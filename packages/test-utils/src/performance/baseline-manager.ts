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

    return parsed;
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

    if (!baseline.metrics[category]) {
      baseline.metrics[category] = {};
    }

    baseline.metrics[category]![scenario] = metrics;
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
      metrics: {},
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
  return {
    ...baseline,
    ...overrides,
    environment: {
      ...baseline.environment,
      ...(overrides.environment ?? {}),
    },
    metrics: {
      ...baseline.metrics,
      ...(overrides.metrics ?? {}),
    },
  };
}
