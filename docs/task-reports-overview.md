# Task Reports Overview

**Last Updated:** 2025-11-04  
**Version:** 2.0.0  
**Target Audience:** All Developers (Primary), AI Coding Assistants (Secondary)

---

## Purpose

This guide provides explicit, structured templates for writing task completion reports that serve as
the critical bridge between task execution, memory bank updates, and feature branch creation.
Following this guide ensures consistent, actionable documentation that supports the CritGenius
Listener project's continuous improvement protocol.

**Related Documentation:**

- `.clinerules/07-cline-continuous-improvement-protocol.md` - Mandatory workflow for capturing
  learnings
- `docs/task-report-templates.md` - Complete template library for all three formats
- `docs/task-report-writing-guide.md` - Practical writing guidance and anti-patterns
- `docs/task-reports-memory-bank-integration.md` - Memory bank workflow integration
- `docs/task-reports-branch-workflow.md` - Feature branch and PR workflow
- `docs/memory-bank-update-guide.md` - Detailed workflow for updating memory bank files
- `docs/development-workflow.md` - Overall development process

---

## Table of Contents

1. [Overview & Philosophy](#overview--philosophy)
2. [Report Selection Matrix](#report-selection-matrix)
3. [Quick Reference](#quick-reference)
4. [Integration Guidelines](#integration-guidelines)

---

## Overview & Philosophy

### Core Principles

Task completion reports serve three critical functions in the CritGenius Listener development
workflow:

1. **Documentation**: Creating a permanent, searchable record of what was accomplished
2. **Knowledge Transfer**: Enabling future developers (human or AI) to understand decisions and
   implementations
3. **Continuous Improvement**: Feeding the memory bank system with learnings and patterns

### The Three Pillars

**Conciseness**: Default to the simplest format that captures essential information. Avoid
information overload while ensuring actionability.

**Actionability**: Every report must enable future work continuation through specific file paths,
validation commands, and observable outcomes.

**Memory Bank Integration**: Reports directly feed into the continuous improvement protocol defined
in `.clinerules/07-cline-continuous-improvement-protocol.md`, providing raw material for:

- `memory-bank/raw_reflection_log.md` entries
- `memory-bank/progress-XXX.md` task records
- `memory-bank/systemPatterns-XXX.md` pattern documentation
- `memory-bank/consolidated-learnings-XXX.md` distilled insights

### Task Completion Lifecycle

```sequenceDiagram
participant Developer
participant TaskExecution
participant CompletionReport
participant RawLog as raw_reflection_log.md
participant ProgressLog as progress-XXX.md
participant ConsolidatedLearnings
participant FeatureBranch

Developer->>TaskExecution: Complete task
TaskExecution->>CompletionReport: Write completion report
CompletionReport->>RawLog: Extract learnings & reflections
CompletionReport->>ProgressLog: Create progress entry
RawLog->>ConsolidatedLearnings: Periodic consolidation
CompletionReport->>FeatureBranch: Create feature branch (if needed)
FeatureBranch->>Developer: Ready for PR workflow
```

### Connection to Continuous Improvement Protocol

This guide implements **Step 1.1 (Task Review & Analysis)** of the continuous improvement protocol:

- **Identify Learnings**: What new information, techniques, or patterns were discovered?
- **Identify Difficulties**: What challenges were faced and how were they resolved?
- **Identify Successes**: What strategies or tools were notably effective?

The completion report captures this raw data, which then flows into Step 1.2 (Logging to
raw_reflection_log.md) and subsequent steps.

---

## Report Selection Matrix

### Complexity Assessment

Choose the appropriate report format based on task complexity, measured across multiple dimensions:

| Dimension                 | Simple      | Medium       | Complex       |
| ------------------------- | ----------- | ------------ | ------------- |
| **Files Changed**         | 1-3         | 4-10         | 10+           |
| **Lines of Code**         | <100        | 100-500      | 500+          |
| **New Patterns**          | 0           | 1-2          | 3+            |
| **Documentation Created** | 0-1         | 2-3          | 4+            |
| **Test Files Added**      | 0-1         | 2-4          | 5+            |
| **Architectural Impact**  | None        | Local        | System-wide   |
| **Report Length**         | 15-30 lines | 50-150 lines | 150-400 lines |

### Complexity Scoring

Assign points based on criteria:

- **Files Changed**: 1-3 files = 1pt, 4-10 = 2pts, 10+ = 3pts
- **Lines of Code**: <100 = 1pt, 100-500 = 2pts, 500+ = 3pts
- **New Patterns**: 0 = 1pt, 1-2 = 2pts, 3+ = 3pts
- **Documentation**: 0-1 docs = 1pt, 2-3 = 2pts, 4+ = 3pts
- **Architectural Impact**: None = 1pt, Local = 2pts, System-wide = 3pts

**Total Score:**

- **5-7 points**: Use [Concise Format](task-report-templates.md#template-1-concise-format)
- **8-11 points**: Use [Structured Format](task-report-templates.md#template-2-structured-format)
- **12-15 points**: Use
  [Comprehensive Format](task-report-templates.md#template-3-comprehensive-format)

### Report Selection Decision Flow

```sequenceDiagram
participant TaskCompleter
participant ComplexityAnalyzer
participant ReportSelector
participant TemplateProvider

TaskCompleter->>ComplexityAnalyzer: Analyze completed task
ComplexityAnalyzer->>ComplexityAnalyzer: Count files changed
ComplexityAnalyzer->>ComplexityAnalyzer: Estimate LOC impact
ComplexityAnalyzer->>ComplexityAnalyzer: Identify new patterns
ComplexityAnalyzer->>ComplexityAnalyzer: Check docs created
ComplexityAnalyzer->>ComplexityAnalyzer: Assess architectural impact
ComplexityAnalyzer->>ComplexityAnalyzer: Calculate complexity score

alt Score 5-7 (Simple)
    ComplexityAnalyzer->>ReportSelector: Simple task
    ReportSelector->>TemplateProvider: Request Concise Template
    TemplateProvider-->>TaskCompleter: Return concise format
else Score 8-11 (Medium)
    ComplexityAnalyzer->>ReportSelector: Medium task
    ReportSelector->>TemplateProvider: Request Structured Template
    TemplateProvider-->>TaskCompleter: Return structured format
else Score 12-15 (Complex)
    ComplexityAnalyzer->>ReportSelector: Complex task
    ReportSelector->>TemplateProvider: Request Comprehensive Template
    TemplateProvider-->>TaskCompleter: Return comprehensive format
end
```

### Quick Decision Guide

**Use Concise Format when:**

- ✅ Bug fix affecting 1-2 files
- ✅ Configuration adjustment without new patterns
- ✅ Documentation-only updates
- ✅ Simple refactoring within single module

**Use Structured Format when:**

- ✅ Feature implementation across multiple files
- ✅ Integration between 2-3 components
- ✅ Refactoring with pattern emergence
- ✅ Infrastructure enhancement with moderate scope

**Use Comprehensive Format when:**

- ✅ Major architectural changes
- ✅ Framework or library migrations
- ✅ System-wide infrastructure overhauls
- ✅ Complex features with cross-package integration

---

## Quick Reference

### Format Selection Cheat Sheet

```
Score 5-7  → Concise Format (15-30 lines)
Score 8-11 → Structured Format (50-150 lines)
Score 12-15 → Comprehensive Format (150-400 lines)

Files: 1-3 → Concise | 4-10 → Structured | 10+ → Comprehensive
Patterns: 0 → Concise | 1-2 → Structured | 3+ → Comprehensive
```

### Required Sections by Format

| Format            | Required Sections                             | Optional Sections    |
| ----------------- | --------------------------------------------- | -------------------- |
| **Concise**       | Summary, Files Changed, Validation            | Follow-ups           |
| **Structured**    | Summary, Artifacts, Implementation, Tests, DX | Security, Follow-ups |
| **Comprehensive** | All 12 sections                               | None (all required)  |

### Common Validation Commands

```bash
# Infrastructure Tests
pnpm run test:infrastructure

# Unit Tests
pnpm test

# Coverage
pnpm test:coverage
pnpm test:coverage:thematic

# Linting
pnpm lint
pnpm lint:fix

# Type Checking
pnpm type-check

# Full Validation Suite
pnpm lint && pnpm type-check && pnpm test
```

### Report File Naming

**Format:** `YYYY-MM-DD-[task-id]-[brief-description].md`

**Examples:**

- `2025-10-23-dev-infra-3-3-4-ci-eslint-workflow-guard.md`
- `2025-09-20-dev-infra-2-10-2-2-centralized-proxy-registry.md`
- `2025-01-11-dev-infra-3-1-5-comprehensive-testing-guide.md`

### Memory Bank Update Checklist

After writing completion report:

- [ ] Create raw_reflection_log.md entry (Step 1.2 of protocol)
- [ ] Extract learnings for consolidation
- [ ] Create progress-XXX.md entry
- [ ] Identify patterns for systemPatterns-XXX.md
- [ ] Update indexes (learnings-index.md, index-progress.md)
- [ ] Refresh activeContext.md if milestone reached

### Report Quality Checklist

Before finalizing report:

- [ ] Report filename follows naming convention
- [ ] Date and task ID included in header
- [ ] All required sections present for chosen format
- [ ] Validation commands listed with results
- [ ] File paths are accurate and complete
- [ ] Learnings identified for memory bank
- [ ] Observable outcomes documented
- [ ] Follow-ups are actionable (if included)

---

## Integration Guidelines

### Relationship to Other Documentation

This guide works in concert with several other project documentation files:

**Primary Integration:**

- **`.clinerules/07-cline-continuous-improvement-protocol.md`**: This guide implements Step 1.1
  (Task Review & Analysis) of the protocol. Reports provide raw material for Step 1.2 (Logging to
  raw_reflection_log.md).
- **`docs/memory-bank-update-guide.md`**: Use completion reports as input for memory bank updates
  following the detailed workflow in that guide.

**Supporting Integration:**

- **`docs/task-report-templates.md`**: All three report format templates (concise, structured,
  comprehensive)
- **`docs/task-report-writing-guide.md`**: Detailed section-by-section writing guidance and
  anti-patterns
- **`docs/task-reports-memory-bank-integration.md`**: Specific workflow for memory bank integration
- **`docs/task-reports-branch-workflow.md`**: Feature branch creation and PR workflow
- **`docs/development-workflow.md`**: Reports document completion of workflow stages
- **`docs/comprehensive-testing-guide.md`**: Validation sections reference testing standards
- **`docs/testing-standards.md`**: Test file naming follows these conventions

### When to Write Reports

**Mandatory:**

- ✅ After every task completion (before `attempt_completion`)
- ✅ Before creating feature branch for PR
- ✅ When updating memory bank with learnings
- ✅ As part of CI/CD documentation requirements

**Optional but Recommended:**

- ⚠️ After significant debugging sessions (document solution)
- ⚠️ When discovering reusable patterns mid-task
- ⚠️ After user feedback requires major changes

**Not Required:**

- ❌ During active task execution (wait until completion)
- ❌ For work-in-progress experimental branches
- ❌ For abandoned or rolled-back changes

### Report Storage and Organization

**Location:** `task-completion-reports/`

**Naming Convention:** `YYYY-MM-DD-[task-id]-[brief-description].md`

- Date: Use current date in PST timezone
- Task ID: From tracking system (e.g., `dev-infra-3-3-4`)
- Description: 2-5 hyphenated words summarizing task

**Retention Policy:**

- Keep all reports indefinitely as historical record
- No archiving or deletion (valuable for project history)
- Reports serve as permanent documentation

**Search and Discovery:**

- Task ID in filename enables quick search: `grep -r "3-3-4" task-completion-reports/`
- Date enables chronological browsing
- Git history preserves report evolution

### GPT-5 Copilot Instructions

**YOU MUST:**

- ✅ Write completion report before using `attempt_completion` tool
- ✅ Select format based on complexity matrix (not personal preference)
- ✅ Extract learnings explicitly for memory bank integration
- ✅ Include all validation commands executed
- ✅ Use appropriate sequence diagrams for complex workflows
- ✅ Reference this guide when uncertain about format or content

**YOU MUST NEVER:**

- ❌ Skip completion report for "simple" tasks
- ❌ Use wrong format template (e.g., comprehensive for bug fix)
- ❌ Omit validation commands or file paths
- ❌ Write generic summaries without specifics
- ❌ Fail to connect report to memory bank updates
- ❌ Create report after memory bank update (order matters)

**Decision Protocol:**

1. Complete task and verify all changes work
2. Calculate complexity score using matrix
3. Select appropriate template (concise/structured/comprehensive)
4. Write report following template exactly
5. Extract learnings for raw_reflection_log.md
6. Create progress-XXX.md entry
7. Update memory bank per protocol
8. Use `attempt_completion` tool

**Quality Assurance:**

- Verify all required sections present
- Check file paths are accurate
- Confirm validation commands execute successfully
- Ensure learnings are explicitly identified
- Cross-reference with memory bank update guide

### Workflow Integration

**Standard Task Completion Flow:**

1. **Task Execution** → Complete implementation
2. **Validation** → Run all test commands
3. **Completion Report** → Write using this guide ← YOU ARE HERE
4. **Memory Bank Update** → Follow
   [memory bank integration guide](task-reports-memory-bank-integration.md)
5. **Feature Branch** → Create branch with [conventional naming](task-reports-branch-workflow.md)
6. **Pull Request** → Reference report in PR description
7. **Task Tracking** → Mark task complete in tracking system

**Critical Ordering:**

- Report BEFORE memory bank update (provides input)
- Memory bank update BEFORE `attempt_completion` (protocol requirement)
- Validation BEFORE report writing (ensure accuracy)

---

## Next Steps

Now that you understand the overview and philosophy:

1. **Choose Your Format**: Use the [Report Selection Matrix](#report-selection-matrix) to determine
   whether you need a concise, structured, or comprehensive report
2. **Get Templates**: See [Task Report Templates](task-report-templates.md) for the complete format
   templates
3. **Learn Writing Techniques**: Read [Task Report Writing Guide](task-report-writing-guide.md) for
   section-by-section guidance and anti-patterns to avoid
4. **Integrate with Memory Bank**: Follow
   [Memory Bank Integration](task-reports-memory-bank-integration.md) for the continuous improvement
   protocol
5. **Create Feature Branch**: Use [Branch Workflow](task-reports-branch-workflow.md) for PR
   integration

---

**End of Overview - Version 2.0.0**

**Related Documentation:**

- [Task Report Templates](task-report-templates.md) - Complete template library
- [Task Report Writing Guide](task-report-writing-guide.md) - Practical guidance and anti-patterns
- [Memory Bank Integration](task-reports-memory-bank-integration.md) - Continuous improvement
  workflow
- [Branch Workflow](task-reports-branch-workflow.md) - Feature branch and PR integration
- `.clinerules/07-cline-continuous-improvement-protocol.md`
- `docs/memory-bank-update-guide.md`
- `docs/development-workflow.md`
