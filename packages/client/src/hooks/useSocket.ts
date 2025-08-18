/**
 * @fileoverview React hook for Socket.IO connection management
 * Provides easy integration of Socket.IO with React components
 */

import { useState, useEffect, useCallback } from 'react';
import SocketService from '../services/socketService';
import type { SocketConnectionState, ServerToClientEvents, ClientToServerEvents } from '../types/socket';

export const useSocket = () => {
  const [connectionState, setConnectionState] = useState<SocketConnectionState>({
    isConnected: false,
    isConnecting: false,
    error: null
  });

  // Connect to socket
  const connect = useCallback(() => {
    SocketService.connect();
  }, []);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    SocketService.disconnect();
  }, []);

  // Emit events to server
  const emit = useCallback(<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ) => {
    SocketService.emit(event, ...args);
  }, []);

  // Listen to server events
  const on = useCallback(<K extends keyof ServerToClientEvents>(
    event: K,
    listener: ServerToClientEvents[K]
  ) => {
    SocketService.on(event, listener);
    
    // Return cleanup function
    return () => {
      SocketService.off(event, listener);
    };
  }, []);

  // Set up connection state listener
  useEffect(() => {
    const cleanup = on('connectionStatus', (status: 'connected' | 'disconnected') => {
      setConnectionState(prev => ({
        ...prev,
        isConnected: status === 'connected',
        isConnecting: status === 'connected' ? false : prev.isConnecting,
        error: status === 'disconnected' ? prev.error : null
      }));
    });

    // Initialize connection state
    const initialState = SocketService.getConnectionState();
    setConnectionState(initialState);

    return () => {
      cleanup();
    };
  }, [on]);

  return {
    ...connectionState,
    connect,
    disconnect,
    emit,
    on
  };
};
