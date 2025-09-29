/**
 * @fileoverview React hook for Socket.IO connection management
 * Provides easy integration of Socket.IO with React components
 */

import { useState, useEffect, useCallback } from 'react';
import SocketService from '../services/socketService';
import type {
  SocketConnectionState,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../types/socket';

export const useSocket = () => {
  const [connectionState, setConnectionState] = useState<SocketConnectionState>(
    {
      isConnected: false,
      isConnecting: false,
      error: null,
    }
  );

  // Connect to socket
  const connect = useCallback(() => {
    SocketService.connect();
  }, []);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    SocketService.disconnect();
  }, []);

  // Emit events to server
  const emit = useCallback(
    <K extends keyof ClientToServerEvents>(
      event: K,
      ...args: Parameters<ClientToServerEvents[K]>
    ) => {
      SocketService.emit(event, ...args);
    },
    []
  );

  const on = useCallback(
    <K extends keyof ServerToClientEvents>(
      event: K,
      listener: ServerToClientEvents[K]
    ) => {
      SocketService.on(event, listener as NonNullable<ServerToClientEvents[K]>);
      return () => {
        SocketService.off(
          event,
          listener as NonNullable<ServerToClientEvents[K]>
        );
      };
    },
    []
  );

  useEffect(() => {
    const cleanup = on('connectionStatus', () => {
      setConnectionState(SocketService.getConnectionState());
    });

    setConnectionState(SocketService.getConnectionState());

    return () => {
      cleanup();
    };
  }, [on]);

  return {
    ...connectionState,
    connect,
    disconnect,
    emit,
    on,
  };
};
