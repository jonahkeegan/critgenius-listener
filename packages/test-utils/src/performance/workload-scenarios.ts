import { measureLatency } from './latency-benchmark';
import type { LatencyBenchmarkResult } from './latency-benchmark';

export type ScenarioPhase = 'warmup' | 'measurement';

export interface WorkloadScenario {
  scenarioId: string;
  description: string;
  concurrentStreams: number;
  warmupIterations: number;
  measurementIterations: number;
  /**
   * Optional function used to simulate jitter by introducing additional delay
   * in milliseconds for a particular stream/iteration combination.
   */
  jitterMs?: (context: ScenarioOperationContext) => number;
  metadata?: Record<string, unknown>;
}

export interface ScenarioIterationContext {
  scenario: WorkloadScenario;
  phase: ScenarioPhase;
  iteration: number;
}

export interface ScenarioOperationContext extends ScenarioIterationContext {
  streamIndex: number;
  concurrentStreams: number;
}

export type ScenarioOperation = (
  context: ScenarioOperationContext
) => Promise<void> | void;

export interface ScenarioRunnerOptions {
  warmupIterations?: number;
  measurementIterations?: number;
  beforeIteration?: (context: ScenarioIterationContext) => Promise<void> | void;
  afterIteration?: (context: ScenarioIterationContext) => Promise<void> | void;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function determinePhase(
  warmupsExecuted: number,
  warmupIterations: number
): ScenarioPhase {
  return warmupsExecuted < warmupIterations ? 'warmup' : 'measurement';
}

export async function runWorkloadScenario(
  scenario: WorkloadScenario,
  operation: ScenarioOperation,
  options: ScenarioRunnerOptions = {}
): Promise<LatencyBenchmarkResult> {
  const warmupIterations =
    options.warmupIterations ?? scenario.warmupIterations;
  const measurementIterations =
    options.measurementIterations ?? scenario.measurementIterations;

  if (measurementIterations <= 0) {
    throw new Error('measurementIterations must be greater than zero.');
  }

  let warmupsExecuted = 0;
  let measurementsExecuted = 0;
  let currentPhase: ScenarioPhase = 'warmup';
  let currentIteration = 0;

  const iterationContext: ScenarioIterationContext = {
    scenario,
    phase: currentPhase,
    iteration: currentIteration,
  };

  const result = await measureLatency(
    async () => {
      const baseContext: ScenarioOperationContext = {
        ...iterationContext,
        streamIndex: 0,
        concurrentStreams: scenario.concurrentStreams,
      };

      const operations = Array.from({ length: scenario.concurrentStreams }).map(
        async (_, streamIndex) => {
          const context: ScenarioOperationContext = {
            ...baseContext,
            streamIndex,
          };

          const jitterDuration = scenario.jitterMs?.(context) ?? 0;
          if (jitterDuration > 0) {
            await delay(jitterDuration);
          }

          await operation(context);
        }
      );

      await Promise.all(operations);
    },
    {
      scenarioId: scenario.scenarioId,
      warmupIterations,
      measurementIterations,
      beforeEach: async () => {
        currentPhase = determinePhase(warmupsExecuted, warmupIterations);
        if (currentPhase === 'warmup') {
          currentIteration = warmupsExecuted;
          warmupsExecuted += 1;
        } else {
          currentPhase = 'measurement';
          currentIteration = measurementsExecuted;
          measurementsExecuted += 1;
        }

        iterationContext.phase = currentPhase;
        iterationContext.iteration = currentIteration;

        if (options.beforeIteration) {
          await options.beforeIteration(iterationContext);
        }
      },
      afterEach: async () => {
        if (options.afterIteration) {
          await options.afterIteration(iterationContext);
        }
      },
    }
  );

  return result;
}

export const workloadScenarios: Record<string, WorkloadScenario> = {
  singleStream: {
    scenarioId: 'singleStream',
    description: 'Single audio stream with low jitter and short bursts.',
    concurrentStreams: 1,
    warmupIterations: 5,
    measurementIterations: 25,
    metadata: {
      targetLatencyMs: 120,
    },
  },
  multiStreamBurst: {
    scenarioId: 'multiStreamBurst',
    description:
      'Three concurrent streams representing a party reacting simultaneously with intermittent bursts.',
    concurrentStreams: 3,
    warmupIterations: 8,
    measurementIterations: 30,
    jitterMs: ({ streamIndex, phase }) => {
      if (phase === 'warmup') {
        return 0;
      }
      return streamIndex === 0 ? 5 : streamIndex * 7;
    },
    metadata: {
      targetLatencyMs: 250,
    },
  },
  sustainedMultiStream: {
    scenarioId: 'sustainedMultiStream',
    description:
      'Four concurrent streams over a sustained period mimicking back-to-back dialogue exchanges.',
    concurrentStreams: 4,
    warmupIterations: 10,
    measurementIterations: 40,
    jitterMs: ({ iteration, phase }) => {
      if (phase === 'warmup') {
        return 0;
      }
      return iteration % 5 === 0 ? 15 : 8;
    },
    metadata: {
      targetLatencyMs: 320,
    },
  },
};
