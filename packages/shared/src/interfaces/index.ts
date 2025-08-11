/**
 * @fileoverview Shared interfaces for CritGenius Listener
 * Common interface definitions used across client and server applications
 */

import type { AudioFileMetadata, AudioProcessingResult } from '../types/index.js';

/**
 * Interface for audio upload request
 */
export interface AudioUploadRequest {
  files: File[] | Express.Multer.File[];
  metadata?: {
    userId?: string;
    sessionId?: string;
    tags?: string[];
  };
}

/**
 * Interface for audio upload response
 */
export interface AudioUploadResponse {
  uploadId: string;
  files: {
    filename: string;
    status: 'uploaded' | 'failed';
    error?: string;
  }[];
  totalFiles: number;
  totalSize: number;
}

/**
 * Interface for processing status request
 */
export interface ProcessingStatusRequest {
  uploadId: string;
}

/**
 * Interface for processing status response
 */
export interface ProcessingStatusResponse {
  uploadId: string;
  overallStatus: 'pending' | 'processing' | 'completed' | 'failed';
  files: {
    filename: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number; // 0-100
    error?: string;
  }[];
  totalFiles: number;
  completedFiles: number;
  estimatedTimeRemaining?: number; // in seconds
}

/**
 * Interface for results request
 */
export interface ResultsRequest {
  uploadId: string;
  includeRawData?: boolean;
}

/**
 * Interface for results response
 */
export interface ResultsResponse {
  uploadId: string;
  results: AudioProcessingResult[];
  summary?: {
    totalFiles: number;
    successfulProcessing: number;
    averageSentiment?: 'positive' | 'negative' | 'neutral';
    commonKeywords?: string[];
  };
}

/**
 * Interface for server health check
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  services: {
    database?: 'connected' | 'disconnected';
    storage?: 'available' | 'unavailable';
    processing?: 'running' | 'stopped';
  };
}

/**
 * Interface for error response
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Interface for configuration settings
 */
export interface AppConfiguration {
  server: {
    port: number;
    host: string;
    cors: {
      origins: string[];
      credentials: boolean;
    };
  };
  upload: {
    maxFileSize: number;
    maxFiles: number;
    allowedTypes: string[];
    destination: string;
  };
  processing: {
    maxConcurrent: number;
    timeout: number;
    retryAttempts: number;
  };
}