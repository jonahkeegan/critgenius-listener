# Memory Bank Update Guide

**Last Updated:** 2025-10-15  
**Version:** 2.0.0 - Enhanced for GPT-5 Copilot  
**Target Audience:** AI Coding Assistants (Primary), Human Developers (Secondary)

This guide documents the **required workflow** for updating the CritGenius Listener memory bank.
Follow these steps whenever you capture new learnings, record task progress, or synchronize
documentation derived from project work.

---

## Overview

The Memory Bank system is a comprehensive knowledge management framework designed to maintain
continuity across AI assistant sessions through structured documentation. This guide provides
explicit, unambiguous instructions optimized for GPT-5 Copilot execution.

**Related Documentation:** This guide complements the Continuous Improvement Protocol defined in
`.clinerules/07-cline-continuous-improvement-protocol.md`, which establishes the mandatory workflow
for capturing learnings and updating the memory bank after task completion.

### High-Level Memory Bank Update Workflow

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

## 1. Know the Core Files

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

### 1.7 `memory-bank/systemPatterns-index.md`

**Purpose:** Registry for pattern files with topic mapping.

**When to Update:**

- After adding pattern to any systemPatterns file
- When creating new systemPatterns file
- After reorganizing pattern domains

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

---

## 2. Update Triggers

Create or edit memory bank entries when any of the following occur:

### 2.1 Task Completion Triggers

- ✅ A task completion report introduces new decisions
- ✅ Tests, scripts, or configs change coverage gates or thresholds
- ✅ Validation commands reveal new patterns
- ✅ Documentation landmarks are created or refreshed

### 2.2 Discovery Triggers

- 🔍 Fresh patterns arise in testing infrastructure
- 🔍 Integration workflows reveal cross-package insights
- 🔍 Architecture decisions establish new conventions
- 🔍 Troubleshooting uncovers root cause patterns

### 2.3 Consolidation Triggers

- 📊 Raw reflections log exceeds 5 entries
- 📊 Periodic review cycle (weekly/bi-weekly)
- 📊 Before starting major new feature work
- 📊 When patterns become evident across multiple tasks

### Trigger Detection Workflow

```sequenceDiagram
participant GPT5Copilot
participant TaskResult
participant TriggerDetector
participant DecisionEngine
participant MemoryBank

GPT5Copilot->>TaskResult: Receive completion status
TaskResult->>TriggerDetector: Analyze task characteristics
TriggerDetector->>TriggerDetector: Check for new patterns
TriggerDetector->>TriggerDetector: Check for decisions made
TriggerDetector->>TriggerDetector: Check for validation commands
TriggerDetector->>TriggerDetector: Check raw log size

alt Trigger Detected
    TriggerDetector->>DecisionEngine: Determine required updates
    DecisionEngine->>DecisionEngine: Select target files
    DecisionEngine->>DecisionEngine: Determine update type
    DecisionEngine-->>GPT5Copilot: Return update plan
    GPT5Copilot->>MemoryBank: Execute update workflow
else No Trigger
    TriggerDetector-->>GPT5Copilot: Skip update
end
```

---

## 3. Standard Workflow

### 3.1 Collect Inputs

**Objective:** Gather all information needed for memory bank update.

**Procedure:**

1. Review completion reports in `task-completion-reports/`
2. Examine git diffs for changed files
3. Check terminal history for validation commands
4. Review conversation logs for decisions made
5. Identify files touched during task execution

**Sequence Diagram:**

```sequenceDiagram
participant GPT5Copilot
participant CompletionReports
participant GitHistory
participant TerminalHistory
participant ConversationLog
participant InputCollector

GPT5Copilot->>CompletionReports: Read latest completion report
CompletionReports-->>GPT5Copilot: Return task details

GPT5Copilot->>GitHistory: Query changed files
GitHistory-->>GPT5Copilot: Return file diffs

GPT5Copilot->>TerminalHistory: Extract validation commands
TerminalHistory-->>GPT5Copilot: Return command list

GPT5Copilot->>ConversationLog: Review decisions made
ConversationLog-->>GPT5Copilot: Return decision points

GPT5Copilot->>InputCollector: Aggregate all inputs
InputCollector->>InputCollector: Identify learnings
InputCollector->>InputCollector: Identify outcomes
InputCollector->>InputCollector: Identify commands
InputCollector-->>GPT5Copilot: Return structured input data
```

**Validation Checkpoint:**

- ✓ Completion report located and read
- ✓ List of changed files compiled
- ✓ Validation commands identified
- ✓ Decisions and outcomes documented

---

### 3.2 Log Raw Reflections

**Objective:** Append detailed, timestamped entry to `raw_reflection_log.md`.

**Procedure:**

1. Open `memory-bank/raw_reflection_log.md`
2. Locate the final closing code fence (````)
3. Insert new entry immediately BEFORE the closing fence
4. Use the standard template with Date, TaskRef, Learnings, Success Patterns, Implementation
   Excellence
5. Include specific file paths, function names, and validation commands
6. Re-emit the closing code fence after the new entry

**Sequence Diagram:**

```sequenceDiagram
participant GPT5Copilot
participant RawLog as raw_reflection_log.md
participant TemplateEngine
participant ValidationEngine

GPT5Copilot->>RawLog: Read current content
RawLog-->>GPT5Copilot: Return file content

GPT5Copilot->>GPT5Copilot: Locate closing fence position
GPT5Copilot->>TemplateEngine: Generate entry from template
TemplateEngine->>TemplateEngine: Fill in Date (YYYY-MM-DD)
TemplateEngine->>TemplateEngine: Add TaskRef
TemplateEngine->>TemplateEngine: Add Learnings bullets
TemplateEngine->>TemplateEngine: Add Success Patterns
TemplateEngine->>TemplateEngine: Add Implementation Excellence
TemplateEngine-->>GPT5Copilot: Return formatted entry

GPT5Copilot->>RawLog: Insert entry before closing fence
GPT5Copilot->>RawLog: Re-emit closing fence
RawLog-->>GPT5Copilot: Entry appended successfully

GPT5Copilot->>ValidationEngine: Verify entry structure
ValidationEngine->>ValidationEngine: Check date format
ValidationEngine->>ValidationEngine: Check TaskRef present
ValidationEngine->>ValidationEngine: Check Learnings non-empty
ValidationEngine-->>GPT5Copilot: Validation passed
```

**Validation Checkpoint:**

- ✓ Entry uses YYYY-MM-DD date format (PST timezone)
- ✓ TaskRef includes task ID or descriptive title
- ✓ Learnings section contains specific discoveries
- ✓ File paths and commands are accurate
- ✓ Closing code fence preserved
- ✓ No corruption of previous entries

**Template Example:**

```markdown
---
Date: 2025-10-15
TaskRef: "Task 3.2.2.1 - Parallel Coverage Execution Alignment"

Learnings:
- Updated vitest-config-consistency.test.ts to align with 9% workspace threshold
- Confirmed thematic coverage suite passes with relaxed gates
- Validation: `pnpm vitest run tests/infrastructure/vitest-config-consistency.test.ts`

Success Patterns:
- Test suite caught threshold misalignment before CI failure
- Single source of truth in config/coverage.config.mjs prevented drift

Implementation Excellence:
- Zero manual threshold tracking across test files
- Automated consistency checks maintain accuracy

Improvements_Identified_For_Consolidation:
- Pattern: Coverage gate synchronization via shared module
---
```

---

### 3.3 Distill Learnings

**Objective:** Transfer high-value insights from raw log to active consolidated-learnings file.

**Procedure:**

1. Check `memory-bank/learnings-index.md` for active file
2. Review `raw_reflection_log.md` for consolidation candidates
3. Identify patterns that are durable, actionable, or broadly applicable
4. Count rows in active consolidated-learnings file
5. If row count ≥ 300, create new file with incremented number
6. Synthesize raw insights into concise, generalizable patterns
7. Add to active file under appropriate domain section
8. Update row count and timestamp in learnings-index.md

**Sequence Diagram:**

```sequenceDiagram
participant GPT5Copilot
participant LearningsIndex as learnings-index.md
participant RawLog as raw_reflection_log.md
participant ActiveFile as consolidated-learnings-XXX.md
participant PatternSynthesizer

GPT5Copilot->>LearningsIndex: Read active file designation
LearningsIndex-->>GPT5Copilot: Return active file name

GPT5Copilot->>RawLog: Read all entries
RawLog-->>GPT5Copilot: Return raw reflections

GPT5Copilot->>GPT5Copilot: Identify consolidation candidates
GPT5Copilot->>PatternSynthesizer: Extract patterns
PatternSynthesizer->>PatternSynthesizer: Identify problem
PatternSynthesizer->>PatternSynthesizer: Define solution
PatternSynthesizer->>PatternSynthesizer: Describe benefits
PatternSynthesizer->>PatternSynthesizer: Add implementation notes
PatternSynthesizer-->>GPT5Copilot: Return synthesized pattern

GPT5Copilot->>ActiveFile: Count current rows
ActiveFile-->>GPT5Copilot: Return row count

alt Row count >= 300
    GPT5Copilot->>GPT5Copilot: Create new file (increment number)
    GPT5Copilot->>LearningsIndex: Update active file designation
else Row count < 300
    GPT5Copilot->>ActiveFile: Append pattern to appropriate section
end

GPT5Copilot->>LearningsIndex: Update row count and timestamp
LearningsIndex-->>GPT5Copilot: Index updated
```

**Validation Checkpoint:**

- ✓ Active file correctly identified from index
- ✓ Pattern includes problem/solution/benefits
- ✓ Pattern is actionable and non-redundant
- ✓ Row count accurately tracked
- ✓ New file created if 300-row threshold reached
- ✓ Cross-references added where appropriate

---

### 3.4 Sync Indexes

**Objective:** Update learnings-index.md and index-progress.md with latest metadata.

**Procedure:**

1. Update `learnings-index.md`:
   - Increment row count for active consolidated-learnings file
   - Update "Last Updated" timestamp
   - Add log entry describing changes
   - Update topic list if new topics added
2. Update `index-progress.md`:
   - Increment row count for active progress file
   - Update "Last Updated" timestamp
   - Add recent changes entry

**Sequence Diagram:**

```sequenceDiagram
participant GPT5Copilot
participant LearningsIndex as learnings-index.md
participant ProgressIndex as index-progress.md
participant ActiveFiles

GPT5Copilot->>ActiveFiles: Get updated row counts
ActiveFiles-->>GPT5Copilot: Return current counts

GPT5Copilot->>LearningsIndex: Read current metadata
LearningsIndex-->>GPT5Copilot: Return index content

GPT5Copilot->>LearningsIndex: Update row count
GPT5Copilot->>LearningsIndex: Update timestamp (PST)
GPT5Copilot->>LearningsIndex: Add update log entry
GPT5Copilot->>LearningsIndex: Update topic list
LearningsIndex-->>GPT5Copilot: Learnings index updated

GPT5Copilot->>ProgressIndex: Read current metadata
ProgressIndex-->>GPT5Copilot: Return index content

GPT5Copilot->>ProgressIndex: Update row count
GPT5Copilot->>ProgressIndex: Update timestamp (PST)
GPT5Copilot->>ProgressIndex: Add recent changes entry
ProgressIndex-->>GPT5Copilot: Progress index updated

GPT5Copilot->>GPT5Copilot: Verify both indexes synchronized
```

**Validation Checkpoint:**

- ✓ Row counts match actual file contents
- ✓ Timestamps use PST timezone
- ✓ Update log entries describe changes clearly
- ✓ Topic lists reflect new content
- ✓ Active file designations are correct

---

### 3.5 Record Progress

**Objective:** Add task completion entry to active progress-XXX.md file.

**Procedure:**

1. Check `index-progress.md` for active progress file
2. Add new section under "Completed Tasks" with:
   - Date and task reference
   - Objective summary
   - Bullet list of changes
   - Validation commands executed
   - Observable outcomes
3. Include specific file paths and function names
4. Reference validation commands that confirm success

**Sequence Diagram:**

```sequenceDiagram
participant GPT5Copilot
participant ProgressIndex as index-progress.md
participant ActiveProgress as progress-XXX.md
participant ValidationCommands

GPT5Copilot->>ProgressIndex: Get active progress file
ProgressIndex-->>GPT5Copilot: Return file name

GPT5Copilot->>ActiveProgress: Read current content
ActiveProgress-->>GPT5Copilot: Return progress log

GPT5Copilot->>GPT5Copilot: Format progress entry
GPT5Copilot->>GPT5Copilot: Add date (YYYY-MM-DD)
GPT5Copilot->>GPT5Copilot: Add task title and ID
GPT5Copilot->>GPT5Copilot: List objective
GPT5Copilot->>GPT5Copilot: List changes with file paths

GPT5Copilot->>ValidationCommands: Get executed commands
ValidationCommands-->>GPT5Copilot: Return command list

GPT5Copilot->>GPT5Copilot: Add validation section
GPT5Copilot->>GPT5Copilot: Add outcomes section

GPT5Copilot->>ActiveProgress: Append entry
ActiveProgress-->>GPT5Copilot: Entry added

GPT5Copilot->>ProgressIndex: Update row count
ProgressIndex-->>GPT5Copilot: Index updated
```

**Validation Checkpoint:**

- ✓ Entry includes date, task ID, and title
- ✓ Changes list includes file paths
- ✓ Validation commands are accurate and complete
- ✓ Outcomes describe observable results
- ✓ Entry added to correct active file

**Progress Entry Example:**

```markdown
### 2025-10-15 – Parallel Coverage Gate Calibration (Task 3.2.2.1)

- **Objective**: Align infrastructure tests with 9% workspace coverage threshold
- **Changes**:
  - Updated `tests/infrastructure/vitest-config-consistency.test.ts` workspace tier expectation
  - Confirmed thematic suite passes under relaxed gate
- **Validation**:
  - `pnpm vitest run tests/infrastructure/vitest-config-consistency.test.ts`
  - `pnpm test:coverage:thematic`
- **Outcomes**: All consistency checks and thematic sweeps passing
```

---

### 3.6 Capture System Patterns

**Objective:** Document reusable patterns in appropriate systemPatterns-XXX.md file.

**Procedure:**

1. Determine if task introduced a repeatable pattern
2. Check `systemPatterns-index.md` for appropriate domain file
3. Add pattern entry with:
   - Pattern title
   - Context (when applicable)
   - Problem addressed
   - Solution approach
   - Benefits
   - Implementation notes
   - Validation commands
   - Related patterns
4. Update systemPatterns-index.md with new pattern summary

**Sequence Diagram:**

```sequenceDiagram
participant GPT5Copilot
participant PatternsIndex as systemPatterns-index.md
participant TargetFile as systemPatterns-XXX.md
participant PatternFormatter

GPT5Copilot->>GPT5Copilot: Identify if pattern emerged
alt Pattern detected
    GPT5Copilot->>PatternsIndex: Read domain mapping
    PatternsIndex-->>GPT5Copilot: Return appropriate file

    GPT5Copilot->>PatternFormatter: Format pattern entry
    PatternFormatter->>PatternFormatter: Add pattern title
    PatternFormatter->>PatternFormatter: Define context
    PatternFormatter->>PatternFormatter: Describe problem
    PatternFormatter->>PatternFormatter: Document solution
    PatternFormatter->>PatternFormatter: List benefits
    PatternFormatter->>PatternFormatter: Add implementation notes
    PatternFormatter->>PatternFormatter: Include validation commands
    PatternFormatter-->>GPT5Copilot: Return formatted pattern

    GPT5Copilot->>TargetFile: Append pattern to appropriate section
    TargetFile-->>GPT5Copilot: Pattern added

    GPT5Copilot->>PatternsIndex: Add pattern summary
    GPT5Copilot->>PatternsIndex: Update version and timestamp
    PatternsIndex-->>GPT5Copilot: Index updated
else No pattern
    GPT5Copilot->>GPT5Copilot: Skip pattern capture
end
```

**Validation Checkpoint:**

- ✓ Pattern is truly reusable (not task-specific)
- ✓ Correct domain file selected
- ✓ All required sections present
- ✓ Validation commands are accurate
- ✓ Cross-references added to related patterns
- ✓ Index updated with pattern summary

---

### 3.7 Refresh Active Context

**Objective:** Update activeContext.md with latest project state and milestones.

**Procedure:**

1. Update "Last Updated" date and version number
2. Refresh "Current Capabilities" section if new features added
3. Add entry to "Latest Updates" section (chronological)
4. Update "Decision Log" if architectural decisions made
5. Refresh "Next Steps" based on current priorities

**Sequence Diagram:**

```sequenceDiagram
participant GPT5Copilot
participant ActiveContext as activeContext.md
participant VersionManager
participant MilestoneTracker

GPT5Copilot->>ActiveContext: Read current content
ActiveContext-->>GPT5Copilot: Return context data

GPT5Copilot->>VersionManager: Determine version update
VersionManager-->>GPT5Copilot: Return new version number

GPT5Copilot->>ActiveContext: Update Last Updated date
GPT5Copilot->>ActiveContext: Update version number

alt New capabilities added
    GPT5Copilot->>ActiveContext: Update Current Capabilities section
end

GPT5Copilot->>MilestoneTracker: Get milestone description
MilestoneTracker-->>GPT5Copilot: Return formatted milestone

GPT5Copilot->>ActiveContext: Add to Latest Updates (chronological)

alt Architectural decision made
    GPT5Copilot->>ActiveContext: Add to Decision Log with rationale
end

GPT5Copilot->>ActiveContext: Refresh Next Steps based on priorities
ActiveContext-->>GPT5Copilot: Context refreshed
```

**Validation Checkpoint:**

- ✓ Version number incremented appropriately
- ✓ Latest Updates entry includes date and description
- ✓ Current Capabilities accurately reflects project state
- ✓ Decision Log includes rationale for choices
- ✓ Next Steps are actionable and current

---

### 3.8 Validate Consistency

**Objective:** Ensure all memory bank files are consistent and cross-referenced correctly.

**Procedure:**

1. Verify dates and versions are coherent across files
2. Confirm command snippets reference current scripts/configs
3. Check cross-references between files are valid
4. Verify row counts in indexes match actual files
5. Ensure no duplicate or contradictory information

**Sequence Diagram:**

```sequenceDiagram
participant GPT5Copilot
participant ConsistencyValidator
participant AllFiles as All Memory Bank Files
participant CrossRefChecker
participant CommandValidator

GPT5Copilot->>AllFiles: Read all memory bank files
AllFiles-->>GPT5Copilot: Return file contents

GPT5Copilot->>ConsistencyValidator: Check date consistency
ConsistencyValidator->>ConsistencyValidator: Verify timestamps align
ConsistencyValidator->>ConsistencyValidator: Check version numbers
ConsistencyValidator-->>GPT5Copilot: Date consistency verified

GPT5Copilot->>CrossRefChecker: Validate cross-references
CrossRefChecker->>CrossRefChecker: Check file references exist
CrossRefChecker->>CrossRefChecker: Verify pattern references
CrossRefChecker-->>GPT5Copilot: Cross-references valid

GPT5Copilot->>CommandValidator: Verify command accuracy
CommandValidator->>CommandValidator: Check scripts exist
CommandValidator->>CommandValidator: Verify config paths
CommandValidator-->>GPT5Copilot: Commands validated

GPT5Copilot->>ConsistencyValidator: Check row counts
ConsistencyValidator->>ConsistencyValidator: Compare index vs actual
ConsistencyValidator-->>GPT5Copilot: Row counts match

alt Inconsistencies found
    GPT5Copilot->>GPT5Copilot: Document issues
    GPT5Copilot->>GPT5Copilot: Fix inconsistencies
    GPT5Copilot->>ConsistencyValidator: Re-validate
else All consistent
    GPT5Copilot->>GPT5Copilot: Validation complete
end
```

**Validation Checkpoint:**

- ✓ All timestamps use PST timezone consistently
- ✓ Version numbers follow semantic versioning
- ✓ Commands reference existing scripts
- ✓ Config paths are accurate
- ✓ Cross-references resolve correctly
- ✓ Row counts in indexes match files
- ✓ No contradictory information exists

---

### 3.9 Prune Raw Log

**Objective:** Remove processed entries from raw_reflection_log.md after successful consolidation.

**Procedure:**

1. Verify all raw log entries have been consolidated
2. Cross-check each raw insight exists in consolidated-learnings
3. **IMPORTANT:** Prompt user for confirmation before deletion
4. Remove processed entries while preserving template and closing fence
5. Leave only unprocessed entries (if any)

**Sequence Diagram:**

```sequenceDiagram
participant GPT5Copilot
participant RawLog as raw_reflection_log.md
participant ConsolidatedLearnings as consolidated-learnings-XXX.md
participant VerificationEngine
participant User

GPT5Copilot->>RawLog: Read all entries
RawLog-->>GPT5Copilot: Return entries

GPT5Copilot->>ConsolidatedLearnings: Read consolidated patterns
ConsolidatedLearnings-->>GPT5Copilot: Return patterns

GPT5Copilot->>VerificationEngine: Cross-check entries vs patterns
VerificationEngine->>VerificationEngine: Verify each entry consolidated
VerificationEngine-->>GPT5Copilot: Return verification status

alt All entries verified consolidated
    GPT5Copilot->>User: Request confirmation to prune
    User-->>GPT5Copilot: Confirm pruning approved

    GPT5Copilot->>RawLog: Remove processed entries
    GPT5Copilot->>RawLog: Preserve template and closing fence
    RawLog-->>GPT5Copilot: Entries pruned
else Entries not fully consolidated
    GPT5Copilot->>GPT5Copilot: Skip pruning
    GPT5Copilot->>GPT5Copilot: Log incomplete consolidation
end
```

**Validation Checkpoint:**

- ✓ Every raw entry verified in consolidated file
- ✓ User confirmation obtained before deletion
- ✓ Template structure preserved
- ✓ Closing code fence intact
- ✓ Unprocessed entries (if any) retained

**⚠️ CRITICAL WARNING:** Never prune raw_reflection_log.md without:

1. Verifying all entries exist in consolidated form
2. Obtaining explicit user confirmation
3. Preserving the template and closing fence

---

### 3.10 Optional: Update Docs

**Objective:** Update broader project documentation if patterns affect guides or protocols.

**Procedure:**

1. Determine if changes affect existing documentation
2. Identify which docs need updates (e.g., testing-standards.md, integration-test-patterns.md)
3. Update affected documentation with new patterns or commands
4. Note documentation links inside progress entry or learnings

**Sequence Diagram:**

```sequenceDiagram
participant GPT5Copilot
participant ChangeAnalyzer
participant DocRegistry
participant TargetDocs
participant CrossRefUpdater

GPT5Copilot->>ChangeAnalyzer: Analyze task changes
ChangeAnalyzer->>ChangeAnalyzer: Identify affected docs
ChangeAnalyzer-->>GPT5Copilot: Return doc list

alt Docs require updates
    GPT5Copilot->>DocRegistry: Get doc locations
    DocRegistry-->>GPT5Copilot: Return file paths

    loop For each affected doc
        GPT5Copilot->>TargetDocs: Update content
        GPT5Copilot->>TargetDocs: Add new patterns/commands
        TargetDocs-->>GPT5Copilot: Doc updated
    end

    GPT5Copilot->>CrossRefUpdater: Update doc references
    CrossRefUpdater-->>GPT5Copilot: References updated

    GPT5Copilot->>GPT5Copilot: Note updates in progress log
else No doc updates needed
    GPT5Copilot->>GPT5Copilot: Skip doc updates
end
```

**Validation Checkpoint:**

- ✓ Affected docs identified correctly
- ✓ Updates maintain doc consistency
- ✓ New patterns properly integrated
- ✓ Commands and examples accurate
- ✓ Cross-references updated

---

## 4. Decision Matrices

This section provides clear decision trees for determining which files to update and when.

### 4.1 File Selection Decision Matrix

```
Task Completed
    │
    ├─→ Raw insights or discoveries?
    │   └─→ YES: Update raw_reflection_log.md (Always)
    │
    ├─→ 5+ entries in raw log OR periodic review?
    │   └─→ YES: Consolidate to consolidated-learnings-XXX.md
    │       └─→ Check: Row count >= 300?
    │           ├─→ YES: Create new consolidated-learnings file
    │           └─→ NO: Append to active file
    │
    ├─→ Task completed with observable results?
    │   └─→ YES: Update progress-XXX.md
    │       └─→ Check: Row count >= 300?
    │           ├─→ YES: Create new progress file
    │           └─→ NO: Append to active file
    │
    ├─→ Repeatable pattern emerged?
    │   └─→ YES: Update systemPatterns-XXX.md
    │       └─→ Select appropriate domain file via index
    │       └─→ Check: Row count >= 300?
    │           ├─→ YES: Create new patterns file
    │           └─→ NO: Append to active file
    │
    ├─→ Major milestone or capability added?
    │   └─→ YES: Update activeContext.md
    │       └─→ Increment version number
    │       └─→ Add to Latest Updates section
    │
    └─→ Any file updated?
        └─→ YES: Update corresponding index files
            ├─→ learnings-index.md (if learnings changed)
            ├─→ index-progress.md (if progress changed)
            └─→ systemPatterns-index.md (if patterns changed)
```

### 4.2 Consolidation Timing Decision Matrix

| Condition                     | Consolidate Now? | Rationale                                |
| ----------------------------- | ---------------- | ---------------------------------------- |
| Raw log has 1-2 entries       | ❌ No            | Wait for more patterns to emerge         |
| Raw log has 3-4 entries       | ⚠️ Optional      | Consolidate if patterns are clear        |
| Raw log has 5+ entries        | ✅ Yes           | Prevents log from growing too large      |
| Raw log exceeds 50 rows       | ✅ Required      | Critical to prevent information overload |
| Before major feature work     | ✅ Recommended   | Clean slate for new work                 |
| Weekly/bi-weekly review       | ✅ Recommended   | Regular maintenance prevents backlog     |
| Patterns evident across tasks | ✅ Yes           | Capture generalizable insights           |

### 4.3 File Creation Decision Matrix

| File Type              | Create New When                       | Naming Convention                                  |
| ---------------------- | ------------------------------------- | -------------------------------------------------- |
| consolidated-learnings | Row count ≥ 300                       | `consolidated-learnings-XXX.md` (increment number) |
| progress               | Row count ≥ 300                       | `progress-XXX.md` (increment number)               |
| systemPatterns         | New domain emerges OR row count ≥ 300 | `systemPatterns-XXX.md` (increment number)         |
| Index files            | Never create new                      | Single files with updates                          |
| activeContext          | Never create new                      | Single file with updates                           |

---

## 5. Template Library

### 5.1 Raw Reflection Log Entry Template

```markdown
---
Date: YYYY-MM-DD
TaskRef: 'Task ID / Descriptive Title'

Learnings:
  - Specific discovery with file path or command
  - Pattern identified during implementation
  - Validation command that confirmed success
  - Configuration insight or threshold adjustment

Success Patterns:
  - What approach worked particularly well
  - Tool or technique that proved effective
  - Architectural decision that paid off

Implementation Excellence:
  - Notable achievement or milestone reached
  - Code quality improvement implemented
  - Process optimization discovered

Improvements_Identified_For_Consolidation:
  - General pattern: Brief description
  - Project-specific: Commands or configurations
  - Cross-package: Integration insights
---
```

### 5.2 Consolidated Learning Pattern Template

```markdown
#### Pattern: [Descriptive Pattern Name]

**Problem:** What challenge does this address? **Solution:** Specific implementation approach
**Benefits:** Why use this pattern? **Implementation Notes:**

- Key detail 1
- Key detail 2
- Configuration requirement **Validation:** `command to verify pattern works` **Related Patterns:**
  Links to similar patterns
```

### 5.3 Progress Log Entry Template

```markdown
### YYYY-MM-DD – [Task Title] (Task ID)

- **Objective**: One-sentence description of goal
- **Changes**:
  - Modified `file/path.ts` - specific function or component
  - Updated `config/file.mjs` - threshold or setting changed
  - Added `new/file.ts` - purpose and integration point
- **Validation**:
  - `pnpm command to verify change 1`
  - `pnpm command to verify change 2`
- **Outcomes**: Observable results after changes
```

### 5.4 System Pattern Entry Template

```markdown
## [Pattern Name]

**Context:** When and where this pattern applies **Problem:** Technical challenge being addressed
**Solution:** Detailed implementation approach **Benefits:**

- Benefit 1
- Benefit 2
- Performance/maintenance gain **Implementation Notes:**
- Setup requirement 1
- Configuration detail 2
- Integration consideration 3 **Validation:** `pnpm command to verify pattern` **Related Patterns:**
  See [Pattern X](#pattern-x), [Pattern Y](#pattern-y)
```

### 5.5 Active Context Update Template

```markdown
### Latest Updates (YYYY-MM-DD – [Feature/Milestone Name])

- [CATEGORY] (Task ID)
  - Brief description of changes
  - Key files or components affected
  - Validation commands used
  - Links to completion reports or patterns
```

---

## 6. Validation Checkpoints

### 6.1 Pre-Update Validation

✅ **Before Starting Workflow:**

- [ ] Task completion confirmed
- [ ] Validation commands executed successfully
- [ ] Completion report available (if applicable)
- [ ] Git history reviewed for changed files
- [ ] Decisions and learnings identified

### 6.2 During Raw Log Update (Step 2)

✅ **While Logging Reflections:**

- [ ] Date uses YYYY-MM-DD format
- [ ] TaskRef includes task ID or clear title
- [ ] Learnings are specific (not generic)
- [ ] File paths and commands are accurate
- [ ] Closing fence preserved
- [ ] No corruption of previous entries

### 6.3 During Consolidation (Step 3)

✅ **While Distilling Patterns:**

- [ ] Active file identified from index
- [ ] Row count checked before adding
- [ ] Pattern includes problem/solution/benefits
- [ ] Pattern is actionable and generalizable
- [ ] No duplicate patterns created
- [ ] Cross-references added where appropriate

### 6.4 During Index Updates (Step 4)

✅ **While Syncing Indexes:**

- [ ] Row counts match actual file contents
- [ ] Timestamps use PST timezone
- [ ] Update log entries are descriptive
- [ ] Topic lists reflect new content
- [ ] Active file designations correct

### 6.5 During Progress Logging (Step 5)

✅ **While Recording Progress:**

- [ ] Correct active progress file used
- [ ] Entry includes all required sections
- [ ] File paths are complete and accurate
- [ ] Validation commands are complete
- [ ] Outcomes are observable and measurable

### 6.6 During Pattern Capture (Step 6)

✅ **While Capturing Patterns:**

- [ ] Pattern is truly reusable
- [ ] Appropriate domain file selected
- [ ] All pattern sections complete
- [ ] Validation commands tested
- [ ] Related patterns cross-referenced
- [ ] Index updated with pattern summary

### 6.7 During Context Update (Step 7)

✅ **While Refreshing Context:**

- [ ] Version number incremented
- [ ] Latest Updates chronologically ordered
- [ ] Current Capabilities accurate
- [ ] Decision Log includes rationale
- [ ] Next Steps are actionable

### 6.8 During Consistency Validation (Step 8)

✅ **While Validating Consistency:**

- [ ] Dates consistent across files
- [ ] Commands reference existing scripts
- [ ] Cross-references resolve
- [ ] Row counts match indexes
- [ ] No contradictory information

### 6.9 Before Raw Log Pruning (Step 9)

✅ **Before Removing Entries:**

- [ ] All entries verified in consolidated file
- [ ] User confirmation obtained
- [ ] Template structure will be preserved
- [ ] Closing fence will remain intact
- [ ] Unprocessed entries identified

### 6.10 Post-Update Final Validation

✅ **After Completing Workflow:**

- [ ] All updated files saved
- [ ] Indexes synchronized
- [ ] No syntax errors introduced
- [ ] Cross-references valid
- [ ] Timestamps accurate
- [ ] Version numbers incremented

---

## 7. Anti-Pattern Examples

### 7.1 ❌ Anti-Pattern: Vague Learnings

**Wrong:**

```markdown
Learnings:

- Fixed the test
- Updated the config
- Made it work
```

**✅ Correct:**

```markdown
Learnings:

- Updated `tests/infrastructure/vitest-config-consistency.test.ts` to align workspace threshold with
  9% defined in `config/coverage.config.mjs`
- Validation: `pnpm vitest run tests/infrastructure/vitest-config-consistency.test.ts`
- Pattern: Sourcing thresholds directly from shared config prevents drift
```

**Why Wrong:** Vague descriptions provide no actionable information for future reference.

---

### 7.2 ❌ Anti-Pattern: Skipping Validation Checkpoints

**Wrong:**

```
1. Add entry to raw log
2. Immediately consolidate
3. Skip checking if pattern already exists
4. Don't verify row counts
```

**✅ Correct:**

```
1. Add entry to raw log with validation checkpoint
2. Check active file and row count before consolidating
3. Search existing patterns to avoid duplicates
4. Verify row counts match indexes after update
```

**Why Wrong:** Skipping validation leads to duplicate patterns, incorrect row counts, and
inconsistent data.

---

### 7.3 ❌ Anti-Pattern: Premature Consolidation

**Wrong:**

```markdown
Raw log has 1 entry → Immediately consolidate
```

**✅ Correct:**

```markdown
Wait for 5+ entries or clear pattern emergence before consolidation
```

**Why Wrong:** Single entries rarely reveal generalizable patterns. Consolidating too early creates
noise in the consolidated file.

---

### 7.4 ❌ Anti-Pattern: Ignoring Row Count Limits

**Wrong:**

```
Continue adding to consolidated-learnings-007.md even at 350 rows
```

**✅ Correct:**

```
At 300 rows, create consolidated-learnings-008.md and update learnings-index.md
```

**Why Wrong:** Exceeding 300 rows causes context window issues for AI assistants.

---

### 7.5 ❌ Anti-Pattern: Generic Patterns Without Context

**Wrong:**

```markdown
## Test Pattern

Use tests to verify code works.
```

**✅ Correct:**

```markdown
## Parallel Coverage Gate Calibration

**Context:** When adjusting workspace-level coverage thresholds **Problem:** Infrastructure tests
hardcode expected thresholds, causing false negatives when gates change **Solution:** Import
thresholds directly from `config/coverage.config.mjs` in test assertions **Benefits:** Single source
of truth prevents drift, tests stay synchronized with actual gates **Validation:**
`pnpm vitest run tests/infrastructure/vitest-config-consistency.test.ts`
```

**Why Wrong:** Generic patterns lack actionable detail and context for future application.

---

### 7.6 ❌ Anti-Pattern: Pruning Without User Confirmation

**Wrong:**

```typescript
// Automatically delete raw log entries after consolidation
rawLog.removeProcessedEntries();
```

**✅ Correct:**

```typescript
// Verify consolidation completeness
const verified = verifyAllEntriesConsolidated();
if (verified) {
  await askUserConfirmation('Prune raw log entries?');
  // Only proceed if user confirms
}
```

**Why Wrong:** Automatic pruning without verification risks losing information permanently.

---

### 7.7 ❌ Anti-Pattern: Inconsistent Timestamps

**Wrong:**

```
File A: 2025-10-15 EST
File B: 2025-10-15 UTC
File C: 10/15/2025
```

**✅ Correct:**

```
All files: 2025-10-15 PST
Consistent format: YYYY-MM-DD PST
```

**Why Wrong:** Inconsistent timestamps create confusion about update sequence and currency.

---

### 7.8 ❌ Anti-Pattern: Missing Validation Commands

**Wrong:**

```markdown
Changes:

- Fixed the coverage gates
- Tests now pass
```

**✅ Correct:**

```markdown
Changes:

- Updated workspace threshold to 9% in `config/coverage.config.mjs` Validation:
- `pnpm vitest run tests/infrastructure/vitest-config-consistency.test.ts`
- `pnpm test:coverage:thematic` Outcomes: All consistency checks and thematic sweeps passing
```

**Why Wrong:** Without validation commands, future users can't verify the changes still work.

---

## 8. Cross-Reference System

### 8.1 Inter-File Reference Guidelines

**Between Raw Log and Consolidated Learnings:**

- Raw log entries should note which patterns are consolidation candidates
- Consolidated patterns should reference source task IDs from raw log

**Between Progress and System Patterns:**

- Progress entries should link to related patterns when applicable
- System patterns should reference tasks that established the pattern

**Between Consolidated Learnings and System Patterns:**

- Testing-related learnings cross-reference testing patterns
- Architecture learnings cross-reference architecture patterns

**Between Active Context and Other Files:**

- Latest Updates should link to relevant progress entries
- Current Capabilities should reference established patterns
- Decision Log should link to patterns that influenced decisions

### 8.2 Cross-Reference Format

**Within Same File:**

```markdown
See [Pattern Name](#pattern-name) for related approach
```

**Between Memory Bank Files:**

```markdown
Documented in progress-004.md (2025-10-15 entry) Pattern captured in systemPatterns-005.md Related
learning in consolidated-learnings-007.md
```

**To External Documentation:**

```markdown
See `docs/coverage-system-guide.md` for implementation details Troubleshooting in
`docs/testing-standards.md`
```

### 8.3 Maintaining Reference Integrity

✅ **When Adding Cross-References:**

- [ ] Verify target file exists
- [ ] Confirm target section/pattern exists
- [ ] Use consistent naming across references
- [ ] Update both directions (A→B and B→A when appropriate)

✅ **When Moving Content:**

- [ ] Update all incoming references
- [ ] Add redirect or note in original location
- [ ] Verify no broken links remain

✅ **During Periodic Review:**

- [ ] Check all cross-references resolve
- [ ] Update outdated file references
- [ ] Remove references to deleted content

---

## 9. Quality Metrics

### 9.1 Completeness Metrics

**Raw Log Entries:**

- ✅ Contains Date, TaskRef, Learnings, Success Patterns, Implementation Excellence
- ✅ Learnings include specific file paths or commands
- ✅ At least 3 bullet points per section (when applicable)
- ✅ Includes consolidation candidates in Improvements section

**Consolidated Patterns:**

- ✅ Includes Problem, Solution, Benefits, Implementation Notes
- ✅ Contains validation command that verifies pattern
- ✅ Cross-references at least 1 related pattern (when applicable)
- ✅ Pattern name is descriptive and searchable

**Progress Entries:**

- ✅ Contains Objective, Changes, Validation, Outcomes
- ✅ Changes list includes at least 2 specific file paths
- ✅ Validation section includes at least 2 commands
- ✅ Outcomes are observable and measurable

### 9.2 Accuracy Metrics

**Command Accuracy:**

- ✅ All commands reference existing scripts in `package.json`
- ✅ File paths resolve to actual files
- ✅ Config paths point to current configuration files
- ✅ Commands execute successfully when run

**Temporal Accuracy:**

- ✅ All timestamps use PST timezone consistently
- ✅ Dates follow YYYY-MM-DD format
- ✅ Chronological ordering is maintained
- ✅ Version numbers increment logically

**Row Count Accuracy:**

- ✅ Index row counts match actual file row counts (±5 margin)
- ✅ New files created before exceeding 300 rows
- ✅ Active file designations are current
- ✅ Archived files properly marked in indexes

### 9.3 Actionability Metrics

**Pattern Actionability:**

- ✅ Pattern can be applied to new scenarios
- ✅ Implementation notes provide sufficient detail
- ✅ Validation command confirms pattern effectiveness
- ✅ Benefits are concrete and measurable

**Progress Actionability:**

- ✅ Changes can be reproduced from description
- ✅ Validation commands verify current state
- ✅ Outcomes provide measurable success criteria
- ✅ File paths enable quick navigation

**Learning Actionability:**

- ✅ Insights can inform future decisions
- ✅ Commands can be reused in similar scenarios
- ✅ Patterns are generalizable beyond specific task
- ✅ Documentation links provide additional context

### 9.4 Success Indicators

**High-Quality Memory Bank:**

- 📊 Cross-references resolve without errors
- 📊 Commands execute successfully when tested
- 📊 Patterns are frequently referenced in new tasks
- 📊 Row counts stay within limits (never exceed 310)
- 📊 Consolidation happens regularly (every 5-10 tasks)
- 📊 Active context reflects current project state
- 📊 No duplicate or contradictory patterns

**Quality Degradation Warning Signs:**

- ⚠️ Raw log exceeds 100 rows without consolidation
- ⚠️ Files exceed 320 rows
- ⚠️ Commands fail when executed
- ⚠️ Cross-references lead to missing content
- ⚠️ Patterns lack validation commands
- ⚠️ Progress entries missing file paths
- ⚠️ Timestamps inconsistent across files

---

## 10. Troubleshooting Guide

### 10.1 Issue: Raw Log Entries Not Consolidating

**Symptoms:**

- Raw log exceeds 50 rows
- Patterns not evident
- Consolidation keeps getting deferred

**Solutions:**

1. Review entries for common themes
2. Lower threshold for consolidation (consolidate at 3-4 entries)
3. Create "Work in Progress" patterns for emerging insights
4. Schedule dedicated consolidation session

**Prevention:**

- Set consolidation reminder every 5 tasks
- Include consolidation in task completion checklist

---

### 10.2 Issue: Row Counts Don't Match Indexes

**Symptoms:**

- Index shows 250 rows, file has 280
- Active file designation incorrect
- New file not created at threshold

**Solutions:**

1. Manually count rows in actual file
2. Update index with correct count
3. Check if file was recently edited outside workflow
4. Create new file if threshold exceeded

**Prevention:**

- Always update indexes immediately after file changes
- Include row count verification in validation checkpoints
- Use automated row counter if available

---

### 10.3 Issue: Duplicate Patterns in Consolidated Learnings

**Symptoms:**

- Similar patterns appear multiple times
- Pattern names overlap
- Redundant implementation notes

**Solutions:**

1. Search existing patterns before adding new ones
2. Merge duplicate patterns into single comprehensive entry
3. Add cross-references between related patterns
4. Update indexes to remove duplicate listings

**Prevention:**

- Always search file for existing patterns before adding
- Use consistent pattern naming conventions
- Include "Related Patterns" section to surface overlaps

---

### 10.4 Issue: Commands Fail When Executed

**Symptoms:**

- Validation commands return errors
- Scripts referenced don't exist
- Config paths are incorrect

**Solutions:**

1. Verify script exists in `package.json`
2. Check if script was renamed or moved
3. Update command with current script name
4. Test command before documenting

**Prevention:**

- Execute commands during validation checkpoint
- Include command testing in quality metrics
- Regular audit of documented commands

---

### 10.5 Issue: Cross-References Lead to Missing Content

**Symptoms:**

- References point to deleted files
- Section anchors don't exist
- Pattern names changed

**Solutions:**

1. Search for content in other files
2. Update reference to correct location
3. Add redirect note if content moved
4. Remove reference if content no longer relevant

**Prevention:**

- Update references when moving content
- Periodic audit of cross-references
- Maintain redirect stubs for moved content

---

### 10.6 Issue: Files Exceed 300-Row Limit

**Symptoms:**

- Consolidated file has 350+ rows
- Progress file exceeds capacity
- Index shows overflow

**Solutions:**

1. Immediately create new numbered file
2. Move newest entries to new file
3. Update index with new active file
4. Archive old file by updating status

**Prevention:**

- Check row counts before adding content
- Create new file at 290 rows (buffer)
- Include row count in validation checkpoints

---

### 10.7 Issue: Context Window Limitations During AI Session

**Symptoms:**

- AI truncates responses
- Cannot load all memory bank files
- Runs out of context mid-update

**Solutions:**

1. Load only essential files for current task
2. Use indexes to identify relevant files
3. Focus on active files first
4. Defer non-critical updates to next session

**Prevention:**

- Keep files under 300-row limit strictly
- Regularly consolidate and prune
- Use paginated file system
- Load files selectively based on task

---

### 10.8 Issue: Inconsistent Information Across Files

**Symptoms:**

- Version numbers don't match
- Timestamps contradict
- Patterns conflict with learnings

**Solutions:**

1. Identify most recent/accurate source
2. Update all files to match correct information
3. Document correction in update log
4. Add note explaining discrepancy

**Prevention:**

- Single source of truth for each data type
- Consistency validation checkpoint
- Regular cross-file audits
- Clear update sequencing

---

### 10.9 Issue: Lost Information After Pruning

**Symptoms:**

- Entries missing from raw log
- Can't find consolidated version
- Information gap in timeline

**Solutions:**

1. Check git history for deleted content
2. Review consolidated-learnings for pattern
3. Restore from backup if available
4. Reconstruct from task completion reports

**Prevention:**

- **ALWAYS** verify consolidation before pruning
- **ALWAYS** obtain user confirmation before deletion
- Keep git history of memory bank files
- Never auto-prune without verification

---

### 10.10 Issue: New AI Session Can't Find Context

**Symptoms:**

- AI asks for information already in memory bank
- Doesn't reference established patterns
- Repeats previous work

**Solutions:**

1. Explicitly reference relevant memory bank files
2. Load activeContext.md first for overview
3. Point to specific consolidated patterns
4. Reference progress log for recent work

**Prevention:**

- Keep activeContext.md current and comprehensive
- Use descriptive pattern names for searchability
- Maintain clear indexes with topic mapping
- Include task IDs for traceability

---

## 11. Automation Recommendations

### 11.1 Row Count Automation

**Current Process:** Manual row counting **Proposed Automation:**

```bash
node scripts/count-memory-bank-rows.mjs
```

**Capabilities:**

- Counts rows in all memory bank files
- Updates indexes automatically
- Alerts if files approach 300-row limit

**Benefits:**

- Eliminates manual counting errors
- Provides early warning for pagination
- Automates index updates

---

### 11.2 Cross-Reference Validation

**Current Process:** Manual cross-reference checking **Proposed Automation:**

```bash
node scripts/validate-memory-bank-refs.mjs
```

**Capabilities:**

- Checks that all cross-references resolve
- Identifies broken links
- Suggests corrections

**Benefits:**

- Catches broken references early
- Maintains reference integrity
- Reduces manual validation effort

---

### 11.3 Consolidation Reminder

**Current Process:** Manual tracking of consolidation needs **Proposed Automation:**

```bash
node scripts/check-consolidation-need.mjs
```

**Execution Tips:**

- Run as a pre-commit hook or manual check
- Counts raw log entries
- Alerts when consolidation is recommended
- Shows the last consolidation date

**Benefits:**

- Prevents raw log from growing too large
- Maintains a regular consolidation cadence
- Reduces cognitive load

---

### 11.4 Template Generation

**Current Process:** Manual template copying **Proposed Automation:**

```bash
node scripts/generate-memory-bank-entry.mjs --type [raw|progress|pattern]
```

**Capabilities:**

- Generates a pre-filled template
- Includes the current date and interactive prompts
- Validates structure before saving

**Benefits:**

- Ensures template consistency
- Reduces formatting errors
- Speeds up entry creation

---

## 12. GPT-5 Specific Instructions

### 12.1 Mandatory Behaviors

**YOU MUST:**

- ✅ Update raw_reflection_log.md after EVERY task completion
- ✅ Check row counts before adding content to any file
- ✅ Verify active file designation from indexes before updating
- ✅ Obtain user confirmation before pruning raw log
- ✅ Preserve closing code fence when updating raw log
- ✅ Use PST timezone for ALL timestamps
- ✅ Include validation commands in progress entries
- ✅ Cross-check for duplicate patterns before adding new ones
- ✅ Update indexes immediately after modifying tracked files
- ✅ Execute all validation checkpoints before completing workflow

**YOU MUST NEVER:**

- ❌ Skip raw log documentation for "simple" tasks
- ❌ Prune raw log without user confirmation
- ❌ Exceed 300-row limit in paginated files
- ❌ Add patterns without validation commands
- ❌ Update files without checking active designation
- ❌ Create vague or generic entries
- ❌ Skip consistency validation (Step 8)
- ❌ Assume row counts without verification
- ❌ Auto-correct perceived inconsistencies without documentation
- ❌ Consolidate single entries prematurely

### 12.2 Decision-Making Protocol

**When uncertain about file selection:**

1. Consult Decision Matrix (Section 4)
2. Check indexes for active file designation
3. Ask user for clarification if ambiguous
4. Default to most conservative choice (don't create new files unnecessarily)

**When detecting inconsistencies:**

1. Document the inconsistency explicitly
2. Identify most authoritative source
3. Propose correction with rationale
4. Update all affected files simultaneously
5. Log correction in update logs

**When consolidating patterns:**

1. Verify at least 5 entries in raw log OR clear pattern evident
2. Search existing patterns for duplicates
3. Synthesize into problem/solution/benefits format
4. Add validation command that confirms pattern
5. Cross-reference related patterns
6. Mark raw entries for pruning only after consolidation verified

### 12.3 Quality Assurance Protocol

**Before Completing Any Memory Bank Update:**

1. Run through all applicable validation checkpoints
2. Verify row counts match indexes (±5 tolerance)
3. Test that validation commands execute successfully
4. Confirm cross-references resolve correctly
5. Check timestamps use consistent format (YYYY-MM-DD PST)
6. Ensure no duplicate patterns or contradictions
7. Verify user confirmation obtained for any deletions

**If Validation Fails:**

1. Do NOT proceed to attempt_completion
2. Document validation failure
3. Correct issues systematically
4. Re-run validation
5. Only complete after full validation passes

### 12.4 Context Management for AI Assistants

**At Session Start:**

1. Load activeContext.md first for overview
2. Load relevant index files second
3. Load specific active files as needed
4. Use indexes to find patterns without loading all files

**During Session:**

1. Keep track of which files have been modified
2. Maintain list of pending index updates
3. Note row count changes as you work
4. Track cross-references that need updating

**Before Session End:**

1. Complete all pending index updates
2. Verify consistency across modified files
3. Document all changes in appropriate logs
4. Update activeContext if milestone reached
5. Note any incomplete work for next session

### 12.5 Error Recovery Protocol

**If You Realize You Made a Mistake:**

1. DO NOT attempt to hide or quickly fix it
2. Explicitly acknowledge the error
3. Document what went wrong and why
4. Propose correction approach
5. Execute correction with full validation
6. Log the correction in update logs

**If User Points Out an Issue:**

1. Acknowledge the feedback immediately
2. Verify the issue by checking files
3. Propose specific correction
4. Execute correction systematically
5. Add preventive measure to avoid recurrence

### 12.6 Communication Protocol

**When Reporting Memory Bank Updates:**

- ✅ List specific files updated
- ✅ Include row count changes
- ✅ Note validation commands executed
- ✅ Highlight any new files created
- ✅ Summarize key patterns captured

**When Asking for Guidance:**

- ✅ Be specific about uncertainty
- ✅ Present options with pros/cons
- ✅ Reference relevant sections of this guide
- ✅ Ask targeted questions

**When Completing Task:**

- ✅ Confirm all memory bank updates complete
- ✅ Verify validation passed
- ✅ List files modified with row counts
- ✅ Note any follow-up items for next session

---

## Validation Test Suite

This guide is validated by `tests/docs/memory-bank-update-guide.test.ts` which verifies:

- All required sections present
- 10+ sequence diagrams included
- Decision matrices complete
- Templates provided
- Anti-patterns documented
- Cross-reference system defined
- Quality metrics measurable
- Troubleshooting guide comprehensive
- GPT-5 specific instructions explicit

**To validate guide compliance:**

```bash
pnpm vitest run tests/docs/memory-bank-update-guide.test.ts
```

---

## Quick Reference

### Essential Commands

- `pnpm vitest run tests/docs/memory-bank-update-guide.test.ts` — validate guide structure
- `node scripts/count-memory-bank-rows.mjs` or `wc -l memory-bank/*.md` — count rows per file
- `node scripts/validate-memory-bank-refs.mjs` or `grep -r "pattern-name" memory-bank/` — check
  references and patterns
- `pnpm vitest run tests/infrastructure/...` — ensure infrastructure checks pass
- `pnpm test:coverage:thematic` — verify thematic coverage thresholds
- `pnpm -w lint && pnpm -w type-check` — run linting and type checks

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

### Validation Checklist

- [ ] Dates use YYYY-MM-DD PST format
- [ ] Commands reference existing scripts
- [ ] Row counts match indexes (±5)
- [ ] Cross-references resolve
- [ ] No duplicate patterns
- [ ] User confirmation for deletions

---

**End of Guide - Version 2.0.0**

Following this guide ensures GPT-5 Copilot maintains comprehensive, accurate, and actionable memory
bank documentation for maximum utility in future tasks.
