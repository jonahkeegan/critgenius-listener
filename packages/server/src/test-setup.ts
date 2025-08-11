/**
 * @fileoverview Test setup configuration for server package
 * Configures test environment and global utilities for Node.js testing
 */

import { expect } from 'vitest';

// Global test setup for server package
console.log('🧪 Setting up server package test environment...');

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '0'; // Use random available port for tests

// Mock file system operations if needed
// vi.mock('fs', () => ({ ... }));

// Mock external services if needed
// vi.mock('some-external-service', () => ({ ... }));

// Setup test database or storage mocks
// global.testDb = { ... };

// Add custom test utilities
global.testUtils = {
  /**
   * Create a mock Express.Multer.File object for testing
   */
  createMockFile: (options: {
    filename?: string;
    originalname?: string;
    mimetype?: string;
    size?: number;
    buffer?: Buffer;
  } = {}) => ({
    fieldname: 'audio',
    originalname: options.originalname || 'test.wav',
    encoding: '7bit',
    mimetype: options.mimetype || 'audio/wav',
    destination: 'uploads/',
    filename: options.filename || `test_${Date.now()}.wav`,
    path: `uploads/${options.filename || `test_${Date.now()}.wav`}`,
    size: options.size || 1024,
    buffer: options.buffer || Buffer.from('mock audio data'),
  }),
  
  /**
   * Generate a mock upload ID for testing
   */
  generateMockUploadId: () => `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
};

console.log('✅ Server test environment configured successfully!');