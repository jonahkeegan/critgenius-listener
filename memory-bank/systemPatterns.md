# System Patterns - Crit Genius Listener

**Last Updated:** 2025-08-24 09:55 PST **Version:** 2.2.0 **Dependencies:** projectbrief.md,
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
│   └── Socket.IO Client Communication
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
    ├── Socket.IO for real-time communication
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

### ADR-004: Comprehensive Environment Variable Management System

**Status:** Accepted (Aug 20, 2025)  
**Context:** Need robust environment configuration management across development/staging/production with validation and error handling  
**Decision:** Implement Zod-based schema validation with environment-specific templates and centralized management  
**Rationale:** TypeScript compile-time safety combined with runtime validation prevents configuration errors, improves developer experience, and enables secure deployment patterns  
**Consequences:** Centralized configuration management enables consistent validation, reduces misconfiguration risks, and provides clear error messaging at startup

### ADR-005: Client-Safe Environment Projection & Build Injection

**Status:** Accepted (Aug 24, 2025)  
**Context:** Need to expose a minimal, non-secret subset of configuration to browser code while preventing accidental leakage and enabling dynamic feature flags.  
**Decision:** Introduce explicit allow-list schema (`clientConfigSchema`) plus projection utility (`getClientRuntimeConfig`) that feeds sanitized JSON into Vite via `define(__CLIENT_ENV__)`; supply runtime accessor with non-cached `hasFeature` evaluation.  
**Rationale:** Positive control (enumerated allow-list) eliminates secret drift; build-time injection provides immutable snapshot for bundle determinism; dynamic evaluation avoids stale values in tests and future live toggling scenarios.  
**Consequences:** Requires explicit updates when adding new public keys (small maintenance cost) but materially reduces security risk and simplifies client consumption & testing.

### ADR-006: Lightweight Pre-Commit Automation Strategy (Husky + lint-staged)

**Status:** Accepted (Aug 25, 2025)  
**Context:** Need consistent, fast local quality gates (formatting + lint) without slowing contributor workflow or duplicating CI responsibilities (type-check & tests).  
**Decision:** Use Husky with a minimal `pre-commit` hook invoking `lint-staged` (ESLint auto-fix + Prettier) and a `commit-msg` hook enforcing Conventional Commit messages. Exclude type-check and test execution from hooks to keep latency low (<1s typical).  
**Rationale:** Staged-file scoping + auto-fix prevents most CI lint failures while preserving rapid iteration. Conventional Commit enforcement at source improves changelog hygiene and PR review quality.  
**Consequences:** Type errors or failing tests are caught in CI (and by developer manual runs). Future escalation (optional) can add run-once type-check or selective tests if signal-to-time ratio remains favorable.

## Development Workflow Patterns

### Pre-Commit Quality Gate Pattern

| Aspect | Implementation | Rationale |
|--------|----------------|-----------|
| Scope | Staged files only | Minimize latency; avoid full-repo scans |
| Tools | ESLint (--fix) + Prettier | Auto-remediation of style + basic issues |
| Enforcement | Conventional Commit regex in commit-msg | Consistent history & semantic versioning prep |
| Exclusions | Type-check, tests | Preserve speed; handled in CI gates |
| Extensibility | Documented in `docs/pre-commit-workflow.md` | Clear path for future enhancements |

### Hook Hardening Guidelines
1. Always include shebang (`#!/usr/bin/env sh`) for cross-platform consistency.
2. Send failure messaging to stderr to ensure visibility in various Git UIs.
3. Keep hook logic declarative; delegate work to package scripts or lint-staged config.
4. Avoid logging environment variable values (privacy & secret safety).
5. Provide documented skip procedure (`--no-verify`) for rare bulk operations.

### Future Enhancements (Deferred)
- Optional run-once type-check for large refactors.
- Secret scanning (git-secrets / trufflehog-lite) prior to push.
- Selective test execution for changed packages using pnpm filtering.

## Environment Configuration Patterns

### Comprehensive Environment Variable Architecture

**Schema-Driven Configuration Management:**
```
packages/shared/src/config/
├── environment.ts          # Zod schemas with 16 categorized groups
├── environmentLoader.ts    # Runtime validation and loading utilities  
└── index.ts               # Centralized exports with type safety
```

**16 Configuration Categories:**
1. **Node Runtime**: PORT, NODE_ENV, application lifecycle variables
2. **Database**: MongoDB/Redis connection strings with connection pooling settings
3. **AssemblyAI**: API keys, real-time transcription configuration, timeout settings
4. **Security**: JWT secrets, API keys, encryption settings with length validation
5. **UI Configuration**: Theme settings, feature toggles, responsive breakpoints
6. **Logging**: Log levels, structured logging configuration, output destinations
7. **Monitoring**: APM tokens, error tracking, performance monitoring settings
8. **Caching**: Redis caching strategies, TTL configuration, cache invalidation
9. **File Operations**: Upload paths, file size limits, storage configuration
10. **Networking**: CORS settings, rate limiting, timeout configurations
11. **Messaging**: Real-time communication, WebSocket configuration
12. **Authentication**: OAuth settings, session management, token validation
13. **Privacy Compliance**: GDPR settings, data retention policies, consent management
14. **Development Tools**: Debug settings, hot reload configuration, development utilities
15. **Error Tracking**: Sentry configuration, error aggregation settings
16. **Performance**: Resource limits, optimization flags, scaling thresholds

### Environment-Specific Security Tiers

**Development (.env.development.example):**
- Relaxed security requirements for rapid development
- Debug features enabled, verbose logging
- Local service URLs and extended timeouts
- Development-friendly API key validation (shorter minimums)

**Staging (.env.staging.example):**  
- Production-like configuration with testing flexibility
- SSL/TLS requirements enabled for security testing
- Structured logging for monitoring validation
- Privacy compliance features enabled for integration testing

**Production (.env.production.example):**
- Maximum security configuration with strict validation
- Mandatory SSL/TLS with certificate management
- 32+ character minimum for JWT secrets and encryption keys
- Comprehensive security headers and compliance requirements

### Runtime Validation Architecture

**Startup Validation Flow:**
```
Application Boot → validateEnvironmentOnStartup() → 
Parse Environment → Zod Schema Validation → 
Type Generation → Error Reporting → Application Ready
```

**Validation Features:**
- Performance timing (startup validation duration tracking)
- Detailed error messages with specific variable names and expected formats
- Environment utility functions (isDevelopment, isProduction, isStaging)
- TypeScript type generation from Zod schemas for compile-time safety
- Graceful error handling with actionable developer guidance
 - Client projection safety: explicit allow-list blocks accidental secret inclusion (KEY|SECRET|TOKEN patterns)
 - Feature flag parsing: `CLIENT_FEATURE_FLAGS="a,b,c"` → normalized Set enabling O(1) flag lookups and dynamic test mutation

### Implementation Benefits

- **Developer Experience**: Clear error messages and comprehensive documentation
- **Type Safety**: Compile-time TypeScript checking combined with runtime validation  
- **Security**: Environment-specific security requirements and validation
- **Maintainability**: Centralized configuration management across monorepo
- **Deployment Safety**: Startup validation prevents misconfigured deployments
- **Client Security**: Sanitized projection ensures no secret categories reach the bundle
- **Testability**: Dynamic flag evaluation (no static cache) enables per-test environment mutation without reset hooks
