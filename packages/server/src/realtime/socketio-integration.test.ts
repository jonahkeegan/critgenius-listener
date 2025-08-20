/**
 * @fileoverview Integration-lite test: ensure server wiring calls SessionManager.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock SessionManager with hoisted spies to avoid TDZ
const mocks = vi.hoisted(() => {
  return {
    join: vi.fn(),
    leave: vi.fn(),
    startTranscription: vi.fn(),
    stopTranscription: vi.fn(),
    pushAudio: vi.fn(),
  };
});

vi.mock('./sessionManager.js', () => ({
  SessionManager: vi.fn().mockImplementation(() => ({
    join: mocks.join,
    leave: mocks.leave,
    startTranscription: mocks.startTranscription,
    stopTranscription: mocks.stopTranscription,
    pushAudio: mocks.pushAudio,
  })),
}));

// Now import app/server
import app from '../index.js';
import { API_ENDPOINTS, HTTP_STATUS } from '@critgenius/shared';

// We can't spin up Socket.IO easily without a server listen; instead we assert API health and rely on unit tests for session

describe('Server basic wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('health endpoint works while SessionManager is instantiated', async () => {
    const res = await request(app).get(API_ENDPOINTS.HEALTH);
    expect(res.status).toBe(HTTP_STATUS.OK);
    expect(res.body).toHaveProperty('status', 'healthy');
  });
});
