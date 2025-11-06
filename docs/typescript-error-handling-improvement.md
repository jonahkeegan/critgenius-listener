# TypeScript Error Handling Improvement

## Overview

This document describes the improvement made to TypeScript error handling in the client Vite
configuration, specifically replacing `@ts-ignore` with `@ts-expect-error` for better technical debt
tracking.

## Change Details

### File Modified

- `packages/client/vitest.config.ts`

### Before

```typescript
// @ts-ignore - Duplicate Vite installations in node_modules cause incompatible Plugin types.
// The config is structurally valid and works at runtime. This is a known pnpm hoisting issue.
assertUsesSharedConfig(mergedConfig);
```

### After

```typescript
// @ts-expect-error - Duplicate Vite installations in node_modules cause incompatible Plugin types.
// The config is structurally valid and works at runtime. This is a known pnpm hoisting issue.
assertUsesSharedConfig(mergedConfig);
```

## Benefits

### 1. **Better Error Tracking**

- `@ts-ignore` is a blanket suppression that hides ALL errors on the next line
- `@ts-expect-error` is targeted suppression that will FAIL if the error is fixed
- This makes technical debt visible and trackable

### 2. **Improved Maintainability**

- When the underlying pnpm hoisting issue is resolved, the build will fail
- This prompts developers to remove the `@ts-expect-error` directive
- Prevents forgotten technical debt from lingering indefinitely

### 3. **Clear Intent**

- `@ts-expect-error` explicitly states "we expect this error and it's temporary"
- `@ts-ignore` simply says "ignore whatever error happens here"
- Better documentation of known issues and their expected resolution

## Technical Context

### Root Cause

The issue stems from duplicate Vite installations in `node_modules` caused by pnpm's hoisting
behavior. This creates incompatible Plugin types between different Vite instances.

### Current Status

- The configuration is structurally valid and works at runtime
- This is a known pnpm hoisting issue
- The change makes this technical debt visible rather than hidden

## Validation

- TypeScript compilation passes: ✅
- Vite configuration loads correctly: ✅
- Tests continue to run successfully: ✅

## Future Resolution

When the underlying pnpm hoisting issue is resolved (either through pnpm configuration changes or
dependency updates), the TypeScript compiler will fail on this line, prompting developers to:

1. Remove the `@ts-expect-error` directive
2. Verify the configuration works without the suppression
3. Clean up the technical debt

## Best Practices Applied

This change follows TypeScript best practices for managing known issues:

- Use `@ts-expect-error` for intentional, temporary suppressions
- Use `@ts-ignore` only for cases where you want to suppress all possible errors
- Document the reason for the suppression
- Make technical debt visible rather than hidden

---

_Documented: 2025-11-06_ _Task: TypeScript Error Handling Improvement_
