import type {
  CustomMatchers,
  TranscriptMatcherOptions,
} from './custom-matchers';
import type { TestTranscriptSegment } from '../factories/types';

declare module 'vitest' {
  interface Assertion<T = any> {
    toBeValidTranscript(options?: TranscriptMatcherOptions): this;
    toHaveSpeakerLabel(speaker: string): this;
    toMeetLatencyTarget(targetMs: number): this;
    toHaveAccuracyAbove(threshold: number): this;
  }

  interface AsymmetricMatchersContaining {
    toBeValidTranscript(options?: TranscriptMatcherOptions): unknown;
    toHaveSpeakerLabel(speaker: string): unknown;
    toMeetLatencyTarget(targetMs: number): unknown;
    toHaveAccuracyAbove(threshold: number): unknown;
  }
}

export type RegisteredCustomMatchers = CustomMatchers;
export type TranscriptMatcherSegment = TestTranscriptSegment;
