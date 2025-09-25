# System Patterns Index

Last Updated: 2025-09-25 | Index Version: 1.4.0 | Status: Active

## Segment Registry
| File | Segment | Status | Row Count (approx) | Scope |
|------|---------|--------|--------------------|-------|
| systemPatterns-001.md | 001 | Active | <200 | Architectural foundations & ADR-001→007 |
| systemPatterns-002.md | 002 | Active | <250 | Development & infrastructure (ADR-008→014, env, orchestration) |
| systemPatterns-003.md | 003 | Active | <180 | Runtime & operational (design, performance, resilience) |

Row counts maintained under 300-line cap policy. Future Segment 004 to be created only if a new thematic domain emerges (e.g., AI augmentation patterns) exceeding existing scopes.

## Topic Mapping (Selected)
| Topic | Segment |
|-------|---------|
| Core Architectural Principles | 001 |
| Environment Validation Architecture | 002 |
| Pre-Commit & Benchmarking | 002 |
| Dev Server Optimization & Reload | 002 |
| Declarative Service Manifest | 002 |
| Health Scoring & Backoff Resilience | 003 |
| Real-Time Streaming & Mapping | 003 |
| Security & Performance Patterns | 003 |
| Local Dev Secure HTTPS Context | 003 |
| Dev HTTPS Proxy Hardening & Diagnostics | 003 |
| Dev Proxy Dynamic Port Discovery | 002 |
| Centralized Proxy Registry | 002 |
| Env Template Drift Guard & Deterministic Loader Precedence | 002 |
| HTTPS Dev Protocol Alignment & Drift Guard | 003 |
| Scalability & Deployment | 003 |

## Maintenance Protocol
- Update this index after any segment mutation (row counts, new topics, status changes)
- Enforce <300 lines per segment; spin up next segment before overflow
- Preserve historical continuity; never delete—mark Archived if superseded
- Record changes in each segment Change Log + recent changes list here

## Cross-File Dependencies
- `activeContext.md` must reference this index (not legacy monolith)
- `projectbrief.md`, `productContext.md` remain upstream strategic context
- Technical implementation specifics also cross-reference `index-techContext.md`

## Recent Changes
- 2025-09-25: Added Env Template Drift Guard & Deterministic Loader Precedence pattern (Task 2.10.3)
- 2025-09-20: Added Centralized Proxy Registry pattern (Task 2.10.2-2)
- 2025-09-20: Added Dev Proxy Dynamic Port Discovery pattern (Task 2.10.2-1)
- 2025-09-17: Added dev HTTPS proxy hardening & diagnostics pattern (Task 2.10.2)
- 2025-09-14: Added local dev secure HTTPS context pattern (Task 2.10.1)
- 2025-09-12: Initialized segmented systemPatterns (monolith decomposed into 3 thematic files; legacy stub created)

## Backlog Enhancements
- [ ] Automate line count & table update script
- [ ] Add semantic tags per topic for advanced querying
- [ ] Integrity checksum per segment (future)

## Decommissioned Artifact
- Original `systemPatterns.md` replaced by redirect stub (content distributed across segments 001–003). A one-time archival snapshot retained as `systemPatterns-legacy-2025-09-12.md`.

---
End of index.
