# Infrastructure Testing Examples

**Version:** 1.0.0  
**Last Updated:** 2025-11-04  
**Status:** Active  
**Target Audience:** All developers, especially new team members, infrastructure engineers

## Table of Contents

- [1. Implementation Guidelines](#1-implementation-guidelines)
- [2. Real-World Examples from CritGenius](#2-real-world-examples-from-critgenius)
- [3. Integration with Task Planning](#3-integration-with-task-planning)
- [4. Common Antipatterns to Avoid](#4-common-antipatterns-to-avoid)
- [5. Related Documentation](#5-related-documentation)

---

## 1. Implementation Guidelines

### Guideline 1: Start with the Lightest Approach

Always begin with the least complex validation that meets your needs:

1. Can documentation suffice? → Document it
2. Can a runtime check catch it? → Add runtime validation
3. Can a shell script verify it? → Create CI script
4. Need complex validation? → Create test

### Guideline 2: Prefer Runtime Checks for Critical Configs

If misconfiguration would cause:

- Application startup failure
- Data corruption
- Security issues

→ Use runtime validation to fail fast

### Guideline 3: Consolidate Before Adding

Before creating a new validation test:

1. Check if related tests exist
2. Consider adding to existing test suite
3. If adding new test, plan future consolidation path

### Guideline 4: Document Your Decision

In task implementation plans and completion reports, document:

- Which validation strategy you chose
- Why you chose it (reference decision framework)
- What alternative approaches you considered

**Example:**

```markdown
## Validation Strategy Decision

**Decision:** Create CI shell script for package structure validation

**Rationale:**

- No history of drift (new configuration)
- Medium production impact (CI failures)
- Easy to detect manually (simple file checks)
- Per decision framework: Medium impact + Easy detection = CI Script

**Alternatives Considered:**

- Validation test: Overkill for simple file checks
- Runtime check: Not critical enough for startup validation
- Documentation only: Want automated enforcement
```

### Guideline 5: Review and Refactor

Every 6 months, review infrastructure tests:

- Which tests have never failed?
- Which tests are high maintenance?
- Can any tests be consolidated or replaced?

### Guideline 6: Measure Value vs. Cost

For each test, track:

- **Value:** How many times has it caught real issues?
- **Cost:** Lines of code, setup complexity, CI time
- **Ratio:** Value / Cost

Consider removing or simplifying tests with low ratios.

---

## 2. Real-World Examples from CritGenius

### Example 1: High-Value Simple Test ✅

**Test:** `test-naming-standards.test.ts` (22 lines)

**What it does:** Wraps existing validation script to enforce test naming conventions

**Why it's valuable:**

- Very low maintenance (thin wrapper)
- Catches real violations (proven drift history)
- Medium production impact (test organization)
- Easy to understand

**Key Takeaway:** Thin wrappers around reusable validation logic provide high value with minimal
overhead.

```typescript
// Excellent pattern: Minimal test code
describe('testing standards compliance', () => {
  it('has no outstanding naming or structure violations', async () => {
    const { collectTestingStandardsIssues } = await import(
      '../../scripts/validate-testing-standards.mjs'
    );
    const { issues } = await collectTestingStandardsIssues({ fix: false });
    expect(issues).toHaveLength(0);
  });
});
```

### Example 2: High-Maintenance Complex Test ⚠️

**Test:** `coverage-orchestration.test.ts` (486 lines)

**What it does:** Tests coverage script orchestration with complex child process mocking

**Maintenance concerns:**

- Complex mocking of child processes, events, streams
- Extensive setup/teardown logic
- Tests internal implementation details
- High line count = high maintenance

**Alternative approach:**

```typescript
// Instead of complex mocking, use integration test:
describe('coverage orchestration (integration)', () => {
  it('runs all coverage targets successfully', async () => {
    // Actually run the coverage script
    const result = await exec('node scripts/coverage/run-coverage.mjs workspace');
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('✅');
  });
});
```

**Key Takeaway:** When tests become too complex, consider whether integration tests or runtime
checks would be more appropriate.

### Example 3: Good Consolidation Opportunity 🔄

**Current State:**

- `eslint-audit-validation.test.ts` (372 lines)
- `eslint-package-configs.validation.test.ts` (174 lines)

**Consolidation Potential:** Both tests validate ESLint configuration but from different angles.
Could consolidate into:

```typescript
// tests/infrastructure/eslint-configuration.validation.test.ts

describe('ESLint configuration validation', () => {
  describe('audit completeness', () => {
    // Fixture catalog and audit tests
  });

  describe('package configuration standards', () => {
    // Package-level config prohibition tests
  });

  describe('ignore patterns', () => {
    // Shared ignore pattern validation
  });
});
```

**Benefits:**

- Single file to maintain (easier updates)
- Shared ESLint instance setup
- Related validations grouped logically
- ~450 lines vs. 546 lines (some deduplication)

### Example 4: Runtime Check Alternative 🔵

**Current:** `version-validation.test.ts` (130 lines) + `version-validation.test.mjs` (12 lines)

**Could be replaced with:**

```typescript
// scripts/runtime-validation-helpers.mjs

export function validateToolingVersions() {
  const policy = loadVersionPolicy();
  const installed = detectInstalledVersions();

  for (const [tool, requiredVersion] of Object.entries(policy)) {
    if (!installed[tool]) {
      throw new Error(`Missing required tool: ${tool} ${requiredVersion}`);
    }

    if (!satisfiesVersion(installed[tool], requiredVersion)) {
      throw new Error(
        `Version mismatch for ${tool}:\n` +
          `  Required: ${requiredVersion}\n` +
          `  Installed: ${installed[tool]}\n` +
          `  Run: pnpm install -g ${tool}@${requiredVersion}`
      );
    }
  }
}
```

**Used at startup:**

```typescript
// scripts/dev-orchestration.mjs
validateToolingVersions(); // Fail fast if versions don't match
startDevServer();
```

**Benefits:**

- No test maintenance
- Validates in all environments
- Immediate feedback
- Clear fix instructions

### Example 5: CI Script Pattern 🟡

**Test:** Package structure validation

**Instead of 200-line test file:**

```bash
#!/usr/bin/env bash
# scripts/validate-package-structure.sh

find packages -type f -name 'eslint.config.*' -o -name '.eslintrc*' | \
  grep -v node_modules | \
  if read result; then
    echo "❌ Unexpected ESLint configs in packages:"
    echo "$result"
    exit 1
  fi

echo "✅ No unexpected ESLint configs"
```

**CI integration:**

```yaml
- name: Validate Package Structure
  run: bash scripts/validate-package-structure.sh
```

**Benefits:**

- ~10 lines vs 200 lines
- Easy to understand
- Fast execution
- Leverages Unix tools

---

## 3. Integration with Task Planning

### During Task Implementation Planning

When planning an infrastructure task, include a "Validation Strategy" section:

```markdown
## Task: Update Build Configuration

### Validation Strategy Decision

**Configuration Changes:**

- Build output directory
- Source maps generation
- Minification settings

**Drift History:** None (first time setting up)

**Production Impact:** High (affects all builds)

**Detection Difficulty:** Medium (need to check multiple files)

**Decision:** Runtime Check + Documentation

**Rationale:**

- High production impact suggests runtime validation
- Medium detection difficulty manageable with runtime check
- No drift history means full test is premature
- Will add test if drift occurs in future

**Implementation:**

1. Add runtime check in build script to validate config
2. Document configuration requirements in docs/build-system.md
3. Add to code review checklist

**Will NOT create:**

- Dedicated validation test (no drift history justifies it yet)
- Complex fixture-based testing (overkill for first-time setup)
```

### During Code Review

Reviewers should verify:

- [ ] Validation strategy decision is documented
- [ ] Decision aligns with decision framework in this guide
- [ ] If validation test created, drift history or justification provided
- [ ] Alternative approaches were considered

### In Task Completion Reports

Document validation approach:

```markdown
## Validation Implementation

**Strategy Used:** CI Script

**Justification:** Medium impact, easy detection, per pragmatic testing guide framework

**Files Created:**

- `scripts/validate-tsconfig-consistency.sh` (25 lines)
- Added to `.github/workflows/ci.yml`

**Why Not a Test:** Simple file comparisons don't justify test framework overhead. CI script
provides adequate validation with minimal maintenance.
```

---

## 4. Common Antipatterns to Avoid

### Antipattern 1: Automatic Test Creation

❌ **Don't:** Create a validation test for every infrastructure change by default

✅ **Do:** Use the decision framework to choose the appropriate validation strategy

### Antipattern 2: Testing Implementation Details

❌ **Don't:** Test how a script does something (mocking internals)

✅ **Do:** Test what the script achieves (integration tests or runtime checks)

### Antipattern 3: Complex Fixture Management

❌ **Don't:** Create elaborate temporary file structures for simple validations

✅ **Do:** Validate actual project files when possible

### Antipattern 4: Premature Validation

❌ **Don't:** Add validation tests for configurations that have never drifted

✅ **Do:** Start with documentation or runtime checks; add tests when drift occurs

### Antipattern 5: Validation Sprawl

❌ **Don't:** Create many small test files for related configurations

✅ **Do:** Consolidate related validations into cohesive test suites

### Antipattern 6: Ignoring Maintenance Cost

❌ **Don't:** Create tests without considering long-term maintenance burden

✅ **Do:** Assess maintenance cost vs. value before creating tests

### Antipattern 7: Test Framework for Everything

❌ **Don't:** Use Vitest for simple file existence checks

✅ **Do:** Use CI scripts for simple validations, tests for complex ones

---

## 5. Related Documentation

### Foundation & Decision Making

- [Infrastructure Testing Overview](./infrastructure-testing-overview.md) - Core principles,
  decision framework, and problem analysis
- [Infrastructure Testing Strategies](./infrastructure-testing-strategies.md) - Detailed
  implementation strategies and consolidation patterns
- [Infrastructure Testing Migration](./infrastructure-testing-migration.md) - Migration guidance and
  assessment tools

### Implementation & Testing

- [Comprehensive Testing Guide](./comprehensive-testing-guide.md) - Complete testing strategy and
  practices
- [Testing Standards](./testing-standards.md) - Naming conventions and test structure
- [Integration Testing Standards](./integration-testing-standards.md) - Integration test patterns
- [Testing Utilities](../testing-utilities.md) - Shared testing utilities and helpers

### Validation & Quality

- [Validation Test Decision Matrix](./validation-test-decision-matrix.md) - One-page decision
  reference
- [Coverage System Guide](./coverage-system-guide.md) - Coverage reporting and validation
- [CI/ESLint Integration](./ci-eslint-integration.md) - Code quality validation patterns

### Workflow & Planning

- [Developer Onboarding](./developer-onboarding.md) - New developer guidance
- [Development Workflow](./development-workflow.md) - Standard development processes
- [Task Completion Report Guide](./task-completion-report-guide.md) - Documentation standards

### Protocol Files

- [.clinerules/07-cline-continuous-improvement-protocol.md](../.clinerules/07-cline-continuous-improvement-protocol.md) -
  Continuous learning and improvement protocols
- [.clinerules/baby-steps-v-1-1.md](../.clinerules/baby-steps-v-1-1.md) - Methodical task execution
  approach
- [.clinerules/01-sequence-diagrams.md](../.clinerules/01-sequence-diagrams.md) - Workflow
  visualization protocols

---

## Summary

**Key Principles:**

1. **Validation tests only when justified** - Drift history or high impact + difficulty
2. **Start with the lightest approach** - Documentation → Runtime checks → CI scripts → Tests
3. **Consolidate related validations** - Reduce maintenance overhead
4. **Document your decisions** - Make rationale clear for future developers
5. **Review and optimize** - Regularly assess test value vs. maintenance cost

**Remember:** The goal is production reliability with minimal test maintenance burden. Every
validation approach should be chosen deliberately based on evidence, not habit.

For questions or suggestions about this guide, open an issue or discussion in the repository.

---

## Version History

| Version | Date       | Changes                                                                     |
| ------- | ---------- | --------------------------------------------------------------------------- |
| 1.0.0   | 2025-11-04 | Initial examples guide with real-world patterns and implementation guidance |
| 1.0.0   | 2025-10-21 | Original comprehensive guide creation (migrated content)                    |

---

**Last Updated:** 2025-11-04 16:56:59  
**Next Steps:** Refer to [Infrastructure Testing Migration](./infrastructure-testing-migration.md)
for assessment tools and migration guidance
