import { expect } from 'vitest';

export interface LatencyAssertionOptions {
  targetMs: number;
  description?: string;
}

export interface ConfidenceAssertionOptions {
  minimum: number;
  description?: string;
}

export interface TranscriptWord {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface TranscriptSegment {
  timestamp: string;
  text: string;
  confidence?: number;
  speaker?: string;
  words?: TranscriptWord[];
}

export const assertLatencyUnder = (
  latencyMs: number,
  { targetMs, description }: LatencyAssertionOptions
): void => {
  expect(latencyMs, description ?? 'latency').toBeLessThanOrEqual(targetMs);
};

export const assertConfidenceAtLeast = (
  confidence: number | undefined,
  { minimum, description }: ConfidenceAssertionOptions
): void => {
  expect(confidence, description ?? 'confidence').toBeGreaterThanOrEqual(
    minimum
  );
};

export const expectTranscriptSegmentsOrdered = (
  segments: TranscriptSegment[]
): void => {
  for (let i = 1; i < segments.length; i += 1) {
    const previousTimestamp = segments[i - 1]?.timestamp;
    const currentTimestamp = segments[i]?.timestamp;
    if (!previousTimestamp || !currentTimestamp) {
      throw new Error('Transcript segment timestamps must be defined');
    }
    const previous = Date.parse(previousTimestamp);
    const current = Date.parse(currentTimestamp);
    expect(current).toBeGreaterThanOrEqual(previous);
  }
};

export const expectWordsWithinBounds = (segment: TranscriptSegment): void => {
  const words = segment.words ?? [];
  for (const word of words) {
    expect(word.start).toBeGreaterThanOrEqual(0);
    expect(word.end).toBeGreaterThanOrEqual(word.start);
    expect(word.text).toBeTruthy();
  }
};

export const assertIsSubset = <T>(
  subset: T[],
  superset: T[],
  description?: string
): void => {
  const missing = subset.filter(item => !superset.includes(item));
  expect(missing, description ?? 'subset comparison').toHaveLength(0);
};

export const normalizeWhitespace = (value: string): string =>
  value.replace(/\s+/g, ' ').trim();
