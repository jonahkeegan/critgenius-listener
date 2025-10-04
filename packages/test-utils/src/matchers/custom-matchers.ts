import { expect } from 'vitest';
import type { TestTranscript, TestTranscriptSegment } from '../factories/types';

export interface TranscriptMatcherOptions {
  allowEmptyText?: boolean;
}

const formatSegment = (segment: TestTranscriptSegment): string =>
  `${segment.segmentId} (${segment.speakerId})`;

const isTranscriptSegment = (
  value: unknown
): value is TestTranscriptSegment => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const segment = value as Partial<TestTranscriptSegment>;
  return (
    typeof segment.segmentId === 'string' &&
    typeof segment.sessionId === 'string' &&
    typeof segment.speakerId === 'string' &&
    typeof segment.text === 'string'
  );
};

const createResult = (pass: boolean, message: string) => ({
  pass,
  message: () => message,
});

const toBeValidTranscript = (
  received: unknown,
  options: TranscriptMatcherOptions = {}
) => {
  if (!received || typeof received !== 'object') {
    return createResult(false, 'Expected transcript object');
  }
  const transcript = received as Partial<TestTranscript>;
  if (!transcript.sessionId) {
    return createResult(false, 'Transcript missing sessionId');
  }
  if (!Array.isArray(transcript.segments)) {
    return createResult(false, 'Transcript missing segments array');
  }

  for (const segment of transcript.segments) {
    if (!isTranscriptSegment(segment)) {
      return createResult(
        false,
        `Invalid segment encountered: ${JSON.stringify(segment)}`
      );
    }
    if (!options.allowEmptyText && segment.text.trim().length === 0) {
      return createResult(false, `Segment ${segment.segmentId} has empty text`);
    }
  }

  return createResult(true, 'Transcript is valid');
};

const toHaveSpeakerLabel = (
  received: TestTranscriptSegment,
  speaker: string
): { pass: boolean; message: () => string } => {
  if (!isTranscriptSegment(received)) {
    return createResult(false, 'Expected transcript segment');
  }
  if (received.speakerName === speaker || received.speakerId === speaker) {
    return createResult(true, 'Segment contains expected speaker label');
  }

  return createResult(
    false,
    `Expected ${formatSegment(received)} to include speaker ${speaker}`
  );
};

const toMeetLatencyTarget = (
  received: number,
  targetMs: number
): { pass: boolean; message: () => string } => {
  if (typeof received !== 'number') {
    return createResult(false, 'Latency must be a number');
  }
  if (received <= targetMs) {
    return createResult(true, 'Latency within acceptable bounds');
  }
  return createResult(
    false,
    `Expected latency <= ${targetMs}ms but received ${received}ms`
  );
};

const toHaveAccuracyAbove = (
  received: number,
  threshold: number
): { pass: boolean; message: () => string } => {
  if (typeof received !== 'number') {
    return createResult(false, 'Accuracy must be numeric');
  }
  if (received >= threshold) {
    return createResult(true, 'Accuracy meets threshold');
  }
  return createResult(
    false,
    `Expected accuracy >= ${threshold} but received ${received}`
  );
};

export const customMatchers = {
  toBeValidTranscript,
  toHaveSpeakerLabel,
  toMeetLatencyTarget,
  toHaveAccuracyAbove,
};

export type CustomMatchers = typeof customMatchers;

export const registerMatchers = (): void => {
  expect.extend(customMatchers);
};
