/**
 * @fileoverview Shared utility functions for CritGenius Listener
 * Common utilities used across client and server applications
 */
/**
 * Create a standardized API response
 */
export function createApiResponse(success, data, error) {
  const response = {
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
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
/**
 * Validate audio file type
 */
export function isValidAudioFile(mimeType) {
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
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Generate unique identifier
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Deep clone an object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item));
  }
  const cloned = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}
//# sourceMappingURL=index.js.map
