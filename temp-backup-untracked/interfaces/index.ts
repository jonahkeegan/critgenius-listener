/**
 * Shared interfaces for CritGenius Listener services and components
 */

import type {
  AudioConfig,
  TranscriptionResult,
  Speaker,
  Session,
} from '../types/index.js';

// Service interfaces
export interface TranscriptionService {
  startTranscription(config: AudioConfig): Promise<void>;
  stopTranscription(): Promise<void>;
  getTranscription(id: string): Promise<TranscriptionResult | null>;
}

export interface SpeakerService {
  identifySpeaker(audioData: ArrayBuffer): Promise<Speaker | null>;
  registerSpeaker(name: string, characterName?: string): Promise<Speaker>;
  updateSpeaker(id: string, updates: Partial<Speaker>): Promise<Speaker>;
}

export interface SessionService {
  createSession(name: string): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session>;
  deleteSession(id: string): Promise<void>;
}

// Repository interfaces
export interface BaseRepository<T> {
  create(entity: Omit<T, 'id'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface SessionRepository extends BaseRepository<Session> {
  findByDateRange(startDate: Date, endDate: Date): Promise<Session[]>;
}

// Re-export types for convenience
export type {
  AudioConfig,
  TranscriptionResult,
  Speaker,
  Session,
  ApiResponse,
  WebSocketMessage,
} from '../types/index.js';
