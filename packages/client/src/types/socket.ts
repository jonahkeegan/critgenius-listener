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
export interface SocketConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface SocketContextType {
  isConnected: boolean;
  socket: unknown; // Service exposes getters for typed emits/listeners
  connect: () => void;
  disconnect: () => void;
}
