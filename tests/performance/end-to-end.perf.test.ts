import { describe, expect, it } from 'vitest';

import {
  measureLatency,
  runWorkloadScenario,
  workloadScenarios,
} from '@critgenius/test-utils/performance';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateEndToEndPipeline(
  concurrencyIndex: number
): Promise<void> {
  const audioProcessing = 40 + concurrencyIndex * 5;
  const transcription = 220 + Math.random() * 40;
  const speakerMapping = 60 + Math.random() * 20;
  await delay(audioProcessing + transcription + speakerMapping);
}

describe('End-to-end workflow performance benchmarks', () => {
  it('should keep single stream end-to-end latency under 500ms p95', async () => {
    const result = await measureLatency(
      async () => {
        await simulateEndToEndPipeline(0);
      },
      {
        scenarioId: 'end-to-end-single-stream',
        warmupIterations: 2,
        measurementIterations: 8,
      }
    );

    expect(result).toBeWithinLatencyThreshold({ p95: 500, max: 580 });
  });

  it('should keep sustained multi-stream workflows under 520ms p95 latency', async () => {
    const scenario = workloadScenarios.sustainedMultiStream;
    if (!scenario) {
      throw new Error('sustainedMultiStream scenario is not defined');
    }

    const result = await runWorkloadScenario(
      scenario,
      async context => {
        await simulateEndToEndPipeline(context.streamIndex);
      },
      {
        warmupIterations: 2,
        measurementIterations: 6,
      }
    );

    expect(result).toMeetPerformanceTarget({ p95: 520, max: 600 });
  });
});
