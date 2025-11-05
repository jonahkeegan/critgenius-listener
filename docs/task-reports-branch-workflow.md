# Task Reports Branch Workflow

**Last Updated:** 2025-11-04  
**Version:** 2.0.0  
**Target Audience:** All Developers (Primary), DevOps Engineers (Secondary)

---

## Purpose

This guide explains how to integrate task completion reports with feature branch creation and pull
request workflow. Reports serve as the documentation foundation for code changes and enable smooth
PR review processes.

**Prerequisite:** Complete task execution and write report using
[Task Report Templates](task-report-templates.md) and follow
[Memory Bank Integration](task-reports-memory-bank-integration.md) to extract learnings.

**Related Documentation:**

- [Task Reports Overview](task-reports-overview.md) - Format selection and philosophy
- [Task Report Templates](task-report-templates.md) - Complete format templates
- [Task Report Writing Guide](task-report-writing-guide.md) - Writing quality and anti-patterns
- [Task Reports Memory Bank Integration](task-reports-memory-bank-integration.md) - Continuous
  improvement workflow
- `docs/development-workflow.md` - Overall development process

---

## Table of Contents

1. [Branch Naming Convention](#branch-naming-convention)
2. [Branch Creation Workflow](#branch-creation-workflow)
3. [Linking Reports to Branches](#linking-reports-to-branches)
4. [Pull Request Integration](#pull-request-integration)

---

## Branch Naming Convention

### Format Structure

**Standard Format:** `feat/[category]/[task-id]-[brief-description]`

**Components:**

- `feat/` - Prefix indicating feature branch
- `[category]` - dev-infra, ui, api, docs, test, etc.
- `[task-id]` - Task identifier from tracking system
- `[brief-description]` - Hyphenated description (2-5 words)

### Naming Examples from Project

**Development Infrastructure:**

- `feat/dev-infra/3-3-4-ci-eslint-workflow-guard`
- `feat/dev-infra/2-10-2-https-proxy-hardening`
- `feat/dev-infra/3-1-5-comprehensive-testing-guide`

**Documentation:**

- `feat/docs/1-4-repository-setup`
- `feat/docs/coverage-troubleshooting`

**Features:**

- `feat/api/user-authentication`
- `feat/ui/dashboard-redesign`

### Category Guidelines

| Category    | Usage                                          | Examples                          |
| ----------- | ---------------------------------------------- | --------------------------------- |
| `dev-infra` | Development infrastructure, tooling, CI/CD     | CI workflows, test setup, tooling |
| `docs`      | Documentation updates, guides, READMEs         | Guides, API docs, READMEs         |
| `api`       | Backend API changes, server logic              | Endpoints, data models, services  |
| `ui`        | Frontend user interface changes                | Components, styles, layouts       |
| `test`      | Testing infrastructure, test files, test tools | Unit tests, integration tests     |
| `security`  | Security-related changes, authentication, auth | OAuth, permissions, validation    |
| `perf`      | Performance optimizations, monitoring          | Caching, profiling, metrics       |

### Task ID Extraction

**From Task Tracking Systems:**

- Infrastructure tasks: `dev-infra-3-3-4` → `3-3-4`
- Feature tasks: `feature-user-auth` → `user-auth`
- Bug fixes: `bugfix-login-error` → `login-error`

**Task ID Patterns:**

- Numeric sequences: `1-4`, `2-10-2-2`, `3-1-5`
- Descriptive slugs: `ci-eslint`, `proxy-registry`, `coverage-gates`
- Combined: `https-proxy-hardening`, `testing-guide-refactor`

### Description Guidelines

**Length:** 2-5 hyphenated words  
**Clarity:** Descriptive enough to understand purpose  
**Consistency:** Use established terminology from project

**Good Examples:**

- `ci-eslint-workflow-guard`
- `centralized-proxy-registry`
- `coverage-threshold-calibration`
- `documentation-refactor`

**Avoid:**

- Too generic: `feature-update`
- Too long: `add-new-functionality-to-improve-user-experience`
- Unclear: `fix-things` or `improvements`

---

## Branch Creation Workflow

### Complete Workflow Sequence

```sequenceDiagram
participant Developer
participant TaskExecutor
participant ReportWriter
participant MemoryBank
participant BranchCreator
participant GitOps
participant PullRequest

TaskExecutor->>TaskExecutor: Complete implementation
TaskExecutor->>TaskExecutor: Run validation commands
TaskExecutor->>ReportWriter: Write completion report
ReportWriter->>MemoryBank: Extract learnings
MemoryBank->>MemoryBank: Update raw_reflection_log.md
MemoryBank->>MemoryBank: Create progress entry
MemoryBank->>BranchCreator: Extract branch name
BranchCreator->>GitOps: Create feature branch
GitOps->>GitOps: Add and commit changes
GitOps->>GitOps: Push to remote
GitOps->>PullRequest: Create pull request
```

### Step-by-Step Process

**Step 1: Complete Task Execution**

- Implement all changes
- Run comprehensive validation
- Ensure all tests pass
- Verify functionality works

**Step 2: Write Completion Report**

- Select appropriate format (concise/structured/comprehensive)
- Follow template exactly
- Include all validation commands
- Extract learnings for memory bank

**Step 3: Update Memory Bank**

- Create raw_reflection_log.md entry
- Create progress-XXX.md entry
- Identify pattern candidates
- Follow continuous improvement protocol

**Step 4: Create Feature Branch**

```bash
# Extract branch components from task
CATEGORY="dev-infra"           # From task tracking
TASK_ID="3-3-4"                # From tracking system
DESCRIPTION="ci-eslint-workflow-guard"  # From report summary

# Create branch name
BRANCH_NAME="feat/${CATEGORY}/${TASK_ID}-${DESCRIPTION}"

# Execute branch creation
git checkout -b $BRANCH_NAME
git add .
git commit -m "[Task ID]: [Brief description from report]"
git push origin $BRANCH_NAME
```

**Step 5: Create Pull Request**

- Use branch name in PR title
- Reference completion report
- Include validation results
- Add reviewers and labels

### Branch Creation Commands

**Basic Branch Creation:**

```bash
# Create and switch to new branch
git checkout -b feat/dev-infra/3-3-4-ci-eslint-workflow-guard

# Stage all changes
git add .

# Commit with task ID and description
git commit -m "Dev Infra 3.3.4: Add CI ESLint workflow guard"

# Push to remote
git push origin feat/dev-infra/3-3-4-ci-eslint-workflow-guard
```

**With Detailed Commit Message:**

```bash
git commit -m "Dev Infra 3.3.4: CI ESLint Workflow Guard

- Added infrastructure tests for CI lint stage validation
- Updated workflow configuration to ensure proper ordering
- Created comprehensive documentation with troubleshooting
- Validated with full test suite (92/92 tests passing)"
```

---

## Linking Reports to Branches

### Report Metadata in Branches

**Include Branch Information in Reports:**

For structured and comprehensive formats, add branch metadata:

```markdown
Date: 2025-10-24 Branch: feat/dev-infra/3-3-4-ci-eslint-workflow-guard Author: [your-name]
```

**Benefits:**

- Traceability between report and branch
- Easy searching and correlation
- Clear ownership and context

### PR Description Integration

**Standard PR Template:**

```markdown
## Task Completion Report

See: `task-completion-reports/2025-10-24-dev-infra-3-3-4-ci-eslint-workflow-guard.md`

## Summary

[High-level summary from report]

## Changes

[File list from report]

## Validation

[Commands from report]

## Memory Bank Updates

- ✅ raw_reflection_log.md entry created
- ✅ progress-XXX.md entry added
- ✅ Learnings extracted for consolidation
```

**Linking Examples:**

```markdown
## Documentation References

- **Completion Report**:
  task-completion-reports/2025-10-23-dev-infra-3-3-4-ci-eslint-workflow-guard.md
- **Learning Entry**: memory-bank/raw_reflection_log.md (2025-10-23)
- **Related Patterns**: systemPatterns-XXX.md (configuration patterns)
```

### Cross-Reference Maintenance

**In Reports:**

- Reference branch name and PR number when available
- Include GitHub issue numbers if applicable
- Link to related documentation updates

**In Project Management:**

- Use task completion reports as PR description source
- Reference reports in issue comments
- Include report links in project boards

---

## Pull Request Integration

### PR Title Convention

**Format:** `[Task ID]: [Brief Description]`

**Examples:**

- `Dev Infra 3.3.4: CI ESLint Workflow Guard`
- `Docs 1.4: Repository Setup and Branch Structure`
- `Feature User Auth: OAuth Integration`

### PR Description Template

````markdown
## Task Completion Summary

**Task ID:** [Task identifier from tracking]  
**Report Location:** `task-completion-reports/YYYY-MM-DD-[task-id]-[description].md`  
**Branch:** `feat/[category]/[task-id]-[description]`

## What Was Accomplished

[Brief summary from completion report]

## Changes Made

### Files Modified

[List from report's "Files Changed" section]

### Key Implementation Details

[From report's "Implementation Details" section]

## Validation

```bash
[Commands and results from report]
```
````

## Memory Bank Integration

- ✅ **raw_reflection_log.md**: Entry created with learnings
- ✅ **progress-XXX.md**: Task progress recorded
- ✅ **Patterns Identified**: [Any reusable patterns found]

## Review Checklist

- [ ] Code follows project standards
- [ ] Tests pass locally and in CI
- [ ] Documentation updated appropriately
- [ ] Memory bank updated with learnings
- [ ] No sensitive information exposed
- [ ] Backward compatibility maintained

## Additional Notes

[Any follow-up items or future work from report]

```

### Review Process Integration

**For Reviewers:**
- Reference completion report for full context
- Verify validation commands execute successfully
- Check that memory bank updates are appropriate
- Ensure learnings are captured for future reference

**For Authors:**
- Include report link in PR description
- Reference validation commands for review
- Highlight any patterns or learnings discovered
- Note any follow-up work or dependencies

### GitHub Integration Features

**Labels and Tags:**
- Use task category as label: `dev-infra`, `docs`, `feature`
- Add complexity indicators: `simple`, `medium`, `complex`
- Include status tags: `needs-review`, `ready-to-merge`

**Projects Integration:**
- Link to project boards using task IDs
- Update task status in tracking systems
- Reference related issues and epics

**Automated Checks:**
- Validate branch naming convention
- Check that completion report exists
- Verify memory bank update checklist
- Ensure CI/CD pipeline passes

---

## Quality Assurance

### Pre-PR Checklist

**Branch Quality:**
- [ ] Branch name follows convention: `feat/[category]/[task-id]-[description]`
- [ ] All changes are committed and pushed
- [ ] No merge conflicts with main branch
- [ ] Remote branch is accessible

**Report Quality:**
- [ ] Completion report written using appropriate template
- [ ] All validation commands included with results
- [ ] File paths are accurate and complete
- [ ] Learnings identified for memory bank

**Memory Bank Quality:**
- [ ] raw_reflection_log.md entry created
- [ ] progress-XXX.md entry added
- [ ] Pattern candidates evaluated
- [ ] Index files updated if needed

**Code Quality:**
- [ ] All tests pass locally
- [ ] Code follows project standards
- [ ] Documentation updated appropriately
- [ ] No sensitive information exposed

### Post-PR Validation

**Review Process:**
- [ ] PR description includes report reference
- [ ] Reviewers can access completion report
- [ ] Validation commands are reproducible
- [ ] Memory bank updates are appropriate

**Integration Verification:**
- [ ] CI/CD pipeline passes all checks
- [ ] Documentation is accessible and accurate
- [ ] Task tracking system updated
- [ ] Related issues are linked or closed

---

## Next Steps

After completing branch and PR workflow:

1. **Monitor PR Review**: Address reviewer feedback using report as reference
2. **Track Integration**: Verify successful merge and deployment
3. **Update Task Tracking**: Mark task as complete in tracking system
4. **Document Learnings**: Ensure all insights are captured in memory bank

---

**End of Branch Workflow - Version 2.0.0**

**Related Documentation:**

- [Task Reports Overview](task-reports-overview.md) - Format selection and philosophy
- [Task Report Templates](task-report-templates.md) - Complete format templates
- [Task Report Writing Guide](task-reports-writing-guide.md) - Writing quality and anti-patterns
- [Memory Bank Integration](task-reports-memory-bank-integration.md) - Continuous improvement workflow
- `docs/development-workflow.md` - Overall development process
```
