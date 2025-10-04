import { describe, expect, it } from 'vitest';

import {
  TestAudioChunkFactory,
  TestSessionFactory,
  TestTranscriptFactory,
  createTestUser,
} from '../../../src/factories';

import { normalizeWhitespace } from '../../../src/helpers/assertion-helpers';

describe('factories', () => {
  it('creates user with deterministic fields', () => {
    const user = createTestUser();
    expect(user.id).toMatch(/^user-/);
    expect(user.displayName).toContain('Test User');
  });

  it('builds session with participants', () => {
    const session = new TestSessionFactory().build();
    expect(session.participants.length).toBeGreaterThanOrEqual(2);
    expect(session.sessionId).toMatch(/^session-/);
  });

  it('builds transcript with segments', () => {
    const transcript = new TestTranscriptFactory().build();
    expect(transcript.segments.length).toBeGreaterThan(0);
    expect(normalizeWhitespace(transcript.segments[0]?.text ?? '')).not.toBe(
      ''
    );
  });

  it('builds audio chunk with payload', () => {
    const chunk = new TestAudioChunkFactory().build();
    expect(chunk.payload.length).toBeGreaterThan(0);
    expect(chunk.encoding).toBe('pcm_s16le');
  });
});
