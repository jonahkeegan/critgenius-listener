/**
 * @fileoverview Socket.IO client types for CritGenius Listener
 * Re-exports server types for client-side type safety
 */

import type { Socket } from 'socket.io-client';

// Import shared event types from server package
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketConnectionEvents,
  SocketRoomData,
} from '../../../server/src/types/socket-events.js';

// Import types for local use
import type {
  ServerToClientEvents as ServerEvents,
  ClientToServerEvents as ClientEvents,
} from '../../../server/src/types/socket-events.js';

// Client-specific socket types
export interface SocketConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export interface SocketContextType {
  isConnected: boolean;
  socket: Socket<ServerEvents, ClientEvents> | null;
  connect: () => void;
  disconnect: () => void;
}
