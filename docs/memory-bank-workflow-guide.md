# Memory Bank Workflow Guide

**Last Updated:** 2025-11-04  
**Version:** 1.0.0 - Operational workflows split from memory-bank-update-guide.md  
**Target Audience:** Active developers performing memory bank updates

This guide provides step-by-step operational workflows for updating the CritGenius Listener memory
bank. It focuses on the practical procedures for maintaining the knowledge management system.

---

## Update Triggers

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

## Standard Workflow

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

## Decision Matrices

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

## Related Documentation

- **[Memory Bank Setup Guide](memory-bank-setup-guide.md)** — Entry point for understanding the
  memory bank system
- **[Memory Bank Templates](memory-bank-templates.md)** — Ready-to-use templates and examples for
  creating entries
- **[Memory Bank Maintenance Guide](memory-bank-maintenance-guide.md)** — Ongoing maintenance and
  quality assurance procedures
- **[Memory Bank AI Instructions](memory-bank-ai-instructions.md)** — Specialized instructions for
  AI coding assistants

---

**End of Workflow Guide**

This guide provides the operational procedures for maintaining the memory bank system. For
templates, maintenance procedures, and AI-specific instructions, see the related documentation
guides listed above.
