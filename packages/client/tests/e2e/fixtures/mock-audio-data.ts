export const mockTranscriptEvent = {
  sessionId: 'session-e2e-001',
  text: 'The party advances into the ancient ruins.',
  speaker: 'GM',
  timestamp: '2025-01-01T12:00:00.000Z',
  confidence: 0.92,
  isFinal: false,
  words: [
    { start: 0, end: 450, text: 'The', confidence: 0.91 },
    { start: 450, end: 900, text: 'party', confidence: 0.93 },
    { start: 900, end: 1350, text: 'advances', confidence: 0.9 },
    { start: 1350, end: 1800, text: 'into', confidence: 0.92 },
    { start: 1800, end: 2250, text: 'the', confidence: 0.9 },
    { start: 2250, end: 2850, text: 'ancient', confidence: 0.94 },
    { start: 2850, end: 3420, text: 'ruins.', confidence: 0.9 },
  ],
} as const;

export const mockProcessingUpdate = {
  uploadId: 'upload-e2e-01',
  status: 'processing' as const,
  progress: 65,
  message: 'Normalizing audio for transcription.',
};
