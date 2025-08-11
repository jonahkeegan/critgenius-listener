/**
 * @fileoverview Tests for the main server application
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from './index.js';
import { API_ENDPOINTS, HTTP_STATUS } from '@critgenius/shared';

describe('CritGenius Listener Server', () => {
  describe('Health Check Endpoint', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get(API_ENDPOINTS.HEALTH)
        .expect(HTTP_STATUS.OK);
      
      expect(response.body).toMatchObject({
        status: 'healthy',
        timestamp: expect.any(String),
        version: expect.any(String),
        uptime: expect.any(Number),
        services: expect.any(Object),
      });
    });
    
    it('should include service status information', async () => {
      const response = await request(app)
        .get(API_ENDPOINTS.HEALTH);
      
      expect(response.body.services).toHaveProperty('storage', 'available');
      expect(response.body.services).toHaveProperty('processing', 'running');
    });
  });
  
  describe('Upload Endpoint', () => {
    it('should reject requests without files', async () => {
      const response = await request(app)
        .post(API_ENDPOINTS.UPLOAD)
        .expect(HTTP_STATUS.BAD_REQUEST);
      
      expect(response.body).toMatchObject({
        success: false,
        error: 'No files uploaded',
        timestamp: expect.any(String),
      });
    });
    
    it('should accept valid audio files', async () => {
      // Create a mock audio file buffer
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      const response = await request(app)
        .post(API_ENDPOINTS.UPLOAD)
        .attach('audio', mockAudioBuffer, {
          filename: 'test.wav',
          contentType: 'audio/wav',
        })
        .expect(HTTP_STATUS.CREATED);
      
      expect(response.body).toMatchObject({
        success: true,
        data: {
          uploadId: expect.any(String),
          files: expect.any(Array),
          totalFiles: 1,
          totalSize: expect.any(Number),
        },
        timestamp: expect.any(String),
      });
      
      expect(response.body.data.files[0]).toMatchObject({
        filename: expect.any(String),
        originalName: 'test.wav',
        size: expect.any(Number),
        sizeFormatted: expect.any(String),
        mimetype: 'audio/wav',
        path: expect.any(String),
      });
    });
  });
  
  describe('Status Endpoint', () => {
    it('should return processing status for valid upload ID', async () => {
      const uploadId = 'test-upload-id';
      
      const response = await request(app)
        .get(`${API_ENDPOINTS.STATUS}/${uploadId}`)
        .expect(HTTP_STATUS.OK);
      
      expect(response.body).toMatchObject({
        success: true,
        data: {
          uploadId,
          overallStatus: expect.any(String),
          files: expect.any(Array),
          totalFiles: expect.any(Number),
          completedFiles: expect.any(Number),
        },
        timestamp: expect.any(String),
      });
    });
  });
  
  describe('Results Endpoint', () => {
    it('should return results for valid upload ID', async () => {
      const uploadId = 'test-upload-id';
      
      const response = await request(app)
        .get(`${API_ENDPOINTS.RESULTS}/${uploadId}`)
        .expect(HTTP_STATUS.OK);
      
      expect(response.body).toMatchObject({
        success: true,
        data: {
          uploadId,
          results: expect.any(Array),
          summary: expect.any(Object),
        },
        timestamp: expect.any(String),
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(HTTP_STATUS.NOT_FOUND);
      
      expect(response.body).toMatchObject({
        success: false,
        error: expect.any(String),
        timestamp: expect.any(String),
      });
    });
  });
  
  describe('CORS Configuration', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options(API_ENDPOINTS.HEALTH)
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});