# Firefox Sandbox Security Configuration

## Overview

This document explains the security-conscious approach to Firefox sandbox configuration in
Playwright E2E tests, addressing GitHub Copilot security recommendations while maintaining CI
compatibility.

## Problem Statement

Firefox's sandbox security layers conflict with CI container environments (specifically GitHub
Actions) that lack user namespace support. The initial solution disabled all sandbox layers
unconditionally, creating unnecessary security exposure in local development environments.

## Security Issue

**Original Configuration (Insecure):**

```typescript
firefoxUserPrefs: {
  'security.sandbox.content.level': 0,  // ALWAYS disabled
  'security.sandbox.gpu.level': 0,       // ALWAYS disabled
  // ... all sandbox layers disabled everywhere
},
env: {
  MOZ_DISABLE_CONTENT_SANDBOX: '1',      // ALWAYS disabled
},
```

**Risk:** Developers running tests locally have no sandbox protection, creating unnecessary attack
surface.

## Solution: Conditional Sandbox Disabling

**Current Configuration (Secure):**

```typescript
firefoxUserPrefs: {
  'media.navigator.streams.fake': true,
  'media.navigator.permission.disabled': true,
  // Conditional sandbox disabling - ONLY in CI
  ...(process.env.CI
    ? {
        'security.sandbox.content.level': 0,
        'security.sandbox.gpu.level': 0,
        'security.sandbox.gmp-plugin.level': 0,
        'security.sandbox.rdd.level': 0,
        'security.sandbox.socket.process.level': 0,
      }
    : {}),  // Empty object in local development = sandboxing enabled
},
env: process.env.CI
  ? {
      MOZ_DISABLE_CONTENT_SANDBOX: '1',  // Only in CI
    }
  : {},  // Empty object in local development = sandboxing enabled
```

## Security Benefits

### 1. **Principle of Least Privilege**

Sandbox disabling only occurs when absolutely necessary (CI environments), not in all environments.

### 2. **Local Development Protection**

Developers running tests locally retain full Firefox sandbox security:

- Content process isolation
- GPU process isolation
- Plugin isolation
- Network socket isolation
- RDD (Restricted Device Driver) isolation

### 3. **Zero Breaking Changes**

CI environments still function correctly because the GitHub Actions workflow sets `CI=true`:

```yaml
env:
  CI: true
  PLAYWRIGHT_DISABLE_SANDBOX: '1'
```

## Technical Details

### Environment Detection

The configuration uses `process.env.CI` to detect the execution context:

| Environment       | `CI` Value  | Sandbox State                  |
| ----------------- | ----------- | ------------------------------ |
| Local Development | `undefined` | ✅ Enabled (secure)            |
| GitHub Actions    | `"true"`    | ❌ Disabled (CI compatibility) |
| Other CI Systems  | `"true"`    | ❌ Disabled (CI compatibility) |

### Verification

A validation script confirms the configuration:

```bash
node scripts/verify-firefox-sandbox-config.mjs
```

Expected output:

```
✅ Firefox sandbox configuration is properly conditionalized for CI

Security benefits:
  • Local development maintains Firefox sandbox protection
  • CI environments disable sandbox only when necessary
  • Configuration follows principle of least privilege
```

## Testing Requirements

### Local Development Testing

<thought>To verify sandbox is enabled locally, developers should:</thought>

1. **Run Firefox tests locally:**

   ```bash
   pnpm --filter @critgenius/client exec playwright test --project=firefox-desktop
   ```

2. **Verify environment:**

   ```bash
   # Should be empty/undefined
   echo $CI
   ```

3. **Expected behavior:**
   - Tests should run successfully
   - Firefox launches with sandbox protection
   - No security warnings about disabled sandboxing

### CI Testing

1. **Trigger E2E workflow in GitHub Actions**
2. **Verify in job logs:**
   - `CI=true` is set
   - Firefox tests pass without sandbox errors
   - No "CanCreateUserNamespace() clone() failure: EPERM" errors

## Historical Context

### CI Sandbox Failures

Previous Firefox CI failures showed:

```
Running Nightly as root in a regular user's session is not supported.
Sandbox: CanCreateUserNamespace() clone() failure: EPERM
```

### Evolution of Solution

1. **Initial approach:** Disable sandboxing unconditionally (security risk)
2. **GitHub Copilot recommendation:** Conditionalize on `process.env.CI`
3. **Final implementation:** Conditional spread operators with security documentation

## Related Files

- **Playwright Config:** `packages/client/playwright.config.ts`
- **CI Workflow:** `.github/workflows/ci.yml`
- **Verification Script:** `scripts/verify-firefox-sandbox-config.mjs`
- **Failure Documentation:** `context-inputs/playwright-firefox-ci-test-failures.md`

## References

- [GitHub Copilot Security Recommendation](https://github.com/jonahkeegan/critgenius-listener/pull/XXX)
- [Playwright Firefox Sandbox Documentation](https://playwright.dev/docs/browsers#firefox)
- [Firefox Sandbox Architecture](https://wiki.mozilla.org/Security/Sandbox)
- [GitHub Actions Environment Variables](https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables)

## Maintenance

When updating this configuration:

1. **Always maintain conditional logic** - Never revert to unconditional disabling
2. **Test both environments** - Verify local development AND CI
3. **Run verification script** - Confirm configuration correctness
4. **Update this documentation** - Keep rationale current

## Security Audit Trail

| Date       | Change                            | Rationale                                                                    |
| ---------- | --------------------------------- | ---------------------------------------------------------------------------- |
| 2025-11-05 | Conditionalized sandbox disabling | GitHub Copilot security recommendation; follows principle of least privilege |

---

**Status:** ✅ Implemented and Verified  
**Security Level:** Improved (local development now protected)  
**CI Compatibility:** Maintained (no breaking changes)
