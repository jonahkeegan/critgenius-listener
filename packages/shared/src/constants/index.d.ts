/**
 * @fileoverview Shared constants for CritGenius Listener
 * Application-wide constants used across client and server
 */
/**
 * Application configuration constants
 */
export declare const APP_CONFIG: {
  readonly NAME: 'CritGenius Listener';
  readonly VERSION: '0.1.0';
  readonly DESCRIPTION: 'Real-time audio capture and processing for intelligent feedback analysis';
};
/**
 * API endpoint constants
 */
export declare const API_ENDPOINTS: {
  readonly UPLOAD: '/api/upload';
  readonly STATUS: '/api/status';
  readonly RESULTS: '/api/results';
  readonly HEALTH: '/api/health';
};
/**
 * File upload constraints
 */
export declare const UPLOAD_LIMITS: {
  readonly MAX_FILE_SIZE: number;
  readonly MAX_FILES: 10;
  readonly ALLOWED_EXTENSIONS: readonly [
    '.wav',
    '.mp3',
    '.m4a',
    '.ogg',
    '.flac',
    '.webm',
  ];
  readonly ALLOWED_MIME_TYPES: readonly [
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
};
/**
 * Server configuration constants
 */
export declare const SERVER_CONFIG: {
  readonly DEFAULT_PORT: 3001;
  readonly CORS_ORIGINS: readonly [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
  ];
};
/**
 * Audio processing constants
 */
export declare const AUDIO_PROCESSING: {
  readonly SAMPLE_RATES: readonly [16000, 22050, 44100, 48000];
  readonly DEFAULT_SAMPLE_RATE: 16000;
  readonly SUPPORTED_CHANNELS: readonly [1, 2];
  readonly MAX_DURATION_SECONDS: 300;
};
/**
 * Error messages
 */
export declare const ERROR_MESSAGES: {
  readonly FILE_TOO_LARGE: 'File size exceeds maximum allowed limit';
  readonly INVALID_FILE_TYPE: 'File type is not supported';
  readonly UPLOAD_FAILED: 'File upload failed';
  readonly PROCESSING_FAILED: 'Audio processing failed';
  readonly SERVER_ERROR: 'Internal server error';
  readonly NOT_FOUND: 'Resource not found';
  readonly UNAUTHORIZED: 'Unauthorized access';
};
/**
 * Success messages
 */
export declare const SUCCESS_MESSAGES: {
  readonly UPLOAD_SUCCESS: 'File uploaded successfully';
  readonly PROCESSING_COMPLETE: 'Audio processing completed';
  readonly SERVER_STARTED: 'Server started successfully';
};
/**
 * HTTP status codes commonly used in the application
 */
export declare const HTTP_STATUS: {
  readonly OK: 200;
  readonly CREATED: 201;
  readonly BAD_REQUEST: 400;
  readonly UNAUTHORIZED: 401;
  readonly NOT_FOUND: 404;
  readonly PAYLOAD_TOO_LARGE: 413;
  readonly UNSUPPORTED_MEDIA_TYPE: 415;
  readonly INTERNAL_SERVER_ERROR: 500;
};
//# sourceMappingURL=index.d.ts.map
