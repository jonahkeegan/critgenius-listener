import { describe, expect, it } from 'vitest';
import { createMockAssemblyAIScenario } from '../../src/integration/assemblyai/assemblyAITestScenarios';

const BASE_CONFIG = {
  apiKey: 'mock-api-key-12345678901234567890123456789012',
  sampleRate: 16_000,
};

describe('createMockAssemblyAIScenario', () => {
  it('returns frozen copies of audio chunks without mutating the underlying store', async () => {
    const scenario = createMockAssemblyAIScenario('chunk-snapshot');
    const connector = new scenario.Connector('session-1', BASE_CONFIG, {});

    await connector.connect();

    const snapshotBefore = scenario.getAudioChunks('session-1');
    expect(Array.isArray(snapshotBefore)).toBe(true);
    expect(Object.isFrozen(snapshotBefore)).toBe(true);
    expect(snapshotBefore).toHaveLength(0);

    connector.sendAudioChunk(new Uint8Array([1, 2, 3]));

    const snapshotAfter = scenario.getAudioChunks('session-1');
    expect(snapshotAfter).toHaveLength(1);
    expect(snapshotAfter[0]).toBeInstanceOf(Uint8Array);

    // Ensure the original snapshot remains unchanged and detached from the underlying store.
    expect(snapshotBefore).toHaveLength(0);
  });
});
