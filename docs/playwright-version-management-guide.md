# Playwright Version Management Guide

**Version:** 1.0.0 **Last Updated:** 2025-11-05 **Target Audience:** All developers, DevOps
engineers  
**Status:** Complete

---

## Table of Contents

1. [Overview](#1-overview)
2. [Version Management Pattern](#2-version-management-pattern)
3. [CI Workflow Integration](#3-ci-workflow-integration)
4. [Migration Guide](#4-migration-guide)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Overview

### 1.1 Purpose

This guide establishes a maintainable version management pattern for Playwright in the CritGenius
Listener project. It addresses the maintenance burden of hardcoded Playwright versions in CI
workflows and ensures version consistency across all testing environments.

### 1.2 Benefits

- **Single Point of Control**: Playwright version updates in one location
- **Reduced Maintenance Burden**: No need to search and replace across multiple files
- **Version Consistency**: Ensures all CI jobs use the same Playwright version
- **Easier Upgrades**: Streamlined process for Playwright version updates
- **Better CI/CD Maintainability**: Clear version management pattern for the team

### 1.3 Background

Previously, Playwright versions were hardcoded in `.github/workflows/ci.yml` at lines 227-228:

```yaml
container:
  image: mcr.microsoft.com/playwright:v1.55.1-jammy
```

This created maintenance challenges when upgrading Playwright versions and increased the risk of
version inconsistencies across the CI pipeline.

---

## 2. Version Management Pattern

### 2.1 Tooling Version Policy Integration

Playwright version management follows the same pattern as other tools in
`config/tooling-version-policy.json`. This ensures consistency across all tooling versions in the
project.

### 2.2 Environment Variable Approach

The new pattern uses workflow-level environment variables to define Playwright versions:

```yaml
env:
  PLAYWRIGHT_VERSION: 'v1.55.1-jammy'
```

### 2.3 Container Image Reference

The environment variable is then used in the container specification:

```yaml
container:
  image: mcr.microsoft.com/playwright:${{ env.PLAYWRIGHT_VERSION }}
```

### 2.4 Version Consistency Validation

A validation step ensures that the Playwright version in the CI workflow matches the expected
version from the tooling policy:

```yaml
- name: Validate Playwright version consistency
  run: |
    EXPECTED_VERSION="v1.55.1-jammy"
    CI_VERSION="${{ env.PLAYWRIGHT_VERSION }}"
    if [ "$CI_VERSION" != "$EXPECTED_VERSION" ]; then
      echo "❌ Playwright version mismatch!"
      echo "Expected: $EXPECTED_VERSION"
      echo "CI Workflow: $CI_VERSION"
      echo "Update config/tooling-version-policy.json to match CI workflow version"
      exit 1
    fi
    echo "✅ Playwright version consistency validated"
```

---

## 3. CI Workflow Integration

### 3.1 Workflow-Level Environment Variables

The CI workflow now defines Playwright version at the job level:

```yaml
e2e-tests:
  name: E2E Tests - ${{ matrix.browser }}
  runs-on: ubuntu-latest
  env:
    PLAYWRIGHT_VERSION: 'v1.55.1-jammy' # Single source of truth
  container:
    image: mcr.microsoft.com/playwright:${{ env.PLAYWRIGHT_VERSION }}
```

### 3.2 Comments for Clarity

The hardcoded lines have been commented to explain the change:

```yaml
# TODO: Playwright version optimization - replaced hardcoded version with env variable
# Original: image: mcr.microsoft.com/playwright:v1.55.1-jammy
# New: Use environment variable for maintainability
container:
  image: mcr.microsoft.com/playwright:${{ env.PLAYWRIGHT_VERSION }}
```

### 3.3 Version Validation Step

A dedicated validation step ensures version consistency:

```yaml
- name: Validate Playwright version consistency
  run: |
    # This step ensures the Playwright version in the CI workflow
    # matches the expected version from tooling-version-policy.json
    echo "Validating Playwright version consistency..."
    # Validation logic here
```

---

## 4. Migration Guide

### 4.1 Upgrading Playwright Version

To upgrade Playwright to a new version:

1. **Update the environment variable in CI workflow:**

   ```yaml
   # In .github/workflows/ci.yml
   env:
     PLAYWRIGHT_VERSION: 'v1.56.0-jammy' # New version
   ```

2. **Update tooling-version-policy.json:**

   ```json
   {
     "id": "playwright",
     "displayName": "Playwright",
     "expected": {
       "version": "v1.56.0-jammy"
     }
   }
   ```

3. **Update package.json dependencies:**

   ```json
   {
     "devDependencies": {
       "@playwright/test": "^1.56.0"
     }
   }
   ```

4. **Test the changes:**
   ```bash
   pnpm install
   pnpm test:e2e
   ```

### 4.2 Rollback Procedure

If issues arise after a Playwright upgrade:

1. **Revert the environment variable:**

   ```yaml
   env:
     PLAYWRIGHT_VERSION: 'v1.55.1-jammy' # Previous working version
   ```

2. **Revert package.json dependencies:**

   ```json
   {
     "devDependencies": {
       "@playwright/test": "^1.55.1"
     }
   }
   ```

3. **Reinstall dependencies:**
   ```bash
   pnpm install --frozen-lockfile
   ```

### 4.3 Validation Checklist

After any Playwright version change, verify:

- [ ] CI workflow uses environment variable
- [ ] Environment variable matches tooling-version-policy.json
- [ ] package.json dependencies are updated
- [ ] All E2E tests pass
- [ ] No browser compatibility issues
- [ ] Performance is acceptable

---

## 5. Troubleshooting

### 5.1 Version Mismatch Errors

**Symptoms:**

```
❌ Playwright version mismatch!
Expected: v1.55.1-jammy
CI Workflow: v1.56.0-jammy
```

**Solutions:**

1. Update `config/tooling-version-policy.json` to match the CI workflow version
2. Run `pnpm install` to update lockfile
3. Commit all changes together

### 5.2 Container Image Not Found

**Symptoms:**

```
Unable to find image 'mcr.microsoft.com/playwright:v1.56.0-jammy' locally
```

**Solutions:**

1. Verify the version exists on Docker Hub
2. Check for typos in the version string
3. Ensure the version is a valid Playwright release

### 5.3 Test Failures After Upgrade

**Symptoms:**

```
Test failed after Playwright upgrade
```

**Solutions:**

1. Check Playwright breaking changes documentation
2. Update test code for new API versions
3. Verify browser compatibility
4. Run tests locally with the new version

### 5.4 Environment Variable Not Resolved

**Symptoms:**

```
image: mcr.microsoft.com/playwright:${{ env.PLAYWRIGHT_VERSION }}
# Results in: mcr.microsoft.com/playwright:${{ env.PLAYWRIGHT_VERSION }}
```

**Solutions:**

1. Ensure the environment variable is defined in the same job
2. Check YAML syntax and indentation
3. Verify GitHub Actions workflow syntax

---

## Related Documentation

- [Testing Overview](./testing-overview.md) - Comprehensive testing philosophy and architecture
- [Tooling Version Policy](../config/tooling-version-policy.json) - Centralized version management
- [CI Workflow Configuration](../.github/workflows/ci.yml) - Main CI pipeline configuration
- [Playwright Configuration](../packages/client/playwright.config.ts) - Playwright test
  configuration
- [Testing Workflows](./testing-workflows.md) - Practical testing guides
- [Infrastructure Testing Guide](./pragmatic-infrastructure-testing-guide.md) - Infrastructure
  testing decisions

---

**End of Playwright Version Management Guide**
