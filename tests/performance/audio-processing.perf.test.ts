import { describe, expect, it } from 'vitest';

import {
  measureLatency,
  runWorkloadScenario,
  workloadScenarios,
} from '@critgenius/test-utils/performance';

function generateAudioFrame(size: number): Float32Array {
  const frame = new Float32Array(size);
  for (let index = 0; index < frame.length; index += 1) {
    frame[index] = Math.sin(index / 12);
  }
  return frame;
}

async function simulateAudioProcessing(frame: Float32Array): Promise<void> {
  let accumulator = 0;
  for (const value of frame) {
    accumulator += value * 0.97;
  }

  if (accumulator > Number.MAX_SAFE_INTEGER) {
    throw new Error('Accumulator overflow');
  }
}

describe('Audio processing performance benchmarks', () => {
  it('should keep single stream audio frame preprocessing under p95 50ms', async () => {
    const frame = generateAudioFrame(1024);

    const result = await measureLatency(
      async () => {
        await simulateAudioProcessing(frame);
      },
      {
        scenarioId: 'audio-single-stream-preprocess',
        warmupIterations: 3,
        measurementIterations: 12,
      }
    );

    expect(result).toBeWithinLatencyThreshold({ p95: 50, max: 80 });
  });

  it('should maintain audio mixing latency below 120ms for burst scenarios', async () => {
    const scenario = workloadScenarios.multiStreamBurst;
    if (!scenario) {
      throw new Error('multiStreamBurst scenario is not defined');
    }

    const result = await runWorkloadScenario(
      scenario,
      async context => {
        const baseSize = 512 + context.streamIndex * 128;
        const frame = generateAudioFrame(baseSize);
        await simulateAudioProcessing(frame);
      },
      {
        warmupIterations: 2,
        measurementIterations: 6,
      }
    );

    expect(result).toMeetPerformanceTarget({ p95: 120, max: 180 });
  });
});
