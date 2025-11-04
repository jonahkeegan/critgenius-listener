# Refactoring Opportunities Analysis

**Generated:** 2025-11-04 09:55:49  
**Analysis Scope:** 860 files analyzed  
**Criteria:** Files exceeding 500 rows, ranked by recency of modification

## Executive Summary

Coding agents struggle with files exceeding 500 rows due to context window limitations and
complexity management issues. This analysis identified **32 files** exceeding 500 rows, with the
most recently modified files representing the highest priority refactoring opportunities.

## Top 10 Refactoring Priorities

### 1. **docs/comprehensive-testing-guide.md** (2,753 rows)

- **Last Modified:** 2025-11-04 09:55:49 (Most Recent)
- **Priority:** CRITICAL
- **Type:** Documentation
- **Issue:** Massive documentation file that likely contains multiple testing guides
- **Recommendation:** Split into modular documentation files by testing type

### 2. **docs/memory-bank-update-guide.md** (2,074 rows)

- **Last Modified:** 2025-10-31 14:17:31
- **Priority:** CRITICAL
- **Type:** Documentation
- **Issue:** Comprehensive guide that's become unwieldy
- **Recommendation:** Break into topic-specific guides (setup, maintenance, troubleshooting)

### 3. **docs/task-completion-report-guide.md** (1,533 rows)

- **Last Modified:** 2025-11-03 13:43:33
- **Priority:** HIGH
- **Type:** Documentation
- **Issue:** Large guide document
- **Recommendation:** Modularize by report types and workflows

### 4. **docs/pragmatic-infrastructure-testing-guide.md** (1,375 rows)

- **Last Modified:** 2025-11-02 08:55:28
- **Priority:** HIGH
- **Type:** Documentation
- **Issue:** Infrastructure testing guide has grown too large
- **Recommendation:** Separate into infrastructure, testing patterns, and best practices

### 5. **task-plans-cline/dev-infra-task-plan-3-6-3-percy-visual-test-playwright-integration.md** (1,242 rows)

- **Last Modified:** 2025-11-04 08:16:34
- **Priority:** HIGH
- **Type:** Task Planning
- **Issue:** Task plan has become overly detailed
- **Recommendation:** Split into implementation phases and reference documents

### 6. **task-plans-cline/dev-infra-task-plan-3-5-6-document-playwright-test-patterns-unified.md** (1,169 rows)

- **Last Modified:** 2025-11-02 08:51:31
- **Priority:** HIGH
- **Type:** Task Planning
- **Issue:** Unified documentation has grown too large
- **Recommendation:** Break into pattern categories and implementation guides

### 7. **docs/dependabot-guide.md** (1,096 rows)

- **Last Modified:** 2025-11-02 08:55:28
- **Priority:** MEDIUM-HIGH
- **Type:** Documentation
- **Issue:** Dependabot configuration guide is comprehensive but large
- **Recommendation:** Separate configuration examples from troubleshooting

### 8. **docs/playwright-testing-guide.md** (965 rows)

- **Last Modified:** 2025-11-01 09:27:47
- **Priority:** MEDIUM-HIGH
- **Type:** Documentation
- **Issue:** Testing guide has grown significantly
- **Recommendation:** Modularize by test types and browser configurations

### 9. **context-inputs/gpt5-github-sync-guide.md** (919 rows)

- **Last Modified:** 2025-11-02 08:54:56
- **Priority:** MEDIUM-HIGH
- **Type:** Documentation
- **Issue:** Sync guide has become comprehensive
- **Recommendation:** Split into sync workflows and troubleshooting

### 10. **task-plans-cline/dev-infra-task-plan-3-6-4-percy-visual-test-CI-CD-pipeline.md** (892 rows)

- **Last Modified:** 2025-11-04 08:55:23
- **Priority:** MEDIUM-HIGH
- **Type:** Task Planning
- **Issue:** CI/CD pipeline plan is very detailed
- **Recommendation:** Separate pipeline stages and configuration details

## Code Files Requiring Refactoring

### 11. **vitest.shared.config.ts** (810 rows)

- **Last Modified:** 2025-11-04 08:52:26
- **Priority:** HIGH
- **Type:** Configuration
- **Issue:** Shared Vitest configuration is too large
- **Recommendation:** Split into environment-specific configs and shared utilities

### 12. **packages/shared/src/services/assemblyai-logger.ts** (721 rows)

- **Last Modified:** 2025-08-20 11:16:55
- **Priority:** MEDIUM
- **Type:** Service Code
- **Issue:** Logger service has accumulated too much functionality
- **Recommendation:** Extract logging strategies and formatters into separate modules

### 13. **packages/shared/src/services/assemblyai-client.ts** (708 rows)

- **Last Modified:** 2025-08-20 11:16:55
- **Priority:** MEDIUM
- **Type:** Service Code
- **Issue:** Client service is handling too many responsibilities
- **Recommendation:** Split into client, connection management, and error handling modules

### 14. **packages/client/src/theme/critgeniusTheme.ts** (686 rows)

- **Last Modified:** 2025-08-20 11:16:55
- **Priority:** MEDIUM
- **Type:** Theme Configuration
- **Issue:** Theme file has grown too large
- **Recommendation:** Break into component themes and shared utilities

### 15. **packages/client/src/components/speaker/CharacterAssignmentGrid.tsx** (665 rows)

- **Last Modified:** 2025-08-20 11:16:55
- **Priority:** MEDIUM
- **Type:** React Component
- **Issue:** Component is handling too much UI logic
- **Recommendation:** Extract sub-components and custom hooks

## Refactoring Strategy Recommendations

### Phase 1: Documentation Modularization (Immediate - High Impact)

1. **Split comprehensive-testing-guide.md** into:
   - `testing-setup-guide.md`
   - `testing-patterns-guide.md`
   - `testing-troubleshooting-guide.md`

2. **Break memory-bank-update-guide.md** into:
   - `memory-bank-setup.md`
   - `memory-bank-maintenance.md`
   - `memory-bank-best-practices.md`

### Phase 2: Configuration Refactoring (Short-term)

1. **Refactor vitest.shared.config.ts**:
   - Extract environment-specific configs
   - Create shared utility functions
   - Implement configuration composition patterns

### Phase 3: Code Service Modularization (Medium-term)

1. **Refactor assemblyai services**:
   - Separate client logic from connection management
   - Extract error handling strategies
   - Create specialized logger modules

### Phase 4: Component Decomposition (Medium-term)

1. **Break down large React components**:
   - Extract custom hooks for complex logic
   - Create sub-components for UI sections
   - Implement compound component patterns

## Implementation Priority Matrix

| File                                      | Size  | Recency     | Business Impact | Refactoring Effort | Priority Score |
| ----------------------------------------- | ----- | ----------- | --------------- | ------------------ | -------------- |
| comprehensive-testing-guide.md            | 2,753 | Very Recent | High            | Medium             | 10/10          |
| memory-bank-update-guide.md               | 2,074 | Recent      | High            | Medium             | 9/10           |
| task-completion-report-guide.md           | 1,533 | Recent      | Medium          | Medium             | 8/10           |
| pragmatic-infrastructure-testing-guide.md | 1,375 | Recent      | Medium          | Medium             | 8/10           |
| vitest.shared.config.ts                   | 810   | Very Recent | High            | High               | 9/10           |

## CLI Commands for Monitoring Progress

```bash
# Check files exceeding 500 rows
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" | \
  xargs wc -l | awk '$1 > 500 {print $2 " (" $1 " rows)"}' | sort -k2,2nr

# Track refactoring progress
echo "Files remaining over 500 rows:" && \
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" | \
  xargs wc -l | awk '$1 > 500 {count++} END {print count}'
```

## Success Metrics

- **Target:** Reduce all files to under 500 rows
- **Timeline:** 2-3 weeks for documentation, 4-6 weeks for code
- **Quality Gates:**
  - No single file exceeds 500 lines
  - All refactored modules maintain test coverage
  - Documentation remains searchable and accessible

## Next Steps

1. **Immediate:** Begin with documentation modularization (highest impact, lowest risk)
2. **Week 1:** Refactor configuration files
3. **Week 2-3:** Modularize code services
4. **Week 4-6:** Decompose large React components
5. **Ongoing:** Monitor new files for size creep

---

_Analysis generated using CLI tools: `find`, `wc -l`, `stat`, and `sort` for accurate row counting
and timestamp analysis._
