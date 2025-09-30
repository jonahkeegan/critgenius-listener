/**
 * @fileoverview Tests for enhanced Socket.IO client service
 * Tests connection resilience and reconnection logic
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Use hoisted mocks so they are available inside vi.mock factory (which is hoisted by Vitest)
const { mockSocket, mockIo } = vi.hoisted(() => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    // support chaining used by .timeout(...).emit(...)
    timeout: vi.fn().mockReturnThis(),
    connected: false,
    id: 'test-socket-id',
  } as any;

  const mockIo = vi.fn(() => mockSocket);

  return { mockSocket, mockIo };
});

vi.mock('socket.io-client', () => ({
  io: mockIo,
}));

// Defer importing the service until after mocks are defined
import socketService from './socketService';

// Mock global objects
const mockNavigator = {
  onLine: true,
};

const mockFetch = vi.fn();

describe('SocketService', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Set up global mocks
    Object.defineProperty(global, 'navigator', { value: mockNavigator });
    Object.defineProperty(global, 'fetch', { value: mockFetch });

    // Mock fetch to resolve successfully
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    mockNavigator.onLine = true;
    socketService.disconnect();
  });

  describe('Connection Resilience', () => {
    it('should attempt reconnection on disconnect', async () => {
      vi.useFakeTimers();
      // Make reconnection delay deterministic and short for test
      socketService.updateResilienceConfig({
        initialReconnectionDelay: 500,
        reconnectionDelayJitter: 0,
      });

      // Connect and simulate disconnect
      socketService.connect();

      // Simulate connection
      mockSocket.connected = true;
      const connectCallback = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )?.[1];
      if (connectCallback) {
        connectCallback();
      }

      // Simulate disconnect
      mockSocket.connected = false;
      const disconnectCallback = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'disconnect'
      )?.[1];
      if (disconnectCallback) {
        disconnectCallback('transport close');
      }

      // Fast-forward time to trigger reconnection
      vi.advanceTimersByTime(500);

      // Should attempt to reconnect via underlying socket
      expect(mockIo).toHaveBeenCalledTimes(1);
      expect(mockSocket.connect).toHaveBeenCalledTimes(1);
    });

    it('maps TLS handshake failure to structured error and schedules retry', () => {
      vi.useFakeTimers();
      socketService.updateResilienceConfig({
        initialReconnectionDelay: 300,
        reconnectionDelayJitter: 0,
        maxReconnectionAttempts: 2,
      });

      socketService.connect();

      const connectErrorCallback = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect_error'
      )?.[1];
      expect(typeof connectErrorCallback).toBe('function');

      connectErrorCallback?.(new Error('self signed certificate'));

      const state = socketService.getConnectionState();
      expect(state.error?.code).toBe('TLS_HANDSHAKE_FAILED');
      expect(state.error?.retryInMs).toBe(300);

      vi.advanceTimersByTime(300);
      expect(mockSocket.connect).toHaveBeenCalledTimes(1);
    });

    it('should queue messages when disconnected', () => {
      // Simulate disconnected state
      mockSocket.connected = false;

      // Emit a message while disconnected
      socketService.emit('joinSession', { sessionId: 'test-session' });

      // Should queue the message
      // @ts-expect-error accessing private property for testing
      expect(socketService.messageQueue.length).toBe(1);
    });

    it('should process queued messages on reconnect', async () => {
      vi.useFakeTimers();

      // Queue a message while disconnected
      mockSocket.connected = false;
      socketService.emit('joinSession', { sessionId: 'test-session' });

      // Connect and simulate successful connection
      socketService.connect();
      mockSocket.connected = true;

      const connectCallback = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )?.[1];
      if (connectCallback) {
        connectCallback();
      }

      // Should process queued messages
      expect(mockSocket.emit).toHaveBeenCalledWith('joinSession', {
        sessionId: 'test-session',
      });
    });

    it('should handle network status changes', async () => {
      vi.useFakeTimers();

      // Simulate network offline
      mockNavigator.onLine = false;

      // Trigger network check
      // @ts-expect-error accessing private method for testing
      await socketService.checkNetworkStatus();

      // Should detect offline status
      const state = socketService.getConnectionState();
      // @ts-expect-error accessing extended properties
      expect(state.networkStatus.isOnline).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should allow updating resilience configuration', () => {
      const newConfig = {
        maxReconnectionAttempts: 5,
        initialReconnectionDelay: 500,
      };

      socketService.updateResilienceConfig(newConfig);

      // @ts-expect-error accessing private property for testing
      expect(socketService.resilienceConfig.maxReconnectionAttempts).toBe(5);
      // @ts-expect-error accessing private property for testing
      expect(socketService.resilienceConfig.initialReconnectionDelay).toBe(500);
    });
  });

  describe('Session Management', () => {
    it('should handle session joining with reconnection', () => {
      // Ensure socket instance exists and is connected
      socketService.connect();
      mockSocket.connected = true;
      const connectCallback = mockSocket.on.mock.calls.find(
        (call: any) => call[0] === 'connect'
      )?.[1];
      if (connectCallback) {
        connectCallback();
      }
      socketService.joinSession('test-session');

      expect(mockSocket.emit).toHaveBeenCalledWith('joinSession', {
        sessionId: 'test-session',
      });
    });

    it('should queue session join when disconnected', () => {
      mockSocket.connected = false;
      socketService.joinSession('test-session');

      // @ts-expect-error accessing private property for testing
      expect(socketService.messageQueue.length).toBe(1);
      // @ts-expect-error accessing private property for testing
      expect(socketService.messageQueue[0].event).toBe('joinSession');
    });
  });
});
