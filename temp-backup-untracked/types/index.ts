/**
 * Shared TypeScript type definitions for CritGenius Listener
 */

// Audio-related types
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

// Transcription types
export interface TranscriptionResult {
  id: string;
  text: string;
  confidence: number;
  timestamp: number;
  speaker?: string;
}

// Speaker identification types
export interface Speaker {
  id: string;
  name: string;
  characterName?: string;
  voiceProfile?: string;
}

// Session types
export interface Session {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  speakers: Speaker[];
  transcriptions: TranscriptionResult[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}
