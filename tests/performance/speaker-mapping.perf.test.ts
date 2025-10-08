import { describe, expect, it } from 'vitest';

import {
  measureLatency,
  runWorkloadScenario,
  workloadScenarios,
} from '@critgenius/test-utils/performance';
import './setup';

interface SpeakerProfile {
  id: string;
  embedding: number[];
}

interface CharacterProfile {
  id: string;
  tags: string[];
}

function createProfiles(count: number): SpeakerProfile[] {
  return Array.from({ length: count }).map((_, index) => ({
    id: `speaker-${index}`,
    embedding: Array.from({ length: 64 }).map((__, position) =>
      Math.sin(position + index)
    ),
  }));
}

function createCharacters(count: number): CharacterProfile[] {
  return Array.from({ length: count }).map((_, index) => ({
    id: `character-${index}`,
    tags: ['tank', 'healer', 'support', 'dps'].slice(0, (index % 4) + 1),
  }));
}

function computeSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < a.length; index += 1) {
    const aValue = a[index] ?? 0;
    const bValue = b[index] ?? 0;
    dot += aValue * bValue;
    magnitudeA += aValue * aValue;
    magnitudeB += bValue * bValue;
  }

  const denominator = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB) || 1;
  return dot / denominator;
}

async function mapSpeakersToCharacters(
  speakers: SpeakerProfile[],
  characters: CharacterProfile[]
): Promise<Map<string, string>> {
  const assignments = new Map<string, string>();

  for (const speaker of speakers) {
    let bestMatch: { characterId: string; score: number } | null = null;

    for (const character of characters) {
      const score = computeSimilarity(
        speaker.embedding,
        character.tags.map(tag => tag.length)
      );
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { characterId: character.id, score };
      }
    }

    if (bestMatch) {
      assignments.set(speaker.id, bestMatch.characterId);
    }
  }

  return assignments;
}

describe('Speaker mapping performance benchmarks', () => {
  it('should assign speakers to characters under 150ms p95 latency', async () => {
    const speakers = createProfiles(4);
    const characters = createCharacters(6);

    const result = await measureLatency(
      async () => {
        await mapSpeakersToCharacters(speakers, characters);
      },
      {
        scenarioId: 'speaker-mapping-single-stream',
        warmupIterations: 2,
        measurementIterations: 8,
      }
    );

    expect(result).toMeetPerformanceTarget({ p95: 150, max: 220 });
  });

  it('should maintain burst mapping latency within 200ms p95', async () => {
    const scenario = workloadScenarios.multiStreamBurst;
    if (!scenario) {
      throw new Error('multiStreamBurst scenario is not defined');
    }

    const speakers = createProfiles(8);
    const characters = createCharacters(10);

    const result = await runWorkloadScenario(
      scenario,
      async () => {
        await mapSpeakersToCharacters(speakers, characters);
      },
      {
        warmupIterations: 2,
        measurementIterations: 6,
      }
    );

    expect(result).toMeetPerformanceTarget({ p95: 200, max: 260 });
  });
});
