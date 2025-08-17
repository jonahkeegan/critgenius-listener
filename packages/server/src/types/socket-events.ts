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
    uploadId: string;
    text: string;
    speaker?: string;
    timestamp: string;
  }) => void;
  error: (error: {
    code: string;
    message: string;
    uploadId?: string;
  }) => void;
}

/**
 * Socket.IO client events
 */
export interface ClientToServerEvents {
  joinSession: (data: { sessionId: string }) => void;
  leaveSession: (data: { sessionId: string }) => void;
  startRecording: (data: { sessionId: string }) => void;
  stopRecording: (data: { sessionId: string }) => void;
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
