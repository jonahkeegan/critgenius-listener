/**
 * @fileoverview Socket.IO event types for CritGenius Listener
 * Shared types for real-time communication between client and server
 */

/**
 * Socket.IO connection events
 */
export interface SocketConnectionEvents {
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (error: Error) => void;
}

/**
 * Socket.IO server events
 */
export interface ServerToClientEvents {
  connectionStatus: (status: 'connected' | 'disconnected') => void;
  processingUpdate: (data: {
    uploadId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    message?: string;
  }) => void;
  transcriptionUpdate: (data: {
    // support either upload or session driven flows
    sessionId?: string;
    uploadId?: string;
    text: string;
    speaker?: string;
    timestamp: string;
    confidence?: number;
    isFinal?: boolean;
    words?: Array<{
      start: number; // ms
      end: number; // ms
      text: string;
      confidence?: number;
      speaker?: string;
    }>;
  }) => void;
  transcriptionStatus?: (data: {
    sessionId: string;
    status: 'starting' | 'running' | 'stopped' | 'error' | 'resumed';
    message?: string;
  }) => void;
  error: (error: { code: string; message: string; uploadId?: string }) => void;
}

/**
 * Socket.IO client events
 */
export interface ClientToServerEvents {
  joinSession: (data: { sessionId: string }) => void;
  leaveSession: (data: { sessionId: string }) => void;
  startRecording: (data: { sessionId: string }) => void;
  stopRecording: (data: { sessionId: string }) => void;
  // Real-time transcription controls
  startTranscription: (data: {
    sessionId: string;
    audioConfig?: {
      sampleRate: number;
      encoding?: 'pcm_s16le' | 'wav' | 'flac' | 'mp3';
      language?: string;
      diarization?: boolean;
    };
  }) => void;
  stopTranscription: (data: { sessionId: string }) => void;
  audioChunk: (data: {
    sessionId: string;
    chunk: ArrayBuffer | Uint8Array | string;
  }) => void;
}

/**
 * Socket.IO room data
 */
export interface SocketRoomData {
  roomId: string;
  participants: Set<string>;
  createdAt: Date;
  lastActivity: Date;
}
