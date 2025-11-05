# Testing Validation - Quality Gates and CI/CD Integration Guide

**Version:** 1.1.0 **Last Updated:** 2025-11-05 **Target Audience:** Developers, DevOps, CI/CD
**Status:** Complete

---

## Table of Contents

1. [CI/CD Pipeline Integration](#1-cicd-pipeline-integration)
2. [Quality Gates](#2-quality-gates)
3. [Continuous Validation](#3-continuous-validation)

---

## 1. CI/CD Pipeline Integration

The testing validation suite integrates with GitHub Actions workflows to ensure consistent quality
across all environments.

### 1.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml (simplified)
name: Continuous Integration

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [client, server, shared]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run unit tests
        run: |
          cd packages/${{ matrix.package }}
          pnpm test

      - name: Run integration tests
        run: pnpm test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          flags: ${{ matrix.package }}
```

### 1.2 Percy Visual Testing Integration

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Tests

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM

jobs:
  percy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run Percy visual tests
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
        run: |
          cd packages/client
          pnpm test:visual
```

---

## 2. Quality Gates

Automated quality gates ensure all code meets minimum standards before merging.

### 2.1 Coverage Requirements

**Package-Level Thresholds:**

```typescript
// Shared coverage configuration
const COVERAGE_THRESHOLDS = {
  statements: 90,
  branches: 90,
  functions: 90,
  lines: 90,
};
```

**Per-Package Customizations:**

```typescript
// packages/server/vitest.config.ts
export default defineConfig(
  assertUsesSharedConfig(
    createVitestConfig({
      packageRoot: __dirname,
      environment: 'node',
      coverageOverrides: {
        thresholds: {
          statements: 95, // Higher requirement for server
          functions: 95,
        },
        exclude: [
          '**/migrations/**', // Exclude database migrations
          '**/legacy/**', // Exclude legacy compatibility code
        ],
      },
    })
  )
);
```

### 2.2 Performance Benchmarks

```typescript
// scripts/precommit-benchmark.mjs
import { runPerformanceTests } from '@critgenius/test-utils/performance';

const BENCHMARK_THRESHOLDS = {
  'audio-processing': {
    maxProcessingTimeMs: 50,
    maxMemoryIncreaseMB: 10,
  },
  'socket-communication': {
    maxConnectionTimeMs: 1000,
    maxConcurrentConnections: 50,
  },
};

export async function validatePerformanceBenchmarks() {
  const results = await runPerformanceTests();

  for (const [testName, result] of Object.entries(results)) {
    const thresholds = BENCHMARK_THRESHOLDS[testName];

    if (
      thresholds.maxProcessingTimeMs &&
      result.processingTimeMs > thresholds.maxProcessingTimeMs
    ) {
      throw new Error(
        `Performance regression: ${testName} took ${result.processingTimeMs}ms (max: ${thresholds.maxProcessingTimeMs}ms)`
      );
    }

    if (
      thresholds.maxMemoryIncreaseMB &&
      result.memoryIncreaseMB > thresholds.maxMemoryIncreaseMB
    ) {
      throw new Error(
        `Memory regression: ${testName} increased by ${result.memoryIncreaseMB}MB (max: ${thresholds.maxMemoryIncreaseMB}MB)`
      );
    }
  }
}
```

---

## 3. Continuous Validation

Automated validation ensures code quality throughout the development lifecycle.

### 3.1 Pre-Commit Validation

```typescript
// scripts/precommit-validate.mjs
import { execSync } from 'child_process';

const VALIDATION_COMMANDS = [
  'pnpm lint', // ESLint validation
  'pnpm type-check', // TypeScript type checking
  'pnpm test --run --reporter=verbose', // Fast test execution
  'pnpm test:coverage --reporter=verbose', // Coverage validation
];

export function runPreCommitValidation() {
  for (const command of VALIDATION_COMMANDS) {
    try {
      console.log(`Running: ${command}`);
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      console.error(`Validation failed: ${command}`);
      process.exit(1);
    }
  }
}

runPreCommitValidation();
```

### 3.2 Automated Documentation Validation

```typescript
// scripts/validate-doc-links.mjs
import { loadMarkdownFiles, validateLinks } from '@critgenius/test-utils/documentation';

export async function validateDocumentationLinks() {
  const docs = await loadMarkdownFiles('docs/**/*.md');
  const validationResults = await validateLinks(docs);

  if (validationResults.brokenLinks.length > 0) {
    console.error('Broken documentation links found:');
    for (const link of validationResults.brokenLinks) {
      console.error(`  - ${link.file}:${link.line}: ${link.url}`);
    }
    process.exit(1);
  }

  console.log(
    `Documentation validation passed: ${docs.length} files, ${validationResults.validLinks.length} links`
  );
}
```

### 3.3 Integration with Quality Gates

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates

on:
  pull_request:
    branches: [main]

jobs:
  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run quality gate validation
        run: |
          pnpm validate:coverage        # Coverage thresholds
          pnpm validate:performance     # Performance benchmarks
          pnpm validate:documentation   # Documentation links
          pnpm validate:security        # Security scan
          pnpm validate:dependencies    # Dependency vulnerabilities

      - name: Upload quality report
        uses: actions/upload-artifact@v3
        with:
          name: quality-report
          path: quality-reports/
```

---

## Related Documentation

- [Testing Overview](./testing-overview.md) - Testing philosophy and architecture
- [Testing Workflows](./testing-workflows.md) - Practical getting-started guides
- [Testing Infrastructure](./testing-infrastructure.md) - Technical configuration details
- [Testing Utilities](./testing-utilities.md) - Test utilities API reference
- [Integration Testing Handbook](./integration-testing-handbook.md) - Integration test patterns
- [Performance Testing Guide](./performance-testing-guide.md) - Performance testing procedures
- [Pre-Commit Workflow Guide](./pre-commit-workflow.md) - Pre-commit validation procedures
- [CI ESLint Integration Guide](./ci-eslint-integration.md) - CI/CD ESLint integration

---

**End of Testing Validation Guide**
