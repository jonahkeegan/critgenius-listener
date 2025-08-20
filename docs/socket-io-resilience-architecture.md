# Socket.IO Connection Resilience Architecture

## Overview

This document describes the enhanced connection resilience and reconnection logic implemented for
Socket.IO in the CritGenius Listener application. The implementation provides production-grade
reliability for real-time communication during D&D sessions.

## Sequence Diagrams

### 1. Smart Reconnection Process

```sequenceDiagram
participant Client
participant SocketService
participant NetworkMonitor
participant ReconnectionEngine
participant Server

Client->>SocketService: connect()
SocketService->>SocketService: Initialize connection
SocketService->>Server: Attempt WebSocket connection
alt Connection Fails
    Server-->>SocketService: connect_error
    SocketService->>ReconnectionEngine: handleConnectionError()
    ReconnectionEngine->>ReconnectionEngine: Calculate exponential backoff
    ReconnectionEngine->>ReconnectionEngine: Add jitter to delay
    ReconnectionEngine->>NetworkMonitor: Check network status
    NetworkMonitor-->>ReconnectionEngine: Network status
    alt Network Online
        ReconnectionEngine->>ReconnectionEngine: Schedule reconnection
        ReconnectionEngine->>SocketService: setTimeout(reconnect)
        SocketService->>Server: Attempt reconnection
    else Network Offline
        ReconnectionEngine->>ReconnectionEngine: Wait for network online
        NetworkMonitor->>ReconnectionEngine: Network online event
        ReconnectionEngine->>SocketService: Trigger reconnection
        SocketService->>Server: Attempt reconnection
    end
end
Server-->>SocketService: connect (success)
SocketService-->>Client: Connection established
```

### 2. Message Queue Management

```sequenceDiagram
participant Client
participant SocketService
participant MessageQueue
participant Network
participant Server

Client->>SocketService: emit("joinSession", data)
alt Connected
    SocketService->>Server: Send message immediately
    Server-->>SocketService: Acknowledge
    SocketService-->>Client: Message sent
else Disconnected
    SocketService->>MessageQueue: Queue message
    MessageQueue->>MessageQueue: Store with retry count
    MessageQueue-->>SocketService: Message queued
    SocketService-->>Client: Message queued for delivery
end

SocketService->>Server: Connection restored
SocketService->>MessageQueue: Process queued messages
MessageQueue->>MessageQueue: Get queued messages
MessageQueue->>Server: Send queued messages
alt Success
    Server-->>MessageQueue: Acknowledge
    MessageQueue->>MessageQueue: Remove from queue
else Failure
    MessageQueue->>MessageQueue: Increment retry count
    MessageQueue->>MessageQueue: Retry or drop message
end
MessageQueue-->>SocketService: Queue processing complete
```

### 3. Network Status Monitoring

```sequenceDiagram
participant SocketService
participant NetworkMonitor
participant Navigator
participant HealthEndpoint
participant ConnectionManager

NetworkMonitor->>NetworkMonitor: Start periodic checks
loop Every 5 seconds
    NetworkMonitor->>Navigator: Check navigator.onLine
    alt Online
        NetworkMonitor->>HealthEndpoint: Fetch /health (with timeout)
        HealthEndpoint-->>NetworkMonitor: Response time measurement
        NetworkMonitor->>NetworkMonitor: Determine connection quality
        NetworkMonitor->>ConnectionManager: Update network status
    else Offline
        NetworkMonitor->>ConnectionManager: Mark offline
    end
end

ConnectionManager->>ConnectionManager: Update connection quality metrics
ConnectionManager->>SocketService: Notify of network changes
```

### 4. Heartbeat Monitoring

```sequenceDiagram
participant SocketService
participant HeartbeatMonitor
participant Server

HeartbeatMonitor->>HeartbeatMonitor: Start periodic heartbeat
loop Every 25 seconds
    HeartbeatMonitor->>SocketService: Connected check
    alt Connected
        SocketService->>Server: emit("ping", callback)
        Server->>Server: Process ping
        Server-->>SocketService: callback()
        SocketService->>HeartbeatMonitor: Heartbeat successful
    else Disconnected
        HeartbeatMonitor->>HeartbeatMonitor: Skip heartbeat
    end
end

alt Heartbeat Fails
    SocketService->>SocketService: Handle connection instability
    SocketService->>HeartbeatMonitor: Schedule reconnection
end
```

## Key Features Implemented

### 1. Smart Reconnection Strategy

- **Exponential Backoff**: Delay increases exponentially between reconnection attempts
- **Jitter**: Random delay added to prevent thundering herd problems
- **Network Awareness**: Reconnection attempts pause when network is offline
- **Maximum Attempts**: Configurable limit to prevent infinite reconnection loops

### 2. Message Queue Management

- **Offline Queuing**: Messages are stored when connection is lost
- **Retry Logic**: Failed message sends are automatically retried
- **Queue Limits**: Configurable maximum queue size to prevent memory issues
- **Message Deduplication**: Prevents duplicate message delivery

### 3. Connection Health Monitoring

- **Heartbeat System**: Regular ping/pong to detect connection health
- **Network Status Detection**: Monitors browser online/offline status
- **Connection Quality Assessment**: Measures response times to determine quality
- **Proactive Monitoring**: Continuous health checks prevent issues

### 4. Advanced Error Handling

- **Differentiated Error Recovery**: Different strategies for different error types
- **Graceful Degradation**: System continues functioning with reduced capabilities
- **User Notifications**: Clear error messages for connection issues
- **Automatic Recovery**: Self-healing mechanisms for common connection problems

## Configuration Options

The resilience system is highly configurable through the `ResilienceConfig` interface:

```typescript
interface ResilienceConfig {
  maxReconnectionAttempts: number; // Default: 10
  initialReconnectionDelay: number; // Default: 1000ms
  maxReconnectionDelay: number; // Default: 30000ms
  reconnectionDelayJitter: number; // Default: 1000ms
  exponentialBackoffFactor: number; // Default: 2
  connectionTimeout: number; // Default: 20000ms
  heartbeatInterval: number; // Default: 25000ms
  heartbeatTimeout: number; // Default: 5000ms
  networkCheckInterval: number; // Default: 5000ms
  messageQueueMaxSize: number; // Default: 100
  messageRetryAttempts: number; // Default: 3
  messageRetryDelay: number; // Default: 1000ms
}
```

## Usage Examples

### Basic Connection with Resilience

```typescript
import SocketService from '../services/socketService';

// Connect with automatic resilience
SocketService.connect();

// Listen for connection status changes
SocketService.on('connectionStatus', status => {
  console.log('Connection status:', status);
});

// Emit messages (automatically queued if disconnected)
SocketService.emit('joinSession', { sessionId: 'session-123' });
```

### Session Management with Reconnection

```typescript
// Join a session (will be resent on reconnection)
SocketService.joinSession('dnd-session-456');

// Leave a session
SocketService.leaveSession('dnd-session-456');
```

### Configuration Updates

```typescript
// Update resilience configuration
SocketService.updateResilienceConfig({
  maxReconnectionAttempts: 5,
  initialReconnectionDelay: 500,
});
```

## Testing Strategy

The implementation includes comprehensive tests covering:

1. **Reconnection Logic**: Verifies exponential backoff and jitter
2. **Message Queuing**: Tests offline message handling and retry logic
3. **Network Monitoring**: Validates network status detection
4. **Error Handling**: Ensures proper error recovery mechanisms
5. **Session Management**: Tests session persistence across reconnections

## Performance Considerations

- **Memory Efficiency**: Message queue has configurable limits
- **Network Efficiency**: Heartbeat intervals are optimized
- **CPU Efficiency**: Network checks are throttled
- **Battery Efficiency**: Mobile-friendly polling intervals

## Security Considerations

- **Message Integrity**: Queued messages maintain their original order
- **Session Security**: Session IDs are properly managed
- **Error Information**: Sensitive error details are not exposed to clients
- **Timeout Protection**: Prevents hanging connections from consuming resources

This enhanced Socket.IO implementation provides robust, production-ready connection resilience for
the CritGenius Listener application, ensuring reliable real-time communication during D&D sessions
even in challenging network conditions.
