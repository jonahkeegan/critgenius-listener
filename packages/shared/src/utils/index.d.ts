/**
 * @fileoverview Shared utility functions for CritGenius Listener
 * Common utilities used across client and server applications
 */
import type { ApiResponse } from '../types/index.js';
/**
 * Create a standardized API response
 */
export declare function createApiResponse<T>(
  success: boolean,
  data?: T,
  error?: string
): ApiResponse<T>;
/**
 * Format file size in human-readable format
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Validate audio file type
 */
export declare function isValidAudioFile(mimeType: string): boolean;
/**
 * Sleep utility for async operations
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Generate unique identifier
 */
export declare function generateId(): string;
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
//# sourceMappingURL=index.d.ts.map
