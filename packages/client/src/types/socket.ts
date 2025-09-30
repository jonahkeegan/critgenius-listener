/**
 * @fileoverview Socket.IO client types for CritGenius Listener
 * Re-exports server types for client-side type safety
 */

// Import shared event types from server package
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketConnectionEvents,
  SocketRoomData,
} from '../../../server/src/types/socket-events.js';

// Client-specific socket types
export type SocketResilienceErrorCode =
  | 'TLS_HANDSHAKE_FAILED'
  | 'CONNECTION_TIMEOUT'
  | 'CONNECTION_REFUSED'
  | 'NETWORK_OFFLINE'
  | 'UNKNOWN_ERROR';

export interface SocketConnectionError {
  code: SocketResilienceErrorCode;
  message: string;
  retryInMs?: number;
  timestamp: number;
}

export interface SocketConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: SocketConnectionError | null;
}

export interface SocketContextType {
  isConnected: boolean;
  socket: unknown; // Service exposes getters for typed emits/listeners
  connect: () => void;
  disconnect: () => void;
}
