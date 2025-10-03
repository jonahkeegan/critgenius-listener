import { describe, expect, it } from 'vitest';

import { createTestTranscript } from '../src/factories';

describe('custom matchers', () => {
  it('validates transcript structure', () => {
    const transcript = createTestTranscript();
    expect(transcript).toBeValidTranscript();
  });

  it('checks speaker label', () => {
    const transcript = createTestTranscript();
    const firstSegment = transcript.segments[0];
    if (!firstSegment) {
      throw new Error('Expected transcript to contain at least one segment');
    }
    expect(firstSegment).toHaveSpeakerLabel(firstSegment.speakerId);
  });

  it('checks latency threshold', () => {
    expect(450).toMeetLatencyTarget(500);
  });

  it('checks accuracy threshold', () => {
    expect(0.92).toHaveAccuracyAbove(0.9);
  });
});
