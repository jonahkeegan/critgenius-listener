/**
 * Shared utility functions for CritGenius Listener
 */

// Time utilities
export const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp).toISOString();
};

export const getCurrentTimestamp = (): number => {
  return Date.now();
};

// Audio utilities
export const validateAudioConfig = (config: any): boolean => {
  return (
    typeof config.sampleRate === 'number' &&
    typeof config.channels === 'number' &&
    typeof config.bitDepth === 'number' &&
    config.sampleRate > 0 &&
    config.channels > 0 &&
    config.bitDepth > 0
  );
};

// Validation utilities
export const isValidId = (id: string): boolean => {
  return typeof id === 'string' && id.length > 0;
};

export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

// Error handling utilities
export const createError = (message: string, code?: string): Error => {
  const error = new Error(message);
  if (code) {
    (error as any).code = code;
  }
  return error;
};
