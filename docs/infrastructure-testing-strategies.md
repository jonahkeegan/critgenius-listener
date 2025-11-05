# Infrastructure Testing Strategies

**Version:** 1.0.0  
**Last Updated:** 2025-11-04  
**Status:** Active  
**Target Audience:** Developers implementing validation, infrastructure engineers

## Table of Contents

- [1. Alternative Validation Strategies](#1-alternative-validation-strategies)
  - [1.1 Runtime Validation Checks](#11-runtime-validation-checks)
  - [1.2 CI Validation Scripts](#12-ci-validation-scripts)
  - [1.3 Documentation-First Approach](#13-documentation-first-approach)
  - [1.4 Consolidated Test Suites](#14-consolidated-test-suites)
- [2. Consolidation Patterns](#2-consolidation-patterns)
- [3. Related Documentation](#3-related-documentation)

---

## 1. Alternative Validation Strategies

### 1.1 Runtime Validation Checks

Runtime checks provide zero-maintenance validation by failing at application startup if
configuration is invalid.

#### When to Use Runtime Checks

✅ **Use runtime checks when:**

- Configuration errors would prevent normal operation
- Errors are easy to detect programmatically
- Fast failure is preferable to silent misconfiguration
- You want zero test maintenance

❌ **Don't use runtime checks when:**

- Validation is computationally expensive
- Configuration is used only in specific scenarios
- Testing requires complex setup or mocking
- Build-time validation is sufficient

#### Implementation Pattern

```typescript
// scripts/runtime-validation-helpers.mjs

/**
 * Validates configuration at runtime with actionable error messages
 * @param {string} configPath - Path to config file
 * @param {function} validator - Validation function
 * @throws {Error} with descriptive message if validation fails
 */
export function validateConfigAtRuntime(configPath, validator) {
  try {
    const config = loadConfig(configPath);
    const result = validator(config);

    if (!result.valid) {
      throw new Error(
        `Configuration validation failed for ${configPath}:\n` +
          result.errors.map(e => `  - ${e}`).join('\n') +
          `\n\nFix: ${result.fix}`
      );
    }
  } catch (error) {
    console.error(`[Runtime Validation] ${error.message}`);
    process.exit(1);
  }
}

/**
 * Asserts required environment variables are present
 * @param {string[]} requiredVars - Array of required variable names
 * @throws {Error} if any required variable is missing
 */
export function assertRequiredEnvVars(requiredVars) {
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
        missing.map(v => `  - ${v}`).join('\n') +
        `\n\nRefer to .env.example for required variables`
    );
  }
}
```

#### Usage Example

```typescript
// packages/server/src/index.ts

import { assertRequiredEnvVars } from '../../../scripts/runtime-validation-helpers.mjs';

// Validate at startup before any other initialization
assertRequiredEnvVars(['DATABASE_URL', 'JWT_SECRET', 'API_KEY']);

// Application continues only if validation passes
startServer();
```

- Use `detectConfigDrift` when you need to ensure multiple configuration files stay aligned across
  packages without maintaining a full validation test suite.

**Benefits:**

- No test maintenance
- Immediate feedback in all environments (dev, staging, prod)
- Clear error messages guide developers to fixes
- Validates actual runtime configuration

**Trade-offs:**

- Only catches issues when application starts
- Can't validate complex multi-file scenarios
- May slow down startup if validation is expensive

### 1.2 CI Validation Scripts

Simple shell scripts provide lightweight validation without test framework overhead.

#### When to Use CI Scripts

✅ **Use CI scripts when:**

- Validation is simple file system checks
- Existing CLI tools can do the checking (find, grep, diff)
- Test framework would be overkill
- Quick feedback is valuable but not critical

❌ **Don't use CI scripts when:**

- Complex logic or TypeScript/JavaScript code needed
- Need fixture management or mocking
- Validation requires compilation
- Detailed failure diagnostics are important

#### Implementation Pattern

```bash
#!/usr/bin/env bash
# scripts/validate-package-structure.sh

set -euo pipefail

echo "Validating package structure..."

PACKAGES_DIR="packages"
REQUIRED_PACKAGES=("client" "server" "shared" "test-utils")

# Check each package has required files
for pkg in "${REQUIRED_PACKAGES[@]}"; do
  pkg_dir="${PACKAGES_DIR}/${pkg}"

  if [[ ! -d "${pkg_dir}" ]]; then
    echo "❌ Missing package directory: ${pkg_dir}"
    exit 1
  fi

  if [[ ! -f "${pkg_dir}/package.json" ]]; then
    echo "❌ Missing package.json in ${pkg_dir}"
    exit 1
  fi

  if [[ ! -f "${pkg_dir}/tsconfig.json" ]]; then
    echo "❌ Missing tsconfig.json in ${pkg_dir}"
    exit 1
  fi
done

# Check for unexpected ESLint configs in packages
unexpected_configs=$(find "${PACKAGES_DIR}" -type f \( \
  -name '.eslintrc*' -o \
  -name 'eslint.config.*' \
\) 2>/dev/null || true)

if [[ -n "${unexpected_configs}" ]]; then
  echo "❌ Found unexpected ESLint configs in packages (should use root config):"
  echo "${unexpected_configs}"
  exit 1
fi

echo "✅ Package structure validation passed"
```

#### Integration with CI

```yaml
# .github/workflows/ci.yml

- name: Validate Package Structure
  run: bash scripts/validate-package-structure.sh

- name: Validate No Config Drift
  run: bash scripts/validate-no-config-drift.sh
```

**Benefits:**

- Extremely low maintenance
- Fast execution
- Easy to understand and modify
- Leverages existing shell tools
- No test framework dependencies

**Trade-offs:**

- Limited to file system operations
- Harder to provide detailed diagnostics
- Shell scripting can be error-prone
- Less portable across platforms

### 1.3 Documentation-First Approach

For low-impact configurations, comprehensive documentation may be sufficient.

#### When to Use Documentation Only

✅ **Use documentation when:**

- Configuration is set once and rarely changes
- Easy to verify manually during code review
- Low production impact if misconfigured
- No history of drift

❌ **Don't use documentation when:**

- Configuration frequently changes
- Hard to verify manually
- Critical production impact
- Previous drift incidents

#### Documentation Pattern

````markdown
## Package Configuration Standards

### ESLint Configuration

**Rule:** All packages MUST use the root-level `eslint.config.js`. Package-level ESLint configs are
prohibited.

**Rationale:** Ensures consistent linting rules across the monorepo.

**Verification:**

1. Check `packages/*/` directories for `.eslintrc*` or `eslint.config.*` files
2. Only the root `eslint.config.js` should exist

**Common Mistakes:**

- Creating package-specific `.eslintrc.json` files
- Copy-pasting ESLint config from another project

**If You Need Package-Specific Rules:** Add overrides in the root `eslint.config.js`:

\```javascript export default [ // ... global rules { files: ['packages/client/**/*.ts'], rules: {
// Client-specific overrides } } ]; \```
````

**Benefits:**

- Zero maintenance cost
- Flexible for edge cases
- Serves as reference during code review
- Documents rationale

**Trade-offs:**

- Relies on human vigilance
- No automated enforcement
- May be ignored under time pressure
- Doesn't prevent mistakes

### 1.4 Consolidated Test Suites

Combine related validations into single test suites to reduce maintenance overhead.

#### When to Consolidate

✅ **Consolidate when:**

- Multiple tests validate related configurations
- Tests share setup/teardown logic
- Tests have similar structure
- Individual tests are simple

❌ **Don't consolidate when:**

- Tests have very different purposes
- Combined test would be over 400 lines
- Failure isolation would suffer
- Tests run at different times (unit vs infrastructure)

#### Consolidation Example

**Before:** Three separate test files

- `eslint-audit-validation.test.ts` (372 lines)
- `eslint-package-configs.validation.test.ts` (174 lines)
- `eslint-scripts.test.ts` (hypothetical 100 lines)

**After:** One consolidated file

- `eslint-configuration.validation.test.ts` (450 lines)

```typescript
// tests/infrastructure/eslint-configuration.validation.test.ts

describe('ESLint configuration validation', () => {
  describe('audit completeness', () => {
    // Tests from eslint-audit-validation.test.ts
  });

  describe('package configurations', () => {
    // Tests from eslint-package-configs.validation.test.ts
  });

  describe('npm scripts', () => {
    // Tests from eslint-scripts.test.ts
  });
});
```

**Benefits:**

- Single file to maintain
- Shared setup/teardown
- Related validations grouped logically
- Easier to understand full picture

**Trade-offs:**

- Larger files can be harder to navigate
- All tests run together (can't selectively run one subset easily)
- Merge conflicts more likely

---

## 2. Consolidation Patterns

### Pattern 1: Theme-Based Consolidation

Combine tests that validate different aspects of the same system.

**Example: Coverage System**

```
Before:
- coverage-validation.test.ts (283 lines)
- coverage-thresholds.test.ts (130 lines)
- coverage-documentation.test.ts (212 lines)
- ci-coverage-integration.test.ts (139 lines)

After:
- coverage-system.validation.test.ts (600 lines)
  - Configuration validation
  - Threshold validation
  - Documentation validation
  - CI integration checks
```

### Pattern 2: Technology-Stack Consolidation

Combine tests related to a specific technology across different concerns.

**Example: Vitest Configuration**

```
Before:
- vitest-config-consistency.test.ts (333 lines)
- vitest-workspace.test.ts (218 lines)

After:
- vitest-configuration.validation.test.ts (450 lines)
  - Workspace configuration
  - Per-package config consistency
  - Shared config validation
```

### Pattern 3: Thin Wrapper Pattern

For very simple validations, wrap existing validation scripts rather than duplicating logic.

**Example: Testing Standards**

```typescript
// tests/infrastructure/testing-standards.test.ts (22 lines)

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

**Benefits:**

- Minimal test code
- Validation logic is reusable (can run outside tests)
- Easy to maintain
- Single source of truth

### Pattern 4: Fixture-Free Validation

Eliminate complex fixture management by validating actual project files.

**Before:**

```typescript
// Complex fixture management
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
await fs.writeFile(path.join(tempDir, 'config.json'), '...');
// ... test logic ...
await fs.rm(tempDir, { recursive: true });
```

**After:**

```typescript
// Direct validation of actual files
const config = await loadProjectConfig('config.json');
expect(config.setting).toBe(expectedValue);
```

**Benefits:**

- No setup/teardown complexity
- Tests actual project state
- Faster execution
- Fewer moving parts

**When NOT to use:**

- Need to test error conditions
- Testing build processes that modify files
- Need isolation from actual project state

---

## 3. Related Documentation

### Foundation & Decision Making

- [Infrastructure Testing Overview](./infrastructure-testing-overview.md) - Core principles,
  decision framework, and problem analysis
- [Infrastructure Testing Examples](./infrastructure-testing-examples.md) - Real-world examples and
  implementation guidelines
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

## Version History

| Version | Date       | Changes                                                                                     |
| ------- | ---------- | ------------------------------------------------------------------------------------------- |
| 1.0.0   | 2025-11-04 | Initial strategies guide with detailed implementation patterns and consolidation approaches |
| 1.0.0   | 2025-10-21 | Original comprehensive guide creation (migrated content)                                    |

---

**Last Updated:** 2025-11-04 16:54:40  
**Next Steps:** Refer to [Infrastructure Testing Examples](./infrastructure-testing-examples.md) for
practical implementation guidance
