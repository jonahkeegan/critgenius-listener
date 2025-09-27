# System Patterns – Architectural Foundations (Segment 001)

Last Updated: 2025-09-12 | Segment Version: 1.0.0 | Replaces legacy monolith sections

Parent Index: `systemPatterns-index.md` | Related Context: `projectbrief.md`, `productContext.md`

## Scope

Foundational architectural decisions (ADR-001 → ADR-007), core system architecture, principles, and
primary component & workflow interactions. Operational, infrastructure workflow, and runtime
optimization content moved to Segments 002 & 003.

## Architectural Decisions (ADR-001 → ADR-007)

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

### ADR-004: Comprehensive Environment Variable Management System

**Status:** Accepted (Aug 20, 2025)  
**Context:** Need robust environment configuration management across development/staging/production
with validation and error handling  
**Decision:** Implement Zod-based schema validation with environment-specific templates and
centralized management  
**Rationale:** TypeScript compile-time safety + runtime validation prevents configuration errors and
enables secure deployment patterns  
**Consequences:** Centralized configuration management enables consistent validation, reduces
misconfiguration risk, and provides clear startup error messaging

### ADR-005: Client-Safe Environment Projection & Build Injection

**Status:** Accepted (Aug 24, 2025)  
**Context:** Need to expose minimal, non-secret subset of configuration to browser code while
preventing accidental leakage and enabling dynamic feature flags.  
**Decision:** Explicit allow-list schema (`clientConfigSchema`) plus projection utility feeding
sanitized JSON into Vite define; runtime accessor with non-cached `hasFeature` evaluation.  
**Rationale:** Positive control eliminates secret drift; build-time injection provides immutable
snapshot; dynamic evaluation prevents stale test states.  
**Consequences:** Requires explicit updates when adding new public keys (small maintenance cost) but
materially reduces security risk.

### ADR-006: Lightweight Pre-Commit Automation Strategy (Husky + lint-staged)

**Status:** Accepted (Aug 25, 2025)  
**Context:** Need consistent, fast local quality gates (format + lint) without slowing workflow.  
**Decision:** Minimal `pre-commit` (lint-staged ESLint --fix + Prettier) + `commit-msg` Conventional
Commit enforcement.  
**Rationale:** Staged-file scoping preserves sub-second latency; commit hygiene improved.  
**Consequences:** Type errors & tests deferred to CI/manual runs (acceptable tradeoff).

### ADR-007: Conditional Type-Aware Pre-Commit Gating & Validation Harness

**Status:** Accepted (Aug 27, 2025)  
**Context:** Earlier surfacing of type regressions without penalizing non-TS commits.  
**Decision:** Execute monorepo type-check only when staged `.ts/.tsx` present; add simulation +
validation scripts.  
**Rationale:** Preserves fast path for docs commits; stronger local type safety when relevant.  
**Consequences:** Slight script complexity increase; foundation for future JSON reporting.

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

1. Privacy-First Design
2. Real-Time Performance (<500ms target)
3. Modular Design (future microservices path)
4. Progressive Enhancement (graceful degradation)
5. Scalability Planning (horizontal session scaling)
6. Reliability Focus (robust error handling)

## Component Interactions & Core Workflow

```
User → AudioCapture → ListenerService → AssemblyAI → SpeakerMapper → CritGeniusCore
```

**Real-Time Data Flow:** Audio Input → Streaming → Transcription → Mapping → Output

## Notes

- Architecture validated via Context7 technology assessment
- Modular approach enables ecosystem expansion
- Performance targets aligned with gaming experience requirements

## Reference Links

- Dependencies: `projectbrief.md`, `productContext.md`
- Architecture Strategy: `../architecture-strategy-evaluation-critgenius-listener.md`

## Change Log

- 2025-09-12: Extracted foundational content from legacy monolith into Segment 001.

---

End of Segment 001.
