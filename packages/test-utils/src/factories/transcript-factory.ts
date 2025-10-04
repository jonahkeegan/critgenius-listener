import { BaseFactory, createSequentialId } from './base-factory';
import type {
  TestTranscript,
  TestTranscriptSegment,
  TestTranscriptWord,
} from './types';

export class TestTranscriptFactory extends BaseFactory<TestTranscript> {
  protected create(sequence: number): TestTranscript {
    const sessionId = createSequentialId('session', sequence);
    const createdAt = new Date(Date.UTC(2024, 0, 3, 20, sequence % 60));
    const segments = this.createSegments(sessionId, sequence);

    return {
      sessionId,
      segments,
      createdAt,
      updatedAt: createdAt,
    };
  }

  private createSegments(
    sessionId: string,
    sequence: number
  ): TestTranscriptSegment[] {
    const segmentCount = 3 + (sequence % 3);
    return Array.from({ length: segmentCount }, (_, index) => {
      const segmentId = createSequentialId(
        'segment',
        sequence * 10 + index + 1
      );
      const speakerId = createSequentialId('speaker', (index % 4) + 1);
      const baseTimestamp = new Date(
        Date.UTC(2024, 0, 3, 20, Math.floor(index / 2), (index % 2) * 30)
      ).toISOString();
      const words = this.createWords(index + 3);

      return {
        sessionId,
        segmentId,
        speakerId,
        speakerName: `Speaker ${speakerId.split('-').pop()}`,
        text: words.map(word => word.text).join(' '),
        isFinal: index % 2 === 0,
        confidence: 0.8 + (index % 3) * 0.05,
        timestamp: baseTimestamp,
        words,
      };
    });
  }

  private createWords(count: number): TestTranscriptWord[] {
    return Array.from({ length: count }, (_, index) => {
      const start = index * 400;
      const duration = 200 + (index % 3) * 50;
      return {
        start,
        end: start + duration,
        text: `word-${index + 1}`,
        confidence: 0.75 + (index % 2) * 0.1,
        speakerId: index % 2 === 0 ? 'speaker-1' : 'speaker-2',
      };
    });
  }
}

export const testTranscriptFactory = () => new TestTranscriptFactory();

export const createTestTranscript = (
  overrides: Partial<TestTranscript> = {}
): TestTranscript => testTranscriptFactory().build(overrides);
