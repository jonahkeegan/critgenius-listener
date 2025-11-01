# Analysis of `waitForPreviewReady` Function Issues

## Function Location

`packages/client/tests/e2e/helpers/test-fixtures.ts` lines 76-92

## Current Implementation Analysis

### The Core Problem

The current `waitForPreviewReady` function has a critical flaw in its polling logic that leads to
inefficient and slow failure detection:

```typescript
async function waitForPreviewReady(url: string): Promise<void> {
  const deadline = Date.now() + PREVIEW_READY_TIMEOUT_MS;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        return; // Only exits early on 2xx status
      }
      lastError = new Error(`Preview responded with status ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(PREVIEW_READY_POLL_INTERVAL_MS); // Continues polling regardless of error type
  }

  // ... throws timeout error after full 30 seconds
}
```

## Issues Identified

### 1. **Inefficient Error Response Handling**

- **Problem**: When the server responds with HTTP errors (4xx/5xx), the function continues polling
  instead of failing immediately
- **Impact**: Wastes 30 seconds in CI when the server is in a definitively failed state
- **Example**: A 500 Internal Server Error indicates the server is running but broken - continuing
  to poll won't fix this

### 2. **No Distinction Between Transient and Non-Transient Errors**

- **Problem**: The function treats all non-OK responses the same way
- **Impact**: Legitimate failures (like misconfigured routes, missing files) take the full timeout
  to fail
- **HTTP Status Categories**:
  - **2xx (Success)**: Should exit immediately ✅
  - **3xx (Redirect)**: Generally indicate success in this context ✅
  - **4xx (Client Error)**: Usually non-transient (bad request, not found, unauthorized) ❌
  - **5xx (Server Error)**: Usually indicate server issues that won't resolve with polling ❌

### 3. **Poor CI Feedback Loop**

- **Problem**: Tests fail slowly, making debugging and iteration painful
- **Impact**: Developers wait unnecessarily for predictable failures
- **Example**: A 404 error (missing route) should fail immediately, not after 30 seconds of polling

## Recommended Solution

### Immediate Fail-Fast Strategy

```typescript
async function waitForPreviewReady(url: string): Promise<void> {
  const deadline = Date.now() + PREVIEW_READY_TIMEOUT_MS;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });

      if (response.ok || (response.status >= 300 && response.status < 400)) {
        return; // Success or redirect - server is ready
      }

      // Fail fast on non-transient errors
      if (response.status >= 400 && response.status < 500) {
        throw new Error(
          `Preview server configuration error (${response.status}): Server responded with client error - likely misconfigured route or missing resource`
        );
      }

      if (response.status >= 500) {
        throw new Error(
          `Preview server internal error (${response.status}): Server returned internal error - check server logs for details`
        );
      }

      // For any other status, log and continue polling
      lastError = new Error(`Preview responded with unexpected status ${response.status}`);
    } catch (error) {
      // Network errors (connection refused, timeouts) are transient - continue polling
      lastError = error;
    }

    await delay(PREVIEW_READY_POLL_INTERVAL_MS);
  }

  const reason = lastError instanceof Error ? lastError.message : 'unknown error';
  throw new Error(`Timed out waiting for preview server at ${url}: ${reason}`);
}
```

### Alternative: Configurable Error Handling

For more flexibility, consider making the error handling strategy configurable:

```typescript
interface WaitForPreviewOptions {
  failFastOnClientErrors?: boolean; // Default: true
  failFastOnServerErrors?: boolean; // Default: true
  retryableStatuses?: number[]; // Status codes that should be retried
}

async function waitForPreviewReady(
  url: string,
  options: WaitForPreviewOptions = {}
): Promise<void> {
  const {
    failFastOnClientErrors = true,
    failFastOnServerErrors = true,
    retryableStatuses = [],
  } = options;

  const deadline = Date.now() + PREVIEW_READY_TIMEOUT_MS;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });

      if (response.ok) {
        return; // 2xx - Success, exit immediately
      }

      // Check if this status should cause immediate failure
      if (failFastOnClientErrors && response.status >= 400 && response.status < 500) {
        throw new Error(
          `Preview server configuration error (${response.status}): ${response.statusText || 'Client error'}`
        );
      }

      if (failFastOnServerErrors && response.status >= 500) {
        throw new Error(
          `Preview server internal error (${response.status}): ${response.statusText || 'Server error'}`
        );
      }

      // If status is in retryable list or is a redirect, continue polling
      if (
        retryableStatuses.includes(response.status) ||
        (response.status >= 300 && response.status < 400)
      ) {
        lastError = new Error(`Preview responded with status ${response.status} (retrying)`);
      } else {
        // Unknown status, fail fast
        throw new Error(
          `Preview responded with unexpected status ${response.status}: ${response.statusText || 'Unknown error'}`
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('configuration error')) {
        throw error; // Re-throw configuration errors immediately
      }
      if (error instanceof Error && error.message.includes('internal error')) {
        throw error; // Re-throw server errors immediately
      }
      lastError = error; // Network/transient errors - continue polling
    }

    await delay(PREVIEW_READY_POLL_INTERVAL_MS);
  }

  const reason = lastError instanceof Error ? lastError.message : 'unknown error';
  throw new Error(`Timed out waiting for preview server at ${url}: ${reason}`);
}
```

## Benefits of Fail-Fast Approach

### 1. **Faster CI Feedback**

- Tests fail in seconds instead of 30 seconds for configuration issues
- Faster iteration cycles for developers

### 2. **Clearer Error Messages**

- Immediate context about what went wrong (configuration vs. server startup issues)
- Better debugging information

### 3. **Resource Efficiency**

- Reduces unnecessary polling requests
- Frees up test execution slots faster

### 4. **Better Error Categorization**

- Separates transient network issues from configuration problems
- Enables different handling strategies

## Implementation Priority

1. **High Priority**: Implement basic fail-fast logic for 4xx/5xx errors
2. **Medium Priority**: Add configurable options for different test scenarios
3. **Low Priority**: Add metrics/logging for monitoring error patterns

## Testing Considerations

When implementing the fix, consider adding tests for:

- Successful startup (2xx response)
- Configuration errors (4xx responses - should fail fast)
- Server errors (5xx responses - should fail fast)
- Network failures (connection refused - should retry)
- Edge cases (unexpected status codes)
