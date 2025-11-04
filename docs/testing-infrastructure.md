# Testing Infrastructure - Technical Configuration Guide

**Version:** 1.1.0 **Last Updated:** 2025-11-04 **Target Audience:** Developers configuring test
environments, DevOps **Status:** Complete

---

## Table of Contents

1. [Shared Vitest Configuration Factory](#1-shared-vitest-configuration-factory)
2. [Package-Level Configuration Patterns](#2-package-level-configuration-patterns)
3. [Environment Setup and Teardown](#3-environment-setup-and-teardown)
4. [Path Alias Resolution](#4-path-alias-resolution)
5. [E2E Infrastructure](#5-e2e-infrastructure)

---

## 1. Shared Vitest Configuration Factory

The `vitest.shared.config.ts` file provides a configuration factory that ensures consistency across
all packages while allowing customization.

### 1.1 Architecture

```typescript
// vitest.shared.config.ts - Simplified view
export function createVitestConfig(options: CreateVitestConfigOptions): UserConfigExport {
  const {
    packageRoot,
    environment,
    setupFiles = [],
    tsconfigPath,
    testOverrides,
    coverageOverrides,
  } = options;

  return {
    root: normalizePathInput(packageRoot),
    resolve: {
      alias: resolveTsconfigAliases(tsconfigPath), // Auto-sync with tsconfig.json
    },
    test: {
      globals: true,
      environment, // 'node' | 'jsdom'
      setupFiles: normalizedSetupFiles,
      include: DEFAULT_INCLUDE_PATTERNS,
      exclude: DEFAULT_EXCLUDE_PATTERNS,
      coverage: applyCoverageDefaults(packageRoot, coverageOverrides),
      ...testOverrides,
    },
  };
}
```

### 1.2 Key Features

**1. Automatic Path Alias Resolution**

The factory reads `compilerOptions.paths` from your `tsconfig.json` and configures Vitest to resolve
the same aliases:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@critgenius/shared/*": ["../shared/src/*"],
      "@critgenius/test-utils/*": ["../test-utils/src/*"]
    }
  }
}
```

```typescript
// Automatically works in tests
import { createTestSession } from '@critgenius/test-utils/factories';
import { normalizeTranscript } from '@critgenius/shared/transcript';
```

**2. Mandatory Coverage Thresholds**

All packages inherit a 90% coverage requirement for statements, branches, functions, and lines. This
is enforced automatically:

```typescript
// Package-level vitest.config.ts
export default defineConfig(
  assertUsesSharedConfig(
    createVitestConfig({
      packageRoot: __dirname,
      environment: 'node',
      setupFiles: ['./src/test-setup.ts'],
    })
  )
);
```

The `assertUsesSharedConfig` wrapper ensures the factory is used and will throw an error if
bypassed.

**3. Deterministic Setup File Ordering**

Setup files execute in a predictable order:

1. Root common hooks: `tests/setup/common-vitest-hooks.ts`
2. Package-specific setup: `packages/*/src/test-setup.ts`

This ensures consistent test runtime configuration across all packages.

**4. Coverage Customization Per Package**

While 90% is the default, packages can add exclusions or adjust thresholds:

```typescript
export default defineConfig(
  assertUsesSharedConfig(
    createVitestConfig({
      packageRoot: __dirname,
      environment: 'jsdom',
      setupFiles: ['./src/test-setup.ts'],
      coverageOverrides: {
        exclude: [
          '**/legacy/**', // Exclude legacy code
          '**/prototypes/**',
        ],
        thresholds: {
          functions: 85, // Relax function coverage slightly
        },
      },
    })
  )
);
```

---

## 2. Package-Level Configuration Patterns

Each package has its own `vitest.config.ts` that invokes the shared factory:

### 2.1 Client Package (jsdom environment for React)

```typescript
// packages/client/vitest.config.ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { assertUsesSharedConfig, createVitestConfig } from '../../vitest.shared.config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(
  assertUsesSharedConfig(
    createVitestConfig({
      packageRoot: __dirname,
      environment: 'jsdom', // Browser environment for React
      setupFiles: ['../../tests/setup/common-vitest-hooks.ts', './src/test-setup.ts'],
    })
  )
);
```

### 2.2 Server Package (node environment)

```typescript
// packages/server/vitest.config.ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { assertUsesSharedConfig, createVitestConfig } from '../../vitest.shared.config';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(
  assertUsesSharedConfig(
    createVitestConfig({
      packageRoot: __dirname,
      environment: 'node', // Node.js environment for server
      setupFiles: ['../../tests/setup/common-vitest-hooks.ts', './src/test-setup.ts'],
    })
  )
);
```

---

## 3. Environment Setup and Teardown

The shared setup file `tests/setup/common-vitest-hooks.ts` provides deterministic runtime
configuration:

```typescript
import { beforeEach, afterEach, vi } from 'vitest';

// Set consistent timezone to avoid time-related flakiness
process.env.TZ = 'UTC';

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Restore all mocks (return to original implementation)
  vi.restoreAllMocks();

  // Reset module registry to ensure clean state
  vi.resetModules();
});

afterEach(() => {
  // Clear all timers to prevent leaks between tests
  vi.clearAllTimers();

  // Reset all mocks after each test
  vi.resetAllMocks();
});
```

Package-specific setup files can add additional configuration:

```typescript
// packages/client/src/test-setup.ts
import '@testing-library/jest-dom'; // DOM matchers
import { installTestRuntime } from '@critgenius/test-utils/runtime';
import { registerMatchers } from '@critgenius/test-utils/matchers';

// Install deterministic runtime globally
installTestRuntime();

// Register custom matchers
registerMatchers();
```

---

## 4. Path Alias Resolution

The factory automatically synchronizes Vitest's path resolution with your `tsconfig.json`:

### 4.1 How it works:

1. Reads `compilerOptions.paths` from `tsconfig.json`
2. Resolves each alias to absolute paths
3. Configures Vitest's `resolve.alias` setting
4. Handles `extends` in tsconfig for inheritance

### 4.2 Debug path resolution:

```bash
# Enable path resolution debugging
DEBUG_VITEST_ALIASES=true pnpm test
```

This outputs the resolved alias map for troubleshooting.

### 4.3 Path diagnostics for complex issues:

```bash
# Enable detailed path diagnostics
DEBUG_VITEST_PATHS=true \
DEBUG_VITEST_PATH_LEVEL=debug \
DEBUG_VITEST_PATH_STACKS=true \
pnpm test
```

> ⚠️ On Windows, never point `DEBUG_VITEST_PATH_OUTPUT` at reserved device names such as `NUL`,
> `CON`, `PRN`, `AUX`, or any `COM1`–`COM9` / `LPT1`–`LPT9` variant. The shared Vitest configuration
> now detects these values, logs a warning, and disables diagnostic file output to prevent
> filesystem errors. Prefer explicit filenames like `diagnostic-output.log` or consult
> `docs/filename-compatibility-troubleshooting.md` for safe alternatives.

---

## 5. E2E Infrastructure

Playwright E2E testing infrastructure integrates browser automation with the CritGenius Listener
development environment.

### 5.1 Browser Environment Setup

**Package Configuration:**

```typescript
// packages/client/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
```

### 5.2 Development Server Integration

For HTTPS requirements and proxy configuration, see:

- [Development Server Guide](./development-server.md) - Development server setup for E2E tests
- [Development Proxy Configuration](./development-proxy.md) - Proxy routing for E2E testing
- [HTTPS Development Setup](./https-development-setup.md) - HTTPS configuration for microphone
  access
- [HTTPS Troubleshooting Guide](./https-troubleshooting-guide.md) - Common HTTPS issues and
  solutions

### 5.3 Cross-Reference: Playwright Testing Patterns

This E2E infrastructure is complemented by dedicated testing patterns in the
[Playwright Testing Guide](./playwright-testing-guide.md):

- **Section 2: Core Testing Patterns** - Essential Playwright test patterns for CritGenius
- **Section 3: Browser Compatibility Matrix** - Browser-specific testing considerations
- **Section 4: VSCode Debugging Workflows** - Debugging Playwright tests in VSCode
- **Section 5: Troubleshooting Procedures** - Common Playwright issues and solutions

The integration ensures E2E tests validate the complete audio capture and transcription workflow
across all supported browsers while maintaining consistency with unit and integration test patterns.

---

## Related Documentation

- [Testing Overview](./testing-overview.md) - Testing philosophy and architecture
- [Testing Workflows](./testing-workflows.md) - Practical getting-started guides
- [Testing Utilities](./testing-utilities.md) - Test utilities API reference
- [Integration Testing Handbook](./integration-testing-handbook.md) - Integration test patterns
- [Performance Testing Guide](./performance-testing-guide.md) - Performance testing procedures
- [Testing Validation](./testing-validation.md) - Quality gates and CI/CD integration
- [Development Server Guide](./development-server.md) - Development server setup for E2E tests
- [Development Proxy Configuration](./development-proxy.md) - Proxy routing for E2E testing
- [HTTPS Development Setup](./https-development-setup.md) - HTTPS configuration for microphone
  access
- [HTTPS Troubleshooting Guide](./https-troubleshooting-guide.md) - Common HTTPS issues and
  solutions
- [Playwright Testing Guide](./playwright-testing-guide.md) - Core testing patterns and workflows
- [Playwright Parallelization Guide](./playwright-parallelization-guide.md) - Worker allocation and
  sharding procedures
- [Filename Compatibility Guide](./filename-compatibility-guide.md) - Windows filename compatibility
  issues

---

**End of Testing Infrastructure Guide**
