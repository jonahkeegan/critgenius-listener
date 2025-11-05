# Task Report Writing Guide

**Last Updated:** 2025-11-04  
**Version:** 2.0.0  
**Target Audience:** New Report Writers (Primary), Developers Seeking Improvement (Secondary)

---

## Purpose

This guide provides practical, section-by-section guidance for writing effective task completion
reports. Use this guide to improve your writing quality and avoid common mistakes.

**Prerequisite:** Select your format using [Task Reports Overview](task-reports-overview.md) and use
templates from [Task Report Templates](task-report-templates.md).

**Related Documentation:**

- [Task Reports Overview](task-reports-overview.md) - Format selection and complexity matrix
- [Task Report Templates](task-report-templates.md) - Complete format templates
- [Task Reports Memory Bank Integration](task-reports-memory-bank-integration.md) - Continuous
  improvement workflow
- [Task Reports Branch Workflow](task-reports-branch-workflow.md) - Feature branch and PR
  integration

---

## Table of Contents

1. [Section-by-Section Guide](#section-by-section-guide)
2. [Anti-Pattern Examples](#anti-pattern-examples)

---

## Section-by-Section Guide

### Writing the Summary

**Purpose:** Provide quick overview of accomplishment

**Concise Format:**

- 2-3 bullet points
- Include specific file/component names
- State observable outcomes
- Mark task completion in tracking

**Structured Format:**

- 2-3 paragraphs
- Cover what, why, and impact
- Highlight key technical decisions
- Provide context for changes

**Comprehensive Format:**

- 1-2 paragraphs
- High-level accomplishment statement
- Major achievement highlights
- Link to broader project goals

### Writing Implementation Details

**Purpose:** Explain technical approach and decisions

**What to Include:**

- Why decisions were made (not just what)
- Key patterns or techniques used
- Integration points with existing code
- Configuration approaches
- Code snippets where they add clarity

**What to Exclude:**

- Entire file contents
- Line-by-line code walkthroughs
- Overly detailed technical minutiae

**Example (Good):**

```markdown
## Implementation Details

Introduced centralized proxy registry to solve route/env key drift:

- `PROXY_ROUTES` object defines all proxy paths
- `resolveTargetFromEnv()` helper derives protocol/port consistently
- Client proxy builder iterates registry for route configuration

Benefits: Single source of truth enables future auto-generation of docs and .env templates.
```

**Example (Bad):**

```markdown
## Implementation Details

I created a file and put some code in it. Then I updated another file to use that code.
```

### Documenting Validation

**Purpose:** Provide reproducible evidence of success

**Required Elements:**

- Exact commands executed
- Expected outcomes
- Actual results (PASS/FAIL)
- Any special setup needed

**Example (Good):**

```markdown
## Validation

- `pnpm run test:infrastructure` — PASS (23/23 tests)
- `pnpm lint` — PASS (0 warnings)
- `pnpm type-check` — PASS (0 errors)
- `pnpm test:coverage:thematic` — PASS (coverage gates met)
```

**Example (Bad):**

```markdown
## Validation

Everything works correctly. All tests passed.
```

### Listing Files Changed

**Purpose:** Enable quick identification of affected areas

**Best Practices:**

- Use relative paths from project root
- Group by package, module, or type
- Include brief description of change type
- Order: Created → Modified → Deleted

**Format Options:**

Simple list (Concise):

```markdown
## Files Changed

- `path/to/file1.ts`
- `path/to/file2.md`
```

Organized by category (Structured):

```markdown
## Artifacts Changed

- **Shared Package**
  - `packages/shared/src/config/registry.ts` — NEW: Centralized registry
  - `packages/shared/src/index.ts` — Export registry

- **Client Package**
  - `packages/client/src/config/proxy.ts` — Refactored to use registry
```

Detailed with specifications (Comprehensive):

```markdown
## Files Created/Modified

### Created Files

1. `docs/guide.md` (1,530 lines)
   - Complete testing guide with 9 sections

### Modified Files

1. `package.json` (updated scripts section)
   - Added `test:infrastructure` command
```

### Capturing Follow-ups

**Purpose:** Document future work opportunities

**Best Practices:**

- Be specific about future work
- Reference related task IDs if known
- Distinguish required vs. optional
- Provide rationale for each item
- Link to issues or ADRs if applicable

**Example (Good):**

```markdown
## Follow-up Recommendations

1. Create generator script: `scripts/generate-proxy-docs.mjs` → auto-generate route documentation
2. Add integration test for multi-port discovery scenario (Task 2.10.3)
```

**Example (Bad):**

```markdown
## Follow-ups

- Make it better
- Improve performance
- Add tests
```

---

## Anti-Pattern Examples

### Anti-Pattern 1: Vague Summary

**Example from project history** (dev-infra-task-1-4-completion-report.md - improved version):

**❌ Bad:**

```markdown
## Summary

Task 1.4 has been successfully completed using the GitHub MCP.
```

**Why Wrong:** Generic statement with no specifics about what was accomplished or what files were
affected.

**✅ Good:**

```markdown
## Summary

- ✅ Created initial README.md file in main branch to establish repository content
- ✅ Created `develop` branch from `main` using GitHub MCP create_branch tool
- ✅ Created `staging` branch from `main` using GitHub MCP create_branch tool
- ✅ Updated infrastructure setup task list to mark task 1.4 as completed
```

**Why Better:** Specific actions with file/branch names and tool references make it clear what was
accomplished.

### Anti-Pattern 2: Missing Validation Commands

**Hypothetical example:**

**❌ Bad:**

```markdown
## Validation

Everything works correctly. All tests passed.
```

**Why Wrong:** No commands provided to verify the claims; future developers can't reproduce
validation.

**✅ Good:**

```markdown
## Validation

- `pnpm run test:infrastructure` — PASS (23/23 tests)
- `pnpm lint` — PASS (0 warnings)
- `pnpm type-check` — PASS (0 errors)
- `pnpm test:coverage:thematic` — PASS (coverage gates met)
```

**Why Better:** Exact commands with results enable reproducible verification.

### Anti-Pattern 3: Overly Detailed for Simple Task

**Hypothetical example of wrong format choice:**

**❌ Bad (using Comprehensive format for simple task):**

```markdown
# Task Completion Report: Fix Typo in README

**Date:** 2025-10-24 **Status:** ✅ COMPLETE

## Executive Summary

This comprehensive report documents the correction of a critical typographical error discovered in
the project's primary documentation file...

## Objectives Achieved

✅ Identified typo through documentation review ✅ Implemented correction using industry best
practices ✅ Validated change through peer review process

## Technical Implementation Details

The implementation required careful analysis of the existing documentation structure... [... 300
more lines ...]
```

**Why Wrong:** Massive overhead for trivial change; wastes time reading irrelevant detail.

**✅ Good (using Concise format):**

```markdown
# Task Completion Report – Doc Fix: README Typo

## Summary

- Fixed typo in README.md: "recieve" → "receive"

## Files Changed

- `README.md`

## Validation

- Visual inspection confirmed correction
```

**Why Better:** Appropriate detail level for scope of change.

### Anti-Pattern 4: No Connection to Memory Bank

**❌ Bad:**

```markdown
# Task Completion Report – Dev Infra 3.2.1: Coverage Gates

## Summary

- Updated coverage configuration
- Fixed tests

## Files Changed

- `config/coverage.config.mjs`
- `tests/infrastructure/vitest-config-consistency.test.ts`

## Validation

- `pnpm test:infrastructure`
```

**Why Wrong:** No identification of learnings, patterns, or insights for memory bank; misses
opportunity for knowledge capture.

**✅ Good:**

```markdown
# Task Completion Report – Dev Infra 3.2.1: Coverage Gate Calibration

## Summary

- Updated workspace coverage threshold to 9% in `config/coverage.config.mjs`
- Aligned infrastructure test assertions with new threshold
- Validated thematic coverage suite passes under relaxed gate

## Files Changed

- `config/coverage.config.mjs`
- `tests/infrastructure/vitest-config-consistency.test.ts`

## Validation

- `pnpm test:infrastructure` — PASS
- `pnpm test:coverage:thematic` — PASS

## Learnings for Memory Bank

- **Pattern Identified**: Centralized coverage thresholds in shared config prevent drift
- **Success**: Single source of truth approach caught misalignment before CI failure
- **Improvement**: Automated consistency checks maintain accuracy across test files
```

**Why Better:** Explicitly identifies learnings and patterns for continuous improvement protocol.

---

## Quality Improvement Checklist

Before submitting your report, verify:

### Content Quality

- [ ] Summary captures essence without being vague
- [ ] File paths are specific and accurate
- [ ] Validation commands are reproducible
- [ ] Implementation details explain "why" not just "what"
- [ ] Learnings are identified for memory bank

### Format Adherence

- [ ] Using appropriate format for task complexity
- [ ] All required sections present
- [ ] No unnecessary sections included
- [ ] Follows template structure closely
- [ ] Stays within size limits (30/150/400 lines)

### Technical Accuracy

- [ ] Commands execute successfully
- [ ] File paths exist and are correct
- [ ] Test results are current
- [ ] No false claims or assumptions
- [ ] Observable outcomes are stated

### Memory Bank Integration

- [ ] Learnings explicitly identified
- [ ] Patterns documented where applicable
- [ ] Success factors highlighted
- [ ] Challenges and solutions captured
- [ ] Ready for raw_reflection_log.md entry

---

## Next Steps

After improving your report quality:

1. **Complete Memory Bank Integration**: Follow
   [Memory Bank Integration](task-reports-memory-bank-integration.md) to extract learnings for
   continuous improvement
2. **Create Feature Branch**: Use [Branch Workflow](task-reports-branch-workflow.md) for PR
   integration
3. **Practice and Iterate**: Review your reports against this guide to continuously improve

---

**End of Writing Guide - Version 2.0.0**

**Related Documentation:**

- [Task Reports Overview](task-reports-overview.md) - Format selection and philosophy
- [Task Report Templates](task-report-templates.md) - Complete format templates
- [Memory Bank Integration](task-reports-memory-bank-integration.md) - Continuous improvement
  workflow
- [Branch Workflow](task-reports-branch-workflow.md) - Feature branch and PR integration
