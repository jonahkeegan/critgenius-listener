import { Buffer } from 'node:buffer';
import type { TestAudioChunk } from '../factories';
import { defaultFixtureLoader } from './fixture-loader';

interface AudioFixtureFile {
  encoding: TestAudioChunk['encoding'];
  sampleRate: number;
  payloadBase64: string;
}

const AUDIO_FIXTURE_PATH = 'audio.sample.json';

export const loadSampleAudioFixture = async (): Promise<TestAudioChunk> => {
  const data =
    await defaultFixtureLoader.loadJson<AudioFixtureFile>(AUDIO_FIXTURE_PATH);
  return {
    sessionId: 'session-fixture',
    chunkId: 'chunk-fixture',
    sequence: 1,
    payload: decodeBase64(data.payloadBase64),
    sampleRate: data.sampleRate,
    encoding: data.encoding,
    capturedAt: new Date('2024-01-03T20:00:00.000Z'),
  };
};

export const createSilenceChunk = (durationMs: number): Uint8Array => {
  const sampleRate = 16_000;
  const totalSamples = Math.round((durationMs / 1_000) * sampleRate);
  return new Uint8Array(totalSamples).fill(0);
};

const decodeBase64 = (value: string): Uint8Array =>
  new Uint8Array(Buffer.from(value, 'base64'));
