/**
 * @fileoverview Main server entry point for CritGenius Listener
 * Express.js server with audio upload and processing capabilities
 */

import express, { type Application } from 'express';
import cors from 'cors';
import multer from 'multer';
import {
  SERVER_CONFIG,
  API_ENDPOINTS,
  UPLOAD_LIMITS,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  type ApiResponse,
  type HealthCheckResponse,
  createApiResponse,
  isValidAudioFile,
  formatFileSize,
} from '@critgenius/shared';

const app: Application = express();
const PORT = process.env.PORT || SERVER_CONFIG.DEFAULT_PORT;

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE,
    files: UPLOAD_LIMITS.MAX_FILES,
  },
  fileFilter: (_req, file, cb) => {
    if (isValidAudioFile(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(ERROR_MESSAGES.INVALID_FILE_TYPE));
    }
  },
});

// Middleware
app.use(
  cors({
    origin: [...SERVER_CONFIG.CORS_ORIGINS],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get(API_ENDPOINTS.HEALTH, (_req, res) => {
  const healthCheck: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    uptime: Math.floor(process.uptime()),
    services: {
      storage: 'available',
      processing: 'running',
    },
  };

  res.status(HTTP_STATUS.OK).json(healthCheck);
});

// Audio upload endpoint
app.post(API_ENDPOINTS.UPLOAD, upload.array('audio'), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(createApiResponse(false, null, 'No files uploaded'));
    }

    // Process uploaded files
    const uploadResults = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      mimetype: file.mimetype,
      path: file.path,
    }));

    const response: ApiResponse = createApiResponse(
      true,
      {
        uploadId: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        files: uploadResults,
        totalFiles: files.length,
        totalSize: files.reduce((acc, file) => acc + file.size, 0),
      },
      SUCCESS_MESSAGES.UPLOAD_SUCCESS
    );

    return res.status(HTTP_STATUS.CREATED).json(response);
  } catch (error) {
    console.error('Upload error:', error);
    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(createApiResponse(false, null, ERROR_MESSAGES.UPLOAD_FAILED));
  }
});

// Processing status endpoint
app.get(API_ENDPOINTS.STATUS + '/:uploadId', (req, res) => {
  const { uploadId } = req.params;

  // TODO: Implement real processing status tracking
  const mockStatus = {
    uploadId,
    overallStatus: 'pending' as const,
    files: [
      {
        filename: 'example.wav',
        status: 'pending' as const,
        progress: 0,
      },
    ],
    totalFiles: 1,
    completedFiles: 0,
  };

  res.status(HTTP_STATUS.OK).json(createApiResponse(true, mockStatus));
});

// Results endpoint
app.get(API_ENDPOINTS.RESULTS + '/:uploadId', (req, res) => {
  const { uploadId } = req.params;

  // TODO: Implement real results retrieval
  const mockResults = {
    uploadId,
    results: [],
    summary: {
      totalFiles: 0,
      successfulProcessing: 0,
    },
  };

  res.status(HTTP_STATUS.OK).json(createApiResponse(true, mockResults));
});

// Error handling middleware
app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Server error:', error);

    if (error.message === ERROR_MESSAGES.INVALID_FILE_TYPE) {
      return res
        .status(HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE)
        .json(createApiResponse(false, null, error.message));
    }

    if (error.message.includes('File too large')) {
      return res
        .status(HTTP_STATUS.PAYLOAD_TOO_LARGE)
        .json(createApiResponse(false, null, ERROR_MESSAGES.FILE_TOO_LARGE));
    }

    return res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(createApiResponse(false, null, ERROR_MESSAGES.SERVER_ERROR));
  }
);

// 404 handler
app.use('*', (_req, res) => {
  res
    .status(HTTP_STATUS.NOT_FOUND)
    .json(createApiResponse(false, null, ERROR_MESSAGES.NOT_FOUND));
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 CritGenius Listener server running on port ${PORT}`);
    console.log(
      `📋 Health check: http://localhost:${PORT}${API_ENDPOINTS.HEALTH}`
    );
    console.log(
      `📁 Upload endpoint: http://localhost:${PORT}${API_ENDPOINTS.UPLOAD}`
    );
  });
}

export default app;
