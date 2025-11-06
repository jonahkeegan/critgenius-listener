# JSDOM Canvas Limitation in Accessibility Testing

## Problem Summary

Axe-core's `color-contrast` rule requires canvas API support to perform icon ligature detection.
When testing complex components (e.g., Material UI) with JSDOM, tests timeout because JSDOM's canvas
implementation is incomplete.

## Root Cause Analysis

### Investigation Timeline

Through extensive diagnostic testing with property descriptors, function name tracking, and
execution flow logging, we identified the following issues:

1. **JSDOM Internal Architecture**
   - JSDOM uses an internal/external wrapper system
   - Error stack shows `HTMLCanvasElementImpl.getContext` being called
   - Public `HTMLCanvasElement.prototype` stubs don't intercept internal implementation calls

2. **Module Load Timing**
   - axe-core is imported at module level in `packages/test-utils/src/accessibility/helpers.ts`
   - It captures references to DOM constructors before per-test stubs exist
   - Multiple workspace execution contexts cause function name mangling (`getContextStub2`)

3. **Canvas Package Issues**
   - Installing `canvas` npm package provided real canvas support
   - However, it caused rendering operations to hang indefinitely
   - Tests timed out even with extended timeouts (15+ seconds)

### Technical Details

```typescript
// Error stack trace shows internal implementation being called:
Error: Not implemented: HTMLCanvasElement.prototype.getContext
    at HTMLCanvasElementImpl.getContext  // <-- Internal implementation
    at axe-core's icon ligature detection code
```

The stub was correctly installed on `HTMLCanvasElement.prototype.getContext` (verified via property
descriptors), but axe-core's internal code path bypassed it by calling JSDOM's internal
`HTMLCanvasElementImpl` directly.

## Current Solution

### Documented Limitation

The test file now documents this known limitation:

```typescript
/**
 * Known Limitation: JSDOM's canvas implementation is incomplete and causes axe-core's
 * color-contrast rule to hang when testing complex components (e.g., Material UI) that trigger
 * canvas-dependent icon ligature detection. The 'canvas' npm package was tested but caused
 * rendering hangs. This is a known JSDOM architecture issue where the internal implementation
 * layer cannot be properly stubbed. Tests will timeout on components with canvas-dependent
 * accessibility checks until JSDOM's canvas support improves.
 */
```

### Test Behavior

- ✅ Simple HTML elements: Tests pass
- ✅ Configuration tests: Pass
- ✅ Audio-specific tests: Pass
- ⏭️ Complex components with icon ligatures: Tests skipped in Vitest (see
  `tests/infrastructure/vitest-axe-integration.test.ts`)

## Attempted Solutions

### 1. Custom Canvas Stub (Failed)

- Installed stub on `HTMLCanvasElement.prototype.getContext`
- Verified correct installation via property descriptors
- Never invoked - axe bypassed via internal implementation

### 2. Canvas Package Installation (Failed)

- Installed `canvas@3.2.0` npm package
- Provided real canvas rendering support
- Caused indefinite hangs during component rendering
- Tests timed out even with 15000ms timeout

### 3. Timing Adjustments (Failed)

- Tried installing stub before JSDOM parsing (`beforeParse` hook)
- Tried installing after global binding
- Module-level axe-core import captured references too early

## Recommendations

### Short Term

1. Skip Material UI component tests that trigger canvas operations in Vitest workspaces
2. Test these components with Playwright/browser-based tests instead
3. Focus vitest-axe tests on simpler components and HTML elements

### Long Term

1. Monitor JSDOM canvas support improvements
2. Consider migrating to browser-based accessibility testing for complex components
3. Evaluate alternative testing strategies (e.g., Percy visual regression with accessibility checks)

## Files Modified

- `tests/infrastructure/vitest-axe-integration.test.ts` - Added limitation documentation
- `package.json` - Canvas package installed then removed
- Various diagnostic logging added and cleaned up

## Related Issues

- JSDOM Issue: https://github.com/jsdom/jsdom/issues/1782
- Axe-core canvas dependency in color-contrast rule
- Vitest workspace isolation causing function name mangling

## Date

Investigation completed: 2025-11-05

## Contributors

Investigation and documentation by Cline AI assistant
