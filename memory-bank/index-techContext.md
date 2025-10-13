# Technical Context Index

Last Updated: 2025-10-12 | Version: 1.23.0 | System Status: Active

## Active Segments
- Current Active Editing Target: techContext-003.md (initial extraction complete; all segments stable)

## Segment Registry
| File | Status | Row Count (approx) | Scope | Notes |
|------|--------|--------------------|-------|-------|
| techContext-001.md | Active | <200 | Core stack, languages, frameworks, realtime flow | Foundational technology map |
| techContext-002.md | Active | <200 | Tooling, testing, build, CI/CD, automation | Includes pre-commit + env projection |
| techContext-003.md | Active | <200 | Infrastructure, security, performance, scalability | Contains constraints & risk register |

Row counts maintained under 300-line cap policy. Future segments (004+) to be created only when a domain emerges that doesn't fit existing thematic separation.

## Topic Mapping
| Topic | Segment |
|-------|---------|
| React / Web Audio | 001 |
| AssemblyAI Streaming | 001 |
| Testing Strategy | 002 |
| Pre-commit Automation | 002 |
| Conditional Type-Aware Pre-commit Gating | 002 |
| Workflow Benchmarking & Onboarding | 002 |
| Vite Dev Server Optimization | 002 |
| Development Proxy Configuration | 002 |
| Dev Proxy Dynamic Port Discovery | 002 |
| Dev Server Validation & Documentation | 002 |
| EnvReloadPlugin Interface Enhancement (explicit options + dedup) | 002 |
| Env Reload Integration Test (Playwright) | 002 |
| Coordinated Dev Orchestration (Legacy Inline) | 002 |
| Declarative Service Manifest Orchestration | 002 |
| Enhanced Health & Restart Resilience | 003 |
| Declarative Manifest Orchestration | 003 |
| Local Dev HTTPS Certificate Enablement | 003 |
| Environment Validation | 002 |
| CI/CD Workflow | 002 |
| Infrastructure Scaling | 003 |
| Security Headers / CORS | 003 |
| Performance Targets | 003 |
| Risk Register | 003 |
| Dev HTTPS Proxy Hardening & Diagnostics | 003 |
| Centralized Proxy Registry | 002 |
| Audio Capture Configuration (Feature Flags + Retry) | 001 |
| Structured Audio Diagnostics & Error Codes | 001 |
| HTTPS Socket.IO Verification & TLS Resilience | 003 |
| Vitest Configuration Standardization | 002 |
| Vitest Workspace Hardening & CI Readiness | 002 |
| Performance Latency Benchmarking & Regression Detection Harness | 003 |
| Path Diagnostics & Normalization Guardrails | 003 |
| Socket.IO Integration Timeout Stabilization | 003 |
| Integration Testing Harness & Cross-Package Workflows | 003 |
| Comprehensive Testing Guide & Validation Suite | 002 |
| Tiered Coverage Enforcement & Thematic Reporting | 003 |
| ESLint Warm-up & Vitest Timeout Governance | 003 |

## Maintenance Protocol
- Update this index upon any segment modification (row counts, new topics, status changes)
- Enforce <300 lines per segment; if nearing threshold, spin up next segment (e.g., 004)
- Preserve historical continuity; do not delete segments—mark Archived if superseded
- Add change log entries inside each segment under its Change Log section

## Cross-File Dependencies
- `activeContext.md` must reference this index + segments, not legacy monolith filename
- `projectbrief.md`, `productContext.md`, and `systemPatterns.md` remain upstream context for all segments

## Recent Changes
- 2025-10-12: Added tiered coverage enforcement, thematic coverage orchestration, and lint/timeout governance topics (Task 3.2.1) to segment 003
- 2025-10-11: Added comprehensive testing guide & validation suite summary (Task 3.1.5) to segment 002
- 2025-10-10: Added integration testing harness & cross-package workflow topic (Task 3.1.4) to segment 003
- 2025-10-10: Added Socket.IO integration timeout stabilization topic (Task 3.1.3 latency harness hardening) to segment 003
- 2025-10-08: Added path diagnostics & normalization guardrail topic (Task 3.1.3 Path TypeError investigation) to segment 003
- 2025-10-05: Added performance benchmarking harness hardening topic (Task 3.1.3) to segment 003
- 2025-10-02: Added Vitest workspace hardening & CI readiness topic (Task 3.1.1.1) to segment 002
- 2025-09-30: Added Vitest configuration standardization topic (Task 3.1.1) to segment 002
- 2025-09-29: Added HTTPS Socket.IO verification & TLS resilience topic (Task 2.10.5) to segment 003
- 2025-09-28: Added Structured Audio Diagnostics & Error Codes topic (Task 2.10.4.2) to segment 001
- 2025-09-28: Added Audio Capture Configuration topic (Task 2.10.3) to segment 001
- 2025-09-20: Added Centralized Proxy Registry topic (Task 2.10.2-2: shared proxy route/env key registry, client proxy builder refactor; tests; future generators)
- 2025-09-20: Added Dev Proxy Dynamic Port Discovery topic (Task 2.10.2-1: shared env schema, PortDiscoveryService, async proxy builder, Vite serve integration, unit tests, docs; sanitized logging)
- 2025-09-17: Added dev HTTPS proxy hardening & diagnostics topic (Task 2.10.2: HTTPS proxy env vars, proxy builder enhancements, preflight diagnostics script, docs updates)
- 2025-09-14: Added local dev HTTPS certificate enablement topic (Task 2.10.1: dev-only HTTPS env vars, mkcert/OpenSSL scripts, conditional Vite https, docs & tests)
- 2025-09-06: Added envReloadPlugin interface enhancement topic (explicit options + canonicalization & dedup; Task 2.9.4 enhancement)
- 2025-09-03: Added env reload integration test topic (Task 2.9.4 extension: real Vite + Playwright navigation-based reload detection scaffold)
- 2025-08-31: Added dev server validation & documentation topic (Task 2.9.4: plugin extraction, test-centric validation, simulated HMR harness, documentation update)
- 2025-08-30: Added enhanced health endpoint & intelligent restart backoff (Task 2.9.3 resilience enhancement)
- 2025-08-30: Refined coordinated dev orchestration → declarative manifest model (Task 2.9.3 enhancement)
- 2025-08-29: Added coordinated dev orchestration topic (Task 2.9.3)
- 2025-08-29: Added development proxy configuration topic (Task 2.9.2)
- 2025-08-28: Added Vite dev server optimization topic (Task 2.9.1)
- 2025-08-28: Added workflow benchmarking & onboarding topic (Task 2.8.5)
- 2025-08-27: Added entry for conditional type-aware pre-commit gating enhancement (Task 2.8.4)
- 2025-08-25: Initialized versioned system; split monolithic techContext.md into 3 thematic segments
- 2025-08-25: Added index-techContext.md with registry + topic mapping
- 2025-08-25: Restored index after unintended content wipe
- 2025-08-25: Created backup snapshots (techContext-001/002/003 .backup-2025-08-25)
- 2025-08-25: Added full backups (techContext-002/003 .backup-full-2025-08-25)

## Backlog Enhancements
- [ ] Add automated script to recalc line counts & update table
- [ ] Introduce semantic tags for advanced querying
- [ ] Integrity checksum per segment (future)

## Decommissioned Artifact
- Original `techContext.md` replaced by stub pointer to this index (no content lost)

---
End of index.
