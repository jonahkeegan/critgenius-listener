export type UserRole = 'player' | 'dm' | 'observer';

export interface TestUser {
  id: string;
  displayName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestSessionParticipant {
  user: TestUser;
  characterName: string;
  isSpeaking: boolean;
  joinedAt: Date;
}

export interface TestSession {
  sessionId: string;
  title: string;
  description?: string;
  status: 'scheduled' | 'running' | 'completed';
  startedAt: Date;
  endedAt?: Date;
  participants: TestSessionParticipant[];
}

export interface TestTranscriptWord {
  start: number;
  end: number;
  text: string;
  confidence: number;
  speakerId?: string;
}

export interface TestTranscriptSegment {
  sessionId: string;
  segmentId: string;
  speakerId: string;
  speakerName?: string;
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: string;
  words: TestTranscriptWord[];
}

export interface TestAudioChunk {
  sessionId: string;
  chunkId: string;
  sequence: number;
  payload: Uint8Array;
  sampleRate: number;
  encoding: 'pcm_s16le' | 'wav' | 'flac';
  capturedAt: Date;
}

export interface TestTranscript {
  sessionId: string;
  segments: TestTranscriptSegment[];
  createdAt: Date;
  updatedAt: Date;
}
