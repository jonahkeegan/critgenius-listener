# Memory Bank Raw Reflection Log – Best Practices

**Last Updated:** 2025-10-16  
**Audience:** Copilot agents & maintainers updating `memory-bank/raw_reflection_log.md`

This guide distills the expectations from the Continuous Improvement Protocol and the broader Memory
Bank Update Guide into a concise checklist specific to `raw_reflection_log.md`.

---

## Why This Matters

- Ensures every task produces a consistent, timestamped reflection trail before consolidation.
- Keeps reflections actionable and easy to migrate into `consolidated-learnings-XXX.md` files.
- Prevents accidental corruption of the markdown structure (code fences, headings, etc.).

---

## VISUALIZING THE REFLECTION LOGGING PROCESS

This document includes comprehensive sequence diagrams for all procedural workflows to ensure clear
understanding and consistent implementation. Each diagram follows the mandatory visualization
protocol and shows:

- **Component Interactions**: All actors and system components involved in the process
- **Message Flow**: Precise chronological ordering of operations
- **Decision Points**: Alternative paths using alt/else structures
- **Validation Gates**: Quality checkpoints throughout the process

### Key Actors and Components

- **Developer**: The agent or maintainer creating reflection entries
- **TaskAnalyzer**: Evaluates task completion to determine reflection needs
- **ReflectionDecider**: Makes decisions about entry creation
- **TemplateValidator**: Ensures entry structure compliance
- **ContentFormatter**: Formats entry content according to standards
- **FileHandler**: Manages file operations on `raw_reflection_log.md`
- **EntryValidator**: Validates entry content and structure
- **MarkdownParser**: Parses and validates markdown syntax
- **ChecklistRunner**: Executes validation checklist items
- **SyntaxChecker**: Validates markdown syntax correctness
- **ContentVerifier**: Verifies content accuracy and completeness
- **AntiPatternDetector**: Identifies common mistakes and issues
- **CorrectionEngine**: Implements corrections for detected issues
- **ConsolidationEngine**: Manages migration to consolidated learnings
- **RawReflectionLog**: The target file being updated
- **ConsolidatedLearnings**: The destination for consolidated knowledge

---

## When to Append an Entry

### Decision Criteria

- Immediately after finishing a task or sub-task that produced new insight, tooling, or automation.
- After resolving bugs, covering new validation commands, or adjusting CI/CD workflows.
- Whenever the task completion report introduces knowledge that is not yet in consolidated files.

> **Tip:** If you already authored a task completion report, use it as the primary source for the
> reflection entry and add any extra context discovered during commits or validation.

### Entry Decision Workflow

The following sequence diagram shows the systematic process for determining when to create a
reflection entry:

```sequenceDiagram
participant Developer
participant TaskAnalyzer
participant TaskCompletionReport
participant ReflectionDecider
participant ConsolidatedLearnings
participant RawReflectionLog

Developer->>TaskAnalyzer: Submit completed task
TaskAnalyzer->>TaskAnalyzer: Analyze task outcome
TaskAnalyzer->>TaskAnalyzer: Check for new insights
TaskAnalyzer->>TaskAnalyzer: Identify new tooling/automation
TaskAnalyzer->>TaskAnalyzer: Assess bug resolutions
TaskAnalyzer-->>Developer: Return analysis results

Developer->>TaskCompletionReport: Check for completion report
TaskCompletionReport-->>Developer: Return report status

alt Task completion report exists
    Developer->>ReflectionDecider: Request reflection decision with report
    ReflectionDecider->>TaskCompletionReport: Extract key insights
    TaskCompletionReport-->>ReflectionDecider: Return insights
    ReflectionDecider->>ConsolidatedLearnings: Check if knowledge exists
    ConsolidatedLearnings-->>ReflectionDecider: Return existence status

    alt Knowledge not in consolidated learnings
        ReflectionDecider-->>Developer: Create reflection entry
        Developer->>RawReflectionLog: Append new entry
        Note over Developer,RawReflectionLog: Use completion report as<br/>primary source + context
    else Knowledge already consolidated
        ReflectionDecider-->>Developer: Skip reflection entry
        Note over Developer: No duplicate knowledge needed
    end
else No completion report
    Developer->>ReflectionDecider: Request reflection decision
    ReflectionDecider->>ReflectionDecider: Evaluate task significance

    alt Task has new insights OR tooling OR resolutions
        ReflectionDecider-->>Developer: Create reflection entry
        Developer->>RawReflectionLog: Append new entry
        Note over Developer,RawReflectionLog: Document insights directly
    else Task routine with no new knowledge
        ReflectionDecider-->>Developer: Skip reflection entry
    end
end
```

**Key Decision Points:**

1. Does the task produce new insights, tooling, or automation?
2. Does a task completion report exist?
3. Is the knowledge already in consolidated learnings?
4. Is the task significant enough to warrant reflection?

---

## Required Entry Structure

Every entry follows the canonical template and lives **inside** the enclosing code fence:

```markdown
Date: YYYY-MM-DD TaskRef: "<Task ID / Descriptive Title>"

Learnings:

- …

Success Patterns:

- …

Implementation Excellence:

- …

Improvements_Identified_For_Consolidation:

- …
```

### Entry Creation Process

The following sequence diagram illustrates the systematic process for creating properly structured
reflection entries:

```sequenceDiagram
participant Developer
participant TemplateValidator
participant ContentFormatter
participant DateFormatter
participant TaskRefBuilder
participant SectionBuilder
participant RawReflectionLog

Developer->>TemplateValidator: Request entry creation
TemplateValidator->>TemplateValidator: Load canonical template
TemplateValidator-->>Developer: Return template structure

Developer->>DateFormatter: Format current date
DateFormatter->>DateFormatter: Convert to ISO format (YYYY-MM-DD)
DateFormatter->>DateFormatter: Apply Pacific Time zone
DateFormatter-->>Developer: Return formatted date

Developer->>TaskRefBuilder: Create TaskRef
TaskRefBuilder->>TaskRefBuilder: Extract task ID or title
TaskRefBuilder->>TaskRefBuilder: Wrap in straight quotes
TaskRefBuilder-->>Developer: Return formatted TaskRef

Developer->>SectionBuilder: Build Learnings section
SectionBuilder->>SectionBuilder: Extract key insights
SectionBuilder->>SectionBuilder: Format as bullet list
SectionBuilder->>SectionBuilder: Add file paths and commands
SectionBuilder-->>Developer: Return Learnings content

Developer->>SectionBuilder: Build Success Patterns section
SectionBuilder->>SectionBuilder: Identify what worked well
SectionBuilder->>SectionBuilder: Format as bullet list
SectionBuilder-->>Developer: Return Success Patterns content

Developer->>SectionBuilder: Build Implementation Excellence section
SectionBuilder->>SectionBuilder: Document best practices used
SectionBuilder->>SectionBuilder: Format as bullet list
SectionBuilder-->>Developer: Return Implementation Excellence content

Developer->>SectionBuilder: Build Improvements section
SectionBuilder->>SectionBuilder: Identify consolidation candidates
SectionBuilder->>SectionBuilder: Format as bullet list
SectionBuilder-->>Developer: Return Improvements content

Developer->>ContentFormatter: Assemble complete entry
ContentFormatter->>ContentFormatter: Combine all sections
ContentFormatter->>ContentFormatter: Validate structure
ContentFormatter->>ContentFormatter: Check for empty sections

alt All sections populated
    ContentFormatter-->>Developer: Return formatted entry
    Developer->>RawReflectionLog: Append entry before closing fence
    RawReflectionLog-->>Developer: Entry added successfully
else Empty sections detected
    ContentFormatter-->>Developer: Return error with missing sections
    Developer->>SectionBuilder: Complete missing sections
end
```

### Formatting Rules

- Use ISO dates in Pacific Time (e.g., `2025-10-16`).
- Wrap `TaskRef` in straight quotes; include the task number or a descriptive slug.
- Bullet lists should be short, actionable, and reference file paths or commands as needed.
- When copying commands, prefer inline code (`` `command` ``) or fenced code blocks if multi-line.

---

## Update Workflow

### Core Update Workflow Steps

The following sequence diagram shows the complete 6-step process for updating the raw reflection
log:

```sequenceDiagram
participant Developer
participant FileHandler
participant MarkdownParser
participant ClosingFenceLocator
participant EntryInserter
participant TemplatePreserver
participant SyntaxValidator
participant WhitespaceChecker
participant RawReflectionLog

Developer->>FileHandler: Open raw_reflection_log.md
FileHandler->>RawReflectionLog: Read file content
RawReflectionLog-->>FileHandler: Return current content
FileHandler-->>Developer: File opened successfully

Note over Developer: Step 1: Open the file

Developer->>MarkdownParser: Parse file structure
MarkdownParser->>MarkdownParser: Identify code fences
MarkdownParser->>MarkdownParser: Locate template header
MarkdownParser-->>Developer: Return structure map

Note over Developer: Step 2: Understand structure

Developer->>ClosingFenceLocator: Find closing fence
ClosingFenceLocator->>MarkdownParser: Request fence positions
MarkdownParser-->>ClosingFenceLocator: Return fence locations
ClosingFenceLocator->>ClosingFenceLocator: Identify final fence
ClosingFenceLocator-->>Developer: Return closing fence position

Note over Developer: Step 3: Locate insertion point

Developer->>EntryInserter: Insert new entry
EntryInserter->>EntryInserter: Position before closing fence
EntryInserter->>EntryInserter: Preserve existing entries
EntryInserter->>EntryInserter: Maintain proper spacing
EntryInserter-->>Developer: Entry inserted

Note over Developer: Step 4: Insert entry

Developer->>TemplatePreserver: Verify template header
TemplatePreserver->>MarkdownParser: Check header integrity
MarkdownParser-->>TemplatePreserver: Return header status

alt Template header intact
    TemplatePreserver-->>Developer: Header preserved
else Template header modified
    TemplatePreserver->>TemplatePreserver: Restore original header
    TemplatePreserver-->>Developer: Header restored
end

Note over Developer: Step 5: Preserve template

Developer->>SyntaxValidator: Validate complete file
SyntaxValidator->>SyntaxValidator: Check balanced backticks
SyntaxValidator->>SyntaxValidator: Verify list formatting
SyntaxValidator->>SyntaxValidator: Validate code fence structure

alt Syntax valid
    SyntaxValidator->>WhitespaceChecker: Check whitespace
    WhitespaceChecker->>WhitespaceChecker: Scan for trailing whitespace
    WhitespaceChecker->>WhitespaceChecker: Verify line endings

    alt No whitespace issues
        WhitespaceChecker-->>SyntaxValidator: Whitespace clean
        SyntaxValidator-->>Developer: Validation passed
        Developer->>FileHandler: Save file
        FileHandler->>RawReflectionLog: Write updated content
        RawReflectionLog-->>FileHandler: Save successful
        FileHandler-->>Developer: File saved
    else Whitespace issues found
        WhitespaceChecker-->>Developer: Report whitespace issues
        Developer->>Developer: Clean whitespace
    end
else Syntax errors detected
    SyntaxValidator-->>Developer: Return syntax errors
    Developer->>Developer: Correct syntax errors
end

Note over Developer: Step 6: Validate and save
```

### Workflow Implementation Steps

1. **Open the file** (`memory-bank/raw_reflection_log.md`).
2. **Locate the closing code fence** (` ```` `) at the end of the file.
3. **Insert the new entry immediately before** that closing fence.
4. **Keep the existing template header** intact (do not overwrite the original instructions).
5. **Double-check the new entry** for:
   - Filled sections (no empty headings).
   - Accurate commands and file paths.
   - No trailing whitespace inside bullet items.
6. **Re-emit the closing fence** if you temporarily removed it.

---

## Validation Checklist

### Validation Protocol

The following sequence diagram shows the systematic validation process using the checklist:

```sequenceDiagram
participant Developer
participant ChecklistRunner
participant EntryLocationValidator
participant DateTaskRefValidator
participant SectionContentValidator
participant CommandValidator
participant FilePathValidator
participant SyntaxChecker
participant RawReflectionLog

Developer->>ChecklistRunner: Execute validation checklist
ChecklistRunner->>RawReflectionLog: Load file content
RawReflectionLog-->>ChecklistRunner: Return content

ChecklistRunner->>EntryLocationValidator: Check entry location
EntryLocationValidator->>EntryLocationValidator: Find entry position
EntryLocationValidator->>EntryLocationValidator: Verify before closing fence

alt Entry properly located
    EntryLocationValidator-->>ChecklistRunner: Location valid ✓
else Entry outside fence
    EntryLocationValidator-->>ChecklistRunner: Location error ✗
    ChecklistRunner-->>Developer: FAIL - Entry location invalid
end

ChecklistRunner->>DateTaskRefValidator: Validate Date and TaskRef
DateTaskRefValidator->>DateTaskRefValidator: Check date format (YYYY-MM-DD)
DateTaskRefValidator->>DateTaskRefValidator: Verify TaskRef has quotes
DateTaskRefValidator->>DateTaskRefValidator: Ensure both present

alt Date and TaskRef valid
    DateTaskRefValidator-->>ChecklistRunner: Date/TaskRef valid ✓
else Missing or malformed
    DateTaskRefValidator-->>ChecklistRunner: Date/TaskRef error ✗
    ChecklistRunner-->>Developer: FAIL - Date/TaskRef issues
end

ChecklistRunner->>SectionContentValidator: Validate section content
SectionContentValidator->>SectionContentValidator: Check Learnings section
SectionContentValidator->>SectionContentValidator: Check Success Patterns
SectionContentValidator->>SectionContentValidator: Check Implementation Excellence
SectionContentValidator->>SectionContentValidator: Check Improvements section

alt All sections populated
    SectionContentValidator-->>ChecklistRunner: Content valid ✓
else Empty sections found
    SectionContentValidator-->>ChecklistRunner: Content incomplete ✗
    ChecklistRunner-->>Developer: FAIL - Empty sections
end

ChecklistRunner->>CommandValidator: Validate commands
CommandValidator->>CommandValidator: Extract command references
CommandValidator->>CommandValidator: Verify command syntax
CommandValidator->>CommandValidator: Check against terminal history

alt Commands valid
    CommandValidator-->>ChecklistRunner: Commands verified ✓
else Invalid commands
    CommandValidator-->>ChecklistRunner: Command errors ✗
    ChecklistRunner-->>Developer: FAIL - Invalid commands
end

ChecklistRunner->>FilePathValidator: Validate file paths
FilePathValidator->>FilePathValidator: Extract file path references
FilePathValidator->>FilePathValidator: Check path spelling
FilePathValidator->>FilePathValidator: Verify path casing

alt Paths valid
    FilePathValidator-->>ChecklistRunner: Paths verified ✓
else Invalid paths
    FilePathValidator-->>ChecklistRunner: Path errors ✗
    ChecklistRunner-->>Developer: FAIL - Invalid paths
end

ChecklistRunner->>SyntaxChecker: Check markdown syntax
SyntaxChecker->>SyntaxChecker: Validate backtick balance
SyntaxChecker->>SyntaxChecker: Check list formatting
SyntaxChecker->>SyntaxChecker: Verify code fence structure

alt Syntax correct
    SyntaxChecker-->>ChecklistRunner: Syntax valid ✓
    ChecklistRunner-->>Developer: PASS - All validations successful
else Syntax errors
    SyntaxChecker-->>ChecklistRunner: Syntax errors ✗
    ChecklistRunner-->>Developer: FAIL - Markdown syntax issues
end
```

### Checklist Items

- [ ] Entry appended before the final ` ```` ` fence
- [ ] Date + TaskRef present and correct
- [ ] Each section contains at least one bullet
- [ ] Commands / scripts confirmed against terminal history
- [ ] Spelling & casing match actual files (`packages/server/...`, etc.)
- [ ] No Markdown syntax errors (balanced backticks, lists)

---

## Anti-Patterns to Avoid

### Anti-Pattern Detection and Correction

The following sequence diagram shows how to detect and correct common mistakes:

```sequenceDiagram
participant Developer
participant AntiPatternDetector
participant TemplateHeaderChecker
participant FenceLocationChecker
participant SectionCompletenessChecker
participant VaguenessDetector
participant ScriptBypassChecker
participant CorrectionEngine
participant RawReflectionLog

Developer->>AntiPatternDetector: Scan for anti-patterns
AntiPatternDetector->>RawReflectionLog: Read file content
RawReflectionLog-->>AntiPatternDetector: Return content

AntiPatternDetector->>TemplateHeaderChecker: Check template integrity
TemplateHeaderChecker->>TemplateHeaderChecker: Verify original header exists
TemplateHeaderChecker->>TemplateHeaderChecker: Check for overwrites

alt Template header overwritten
    TemplateHeaderChecker-->>AntiPatternDetector: ANTI-PATTERN: Template overwrite detected
    AntiPatternDetector->>CorrectionEngine: Restore template header
    CorrectionEngine->>CorrectionEngine: Recover original template
    CorrectionEngine-->>Developer: Template restored
    Note over Developer: ✓ Corrected: Template header restored
else Previous reflections deleted
    TemplateHeaderChecker-->>AntiPatternDetector: ANTI-PATTERN: Reflections deleted
    AntiPatternDetector-->>Developer: ERROR - Cannot auto-recover deleted content
    Note over Developer: ✗ Manual recovery required from git history
end

AntiPatternDetector->>FenceLocationChecker: Check entry locations
FenceLocationChecker->>FenceLocationChecker: Scan for entries outside fence

alt Entries outside code fence
    FenceLocationChecker-->>AntiPatternDetector: ANTI-PATTERN: Fence violation detected
    AntiPatternDetector->>CorrectionEngine: Move entries inside fence
    CorrectionEngine->>CorrectionEngine: Relocate misplaced entries
    CorrectionEngine-->>Developer: Entries relocated
    Note over Developer: ✓ Corrected: Entries moved inside fence
else All entries properly fenced
    FenceLocationChecker-->>AntiPatternDetector: Fence usage correct
end

AntiPatternDetector->>SectionCompletenessChecker: Check section content
SectionCompletenessChecker->>SectionCompletenessChecker: Scan for empty sections
SectionCompletenessChecker->>SectionCompletenessChecker: Check for action items in Learnings

alt Empty sections found
    SectionCompletenessChecker-->>AntiPatternDetector: ANTI-PATTERN: Empty sections
    AntiPatternDetector->>CorrectionEngine: Request section completion
    CorrectionEngine-->>Developer: Prompt for missing content
    Note over Developer: ✗ Manual content required
else Action items in wrong section
    SectionCompletenessChecker-->>AntiPatternDetector: ANTI-PATTERN: Misplaced action items
    AntiPatternDetector->>CorrectionEngine: Move to Improvements section
    CorrectionEngine-->>Developer: Items relocated to correct section
    Note over Developer: ✓ Corrected: Items moved to Improvements
end

AntiPatternDetector->>VaguenessDetector: Check description quality
VaguenessDetector->>VaguenessDetector: Scan for vague phrases
VaguenessDetector->>VaguenessDetector: Check for missing artifacts

alt Vague descriptions found
    VaguenessDetector-->>AntiPatternDetector: ANTI-PATTERN: Vague language detected
    AntiPatternDetector->>CorrectionEngine: Request specific details
    CorrectionEngine-->>Developer: Prompt for specific references
    Note over Developer: ✗ Add file paths, commands, or artifacts
else Descriptions specific and actionable
    VaguenessDetector-->>AntiPatternDetector: Description quality good
end

AntiPatternDetector->>ScriptBypassChecker: Check for formatting bypasses
ScriptBypassChecker->>ScriptBypassChecker: Verify manual review occurred

alt Script bypassed formatting checks
    ScriptBypassChecker-->>AntiPatternDetector: ANTI-PATTERN: Checks bypassed
    AntiPatternDetector->>CorrectionEngine: Run formatting validation
    CorrectionEngine->>CorrectionEngine: Execute formatting checks
    CorrectionEngine-->>Developer: Formatting issues report
    Note over Developer: ✗ Review and fix formatting issues
else Manual review confirmed
    ScriptBypassChecker-->>AntiPatternDetector: Process followed correctly
    AntiPatternDetector-->>Developer: No anti-patterns detected
    Note over Developer: ✓ Entry meets all standards
end
```

### Common Anti-Patterns

- ❌ **Overwriting the template header** or deleting previous reflections.
- ❌ **Adding reflections outside the code fence** (breaks downstream parsers).
- ❌ **Leaving sections blank** or stuffing future action items into "Learnings."
- ❌ **Using vague phrases** (e.g., "Fixed stuff"); be explicit and reference artifacts.
- ❌ **Relying on scripts that bypass formatting checks**—manually review the final markdown.

---

## Recommended Sources When Writing Entries

- Latest task completion report (`task-completion-reports/…`).
- Git diff (`git show`, `git status`) for file paths and summaries.
- Terminal history for validation commands (`pnpm vitest …`, `pnpm lint …`).
- Conversation notes or meeting summaries if they influenced the work.

---

## Periodic Maintenance

### Consolidation Workflow

The following sequence diagram illustrates the process of migrating knowledge from raw reflections
to consolidated learnings:

```sequenceDiagram
participant Maintainer
participant ConsolidationScheduler
participant RawReflectionLog
participant EntryAnalyzer
participant ConsolidationEngine
participant LearningsIndex
participant ConsolidatedLearnings
participant PruningValidator

Maintainer->>ConsolidationScheduler: Check consolidation schedule
ConsolidationScheduler->>RawReflectionLog: Count unprocessed entries
RawReflectionLog-->>ConsolidationScheduler: Return entry count

alt Entry count >= 5
    ConsolidationScheduler-->>Maintainer: Consolidation recommended

    Maintainer->>RawReflectionLog: Load unprocessed entries
    RawReflectionLog-->>Maintainer: Return entries

    Maintainer->>EntryAnalyzer: Analyze entries for consolidation
    EntryAnalyzer->>EntryAnalyzer: Identify durable knowledge
    EntryAnalyzer->>EntryAnalyzer: Group related insights
    EntryAnalyzer->>EntryAnalyzer: Extract actionable patterns
    EntryAnalyzer-->>Maintainer: Return consolidation candidates

    Maintainer->>ConsolidationEngine: Begin consolidation process
    ConsolidationEngine->>LearningsIndex: Check active file
    LearningsIndex-->>ConsolidationEngine: Return active file reference

    ConsolidationEngine->>ConsolidatedLearnings: Load active file
    ConsolidatedLearnings-->>ConsolidationEngine: Return current content

    ConsolidationEngine->>ConsolidationEngine: Check row count

    alt Row count >= 300
        ConsolidationEngine->>ConsolidationEngine: Create new file
        ConsolidationEngine->>LearningsIndex: Update active file reference
        LearningsIndex-->>ConsolidationEngine: Active file updated
    else Row count < 300
        ConsolidationEngine->>ConsolidationEngine: Use current file
    end

    ConsolidationEngine->>ConsolidationEngine: Synthesize insights
    ConsolidationEngine->>ConsolidationEngine: Distill patterns
    ConsolidationEngine->>ConsolidationEngine: Format for consolidated file

    ConsolidationEngine->>ConsolidatedLearnings: Append consolidated knowledge
    ConsolidatedLearnings-->>ConsolidationEngine: Knowledge added

    ConsolidationEngine->>LearningsIndex: Update metadata
    LearningsIndex->>LearningsIndex: Update row count
    LearningsIndex->>LearningsIndex: Update last_updated timestamp
    LearningsIndex-->>ConsolidationEngine: Metadata updated

    ConsolidationEngine-->>Maintainer: Consolidation complete

    Maintainer->>PruningValidator: Request pruning validation
    PruningValidator->>PruningValidator: Verify all entries consolidated
    PruningValidator->>PruningValidator: Check no data loss

    alt Consolidation verified
        PruningValidator-->>Maintainer: Request user approval for pruning
        Note over Maintainer: Prompt user before pruning

        alt User approves pruning
            Maintainer->>RawReflectionLog: Remove processed entries
            RawReflectionLog-->>Maintainer: Entries pruned
            Note over Maintainer: ✓ Raw log cleaned
        else User declines pruning
            Maintainer->>Maintainer: Skip pruning
            Note over Maintainer: Keep entries in raw log
        end
    else Verification failed
        PruningValidator-->>Maintainer: ERROR - Do not prune
        Note over Maintainer: ✗ Fix consolidation issues first
    end

else Entry count < 5
    ConsolidationScheduler-->>Maintainer: No consolidation needed yet
    Note over Maintainer: Continue accumulating entries
end
```

### Maintenance Guidelines

- When the log accumulates ~5 entries, schedule consolidation into the next
  `consolidated-learnings-XXX.md` file.
- After consolidation, **prompt the user before pruning** processed entries from the raw log.
- Verify that all consolidated knowledge accurately represents the original reflections.
- Update the learnings index with current row counts and timestamps.

---

## Quick Reference

### File Locations

- **Target File:** `memory-bank/raw_reflection_log.md`
- **Consolidated Learnings:** `memory-bank/consolidated-learnings-XXX.md`
- **Learnings Index:** `memory-bank/learnings-index.md`

### Related Documentation

- `docs/07-cline-continuous-improvement-protocol.md`
- `docs/memory-bank-update-guide.md`
- `C:\Users\jonah\OneDrive\Documents\Cline\Rules\01-sequence-diagrams.md`

### Quick Commands

```bash
# Open raw reflection log
code memory-bank/raw_reflection_log.md

# View recent git changes for context
git show HEAD

# Check terminal history for commands
history | tail -20
```

---

## Summary

This enhanced guide now provides comprehensive visualization of all procedural workflows through
sequence diagrams. Each diagram follows the mandatory visualization protocol and shows:

- **Clear component interactions** and responsibilities
- **Precise message flow** with chronological ordering
- **Decision points** with alternative paths
- **Validation gates** ensuring quality at each step

Keep this guide handy when logging reflections to ensure consistency and preserve the integrity of
the CritGenius Listener knowledge base. The sequence diagrams serve as both reference documentation
and implementation blueprints for GPT-5 Codex and other AI agents.
