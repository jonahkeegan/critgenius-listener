# Consolidated Learnings - CritGenius: Listener (File 003)

**Last Updated:** 2025-08-18 15:05 PST **Version:** 1.1.0 **Status:** Active **Topic Coverage:**
Client-Side Socket.IO Implementation, Server-Side Real-Time Patterns, AssemblyAI Integration,
Context Recovery, Type Management, Documentation Workflows, WebSocket Testing


## Client-Side Socket.IO Implementation Patterns

### Pattern: TypeScript Socket.IO Client Service Architecture

- Create dedicated service layers for Socket.IO client connections using socket.io-client with full
  TypeScript support
- Implement comprehensive connection management with reconnection logic, error handling, and state
  tracking
- Use centralized configuration with proper CORS and port coordination matching server settings
- Implementation example:

  ```typescript
  // socketService.ts
  import { io, Socket } from 'socket.io-client';
  import type { ServerToClientEvents, ClientToServerEvents } from '@critgenius/shared';

  class SocketService {
    private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;

    connect(url: string = 'http://localhost:3001') {
      this.socket = io(url, {
        transports: ['websocket'],
        timeout: 10000,
        reconnectionDelay: 2000,
      });

      this.setupEventListeners();
      return this.socket;
    }

    private setupEventListeners() {
      if (!this.socket) return;

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket?.id);
        this.reconnectAttempts = 0;
      });

      this.socket.on('disconnect', reason => {

        console.log('Socket disconnected:', reason);
      });
    }
  }
  ```

### Pattern: React Hook Integration for Socket.IO

- Build custom React hooks for Socket.IO integration that handle connection lifecycle and state
  management
- Implement connection state tracking with isConnected, isConnecting, and error states
- Use proper useEffect cleanup to prevent memory leaks and connection issues
- Implementation example:


  ```typescript
  // useSocket.ts
  import { useEffect, useState } from 'react';
  import { socketService } from '../services/socketService';

  export const useSocket = (sessionId?: string) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      setIsConnecting(true);
      const socket = socketService.connect();

      socket.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);


        if (sessionId) {
          socket.emit('joinSession', { sessionId });
        }
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        setIsConnecting(false);
      });

      return () => {
        if (sessionId) {
          socket.emit('leaveSession', { sessionId });
        }
        socketService.disconnect();
      };
    }, [sessionId]);

    return { isConnected, isConnecting, error };
  };
  ```

### Pattern: Session Management with Automatic Lifecycle Handling

- Implement automatic session joining/leaving on component mount/unmount for clean resource
  management
- Use session-based room management for isolated communication channels
- Handle connection state recovery with proper session restoration
- Provide real-time connection status feedback to users through UI components

## Context Corruption Recovery Patterns

### Pattern: Implementation Validation After Context Loss

- When context corruption occurs during large implementations, perform systematic validation of
  existing code
- Use comprehensive review checklists to verify implementation completeness against requirements
- Identify and fix issues without disrupting working functionality
- Implementation approach:
  ```typescript
  // Context Recovery Validation Checklist
  const validationChecklist = {
    connectionManagement: 'Verify socket connection/disconnection handling',
    eventHandling: 'Check all required event listeners are implemented',
    typeDefinitions: 'Validate TypeScript interfaces match server contract',
    errorHandling: 'Confirm error states and user feedback mechanisms',
    cleanup: 'Ensure proper resource cleanup in useEffect hooks',
    integration: 'Test component integration with existing application',
  };
  ```

### Pattern: Code Review and Integration Validation

- Implement systematic code review procedures for validating existing implementations
- Use dependency checking to ensure proper import/export relationships
- Verify functionality through testing rather than assuming completion
- Document validation results and any issues discovered for future reference

## Type Management in Monorepo Environments

### Pattern: Centralized Type Definitions with Import Deduplication

- Centralize shared type definitions in dedicated packages to avoid duplication
- Use proper import strategies from shared packages rather than duplicating interfaces
- Implement systematic cleanup of redundant type definitions to maintain code quality
- Implementation example:

  ```typescript
  // Before: Duplicate definitions
  // client/src/types/socket.ts - duplicate interfaces
  // server/src/types/socket-events.ts - original interfaces

  // After: Centralized imports
  // client/src/services/socketService.ts
  import type { ServerToClientEvents, ClientToServerEvents } from '@critgenius/shared';

  // shared/src/types/index.ts - single source of truth
  export interface ServerToClientEvents {
    connectionStatus: (status: 'connected' | 'disconnected') => void;
    processingUpdate: (data: ProcessingUpdateData) => void;
  }
  ```

### Pattern: Type Import Maintenance Strategies

- Regularly audit type imports to identify and eliminate duplications
- Use workspace-wide search to find redundant interface definitions
- Implement systematic refactoring to consolidate type definitions
- Document type ownership and maintenance responsibilities in monorepo

## Memory Bank Documentation Workflows

### Pattern: Task Completion Documentation Procedures

- Update Memory Bank documentation immediately upon task completion to maintain accuracy
- Use systematic validation of task progress against requirements checklist
- Document final implementation status with comprehensive validation results
- Coordinate documentation updates with version control operations for consistency

### Pattern: Progress Tracking Integration with Development Workflow

- Integrate Memory Bank updates with Git workflow for synchronized documentation
- Use batch file operations for coordinated updates across multiple documentation files
- Implement validation procedures for documentation consistency and accuracy
- Maintain clear separation between raw reflections and consolidated actionable knowledge

### Pattern: Context Preservation During Implementation Phases

- Maintain comprehensive implementation logs during complex development phases
- Document decision points and rationale for future context reconstruction
- Use systematic reflection capture to identify patterns and improvements
- Consolidate implementation insights into reusable patterns for future development

## Documentation Synchronization Process Improvements

### Pattern: Task Completion Documentation Validation Protocol

- Implement systematic validation procedures to ensure all documentation sources are synchronized
  when tasks are completed
- Create validation checklists that include: task list updates, memory bank progress updates, and
  implementation file verification
- Establish cross-reference procedures between actual implementation code and task documentation
  status
- Implementation checklist:
  ```markdown
  ## Task Completion Validation Checklist

  - [ ] Implementation code completed and tested
  - [ ] Task list status updated ([ ] → [x])
  - [ ] Memory bank progress.md updated with completion details
  - [ ] Memory bank raw_reflection_log.md updated with learnings
  - [ ] Cross-reference verification: code matches documented completion status
  - [ ] Related subtasks checked for completion (comprehensive implementations may complete multiple
        tasks)
  ```

### Pattern: Documentation Synchronization Issue Detection and Resolution

- Use systematic investigation approaches when documentation discrepancies are suspected
- Cross-reference multiple documentation sources: task lists, memory bank files, actual
  implementation code, and test coverage
- Apply evidence-based analysis rather than assumptions when determining actual completion status
- Resolution procedure:
  1. **Evidence Gathering:** Examine actual implementation files for completion indicators
  2. **Cross-Reference Analysis:** Compare implementation against task requirements
  3. **Documentation Review:** Check all relevant documentation sources for consistency
  4. **Status Correction:** Update documentation to reflect actual implementation status
  5. **Process Improvement:** Identify and document procedures to prevent future occurrences

### Pattern: Comprehensive Task Implementation Recognition

- Recognize that comprehensive implementations may complete multiple related tasks simultaneously
- Establish procedures for identifying when single implementations satisfy multiple task
  requirements
- Document task completion clusters where one implementation effort completes several related
  subtasks
- Implementation considerations:
  - Review all related subtasks when completing comprehensive implementations
  - Update all affected task statuses simultaneously to maintain documentation consistency
  - Document the relationship between completed tasks in memory bank entries
  - Use clear cross-references to explain why multiple tasks were completed together

## Version Control Coordination Patterns

### Pattern: GitHub MCP Batch Upload Coordination

- Use GitHub MCP batch upload capabilities for coordinated multi-file changes
- Ensure proper commit message documentation for knowledge management updates
- Coordinate file dependencies to maintain system integrity during uploads
- Implementation considerations:
  - Group related file changes into single commit operations
  - Validate file dependencies before batch operations
  - Include comprehensive commit messages documenting the knowledge management operations
  - Verify upload success before proceeding with additional operations

### Pattern: Documentation Version Control Integration

- Coordinate documentation updates with code changes for consistency
- Use proper branching strategies for documentation updates
- Maintain documentation change logs aligned with development milestones
- Implement validation workflows to ensure documentation accuracy

## Server-Side Socket.IO Real-Time Patterns

### Pattern: Express Integration with HTTP Server Wrapper

- Integrate Socket.IO v4.8+ with existing Express.js servers using HTTP server wrapper pattern for
  seamless operation
- Maintain single port usage for both HTTP and WebSocket connections eliminating port conflicts
- Align CORS configuration between Express and Socket.IO for consistent security policies
- Implementation example:

  ```typescript
  // Server setup with integrated Socket.IO
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });

  // Express middleware and routes continue normally
  app.use('/api', apiRoutes);

  // Socket.IO event handling with session awareness
  io.on('connection', socket => {
    socket.on('joinSession', async ({ sessionId }) => {
      await socket.join(sessionId);
      socket.to(sessionId).emit('userJoined', { userId: socket.id });
    });
  });
  ```

### Pattern: Session-Based Room Management with Isolation

- Use Socket.IO rooms for session-based isolation enabling multiple concurrent transcription streams
- Implement automatic session joining/leaving with proper cleanup on disconnect
- Coordinate session lifecycle with external service connectors (e.g., AssemblyAI)
- Implementation example:
  ```typescript
  // Session manager with isolated transcription streams
  class SessionManager {
    private activeSessions = new Map<string, AssemblyAIConnector>();

    async joinSession(socket: Socket, sessionId: string) {
      await socket.join(sessionId);

      if (!this.activeSessions.has(sessionId)) {
        const connector = new AssemblyAIConnector({
          onTranscription: data => {
            socket.to(sessionId).emit('transcriptionUpdate', {
              sessionId,
              text: data.text,
              confidence: data.confidence,
              isFinal: data.message_type === 'FinalTranscript',
              words: data.words || [],
              speaker: data.speaker,
            });
          },
          onStatus: status => {
            socket.to(sessionId).emit('transcriptionStatus', { sessionId, status });
          },
        });
        this.activeSessions.set(sessionId, connector);
      }
    }
  }
  ```

### Pattern: Real-Time Event Handler Architecture

- Implement comprehensive event contracts for real-time audio streaming and transcription
- Use TypeScript interfaces for type-safe client-server communication
- Establish clear event naming conventions and payload structures
- Implementation example:

  ```typescript
  // Comprehensive event interface definitions
  interface ClientToServerEvents {
    joinSession: (data: { sessionId: string }) => void;
    leaveSession: (data: { sessionId: string }) => void;
    startTranscription: (data: { sessionId: string; config?: TranscriptionConfig }) => void;
    stopTranscription: (data: { sessionId: string }) => void;
    audioChunk: (data: { sessionId: string; audioData: string }) => void;
  }

  interface ServerToClientEvents {
    transcriptionUpdate: (data: TranscriptionUpdateData) => void;
    transcriptionStatus: (data: { sessionId: string; status: string }) => void;
    processingUpdate: (data: ProcessingUpdateData) => void;
    connectionStatus: (status: 'connected' | 'disconnected') => void;
  }

  // Event handler implementation with session awareness
  io.on('connection', socket => {
    socket.on('startTranscription', async ({ sessionId, config }) => {
      const connector = sessionManager.getConnector(sessionId);
      if (connector) {
        await connector.startTranscription(config);
        socket.to(sessionId).emit('transcriptionStatus', {
          sessionId,
          status: 'transcription_started',
        });
      }
    });
  });
  ```

## AssemblyAI Integration Patterns

### Pattern: WebSocket Connector with Event-Driven Architecture

- Create minimal WebSocket connectors with callback-based event handling for separation of concerns
- Implement base64 audio encoding for AssemblyAI compatibility with proper PCM data handling
- Use environment variable configuration for API key management and security
- Implementation example:

  ```typescript
  // AssemblyAI WebSocket connector with callbacks
  class AssemblyAIConnector {
    private ws: WebSocket | null = null;
    private callbacks: {
      onOpen?: () => void;
      onError?: (error: any) => void;
      onClose?: () => void;
      onTranscription?: (data: any) => void;
      onStatus?: (status: string) => void;
    };

    constructor(callbacks: typeof this.callbacks) {
      this.callbacks = callbacks;
    }

    async connect() {
      const apiKey = process.env.ASSEMBLYAI_API_KEY;
      if (!apiKey) throw new Error('ASSEMBLYAI_API_KEY required');

      this.ws = new WebSocket(
        `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${apiKey}`
      );

      this.ws.onopen = () => this.callbacks.onOpen?.();
      this.ws.onerror = error => this.callbacks.onError?.(error);
      this.ws.onclose = () => this.callbacks.onClose?.();
      this.ws.onmessage = event => {
        const data = JSON.parse(event.data);
        if (data.message_type === 'PartialTranscript' || data.message_type === 'FinalTranscript') {
          this.callbacks.onTranscription?.(data);
        }
      };
    }

    sendAudioChunk(audioData: string) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ audio_data: audioData }));
      }
    }
  }
  ```

### Pattern: Session-Connector Coordination with Lifecycle Management

- Coordinate one AssemblyAI connector per sessionId for isolated transcription streams
- Implement automatic connector creation/destruction tied to session membership
- Normalize transcription payloads for consistent client-side processing regardless of API
  variations
- Implementation example:
  ```typescript
  // Session manager with connector lifecycle coordination
  class SessionManager {
    private activeSessions = new Map<string, AssemblyAIConnector>();

    async startTranscription(sessionId: string) {
      if (!this.activeSessions.has(sessionId)) {
        const connector = new AssemblyAIConnector({
          onTranscription: data => {
            // Normalize AssemblyAI payload for consistent client processing
            const normalized = {
              sessionId,
              text: data.text,
              confidence: data.confidence || 0.0,
              isFinal: data.message_type === 'FinalTranscript',
              words:
                data.words?.map(word => ({
                  text: word.text,
                  start: word.start,
                  end: word.end,
                  confidence: word.confidence,
                })) || [],
              speaker: data.speaker || null,
            };

            this.io.to(sessionId).emit('transcriptionUpdate', normalized);
          },
        });

        await connector.connect();
        this.activeSessions.set(sessionId, connector);
      }
    }

    async stopTranscription(sessionId: string) {
      const connector = this.activeSessions.get(sessionId);
      if (connector) {
        connector.disconnect();
        this.activeSessions.delete(sessionId);
      }
    }
  }
  ```

## WebSocket Testing Strategies for Real-Time Systems

### Pattern: Vitest Hoisted Mocks for WebSocket Testing

- Use vi.hoisted() for proper mock management in Vitest to avoid hoisting errors
- Implement deterministic timer control for WebSocket connection and reconnection testing
- Create comprehensive test scenarios covering connection lifecycle events
- Implementation example:

  ```typescript
  // Proper Vitest mock setup for Socket.IO testing
  const mockSocket = vi.hoisted(() => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    timeout: vi.fn().mockReturnThis(), // Enable chaining with emit
    connect: vi.fn(),
  }));

  vi.mock('socket.io-client', () => ({
    io: vi.fn(() => mockSocket),
  }));

  describe('SocketService Real-Time Testing', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('handles reconnection with deterministic timing', async () => {
      const service = new SocketService();
      service.connect();

      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'disconnect'
      )?.[1];

      disconnectHandler?.('transport error');

      // Advance timers to trigger reconnection
      vi.advanceTimersByTime(2000);

      expect(mockSocket.connect).toHaveBeenCalled();
    });
  });
  ```

### Pattern: Real-Time Event Flow Testing

- Test complete event flows from audio chunk submission to transcription updates
- Validate event payload normalization and session isolation
- Implement mock connectors for testing without external API dependencies
- Use controlled timing for testing real-time system behaviors and edge cases

## Real-Time UI Integration Patterns

### Pattern: Socket Connection Status Display

- Implement real-time connection status indicators in user interface components
- Use Material-UI components with theming for consistent status visualization
- Provide user feedback for connection states (connecting, connected, disconnected, error)
- Implementation example:
  ```typescript
  // Connection status component integration
  const ProcessingSidebar = () => {
    const { isConnected, isConnecting, error } = useSocket(sessionId);

    return (
      <Box>
        <ConnectionStatus
          isConnected={isConnected}
          isConnecting={isConnecting}
          error={error}
        />
        {/* Other processing UI elements */}
      </Box>
    );
  };
  ```

### Pattern: Real-Time Event Integration with React Components

- Integrate Socket.IO events with React component state for real-time updates
- Use proper event handler cleanup to prevent memory leaks
- Implement event-driven UI updates for processing status and transcription data
- Maintain proper separation between Socket.IO logic and UI rendering logic

---

## Maintenance Information

**Row Count:** 287 **Context Efficiency:** High **Last Consolidation:** 2025-08-18 **Next Review:**
Continuous (updated with each major implementation phase) **Archive Criteria:** When file reaches
300 rows or when content is superseded by newer patterns

## Topic Index

- **Client-Side Implementation:** Socket.IO service architecture, React hook integration, connection
  management
- **Server-Side Real-Time:** Express integration, session management, event handler architecture
- **AssemblyAI Integration:** WebSocket connectors, session-connector coordination, event-driven
  architecture
- **WebSocket Testing:** Vitest hoisted mocks, real-time event flow testing, deterministic timing
- **Context Recovery:** Implementation validation, code review procedures, systematic recovery
  workflows
- **Type Management:** Centralized definitions, import deduplication, maintenance strategies
- **Documentation Workflows:** Task completion procedures, progress tracking, context preservation
- **Version Control:** GitHub MCP coordination, batch operations, documentation integration
- **Real-Time UI:** Connection status display, event integration, user feedback mechanisms

## System Notes

- File initialized for client-side Socket.IO patterns and advanced development workflows
- Focus on actionable patterns derived from recent implementation experiences
- Emphasis on maintainability and code quality in monorepo environments
- Integration patterns for real-time communication with React applications
- Context recovery and documentation workflow optimization
