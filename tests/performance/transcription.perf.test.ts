import { beforeAll, describe, expect, it } from 'vitest';

import {
  BaselineManager,
  measureLatency,
  runWorkloadScenario,
  workloadScenarios,
} from '@critgenius/test-utils/performance';
import type { BaselineFile } from '@critgenius/test-utils/performance';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function simulateTranscriptionRequest(
  concurrencyIndex: number
): Promise<void> {
  const networkLatency = 40 + concurrencyIndex * 10;
  const processingTime = 60 + Math.random() * 25;
  await delay(networkLatency + processingTime);
}

let baseline: BaselineFile;

beforeAll(async () => {
  const manager = new BaselineManager();
  baseline = await manager.load();
});

describe('Transcription performance benchmarks', () => {
  it('should deliver interim transcription updates under 400ms p95 latency', async () => {
    const result = await measureLatency(
      async () => {
        await simulateTranscriptionRequest(0);
      },
      {
        scenarioId: 'transcription-single-stream',
        warmupIterations: 3,
        measurementIterations: 8,
      }
    );

    expect(result).toMeetPerformanceTarget({ p95: 400, max: 480 });
  });

  it('should avoid regressions versus baseline for sustained multi-stream transcription', async () => {
    const scenario = workloadScenarios.sustainedMultiStream;
    if (!scenario) {
      throw new Error('sustainedMultiStream scenario is not defined');
    }

    const result = await runWorkloadScenario(
      scenario,
      async context => {
        await simulateTranscriptionRequest(context.streamIndex);
      },
      {
        warmupIterations: 3,
        measurementIterations: 8,
      }
    );

    expect(result).toNotRegressFromBaseline(
      baseline,
      'transcription',
      'sustainedMultiStream',
      {
        tolerancePercent: 15,
        hardLatencyThresholdMs: 500,
      }
    );
  });
});
