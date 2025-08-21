import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from './index.js';

// Mock environment validation to avoid actual startup validation in tests
vi.mock('@critgenius/shared', async () => {
  const actual = await vi.importActual('@critgenius/shared');
  return {
    ...actual,
    validateEnvironmentOnStartup: vi.fn(() => ({
      NODE_ENV: 'test',
      PORT: 3100,
      CLIENT_PORT: 3101,
      HOST: 'localhost',
      ASSEMBLYAI_API_KEY: 'test-key',
      MONGODB_URI: 'mongodb://localhost:27017/test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-jwt-secret',
      CORS_ORIGINS: 'http://localhost:3101',
    })),
  };
});

describe('Server', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('should start successfully with valid environment', async () => {
    // Test that the server starts and responds to health check
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('healthy');
  });

  it('should handle invalid file uploads', async () => {
    const response = await request(app)
      .post('/api/upload')
      .set('Content-Type', 'multipart/form-data');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('No files uploaded');
  });
});
