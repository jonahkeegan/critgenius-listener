/**
 * @fileoverview Shared constants for CritGenius Listener
 * Application-wide constants used across client and server
 */
/**
 * Application configuration constants
 */
export const APP_CONFIG = {
  NAME: 'CritGenius Listener',
  VERSION: '0.1.0',
  DESCRIPTION:
    'Real-time audio capture and processing for intelligent feedback analysis',
};
/**
 * API endpoint constants
 */
export const API_ENDPOINTS = {
  UPLOAD: '/api/upload',
  STATUS: '/api/status',
  RESULTS: '/api/results',
  HEALTH: '/api/health',
};
/**
 * File upload constraints
 */
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_FILES: 10,
  ALLOWED_EXTENSIONS: ['.wav', '.mp3', '.m4a', '.ogg', '.flac', '.webm'],
  ALLOWED_MIME_TYPES: [
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
  ],
};
/**
 * Server configuration constants
 */
export const SERVER_CONFIG = {
  DEFAULT_PORT: 3001,
  CORS_ORIGINS: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ],
};
/**
 * Audio processing constants
 */
export const AUDIO_PROCESSING = {
  SAMPLE_RATES: [16000, 22050, 44100, 48000],
  DEFAULT_SAMPLE_RATE: 16000,
  SUPPORTED_CHANNELS: [1, 2], // mono, stereo
  MAX_DURATION_SECONDS: 300, // 5 minutes
};
/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds maximum allowed limit',
  INVALID_FILE_TYPE: 'File type is not supported',
  UPLOAD_FAILED: 'File upload failed',
  PROCESSING_FAILED: 'Audio processing failed',
  SERVER_ERROR: 'Internal server error',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
};
/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: 'File uploaded successfully',
  PROCESSING_COMPLETE: 'Audio processing completed',
  SERVER_STARTED: 'Server started successfully',
};
/**
 * HTTP status codes commonly used in the application
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  UNSUPPORTED_MEDIA_TYPE: 415,
  INTERNAL_SERVER_ERROR: 500,
};
//# sourceMappingURL=index.js.map
