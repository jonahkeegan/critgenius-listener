import type { TestTranscript } from '../factories';
import { defaultFixtureLoader } from './fixture-loader';

const TRANSCRIPT_FIXTURE_PATH = 'transcript.sample.json';

export const loadTranscriptFixture = async (): Promise<TestTranscript> =>
  defaultFixtureLoader.loadJson<TestTranscript>(TRANSCRIPT_FIXTURE_PATH);

export const getTranscriptSummary = (transcript: TestTranscript): string => {
  const totalWords = transcript.segments.reduce(
    (acc, segment) => acc + segment.words.length,
    0
  );
  return `${transcript.segments.length} segments / ${totalWords} words`;
};
