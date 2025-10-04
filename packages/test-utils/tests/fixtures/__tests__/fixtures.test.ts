import { describe, expect, it } from 'vitest';

import {
  defaultFixtureLoader,
  loadSampleAudioFixture,
  loadTranscriptFixture,
} from '../../../src/fixtures';

import { assertLatencyUnder } from '../../../src/helpers/assertion-helpers';

describe('fixtures', () => {
  it('loads transcript fixture with caching', async () => {
    defaultFixtureLoader.clearCache();
    const transcript = await loadTranscriptFixture();
    const again = await loadTranscriptFixture();

    expect(transcript.sessionId).toBe('session-fixture');
    expect(again).toBe(transcript);
  });

  it('returns sample audio chunk', async () => {
    const chunk = await loadSampleAudioFixture();
    expect(chunk.payload.byteLength).toBeGreaterThan(0);
    expect(chunk.sampleRate).toBe(16_000);
  });

  it('supports assertion helper with fixture data', async () => {
    const chunk = await loadSampleAudioFixture();
    assertLatencyUnder(chunk.payload.length, { targetMs: 800 });
  });
});
