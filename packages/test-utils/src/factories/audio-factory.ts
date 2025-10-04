import { BaseFactory, createSequentialId } from './base-factory';
import type { TestAudioChunk } from './types';

const createPayload = (sequence: number): Uint8Array => {
  const length = 320;
  const buffer = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    buffer[i] = (sequence + i) % 255;
  }
  return buffer;
};

export class TestAudioChunkFactory extends BaseFactory<TestAudioChunk> {
  protected create(sequence: number): TestAudioChunk {
    const sessionId = createSequentialId('session', Math.ceil(sequence / 10));
    const payload = createPayload(sequence);

    return {
      sessionId,
      chunkId: createSequentialId('chunk', sequence),
      sequence,
      payload,
      sampleRate: 16_000,
      encoding: 'pcm_s16le',
      capturedAt: new Date(Date.UTC(2024, 0, 4, 14, Math.floor(sequence / 60))),
    };
  }
}

export const testAudioChunkFactory = () => new TestAudioChunkFactory();

export const createTestAudioChunk = (
  overrides: Partial<TestAudioChunk> = {}
): TestAudioChunk => testAudioChunkFactory().build(overrides);
