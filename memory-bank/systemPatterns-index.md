# System Patterns Index

Last Updated: 2025-10-29 | Index Version: 1.29.0 | Status: Active

## Segment Registry

| File                  | Segment | Status | Row Count (approx) | Scope                                                          |
| --------------------- | ------- | ------ | ------------------ | -------------------------------------------------------------- |
| systemPatterns-001.md | 001     | Active | <200               | Architectural foundations & ADR-001→007                        |
| systemPatterns-002.md | 002     | Active | <250               | Development & infrastructure (ADR-008→014, env, orchestration) |
| systemPatterns-003.md | 003     | Active | <120               | Runtime & operational (design, performance, resilience)        |
| systemPatterns-004.md | 004     | Active | <120               | Quality gates, coverage orchestration, and lint resilience     |
| systemPatterns-005.md | 005     | Active | <250               | Testing infrastructure, coverage metadata, and QA automation   |

Row counts maintained under 300-line cap policy. Future Segment 006 to be created only if a new
thematic domain emerges (e.g., AI augmentation patterns) exceeding existing scopes.

## Topic Mapping (Selected)

| Topic                                                      | Segment |
| ---------------------------------------------------------- | ------- |
| Core Architectural Principles                              | 001     |
| Environment Validation Architecture                        | 002     |
| Pre-Commit & Benchmarking                                  | 002     |
| Dev Server Optimization & Reload                           | 002     |
| Declarative Service Manifest                               | 002     |
| Health Scoring & Backoff Resilience                        | 003     |
| Real-Time Streaming & Mapping                              | 003     |
| Security & Performance Patterns                            | 003     |
| Local Dev Secure HTTPS Context                             | 003     |
| Dev HTTPS Proxy Hardening & Diagnostics                    | 003     |
| Dev Proxy Dynamic Port Discovery                           | 002     |
| Centralized Proxy Registry                                 | 002     |
| Env Template Drift Guard & Deterministic Loader Precedence | 002     |
| HTTPS Dev Protocol Alignment & Drift Guard                 | 003     |
| Audio Capture Configuration (Feature Flags + Retry)        | 003     |
| Structured Audio Diagnostics & Error Codes                 | 003     |
| Vitest Configuration Standardization                       | 005     |
| Vitest Workspace Hardening & CI Readiness                  | 005     |
| Shared Test Utilities Library                              | 005     |
| Scalability & Deployment                                   | 003     |
| HTTPS Socket.IO TLS Resilience                             | 003     |
| HTTPS Documentation & Troubleshooting Playbook             | 003     |
| Performance Regression Harness (Latency Benchmarking)      | 005     |
| Path Diagnostics & Normalization Guardrails                | 005     |
| Socket.IO Integration Timeout Stabilization                | 003     |
| Integration Testing Harness & Cross-Package Workflows      | 005     |
| Documentation Validation Harness (Comprehensive Guide)     | 005     |
| Tiered Coverage Enforcement & Thematic Reporting           | 004     |
| Centralized Coverage Configuration Module                  | 005     |
| ESLint Warm-up & Slow-Runner Stabilization                 | 004     |
| ESLint Flat Config Single-Source Enforcement               | 004     |
| CI Lint Workflow Guard                                     | 004     |
| Vitest Timeout Governance & Dialog Resilience              | 004     |
| Playwright Runtime Config Validation                       | 004     |
| Playwright Socket Event Buffer Observability               | 004     |
| CI-Only Coverage Enforcement Strategy                      | 004     |
| Coverage Orchestration Validation Guard                    | 005     |
| Coverage Gate Recalibration for Parallel Execution         | 005     |
| CI Coverage Reporting & Codecov Integration                | 004     |
| Disposable ESLint Fixture Harness                          | 004     |
| VS Code Workspace Prettier Enforcement                     | 004     |
| Workspace Playwright E2E Orchestration                     | 005     |
| Playwright Responsive Browser Matrix & Artifact Retention  | 005     |

## Maintenance Protocol

- Update this index after any segment mutation (row counts, new topics, status changes)
- Enforce <300 lines per segment; spin up next segment before overflow
- Preserve historical continuity; never delete—mark Archived if superseded
- Record changes in each segment Change Log + recent changes list here

## Cross-File Dependencies

- `activeContext-current.md` (or `index-activeContext.md` for history) must reference this index
  (not legacy monolith)
- `projectbrief.md`, `productContext.md` remain upstream strategic context
- Technical implementation specifics also cross-reference `index-techContext.md`

## Recent Changes

- 2025-10-29: Added Playwright socket event buffer observability pattern (Task 3.5.3) to segment
  004; bumped index version to 1.29.0.
- 2025-10-28: Added Playwright runtime config validation pattern (Task 3.5.2) to segment 004 and
  Playwright responsive browser matrix pattern (Task 3.5.2) to segment 005; bumped index version to
  1.28.0.
- 2025-10-27: Added workspace Playwright orchestration pattern (Task 3.5.1) to segment 005 and
  bumped index version to 1.27.0.
- 2025-10-27: Registered EditorConfig cross-editor alignment pattern (Task 3.4.2) in segment 004 and
  bumped index version to 1.26.0.
- 2025-10-26: Registered VS Code workspace Prettier enforcement pattern (Task 3.4.1) in segment 004
  and bumped index version to 1.25.0.
- 2025-10-23: Added CI lint workflow guard pattern (Task 3.3.4) to segment 004 and bumped index
  version to 1.24.0.
- 2025-10-19: Added disposable ESLint fixture harness pattern (Task 3.3.2) to segment 004 and bumped
  index version to 1.23.0.
- 2025-10-17: Added ESLint flat config single-source pattern (Task 3.3.1) to segment 004 and bumped
  index version to 1.22.0.
- 2025-10-16: Updated cross-file dependencies to reference activeContext-current.md following hybrid
  segmentation refactoring
- 2025-10-16: Registered CI coverage reporting & Codecov integration pattern (Task 3.2.3) in segment
  004
- 2025-10-15: Added coverage gate recalibration pattern (Task 3.2.2.1) to segment 005
- 2025-10-14: Added coverage orchestration validation guard pattern (Task 3.2.2) to segment 005
- 2025-10-13: Extracted testing infrastructure and QA patterns into new segment 005; updated segment
  003 scope
- 2025-10-13: Added centralized coverage configuration pattern (Task 3.2.1.1) to segment 003
- 2025-10-12: Added tiered coverage enforcement, thematic reporting, and lint stabilization patterns
  (Task 3.2.1) to segment 004
- 2025-10-11: Added documentation validation harness pattern (Task 3.1.5) to segment 003
- 2025-10-10: Added integration testing harness & cross-package workflow pattern (Task 3.1.4) to
  segment 003
- 2025-10-10: Added Socket.IO integration timeout stabilization pattern (Task 3.1.3 latency harness
  work) to segment 003
- 2025-10-08: Added path diagnostics & normalization guardrail pattern (Task 3.1.3 Path TypeError
  investigation) to segment 003
- 2025-10-05: Added performance regression harness pattern (Task 3.1.3) to segment 003
- 2025-10-03: Added shared test utilities library pattern (Task 3.1.2) to segment 003
- 2025-10-02: Expanded Vitest workspace execution pattern with hoisted mocks + Playwright guard
  (Task 3.1.1.1)
- 2025-09-30: Added Vitest configuration standardization pattern (Task 3.1.1) to segment 003
- 2025-09-29: Added HTTPS documentation & troubleshooting playbook (Task 2.10.6) to segment 003
- 2025-09-29: Added HTTPS Socket.IO TLS resilience pattern (Task 2.10.5) to segment 003
- 2025-09-28: Added Structured Audio Diagnostics pattern (Task 2.10.4.2) to segment 003
- 2025-09-28: Added Audio Capture Configuration pattern (Task 2.10.3) to segment 003
- 2025-09-25: Added Env Template Drift Guard & Deterministic Loader Precedence pattern (Task 2.10.3)
- 2025-09-20: Added Centralized Proxy Registry pattern (Task 2.10.2-2)
- 2025-09-20: Added Dev Proxy Dynamic Port Discovery pattern (Task 2.10.2-1)
- 2025-09-17: Added dev HTTPS proxy hardening & diagnostics pattern (Task 2.10.2)
- 2025-09-14: Added local dev secure HTTPS context pattern (Task 2.10.1)
- 2025-09-12: Initialized segmented systemPatterns (monolith decomposed into 3 thematic files;
  legacy stub created)

## Backlog Enhancements

- [ ] Automate line count & table update script
- [ ] Add semantic tags per topic for advanced querying
- [ ] Integrity checksum per segment (future)

## Decommissioned Artifact

- Original `systemPatterns.md` replaced by redirect stub (content distributed across segments
  001–003). A one-time archival snapshot retained as `systemPatterns-legacy-2025-09-12.md`.

---

End of index.
