# Consolidated Learnings - CritGenius: Listener (File 002)

**Last Updated:** 2025-08-17 14:49 PST **Version:** 1.1.0 **Status:** Active
**Topic Coverage:** WebSocket Integration, Real-time Communication, Session Management

## WebSocket Integration & Real-time Communication

### Pattern: Socket.IO Integration with Express using HTTP Server Wrapper
- For real-time communication in Node.js applications, integrate Socket.IO with existing Express servers using the HTTP server wrapper pattern
- Create the HTTP server first, then pass it to both Express app and Socket.IO server for shared infrastructure
- This approach maintains existing HTTP endpoints while adding WebSocket capabilities on the same port
- Configure CORS settings consistently between Express and Socket.IO for seamless client integration
- Implementation example:
  ```typescript
  import express from 'express';
  import { createServer } from 'http';
  import { Server as SocketIOServer } from 'socket.io';
  
  const app = express();
  const server = createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: ['http://localhost:5173'], // Match Express CORS settings
      credentials: true,
    }
  });
  
  // Existing Express routes work normally
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy' });
  });
  
  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
  });
  
  server.listen(3000, () => {
    console.log('Server running on port 3000');
  });
  ```

### Pattern: TypeScript Type Safety for WebSocket Events
- Create comprehensive TypeScript interface definitions for client-to-server and server-to-client events
- Define strongly-typed event payloads to ensure compile-time safety and better IDE support
- Use separate interface files for event definitions to maintain clean separation of concerns
- Implementation structure:
  ```typescript
  // socket-events.ts
  export interface ServerToClientEvents {
    connectionStatus: (status: 'connected' | 'disconnected') => void;
    processingUpdate: (data: {
      uploadId: string;
      status: 'pending' | 'processing' | 'completed' | 'failed';
      progress?: number;
      message?: string;
    }) => void;
  }
  
  export interface ClientToServerEvents {
    joinSession: (data: { sessionId: string }) => void;
    leaveSession: (data: { sessionId: string }) => void;
  }
  
  // In server implementation
  import type { ServerToClientEvents, ClientToServerEvents } from './types/socket-events.js';
  const io: SocketIOServer<ClientToServerEvents, ServerToClientEvents> = new SocketIOServer(server, options);
  ```

### Pattern: Connection State Recovery for Improved Reliability
- Implement connection state recovery to handle temporary network interruptions gracefully
- Configure reasonable disconnection duration limits (e.g., 2 minutes) to balance reliability with resource usage
- Enable middleware skipping for faster reconnection handling
- Implementation example:
  ```typescript
  const io = new SocketIOServer(server, {
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    },
  });
  ```

## Session Management & Room-Based Communication

### Pattern: Session-Based Room Management for Isolated Communication
- Use Socket.IO rooms to create isolated communication channels for different sessions or groups
- Implement structured event handling for session lifecycle management (join, leave, start, stop)
- Join clients to specific rooms based on session identifiers for targeted message broadcasting
- Implementation example:
  ```typescript
  io.on('connection', (socket) => {
    // Handle session joining
    socket.on('joinSession', (data: { sessionId: string }) => {
      const { sessionId } = data;
      socket.join(sessionId);
      console.log(`Client ${socket.id} joined session: ${sessionId}`);
      
      // Notify client they've joined successfully
      socket.emit('processingUpdate', {
        uploadId: sessionId,
        status: 'pending',
        message: `Joined session ${sessionId}`
      });
    });
    
    // Handle session leaving
    socket.on('leaveSession', (data: { sessionId: string }) => {
      const { sessionId } = data;
      socket.leave(sessionId);
      console.log(`Client ${socket.id} left session: ${sessionId}`);
    });
    
    // Broadcast to specific room
    socket.on('startRecording', (data: { sessionId: string }) => {
      const { sessionId } = data;
      socket.to(sessionId).emit('processingUpdate', {
        uploadId: sessionId,
        status: 'processing',
        message: 'Recording started'
      });
    });
  });
  ```

### Pattern: Structured Error Handling and Logging for WebSocket Communication
- Implement comprehensive error handling for different types of WebSocket events (connection, disconnection, message errors)
- Use proper logging with context information (socket ID, session ID, error details)
- Send structured error messages to clients for consistent error handling on the frontend
- Implementation example:
  ```typescript
  io.on('connection', (socket) => {
    // Handle client disconnect
    socket.on('disconnect', (reason: string) => {
      console.log(`Client disconnected: ${socket.id} (reason: ${reason})`);
      socket.emit('connectionStatus', 'disconnected');
    });
    
    // Handle socket errors
    socket.on('error', (error: Error) => {
      console.error(`Socket error for client ${socket.id}:`, error);
      socket.emit('error', {
        code: 'SOCKET_ERROR',
        message: 'Socket connection error occurred'
      } as {
        code: string;
        message: string;
      });
    });
  });
  ```

## Monorepo Dependency Management

### Pattern: Modern WebSocket Library Selection and Installation
- Install socket.io for server-side WebSocket implementation with built-in TypeScript support
- Install socket.io-client for client-side WebSocket connections with React integration
- Remove deprecated @types packages when libraries provide their own TypeScript definitions
- Verify workspace dependency harmonization and version consistency across monorepo packages
- Implementation example:
  ```bash
  # Install in server package
  pnpm add socket.io
  
  # Install in client package  
  pnpm add socket.io-client
  
  # Remove deprecated types (if present)
  pnpm remove @types/socket.io
  ```

## CritGenius: Listener - Technical Implementation Patterns

### Pattern: Responsive Design System Implementation
- Configure comprehensive MUI breakpoint system with custom breakpoints for enhanced device support
- Implement responsive typography scaling using CSS clamp() functions for fluid text sizing
- Create responsive layout hooks for flexible component behavior across screen sizes
- Build layout components with mobile-first design principles and touch optimization
- Implementation example:
  ```typescript
  // Custom breakpoints
  const theme = createTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1536,
        xxl: 1920, // Custom breakpoint
      },
    },
  });
  
  // Fluid typography with clamp()
  const responsiveTypography = {
    fontSize: 'clamp(14px, 2.5vw, 18px)',
  };
  ```

### Pattern: Theme Customization for Gaming Applications
- Create custom MUI themes with color palettes optimized for gaming/D&D aesthetics
- Implement dark mode designs optimized for extended usage sessions with minimal eye strain
- Design typography scales for readability during long gaming sessions
- Create component overrides for specialized UI elements (audio visualization, character mapping)
- Implementation example:
  ```typescript
  const critgeniusTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#6A4C93', // Mystical purple for D&D theme
      },
      secondary: {
        main: '#FFB300', // Gold accent color
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
      },
    },
  });
  ```

### Pattern: Audio Interface Component Design
- Create responsive audio capture panels with mobile-first design and touch-friendly controls
- Implement audio visualization components with scalable display elements
- Build file upload zones with touch-friendly interfaces and progress indicators
- Design recording controls with large touch targets for mobile and compact layouts for desktop
- Implementation considerations:
  - Touch target minimum size of 44px for mobile usability
  - Visual feedback for recording states (idle, recording, processing)
  - Accessible color contrast for audio level indicators
  - Responsive layout switching for different device orientations

### Pattern: Drag-and-Drop Implementation with React
- Use HTML5 drag-and-drop APIs with React state management for complex UI interactions
- Implement visual feedback during drag operations (ghost images, drop zones)
- Create proper event handling for drag start, drag over, and drop events
- Maintain state persistence for drag-and-drop operations across component re-renders
- Implementation example:
  ```typescript
  const CharacterAssignmentGrid = () => {
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    
    const handleDragStart = (e: React.DragEvent, item: string) => {
      setDraggedItem(item);
      e.dataTransfer.effectAllowed = 'move';
    };
    
    const handleDrop = (e: React.DragEvent, target: string) => {
      e.preventDefault();
      // Handle drop logic
      setDraggedItem(null);
    };
    
    return (
      <div>
        {items.map(item => (
          <div
            key={item}
            draggable
            onDragStart={(e) => handleDragStart(e, item)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, item)}
          >
            {item}
          </div>
        ))}
      </div>
    );
  };
  ```

## Development Tooling & Quality Gates

### Pattern: ESLint 9 Flat Configuration Implementation
- Use modern ESLint flat configuration system for monorepo projects
- Centralize ESLint configuration at workspace level to avoid conflicts
- Configure TypeScript ESLint with proper parser and plugin settings
- Implement performance optimization for linting across large workspaces
- Implementation example:
  ```javascript
  // eslint.config.js
  import eslint from '@eslint/js';
  import tseslint from 'typescript-eslint';
  
  export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
      files: ['**/*.ts', '**/*.tsx'],
      languageOptions: {
        parserOptions: {
          project: './tsconfig.json',
        },
      },
    }
  );
  ```

### Pattern: Git Hook Automation with Husky 9
- Set up Husky 9 with proper git hook configuration for pre-commit validation
- Configure pre-commit hooks for linting, testing, and code quality checks
- Implement commit message validation hooks for consistent commit history
- Use proper Husky 9 setup commands:
  ```bash
  pnpm add -D husky
  pnpm husky init
  ```

## Testing Framework Integration

### Pattern: Vitest over Jest Migration for Monorepos
- Replace Jest with Vitest across monorepo packages for better TypeScript integration
- Configure Vitest with proper JSDOM environment for React component testing
- Set up comprehensive test scripts including watch mode and coverage reporting
- Create proper test setup files with environment mocking
- Implementation example:
  ```typescript
  // vitest.config.ts
  import { defineConfig } from 'vitest/config';
  
  export default defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  });
  ```

## Security & Dependency Management

### Pattern: PNPM Security Override Strategy
- Use pnpm overrides to force specific dependency versions for security vulnerability resolution
- Implement automated security workflows for ongoing vulnerability management
- Document security resolution procedures for maintenance and compliance
- Example override configuration:
  ```json
  {
    "pnpm": {
      "overrides": {
        "esbuild": ">=0.25.0"
      }
    }
  }
  ```

## File Organization & Architecture

### Pattern: Modular Monolith Architecture Design
- Create comprehensive monorepo structure with pnpm workspaces for package organization
- Initialize packages with clear separation of concerns (client, server, shared)
- Implement CritGenius ecosystem metadata across all packages for consistency
- Establish migration path for future microservices architecture
- Structure example:
  ```
  packages/
    client/     # React frontend application
    server/     # Node.js backend services
    shared/     # Shared types, utilities, constants
  ```

## Repository Management & Automation

### Pattern: Automated Repository Configuration Management
- Create comprehensive automation systems for GitHub repository configuration
- Implement GitHub API integration with proper error handling and rate limiting
- Design label systems organized by priority, type, component, status, and technical area
- Add safety features including dry-run capabilities and validation checks
- Implementation considerations:
  - Use environment variables for sensitive configuration (GitHub PAT)
  - Implement proper error handling and retry logic
  - Create comprehensive documentation with usage examples
  - Add validation and verification steps for configuration changes

---

## Maintenance Information

**Row Count:** 287 **Context Efficiency:** High **Last Consolidation:** 2025-08-17
**Next Review:** Continuous (updated with each major implementation phase)
**Archive Criteria:** When file reaches 300 rows or when content is superseded by newer patterns

## Topic Index

- **WebSocket Integration:** Socket.IO patterns, Express integration, HTTP server wrapper
- **Real-time Communication:** TypeScript type safety, event handling, connection recovery
- **Session Management:** Room-based communication, session lifecycle, isolated channels
- **Dependency Management:** Monorepo configuration, version harmonization, package installation
- **Responsive Design:** MUI breakpoints, fluid typography, mobile-first implementation
- **Theme Customization:** Gaming aesthetics, dark mode optimization, component overrides
- **Audio Interface:** Touch optimization, visualization components, recording controls
- **Drag-and-Drop:** React implementation, HTML5 APIs, state management
- **Development Tooling:** ESLint 9 configuration, Husky 9 setup, quality gates
- **Testing Frameworks:** Vitest migration, JSDOM configuration, test setup patterns
- **Security Management:** PNPM overrides, vulnerability resolution, automated workflows
- **Architecture Design:** Modular monolith, package organization, migration strategies
- **Repository Automation:** GitHub API integration, label management, configuration systems
