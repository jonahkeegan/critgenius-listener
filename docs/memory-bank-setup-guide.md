# Memory Bank Setup Guide

**Last Updated:** 2025-11-04  
**Version:** 1.0.0 - Initial setup guide split from memory-bank-update-guide.md  
**Target Audience:** New developers, anyone setting up memory bank awareness

This guide provides the foundational understanding needed to work with the CritGenius Listener
memory bank system. It serves as the entry point for understanding the system architecture and core
file ecosystem.

---

## Overview

The Memory Bank system is a comprehensive knowledge management framework designed to maintain
continuity across AI assistant sessions through structured documentation. This system consists of 6
core file types, each serving specific purposes in our knowledge preservation ecosystem.

### Memory Bank File Ecosystem

The memory bank consists of 6 core file types, each serving specific purposes:

| File Type                       | Purpose                      | Update Frequency             | Row Limit                 |
| ------------------------------- | ---------------------------- | ---------------------------- | ------------------------- |
| `raw_reflection_log.md`         | Initial detailed reflections | After each task              | Prune after consolidation |
| `consolidated-learnings-XXX.md` | Curated, actionable patterns | Periodic                     | 300 rows                  |
| `learnings-index.md`            | Learnings file registry      | With each consolidation      | N/A                       |
| `progress-XXX.md`               | Chronological worklog        | After each task              | 300 rows                  |
| `index-progress.md`             | Progress file registry       | With each progress update    | N/A                       |
| `systemPatterns-XXX.md`         | Architecture patterns        | When patterns emerge         | 300 rows                  |
| `systemPatterns-index.md`       | Patterns file registry       | With each pattern addition   | N/A                       |
| `activeContext.md`              | Current state snapshot       | After significant milestones | N/A                       |

---

## High-Level Memory Bank Update Workflow

```sequenceDiagram
participant GPT5Copilot
participant TaskCompletion
participant MemoryBank
participant RawLog as raw_reflection_log.md
participant ConsolidatedLearnings as consolidated-learnings-XXX.md
participant ProgressLog as progress-XXX.md
participant SystemPatterns as systemPatterns-XXX.md
participant ActiveContext as activeContext.md
participant Indexes

GPT5Copilot->>TaskCompletion: Complete task
TaskCompletion->>GPT5Copilot: Trigger memory bank update
GPT5Copilot->>MemoryBank: Initiate update workflow
MemoryBank->>GPT5Copilot: Load file structure

GPT5Copilot->>RawLog: Log raw reflections (Step 2)
RawLog-->>GPT5Copilot: Entry logged

alt Periodic Consolidation
    GPT5Copilot->>RawLog: Review entries
    GPT5Copilot->>ConsolidatedLearnings: Distill patterns (Step 3)
    ConsolidatedLearnings-->>GPT5Copilot: Patterns captured
    GPT5Copilot->>RawLog: Prune processed entries (Step 9)
end

GPT5Copilot->>Indexes: Update learnings/progress indexes (Step 4)
GPT5Copilot->>ProgressLog: Record task completion (Step 5)
GPT5Copilot->>SystemPatterns: Capture reusable patterns (Step 6)
GPT5Copilot->>ActiveContext: Refresh current state (Step 7)
GPT5Copilot->>MemoryBank: Validate consistency (Step 8)
MemoryBank-->>GPT5Copilot: Validation complete

GPT5Copilot-->>TaskCompletion: Memory bank updated
```

---

## Know the Core Files

### 1.1 `memory-bank/raw_reflection_log.md`

**Purpose:** First stop for detailed, timestamped reflections before consolidation.

**When to Use:**

- Immediately after completing any task
- When discovering new patterns during implementation
- After encountering and resolving errors
- When validation reveals unexpected insights

**Content Structure:**

```markdown
Date: YYYY-MM-DD TaskRef: "Task ID / Descriptive Title"

Learnings:

- Bullet points of discoveries

Success Patterns:

- What worked well

Implementation Excellence:

- Notable achievements

Improvements_Identified_For_Consolidation:

- Patterns for future extraction
```

**Key Characteristics:**

- Contains detailed, raw reflections
- Timestamped entries with task references
- Serves as the initial capture point
- Gets pruned after consolidation to consolidated-learnings files

### 1.2 `memory-bank/consolidated-learnings-XXX.md`

**Purpose:** Curated, actionable patterns distilled from raw log.

**When to Use:**

- During periodic consolidation (when raw log has 5+ entries)
- Before raw log exceeds 50 rows
- When patterns become clear from recent work

**Content Structure:**

- Organized by domain (Architecture, Technical Implementation, Testing, etc.)
- Pattern name with problem/solution/benefits/implementation notes
- Cross-references to related patterns
- Validation commands where applicable

**Key Characteristics:**

- Paginated system (consolidated-learnings-001.md, 002.md, etc.)
- 300-row limit per file
- Contains generalizable, actionable patterns
- Referenced by `learnings-index.md`

### 1.3 `memory-bank/learnings-index.md`

**Purpose:** Registry for consolidated learnings files with metadata.

**When to Update:**

- After adding content to any consolidated-learnings file
- When creating new consolidated-learnings file (at 300-row threshold)
- After major consolidation sessions

**Tracked Metadata:**

- Active file designation
- Row counts per file
- Last updated timestamps
- Topic coverage per file
- Version numbers

**Key Characteristics:**

- Single file (never paginated)
- Tracks all consolidated learning files
- Contains metadata for quick navigation
- Updated whenever learnings files change

### 1.4 `memory-bank/progress-XXX.md`

**Purpose:** Chronological worklog segments capturing task completion details.

**When to Use:**

- After completing any task
- When reaching significant implementation milestones
- After validation confirms changes work correctly

**Content Structure:**

```markdown
### YYYY-MM-DD – Task Title (Task ID)

- **Objective**: Brief description
- **Changes**:
  - Bullet list of modifications
  - Include file paths and key functions
- **Validation**: Commands executed to verify
- **Outcomes**: Observable results
```

**Key Characteristics:**

- Paginated system (progress-001.md, 002.md, etc.)
- Chronological order of completed tasks
- 300-row limit per file
- Referenced by `index-progress.md`

### 1.5 `memory-bank/index-progress.md`

**Purpose:** Registry for progress log segments with metadata.

**When to Update:**

- After adding entry to any progress file
- When creating new progress file (at 300-row threshold)
- After archiving completed segments

**Tracked Metadata:**

- Active segment designation
- Row counts per segment
- Date ranges covered
- Primary topics per segment

**Key Characteristics:**

- Single file (never paginated)
- Tracks all progress log segments
- Contains metadata for quick navigation
- Updated whenever progress files change

### 1.6 `memory-bank/systemPatterns-XXX.md`

**Purpose:** Architecture, testing, and workflow patterns by domain.

**When to Use:**

- When a repeatable approach emerges
- After solving a complex technical challenge
- When establishing new architectural decisions
- After creating reusable infrastructure

**Content Structure:**

```markdown
## Pattern Name

**Context**: When this pattern applies **Problem**: What challenge it addresses **Solution**:
Implementation approach **Benefits**: Why use this pattern **Implementation Notes**: Key details
**Validation**: Commands to verify **Related Patterns**: Cross-references
```

**Key Characteristics:**

- Paginated system (systemPatterns-001.md, 002.md, etc.)
- Domain-organized patterns
- 300-row limit per file
- Referenced by `systemPatterns-index.md`

### 1.7 `memory-bank/systemPatterns-index.md`

**Purpose:** Registry for pattern files with topic mapping.

**When to Update:**

- After adding pattern to any systemPatterns file
- When creating new systemPatterns file
- After reorganizing pattern domains

**Key Characteristics:**

- Single file (never paginated)
- Tracks all system pattern files
- Contains topic mapping for navigation
- Updated whenever patterns files change

### 1.8 `memory-bank/activeContext.md`

**Purpose:** High-level state snapshot of project capabilities and recent milestones.

**When to Update:**

- After completing major features
- When project capabilities expand
- After architectural decisions
- When updating version numbers

**Content Sections:**

- Current Project State Synthesis
- Immediate Context
- Knowledge State Summary
- Current Capabilities
- Latest Updates (chronological)
- Decision Log
- Next Steps

**Key Characteristics:**

- Single file (never paginated)
- High-level project overview
- Updated after major milestones
- Serves as the primary context source for new sessions

---

## Quick Reference

### Essential Commands

- `pnpm vitest run tests/docs/memory-bank-update-guide.test.ts` — validate guide structure
- `wc -l memory-bank/*.md` — count rows per file
- `grep -r "pattern-name" memory-bank/` — check references and patterns
- `pnpm test:coverage:thematic` — verify thematic coverage thresholds

### File Update Priority

1. **Always**: raw_reflection_log.md
2. **After task**: progress-XXX.md
3. **Periodic**: consolidated-learnings-XXX.md
4. **When patterns emerge**: systemPatterns-XXX.md
5. **After milestone**: activeContext.md
6. **After any update**: Relevant index files

### Row Count Limits

- **Hard Limit**: 300 rows per file
- **Warning Threshold**: 290 rows
- **Create New File**: At 300 rows

---

## Related Documentation

- **[Memory Bank Workflow Guide](memory-bank-workflow-guide.md)** — Step-by-step operational
  workflows for updating the memory bank
- **[Memory Bank Templates](memory-bank-templates.md)** — Ready-to-use templates and examples for
  creating entries
- **[Memory Bank Maintenance Guide](memory-bank-maintenance-guide.md)** — Ongoing maintenance and
  quality assurance procedures
- **[Memory Bank AI Instructions](memory-bank-ai-instructions.md)** — Specialized instructions for
  AI coding assistants
- **[Continuous Improvement Protocol](../07-cline-continuous-improvement-protocol.md)** — Mandatory
  workflow for capturing learnings

---

**End of Setup Guide**

This guide provides the foundational understanding needed to work with the memory bank system. For
operational workflows, templates, and detailed procedures, see the related documentation guides
listed above.
