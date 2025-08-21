/**
 * @fileoverview Main server entry point for CritGenius Listener
 * Express.js server with audio upload and processing capabilities
 */

import express, { type Application } from 'express';
import cors from 'cors';
import multer from 'multer';
import { createServer, type Server as HttpServer } from 'http';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import { SessionManager } from './realtime/sessionManager.js';
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
  validateEnvironmentOnStartup,
  type EnvironmentConfig,
} from '@critgenius/shared';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from './types/socket-events.js';

// Validate environment variables on startup with detailed error reporting
const envConfig: EnvironmentConfig = validateEnvironmentOnStartup();

// Use validated configuration instead of raw environment access
const PORT = envConfig.PORT;

// Create Express application
const app: Application = express();

// Create HTTP server and integrate with Express
const server: HttpServer = createServer(app);

// Initialize Socket.IO server with CORS configuration
const io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> =
  new SocketIOServer(server, {
    cors: {
      origin: [...SERVER_CONFIG.CORS_ORIGINS],
      credentials: true,
    },
    // Add connection state recovery for better reliability
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

// Initialize session manager with validated environment configuration
const sessions = new SessionManager(io, envConfig);

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

    // Handle case where no files were uploaded (files is undefined/null)
    if (!files) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(createApiResponse(false, null, 'No files uploaded'));
    }

    // Runtime type validation to prevent type confusion attacks
    if (!Array.isArray(files)) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(createApiResponse(false, null, 'Invalid file upload format'));
    }

    if (files.length === 0) {
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

// Socket.IO connection handlers
io.on('connection', (socket: Socket) => {
  console.log(`📱 Socket.IO client connected: ${socket.id}`);

  // Send connection status to client
  socket.emit('connectionStatus', 'connected');

  // Handle session joining
  socket.on('joinSession', (data: { sessionId: string }) => {
    const { sessionId } = data;
    sessions.join(socket, sessionId);
    console.log(`👥 Client ${socket.id} joined session: ${sessionId}`);

    // Notify client they've joined successfully
    socket.emit('processingUpdate', {
      uploadId: sessionId,
      status: 'pending',
      message: `Joined session ${sessionId}`,
    });
  });

  // Handle session leaving
  socket.on('leaveSession', (data: { sessionId: string }) => {
    const { sessionId } = data;
    sessions.leave(socket, sessionId);
    console.log(`👋 Client ${socket.id} left session: ${sessionId}`);
  });

  // Handle recording start
  socket.on('startRecording', (data: { sessionId: string }) => {
    const { sessionId } = data;
    console.log(`⏺️ Recording started for session: ${sessionId}`);

    // Broadcast to room that recording started
    socket.to(sessionId).emit('processingUpdate', {
      uploadId: sessionId,
      status: 'processing',
      message: 'Recording started',
    });
  });

  // Handle recording stop
  socket.on('stopRecording', (data: { sessionId: string }) => {
    const { sessionId } = data;
    console.log(`⏹️ Recording stopped for session: ${sessionId}`);

    // Broadcast to room that recording stopped
    socket.to(sessionId).emit('processingUpdate', {
      uploadId: sessionId,
      status: 'completed',
      message: 'Recording completed',
    });
  });

  // Handle client disconnect
  socket.on('disconnect', (reason: string) => {
    console.log(
      `📴 Socket.IO client disconnected: ${socket.id} (reason: ${reason})`
    );
    socket.emit('connectionStatus', 'disconnected');
  });

  // Handle socket errors
  socket.on('error', (error: Error) => {
    console.error(`❌ Socket.IO error for client ${socket.id}:`, error);
    socket.emit('error', {
      code: 'SOCKET_ERROR',
      message: 'Socket connection error occurred',
    } as {
      code: string;
      message: string;
    });
  });

  // Handle ping for heartbeat monitoring
  socket.on('ping', (callback: (err?: Error) => void) => {
    console.log(`🏓 Ping received from client ${socket.id}`);
    // Respond to ping
    if (callback) {
      callback();
    }
  });

  // Real-time transcription: start
  socket.on(
    'startTranscription',
    (data: {
      sessionId: string;
      audioConfig?: {
        sampleRate?: number;
        encoding?: string;
        language?: string;
        diarization?: boolean;
      };
    }) => {
      const { sessionId, audioConfig } = data;
      console.log(`🟢 startTranscription for session ${sessionId}`);
      const a: {
        sampleRate?: number;
        language?: string;
        diarization?: boolean;
      } = audioConfig ?? {};
      const opts: {
        sampleRate: number;
        language?: string;
        diarization?: boolean;
      } = {
        sampleRate: typeof a.sampleRate === 'number' ? a.sampleRate : 16000,
      };
      if (typeof a.language === 'string') opts.language = a.language;
      if (typeof a.diarization === 'boolean') opts.diarization = a.diarization;
      sessions.startTranscription(sessionId, opts);
    }
  );

  // Real-time transcription: stop
  socket.on('stopTranscription', (data: { sessionId: string }) => {
    const { sessionId } = data;
    console.log(`🔴 stopTranscription for session ${sessionId}`);
    sessions.stopTranscription(sessionId);
  });

  // Real-time transcription: audio chunk
  socket.on(
    'audioChunk',
    (data: { sessionId: string; chunk: ArrayBuffer | Uint8Array | string }) => {
      const { sessionId, chunk } = data;
      sessions.pushAudio(sessionId, chunk);
    }
  );
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 CritGenius Listener server running on port ${PORT}`);
    console.log(`🔌 Socket.IO server ready for real-time connections`);
    console.log(
      `📋 Health check: http://localhost:${PORT}${API_ENDPOINTS.HEALTH}`
    );
    console.log(
      `📁 Upload endpoint: http://localhost:${PORT}${API_ENDPOINTS.UPLOAD}`
    );
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
  });
}

export default app;
