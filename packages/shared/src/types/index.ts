/**
 * @fileoverview Shared TypeScript types for CritGenius Listener
 * Common types used across client and server applications
 */

/**
 * Audio file metadata interface
 */
export interface AudioFileMetadata {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  duration?: number;
  sampleRate?: number;
  channels?: number;
  bitRate?: number;
  uploadedAt: Date;
}

/**
 * Audio processing status enumeration
 */
export enum AudioProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Audio processing result interface
 */
export interface AudioProcessingResult {
  id: string;
  status: AudioProcessingStatus;
  metadata: AudioFileMetadata;
  transcription?: string;
  analysis?: {
    sentiment?: 'positive' | 'negative' | 'neutral';
    confidence?: number;
    keywords?: string[];
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * API Response wrapper type
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * Utility type for making properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for making properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;