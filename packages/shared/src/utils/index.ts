/**
 * @fileoverview Shared utility functions for CritGenius Listener
 * Common utilities used across client and server applications
 */

import type { ApiResponse } from '../types/index.js';

/**
 * Create a standardized API response
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (error !== undefined) {
    response.error = error;
  }

  return response;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validate audio file type
 */
export function isValidAudioFile(mimeType: string): boolean {
  const validTypes = [
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/m4a',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
  ];

  return validTypes.includes(mimeType.toLowerCase());
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique identifier
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  // Prefer native structuredClone when available
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(obj);
  }
  // Fallback for JSON-serializable data
  try {
    return JSON.parse(JSON.stringify(obj)) as T;
  } catch {
    // Last resort: throw an error to avoid returning the original reference
    throw new Error(
      'deepClone failed: object contains non-serializable data (functions, symbols, or circular references). Use manual cloning for complex objects.'
    );
  }
}
