import {
  createScenarioMetricsFromSummary,
  measureLatency,
  runWorkloadScenario,
  workloadScenarios,
} from '@critgenius/test-utils/performance';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateAudioFrameProcessing(sampleSize) {
  const frame = new Float32Array(sampleSize);
  for (let index = 0; index < frame.length; index += 1) {
    frame[index] = Math.sin(index / 10);
  }

  let accumulator = 0;
  for (const value of frame) {
    accumulator += value * 0.97;
  }

  if (accumulator > Number.MAX_SAFE_INTEGER) {
    throw new Error('Accumulator overflow');
  }
}

async function simulateTranscriptionStream(streamIndex) {
  const networkLatency = 40 + streamIndex * 12;
  const processingLatency = 60 + streamIndex * 14;
  await delay(networkLatency + processingLatency);
}

async function simulateEndToEnd(streamIndex) {
  const audio = 35 + streamIndex * 5;
  const transcription = 220 + streamIndex * 12;
  const mapping = 60 + streamIndex * 8;
  await delay(audio + transcription + mapping);
}

function createProfiles(count) {
  return Array.from({ length: count }).map((_, index) => ({
    id: `speaker-${index}`,
    embedding: Array.from({ length: 64 }).map((__, pos) =>
      Math.sin(pos + index)
    ),
  }));
}

function createCharacters(count) {
  return Array.from({ length: count }).map((_, index) => ({
    id: `character-${index}`,
    tags: ['tank', 'healer', 'support', 'dps'].slice(0, (index % 4) + 1),
  }));
}

function cosineSimilarity(a, b) {
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

async function mapSpeakersToCharacters(speakers, characters) {
  for (const speaker of speakers) {
    let bestMatch = null;

    for (const character of characters) {
      const score = cosineSimilarity(
        speaker.embedding,
        character.tags.map(tag => tag.length)
      );

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { score, characterId: character.id };
      }
    }

    if (!bestMatch) {
      throw new Error('Unable to compute speaker mapping baseline');
    }
  }
}

async function runAudioBenchmarks() {
  const audioSingle = await measureLatency(
    () => simulateAudioFrameProcessing(1024),
    {
      scenarioId: 'audioCapture:singleStream',
      warmupIterations: 6,
      measurementIterations: 30,
    }
  );

  const burstScenario = workloadScenarios.multiStreamBurst;
  if (!burstScenario) {
    throw new Error('multiStreamBurst workload scenario missing');
  }

  const audioBurst = await runWorkloadScenario(burstScenario, async context => {
    await simulateAudioFrameProcessing(512 + context.streamIndex * 128);
  });

  return {
    singleStream: audioSingle,
    multiStreamBurst: audioBurst,
  };
}

async function runTranscriptionBenchmarks() {
  const transcriptionSingle = await measureLatency(
    () => simulateTranscriptionStream(0),
    {
      scenarioId: 'transcription:singleStream',
      warmupIterations: 5,
      measurementIterations: 24,
    }
  );

  const sustainedScenario = workloadScenarios.sustainedMultiStream;
  if (!sustainedScenario) {
    throw new Error('sustainedMultiStream workload scenario missing');
  }

  const transcriptionSustained = await runWorkloadScenario(
    sustainedScenario,
    async context => simulateTranscriptionStream(context.streamIndex)
  );

  return {
    singleStream: transcriptionSingle,
    sustainedMultiStream: transcriptionSustained,
  };
}

async function runEndToEndBenchmarks() {
  const endToEndSingle = await measureLatency(
    () => simulateEndToEnd(0),
    {
      scenarioId: 'endToEnd:singleStream',
      warmupIterations: 3,
      measurementIterations: 18,
    }
  );

  const sustainedScenario = workloadScenarios.sustainedMultiStream;
  if (!sustainedScenario) {
    throw new Error('sustainedMultiStream workload scenario missing');
  }

  const endToEndSustained = await runWorkloadScenario(
    sustainedScenario,
    async context => simulateEndToEnd(context.streamIndex)
  );

  return {
    singleStream: endToEndSingle,
    sustainedMultiStream: endToEndSustained,
  };
}

async function runSpeakerMappingBenchmarks() {
  const speakers = createProfiles(6);
  const characters = createCharacters(8);

  const mappingSingle = await measureLatency(
    () => mapSpeakersToCharacters(speakers, characters),
    {
      scenarioId: 'speakerMapping:singleStream',
      warmupIterations: 4,
      measurementIterations: 22,
    }
  );

  const burstScenario = workloadScenarios.multiStreamBurst;
  if (!burstScenario) {
    throw new Error('multiStreamBurst workload scenario missing');
  }

  const mappingBurst = await runWorkloadScenario(
    burstScenario,
    () => mapSpeakersToCharacters(speakers, characters)
  );

  return {
    singleStream: mappingSingle,
    multiStreamBurst: mappingBurst,
  };
}

function convertToBaselineMetrics(benchmarks) {
  return Object.fromEntries(
    Object.entries(benchmarks).map(([scenario, result]) => [
      scenario,
      createScenarioMetricsFromSummary(result.summary),
    ])
  );
}

export async function collectAudioMetrics() {
  return convertToBaselineMetrics(await runAudioBenchmarks());
}

export async function collectTranscriptionMetrics() {
  return convertToBaselineMetrics(await runTranscriptionBenchmarks());
}

export async function collectEndToEndMetrics() {
  return convertToBaselineMetrics(await runEndToEndBenchmarks());
}

export async function collectSpeakerMappingMetrics() {
  return convertToBaselineMetrics(await runSpeakerMappingBenchmarks());
}

export async function collectBaselineMetrics() {
  return {
    audioCapture: await collectAudioMetrics(),
    transcription: await collectTranscriptionMetrics(),
    endToEnd: await collectEndToEndMetrics(),
    speakerMapping: await collectSpeakerMappingMetrics(),
  };
}

export async function runAllBenchmarks() {
  return {
    audioCapture: await runAudioBenchmarks(),
    transcription: await runTranscriptionBenchmarks(),
    endToEnd: await runEndToEndBenchmarks(),
    speakerMapping: await runSpeakerMappingBenchmarks(),
  };
}
