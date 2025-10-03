# @critgenius/test-utils

Shared testing utilities for the CritGenius Listener monorepo. The package bundles a deterministic
Vitest runtime harness, async helpers, domain-focused data factories, fixture loaders, advanced
resilience testing patterns, and domain-specific custom matchers.

## Features

- **Runtime Harness** – install deterministic clocks, seeded randomness, and global polyfills with a
  single call to `installTestRuntime()`.
- **Async & Mock Helpers** – utilities for polling assertions, managing fake timers, creating
  deferred promises, and mocking Socket.IO style event emitters.
- **Domain Factories** – generate users, sessions, transcripts, and audio chunks with consistent
  identifiers for scenario-driven tests.
- **Fixture Loader** – cached loader for JSON/text/binary fixtures plus curated audio/transcript
  samples.
- **Resilience Patterns** – simulate circuit breaker transitions, retry behaviour, and
  infrastructure error scenarios.
- **Custom Matchers** – extend Vitest’s `expect` with D&D transcription assertions.

## Getting Started

```ts
// tests/setup.ts
import { installTestRuntime } from '@critgenius/test-utils/runtime';
import { registerMatchers } from '@critgenius/test-utils/matchers';

installTestRuntime();
registerMatchers();
```

```ts
import { createTestSession, waitForCondition } from '@critgenius/test-utils';

const session = createTestSession();
await waitForCondition(() => session.participants.length > 0);
```

## Fixture Usage

```ts
import { loadTranscriptFixture } from '@critgenius/test-utils/fixtures';

const transcript = await loadTranscriptFixture();
expect(transcript).toBeValidTranscript();
```

## Development

- `pnpm --filter @critgenius/test-utils test`
- `pnpm --filter @critgenius/test-utils lint`
- `pnpm --filter @critgenius/test-utils build`

All utilities are designed for strict TypeScript environments and avoid leaking secrets or
configuration values.
