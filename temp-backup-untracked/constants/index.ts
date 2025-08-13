/**
 * Shared constants for CritGenius Listener
 */

// API Constants
export const API_ENDPOINTS = {
  SESSIONS: '/api/sessions',
  TRANSCRIPTIONS: '/api/transcriptions',
  SPEAKERS: '/api/speakers',
  AUDIO: '/api/audio',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Audio Constants
export const AUDIO_DEFAULTS = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
} as const;

export const SUPPORTED_FORMATS = ['wav', 'mp3', 'flac'] as const;

// Export Constants
export const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  TXT: 'txt',
  SRT: 'srt',
} as const;

// Error Constants
export const ERROR_CODES = {
  INVALID_CONFIG: 'INVALID_CONFIG',
  TRANSCRIPTION_FAILED: 'TRANSCRIPTION_FAILED',
  SPEAKER_NOT_FOUND: 'SPEAKER_NOT_FOUND',
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
  AUDIO_PROCESSING_ERROR: 'AUDIO_PROCESSING_ERROR',
} as const;

// WebSocket Event Types
export const WS_EVENTS = {
  TRANSCRIPTION_START: 'transcription:start',
  TRANSCRIPTION_PROGRESS: 'transcription:progress',
  TRANSCRIPTION_COMPLETE: 'transcription:complete',
  SPEAKER_IDENTIFIED: 'speaker:identified',
  SESSION_UPDATED: 'session:updated',
} as const;
