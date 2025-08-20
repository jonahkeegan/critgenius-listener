# System Patterns - Crit Genius Listener

**Last Updated:** 2025-01-08 20:31 PST **Version:** 2.0.0 **Dependencies:** projectbrief.md,
productContext.md

## Architectural Decisions

### ADR-001: AssemblyAI Selection for Speech-to-Text

**Status:** Accepted  
**Context:** Need reliable real-time transcription with speaker diarization  
**Decision:** Use AssemblyAI Node SDK for speech-to-text processing  
**Rationale:** Context7 analysis confirms excellent documentation, robust speaker diarization, and
real-time streaming capabilities  
**Consequences:** AssemblyAI service dependency, but excellent feature alignment with requirements

### ADR-002: Web Audio API for Real-Time Audio Capture

**Status:** Accepted  
**Context:** Browser-based real-time audio capture requirement  
**Decision:** Implement Web Audio API with progressive enhancement  
**Rationale:** Native browser support, real-time capabilities, Context7-validated documentation
quality  
**Consequences:** Browser compatibility considerations, but standardized approach

### ADR-003: Modular Monolith Architecture for MVP

**Status:** Accepted  
**Context:** Balance between complexity and scalability for initial release  
**Decision:** Implement modular monolith with clear component boundaries  
**Rationale:** Reduced complexity for MVP while maintaining migration path to microservices  
**Consequences:** Easier development and deployment, with future refactoring considerations

## Design Patterns

### Real-Time Streaming Pattern

- **Pattern:** Event-driven architecture with WebSocket streaming
- **Implementation:** AssemblyAI real-time transcription with speaker diarization
- **Components:** AudioCapture → ListenerService → AssemblyAI → SpeakerMapper → UI

### Speaker-Character Mapping Pattern

- **Pattern:** Persistent profile management with voice fingerprinting
- **Implementation:** Voice characteristic analysis with session-based character assignment
- **Components:** MappingInterface → SpeakerProfileManager → VoiceAnalyzer → SessionStorage

### Audio Processing Pipeline Pattern

- **Pattern:** Multi-layer processing with quality gates
- **Layers:** Input → Streaming → Processing → Output
- **Quality Gates:** Permission handling, quality detection, error resilience

## System Architecture Overview

```
CritGenius Listener Architecture:
├── Frontend (React + TypeScript)
│   ├── Audio Capture Components (Web Audio API)
│   ├── Real-time Transcript Display
│   ├── Speaker-Character Mapping Interface
│   └── WebSocket Client Communication
├── Backend Services (Node.js + Express)
│   ├── Audio Streaming Service
│   ├── AssemblyAI Integration Service
│   ├── Speaker Profile Management
│   └── CritGenius Ecosystem APIs
├── Data Layer
│   ├── MongoDB (Session data, speaker profiles)
│   ├── Redis (Real-time state, caching)
│   └── File Storage (Audio artifacts)
└── Infrastructure
    ├── Docker Containerization
    ├── WebSocket.io for real-time communication
    └── Cloud deployment with auto-scaling
```

## Key Architectural Principles

1. **Privacy-First Design**: Local processing capabilities with transparent data policies
2. **Real-Time Performance**: Sub-500ms latency for gaming experience
3. **Modular Design**: Clear component boundaries for CritGenius ecosystem integration
4. **Progressive Enhancement**: Graceful degradation across browser capabilities
5. **Scalability Planning**: Horizontal scaling support for multiple sessions
6. **Reliability Focus**: 99.9% uptime with comprehensive error handling

## Component Interactions

### Core Workflow Sequence

```
User → AudioCapture → ListenerService → AssemblyAI → SpeakerMapper → CritGeniusCore
```

### Real-Time Data Flow

1. **Audio Input**: Web Audio API microphone capture
2. **Streaming**: WebSocket audio data transmission
3. **Transcription**: AssemblyAI real-time processing with speaker diarization
4. **Mapping**: Speaker-to-character assignment with voice profiling
5. **Output**: Live transcript display and CritGenius ecosystem integration

## Data Flow Patterns

### Audio Processing Pipeline

```
Microphone → Web Audio API → Audio Chunks → WebSocket → AssemblyAI →
Transcript + Speaker Labels → Character Mapping → Display + Export
```

### Speaker Profile Management

```
Voice Input → Voice Analysis → Fingerprint Generation → Profile Storage →
Character Assignment → Persistent Mapping → Cross-Session Recognition
```

## Security Patterns

1. **Audio Permission Management**: Explicit user consent with Web Audio API permissions
2. **Data Encryption**: HTTPS/WSS for secure audio streaming
3. **Privacy Compliance**: Local processing options and transparent data handling
4. **Service Authentication**: Secure AssemblyAI API key management
5. **Client Security**: Input validation and XSS protection

## Performance Patterns

1. **Latency Optimization**: <500ms end-to-end audio-to-transcript processing
2. **Buffer Management**: Efficient audio chunking and streaming
3. **Caching Strategy**: Redis for session state and speaker profiles
4. **Resource Management**: Memory optimization for continuous audio processing
5. **Load Balancing**: Horizontal scaling for concurrent sessions

## Error Handling Patterns

1. **Progressive Degradation**: Fallback processing when services unavailable
2. **Retry Logic**: Exponential backoff for service failures
3. **User Feedback**: Clear error messages and recovery guidance
4. **Monitoring Integration**: Real-time error tracking and alerting
5. **Graceful Recovery**: State preservation during service interruptions

## Validation Patterns (Aug 19, 2025)

- **Mock-first Realtime Validation**: Use module and WebSocket mocks to validate ~90% of integration
  surface without live API keys.
- **Server-side Normalization**: Normalize transcription payloads (text, confidence, words, isFinal)
  in the Session Manager before broadcasting to clients.
- **Lifecycle-driven Cleanup**: Tie connector lifecycle to room participants; last participant leave
  triggers connector close and session deletion.
- **Error Signaling Contracts**: Emit structured error codes across Socket.IO boundary (e.g.,
  ASSEMBLYAI_CONFIG_MISSING, TRANSCRIPTION_ERROR) to simplify client handling.

## Integration Patterns

### CritGenius Ecosystem APIs

```
├── /audio (Audio capture management)
├── /transcription (Real-time transcript streaming)
├── /speakers (Speaker-character mapping)
└── /integration (Ecosystem data export)
```

### Event-Driven Integration

- **Real-time Events**: Live transcript streaming for CritGenius Prompter
- **Session Exports**: Complete session data for CritGenius LLM processing
- **Formatted Output**: Structured data for CritGenius Publisher

## Scalability Considerations

1. **Horizontal Scaling**: Multiple instance support with load balancing
2. **Database Sharding**: MongoDB collections partitioned by session
3. **CDN Integration**: Static asset delivery optimization
4. **Microservices Migration Path**: Clear component boundaries for future decomposition
5. **Performance Monitoring**: Real-time scaling triggers based on usage metrics

## Deployment Patterns

1. **Containerization**: Docker for consistent deployment environments
2. **Blue-Green Deployment**: Zero-downtime production updates
3. **Infrastructure as Code**: Automated environment provisioning
4. **CI/CD Pipeline**: Automated testing, building, and deployment
5. **Monitoring Integration**: APM and logging for production visibility

## Notes

- Architecture validated through Context7 technology assessment
- System patterns derived from Product Architecture Strategy evaluation
- Design supports first-mover advantage in D&D audio processing
- Modular approach enables CritGenius ecosystem expansion
- Performance targets validated through systematic architecture analysis

## Reference Links

- **Dependencies:** ../memory-bank/projectbrief.md, ../memory-bank/productContext.md
- **Next Dependencies:** techContext.md
- **Architecture Strategy:** ../architecture-strategy-evaluation-critgenius-listener.md
