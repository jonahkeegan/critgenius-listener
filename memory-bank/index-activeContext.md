# Active Context Index

**Last Updated:** 2025-10-25  
**Version:** 1.1.4  
**System Status:** Active

## Overview

The Active Context system maintains current project state through a hybrid structure:

- **Current File**: Hot zone with immediate state (updated frequently)
- **History Segments**: Cold archive of updates and decisions (append-only)

## Active File

**Currently Active:** `activeContext-current.md` **Status:** Active - Primary Current State
**Current Row Count:** ~204 (target 150) **Last Updated:** 2025-10-25

## File Registry

### activeContext-current.md

- **Status:** Active
- **Row Count:** ~195 (approx)
- **Scope:** Current state synthesis, immediate context, recent capabilities, next steps
- **Update Frequency:** With each major milestone
- **Description:** Maintains only essential current project state; archives to history when Latest
  Updates exceeds 10 entries

### activeContext-history-001.md

- **Status:** Active
- **Row Count:** ~490 (approx)
- **Date Range:** 2025-01-08 to 2025-10-12
- **Primary Topics:** Infrastructure setup progression, Material-UI integration, environment
  management, testing infrastructure, coverage orchestration
- **Description:** Historical archive of Latest Updates entries and Decision Log from original
  activeContext.md through initial refactoring

### activeContext-legacy-2025-10-16.md

- **Status:** Archived
- **Row Count:** 483
- **Description:** Original monolithic activeContext.md preserved for historical reference;
  superseded by segmented structure

## Content Organization

### Current File (`activeContext-current.md`)

- Version & Last Updated metadata
- Current Project State Synthesis
- Immediate Context
- Knowledge State Summary
- Current Capabilities
- Latest Updates (most recent 5-10 entries only)
- Decision Log (most recent 3-5 entries only)
- Active Issues
- Immediate Next Steps
- Reference Links (including link to history index)

### History Files (`activeContext-history-XXX.md`)

- Chronological archive of all Latest Updates entries
- Complete Decision Log (embedded chronologically)
- Archived major milestones
- Historical context for long-term reference

## Maintenance Protocol

### Archival Workflow

1. When Latest Updates in current file exceeds 10 entries:
   - Archive oldest 5 entries to appropriate history segment
   - Keep most recent 5 in current file
2. When Decision Log in current file exceeds 5 entries:
   - Archive oldest entries to history segment
   - Keep most recent 3-5 in current file
3. When history segment approaches 300 rows:
   - Create new history segment with incremented number
   - Update index registry

### Row Count Management

- Current file target: 100-150 rows (hard limit 200)
- History segments: <300 rows per file
- Enforce archival when current file exceeds 180 rows

### Update Triggers

- **Current file**: After major milestones, feature completions, capability additions
- **History archive**: Monthly or when current file thresholds exceeded
- **Index**: After any segment mutation

## Cross-File Dependencies

**Upstream Context (Dependencies):**

- `projectbrief.md` - Strategic foundation
- `productContext.md` - Product strategy

**Lateral Context (Peers):**

- `systemPatterns-index.md` - Architecture patterns
- `index-techContext.md` - Technical stack
- `index-progress.md` - Task chronology
- `learnings-index.md` - Consolidated insights

**Update Protocol:**

- This index referenced by Memory Bank Update Guide
- Other files reference `index-activeContext.md` not individual segments
- Current file links to history index for deep historical context

## Recent Changes

- 2025-10-25: Logged CI ESLint documentation update (Task 3.3.5); refreshed current segment
  capabilities and latest updates to surface the new developer guide.
- 2025-10-23: Logged CI lint workflow guard (Task 3.3.4), refreshed current segment capabilities,
  latest updates, and decision log; noted row count increase for pending archival.
- 2025-10-19: Logged ESLint validation infrastructure expansion (Task 3.3.2) and refreshed current
  segment metadata for fixture harness coverage.
- 2025-10-18: Archived the 2025-10-12 coverage enforcement update to history, refreshed row counts,
  and bumped metadata for both current and history segments.
- 2025-10-17: Recorded ESLint configuration audit and accessibility policy update; refreshed row
  counts after adding the latest milestone to `activeContext-current.md`.
- 2025-10-16: Initialized index system; refactored monolithic activeContext.md (483 rows) into
  hybrid structure (current + history-001); archived original as legacy file

## Validation Commands

```bash
# Verify structure integrity
ls -la memory-bank/activeContext*.md memory-bank/index-activeContext.md

# Check row counts
wc -l memory-bank/activeContext-current.md memory-bank/activeContext-history-*.md

# Validate no content loss
# (Manual verification that all original content preserved)
```

## Backlog Enhancements

- [ ] Automated archival script when current file exceeds threshold
- [ ] Cross-reference validator for activeContext dependencies
- [ ] Row count monitoring with threshold alerts

---

End of index.
