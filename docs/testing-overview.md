# Testing Overview & Philosophy

**Version:** 1.1.0 **Last Updated:** 2025-11-04 **Target Audience:** All developers, especially new
team members **Status:** Complete

---

## Table of Contents

1. [Testing Philosophy & Architecture](#1-testing-philosophy--architecture)
2. [Testing Best Practices](#2-testing-best-practices)
3. [Troubleshooting & Common Issues](#3-troubleshooting--common-issues)

---

## 1. Testing Philosophy & Architecture

### 1.1 Testing Pyramid for CritGenius Listener

CritGenius Listener follows a pragmatic testing pyramid optimized for real-time audio processing and
transcription workflows:

```
                    ▲
                   ╱ ╲
                  ╱ E2E╲          ~10% - Browser-based microphone access
                 ╱───────╲                Full user journey validation
                ╱         ╲
               ╱Integration╲      ~20% - Socket.IO + AssemblyAI flows
              ╱─────────────╲            Cross-package workflows
             ╱               ╲           Service communication
            ╱      Unit       ╲    ~70% - Business logic
           ╱───────────────────╲         Data transformations
          ╱                     ╲        Pure functions
         ╱_______________________╲       Isolated components
```

**Distribution Rationale:**

- **Unit Tests (70%)**: Fast feedback on business logic, transcript normalization, speaker mapping
  algorithms, and data transformations. These tests use the deterministic runtime from
  `@critgenius/test-utils` to ensure consistent results.

- **Integration Tests (20%)**: Validate real-time communication patterns between client, server, and
  external services. Focus on Socket.IO event flows, AssemblyAI transcript streaming, and
  cross-package orchestration. Mock external services to maintain speed and privacy.

- **E2E Tests (10%)**: Browser-based validation of Web Audio API microphone access, HTTPS
  requirements, and complete user journeys. These are the slowest and most brittle, so we minimize
  them while ensuring critical paths are covered.

### 1.2 Quality Gates and Coverage Requirements

All code must meet the tiered coverage thresholds before merging:

| Metric      | Shared Tier | Client / Server Tier | Workspace / Test-Utils Tier | Enforcement         | Rationale                                     |
| ----------- | ----------- | -------------------- | --------------------------- | ------------------- | --------------------------------------------- |
| Statement   | 75%         | 50%                  | 30%                         | Vitest coverage     | Ensures comprehensive test coverage           |
| Branch      | 75%         | 50%                  | 30%                         | Vitest coverage     | Validates all code paths including edge cases |
| Function    | 75%         | 50%                  | 30%                         | Vitest coverage     | Confirms all functions are tested             |
| Line        | 75%         | 50%                  | 30%                         | Vitest coverage     | Catches untested code                         |
| Performance | <500ms      | <500ms               | <500ms                      | Custom matchers     | Real-time processing requirement              |
| Regression  | <10%        | <10%                 | <10%                        | Baseline comparison | Prevents performance degradation              |

**Enforcement Points:**

1. **Pre-commit**: `pnpm precommit:validate` runs linting, type-checking, and fast unit tests
2. **CI Pipeline**: Full test suite including integration and performance tests
3. **PR Review**: Manual review of test quality and coverage reports

**Recommended Reading:** Pair this guide with `docs/coverage-workflow-guide.md` for daily coverage
routines and `docs/coverage-troubleshooting.md` when coverage thresholds regress.

### 1.3 Test Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CritGenius Listener                         │
│                        Test Ecosystem                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   @critgenius │    │   @critgenius │    │   @critgenius │
│     /client   │    │     /server   │    │     /shared   │
│               │    │               │    │               │
│ • Unit tests  │    │ • Unit tests  │    │ • Unit tests  │
│ • Integration │    │ • Integration │    │ • Integration │
│ • E2E (Playwright)│ │ • Perf tests │    │               │
└───────┬───────┘    └───────┬───────┘    └───────┬───────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │  @critgenius/      │
                  │   test-utils       │
                  │                    │
                  │ Shared Foundation  │
                  └────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Runtime    │  │ Integration  │  │ Performance  │
│   Harness    │  │   Helpers    │  │   Utilities  │
│              │  │              │  │              │
│ • Fake timers│  │ • Socket.IO  │  │ • Latency    │
│ • Seeded RNG │  │ • AssemblyAI │  │   benchmarks │
│ • UTC clock  │  │ • Lifecycle  │  │ • Regression │
│ • Polyfills  │  │ • Mocks      │  │   detection  │
└──────────────┘  └──────────────┘  └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │  Shared Vitest     │
                  │   Configuration    │
                  │   Factory          │
                  │                    │
                  │ vitest.shared.     │
                  │   config.ts        │
                  └────────────────────┘
```

**Key Architectural Decisions:**

1. **Shared Test Utilities Package**: Centralizes testing infrastructure to ensure consistency and
   reusability across all packages.

2. **Deterministic Runtime**: All tests run with controlled time, random number generation, and
   timezone to eliminate flakiness.

3. **Privacy-First Mocking**: External API calls (AssemblyAI) are always mocked to prevent data
   leakage and ensure fast, deterministic tests.

4. **Monorepo-Aware Configuration**: Path aliases, TypeScript resolution, and coverage thresholds
   are managed centrally but customizable per package.

### 1.4 Real-World Example: Transcript Processing Through All Test Levels

Let's trace how a transcript normalization feature flows through each test level:

**Business Requirement**: Normalize AssemblyAI transcripts to include D&D-specific character mapping
and confidence scoring.

#### Unit Test Layer (packages/shared/src/transcript/normalizer.test.ts)

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { installTestRuntime } from '@critgenius/test-utils/runtime';
import { createMockTranscriptSegment } from '@critgenius/test-utils/factories';
import { normalizeTranscript } from './normalizer';

describe('transcript normalizer', () => {
  beforeAll(() => {
    installTestRuntime(); // Deterministic runtime
  });

  it('normalizes AssemblyAI transcript with character mapping', () => {
    // GIVEN: Raw AssemblyAI transcript segment
    const rawSegment = createMockTranscriptSegment({
      text: 'I search for traps in the corridor',
      confidence: 0.95,
      speaker: 'SPEAKER_0',
      words: [
        { text: 'I', start: 1000, end: 1100, confidence: 0.98 },
        { text: 'search', start: 1100, end: 1400, confidence: 0.96 },
        // ... more words
      ],
    });

    const characterMapping = {
      SPEAKER_0: { characterName: 'Elara the Ranger', playerName: 'Alice' },
    };

    // WHEN: Normalizing the transcript
    const normalized = normalizeTranscript(rawSegment, characterMapping);

    // THEN: Output includes character mapping and preserves confidence
    expect(normalized).toEqual({
      sessionId: expect.any(String),
      text: 'I search for traps in the corridor',
      isFinal: true,
      confidence: 0.95,
      speaker: {
        id: 'SPEAKER_0',
        characterName: 'Elara the Ranger',
        playerName: 'Alice',
      },
      words: expect.arrayContaining([
        expect.objectContaining({
          text: 'I',
          start: 1000,
          end: 1100,
          confidence: 0.98,
        }),
      ]),
      timestamp: expect.any(Number),
    });
  });

  it('handles missing character mapping gracefully', () => {
    const rawSegment = createMockTranscriptSegment({
      text: 'Unknown speaker',
      speaker: 'SPEAKER_99',
    });

    const normalized = normalizeTranscript(rawSegment, {});

    expect(normalized.speaker).toEqual({
      id: 'SPEAKER_99',
      characterName: null,
      playerName: null,
    });
  });

  it('filters out low-confidence words', () => {
    const rawSegment = createMockTranscriptSegment({
      text: 'Hello world test',
      words: [
        { text: 'Hello', confidence: 0.95 },
        { text: 'world', confidence: 0.45 }, // Low confidence
        { text: 'test', confidence: 0.92 },
      ],
    });

    const normalized = normalizeTranscript(rawSegment, {});

    expect(normalized.words).toHaveLength(2);
    expect(normalized.words.map(w => w.text)).toEqual(['Hello', 'test']);
  });
});
```

**Unit Test Benefits**: Fast (runs in ~50ms), isolated, tests business logic thoroughly without
external dependencies.

#### Integration Test Layer (packages/server/tests/integration/transcript-streaming.integration.test.ts)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  IntegrationTestHarness,
  createIntegrationServer,
  createMockAssemblyAIScenario,
  waitForSocketEventWithTimeout,
} from '@critgenius/test-utils/integration';
import { createTestSession } from '@critgenius/test-utils/factories';
import { io as ioClient } from 'socket.io-client';

describe('transcript streaming integration', () => {
  let harness: IntegrationTestHarness;
  let server: ReturnType<typeof createIntegrationServer>;
  let clientSocket: ReturnType<typeof ioClient>;

  beforeAll(async () => {
    // GIVEN: Integration test environment with mocked AssemblyAI
    harness = new IntegrationTestHarness({
      workflowName: 'transcript-streaming',
      preset: 'localDevelopment',
    });

    server = await createIntegrationServer(harness);
    clientSocket = ioClient(`http://localhost:${server.port}`);

    await waitForSocketEventWithTimeout(clientSocket, 'connect', {
      timeoutMs: 2000,
    });
  });

  afterAll(async () => {
    clientSocket.close();
    await harness.teardown();
  });

  it('streams normalized transcripts from AssemblyAI to client', async () => {
    // GIVEN: A D&D session with character mappings
    const session = createTestSession({
      participants: [{ name: 'Alice', characterName: 'Elara the Ranger' }],
    });

    // AND: Mock AssemblyAI scenario with realistic D&D dialogue
    const mockScenario = createMockAssemblyAIScenario({
      events: [
        {
          text: 'I search',
          speaker: 'SPEAKER_0',
          isFinal: false,
          confidence: 0.85,
        },
        {
          text: 'I search for traps',
          speaker: 'SPEAKER_0',
          isFinal: true,
          confidence: 0.95,
        },
      ],
    });

    // WHEN: Client initiates transcription session
    clientSocket.emit('session:start', {
      sessionId: session.id,
      characterMappings: {
        SPEAKER_0: {
          characterName: 'Elara the Ranger',
          playerName: 'Alice',
        },
      },
    });

    // AND: Server receives AssemblyAI events
    await mockScenario.simulateStreamingEvents(server.assemblyAIConnector);

    // THEN: Client receives normalized transcripts with character mapping
    const partialTranscript = await waitForSocketEventWithTimeout(
      clientSocket,
      'transcript:partial',
      { timeoutMs: 3000 }
    );

    expect(partialTranscript).toMatchObject({
      sessionId: session.id,
      text: 'I search',
      isFinal: false,
      confidence: 0.85,
      speaker: {
        id: 'SPEAKER_0',
        characterName: 'Elara the Ranger',
        playerName: 'Alice',
      },
    });

    const finalTranscript = await waitForSocketEventWithTimeout(clientSocket, 'transcript:final', {
      timeoutMs: 3000,
    });

    expect(finalTranscript).toMatchObject({
      sessionId: session.id,
      text: 'I search for traps',
      isFinal: true,
      confidence: 0.95,
      speaker: {
        id: 'SPEAKER_0',
        characterName: 'Elara the Ranger',
        playerName: 'Alice',
      },
    });
  });
});
```

**Integration Test Benefits**: Validates Socket.IO communication, AssemblyAI integration, and
cross-package coordination without hitting real APIs. Runs in ~2-3 seconds.

#### E2E Test Layer (packages/client/tests/e2e/microphone-access.e2e.test.ts)

```typescript
import { test, expect } from '@playwright/test';

test.describe('microphone access in HTTPS context', () => {
  test('grants microphone permission and captures audio', async ({ page, context }) => {
    // GIVEN: Browser with microphone permission granted
    await context.grantPermissions(['microphone']);

    // WHEN: User navigates to audio capture page
    await page.goto('https://localhost:5173/capture');

    // AND: Clicks start recording button
    await page.click('[data-testid="start-recording"]');

    // THEN: Microphone access is granted
    await expect(page.locator('[data-testid="recording-status"]')).toHaveText('Recording...');

    // AND: Audio visualizer shows activity
    await expect(page.locator('[data-testid="audio-visualizer"]')).toBeVisible();

    // AND: Volume meter responds to audio input
    const volumeLevel = await page
      .locator('[data-testid="volume-meter"]')
      .getAttribute('data-volume');

    expect(Number(volumeLevel)).toBeGreaterThan(0);

    // WHEN: User stops recording
    await page.click('[data-testid="stop-recording"]');

    // THEN: Recording stops cleanly
    await expect(page.locator('[data-testid="recording-status"]')).toHaveText('Stopped');
  });
});
```

**E2E Test Benefits**: Validates actual browser behavior, Web Audio API, and HTTPS requirements.
Runs in ~10-15 seconds. Brittle and slow, so reserved for critical user journeys only.

**Summary**: By testing at multiple levels, we ensure the transcript normalization feature works
correctly in isolation (unit), integrates properly with real-time communication (integration), and
functions in the actual browser environment (E2E).

---

## 2. Testing Best Practices

### 2.1 Test Organization and Naming

**File Naming:**

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`
- Performance tests: `*.perf.test.ts`

**Test Naming Pattern:**

```typescript
describe('ComponentName or FeatureName', () => {
  describe('methodName or scenario', () => {
    it('describes expected behavior in present tense', () => {
      // Test implementation
    });
  });
});
```

**Good Examples:**

```typescript
describe('transcript normalizer', () => {
  it('normalizes AssemblyAI transcript with character mapping', () => {});
  it('handles missing character mapping gracefully', () => {});
  it('filters out low-confidence words', () => {});
});
```

### 2.2 Deterministic Test Design

**Always use deterministic runtime:**

```typescript
beforeAll(() => {
  installTestRuntime(); // Seed RNG, fake timers, UTC timezone
});
```

**Control time in tests:**

```typescript
it('processes time-sensitive operations correctly', () => {
  vi.setSystemTime(new Date('2025-01-11T10:00:00Z'));

  const result = timestampGenerator.generate();

  expect(result).toBe(1736589600000); // Deterministic
});
```

**Avoid real delays:**

```typescript
// BAD: Real time delay
await new Promise(resolve => setTimeout(resolve, 1000));

// GOOD: Advance fake timers
vi.advanceTimersByTime(1000);
```

### 2.3 Privacy-First Testing Principles

**Never use real API keys or data:**

```typescript
// BAD
const apiKey = process.env.ASSEMBLYAI_API_KEY;
const result = await realAssemblyAI.transcribe(audio);

// GOOD
const mockScenario = createMockAssemblyAIScenario({...});
const result = await mockConnector.transcribe(audio);
```

**Sanitize logs:**

```typescript
// BAD
console.log('API key:', apiKey);

// GOOD
console.log('API key configured:', !!apiKey);
```

### 2.4 Error Scenario Coverage

**Test failure paths explicitly:**

```typescript
it('handles network errors gracefully', async () => {
  const scenario = createResilienceScenarioBuilder().withErrorRate(1.0).build();

  scenario.applyToConnector(connector);

  await expect(service.transcribe(audio)).rejects.toThrow('Network error');
});
```

### 2.5 Test Maintenance Guidelines

**Keep tests DRY but not cryptic:**

```typescript
// Helper function for common setup
function setupTranscriptionTest() {
  const session = createTestSession({...});
  const mockScenario = createMockAssemblyAIScenario({...});
  return { session, mockScenario };
}

// Use in tests
it('transcribes audio', async () => {
  const { session, mockScenario } = setupTranscriptionTest();
  // Test specific logic here
});
```

**Update tests when refactoring:**

- Tests are documentation - keep them in sync with code
- If test becomes complex, consider if code needs refactoring
- Delete obsolete tests immediately

---

## 3. Troubleshooting & Common Issues

### 3.1 Test Timeouts

**Symptoms:**

```
Error: Test timed out after 5000ms
```

**Solutions:**

1. **Increase timeout for specific test:**

```typescript
it('long-running operation', async () => {
  // Test implementation
}, 30000); // 30 second timeout
```

2. **Check for missing await:**

```typescript
// BAD
it('async test', () => {
  asyncOperation(); // Missing await
});

// GOOD
it('async test', async () => {
  await asyncOperation();
});
```

3. **Use proper event waiting:**

```typescript
// BAD - might miss event
let received = false;
socket.on('event', () => {
  received = true;
});
await new Promise(resolve => setTimeout(resolve, 1000));

// GOOD - explicit timeout
const data = await waitForSocketEventWithTimeout(socket, 'event', { timeoutMs: 2000 });
```

### 3.2 Flaky Tests

**Symptoms:** Tests pass sometimes, fail randomly.

**Common Causes & Fixes:**

1. **Race conditions:**

```typescript
// BAD
socket.emit('request');
const response = await waitForEvent(socket, 'response');

// GOOD - ensure order
const responsePromise = waitForEvent(socket, 'response');
socket.emit('request');
const response = await responsePromise;
```

2. **Non-deterministic random values:**

```typescript
// BAD
const id = Math.random().toString();

// GOOD
beforeAll(() => {
  installTestRuntime(); // Seeds Math.random()
});
```

3. **Timezone issues:**

```typescript
// BAD
const date = new Date();

// GOOD
beforeAll(() => {
  installTestRuntime(); // Forces UTC
});
```

### 3.3 Mock Not Being Called

**Symptoms:**

```
Expected mock to be called but it was not
```

**Solutions:**

1. **Check event name spelling:**

```typescript
// Event emitted: 'transcript:partial'
// Listening for: 'transcript:parital' ❌
```

2. **Verify mock setup order:**

```typescript
// BAD
const spy = vi.spyOn(obj, 'method');
obj.method(); // Called before spy setup

// GOOD
const spy = vi.spyOn(obj, 'method');
await nextTick();
obj.method();
```

3. **Check mock scope:**

```typescript
// BAD - mock in wrong scope
beforeEach(() => {
  vi.spyOn(service, 'method');
});

it('test', () => {
  service.method(); // Uses original, not spy
});

// GOOD
it('test', () => {
  const spy = vi.spyOn(service, 'method');
  service.method(); // Uses spy
  expect(spy).toHaveBeenCalled();
});
```

### 3.4 Path Resolution Failures

**Symptoms:**

```
Cannot find module '@critgenius/shared/transcript'
```

**Solutions:**

1. **Enable path debugging:**

```bash
DEBUG_VITEST_ALIASES=true pnpm test
```

2. **Check tsconfig.json paths:**

```json
{
  "compilerOptions": {
    "paths": {
      "@critgenius/shared/*": ["../shared/src/*"]
    }
  }
}
```

3. **Verify shared config usage:**

```typescript
// Must use assertUsesSharedConfig
export default defineConfig(
  assertUsesSharedConfig(createVitestConfig({...}))
);
```

### 3.5 Coverage Threshold Failures

**Symptoms:**

```
ERROR: Coverage for statements (88%) does not meet threshold (90%)
```

**Solutions:**

1. **Identify uncovered code:**

```bash
pnpm test --coverage
open coverage/index.html
```

2. **Add missing test cases:**

```typescript
// Cover error paths
it('handles error condition', () => {
  expect(() => functionThatThrows()).toThrow();
});
```

3. **Exclude legitimately untestable code:**

```typescript
coverageOverrides: {
  exclude: ['**/generated/**', '**/legacy/**'];
}
```

---

## Related Documentation

- [Testing Workflows](./testing-workflows.md) - Practical getting-started guides
- [Testing Infrastructure](./testing-infrastructure.md) - Technical configuration details
- [Testing Utilities](./testing-utilities.md) - Test utilities API reference
- [Integration Testing Handbook](./integration-testing-handbook.md) - Integration test patterns
- [Performance Testing Guide](./performance-testing-guide.md) - Performance testing procedures
- [Testing Validation](./testing-validation.md) - Quality gates and CI/CD integration
- [Testing Standards](./testing-standards.md) - File naming and configuration standards
- [Coverage Workflow Guide](./coverage-workflow-guide.md) - Daily coverage routines
- [Coverage Troubleshooting](./coverage-troubleshooting.md) - Coverage threshold issues
- [Pragmatic Infrastructure Testing Guide](./pragmatic-infrastructure-testing-guide.md) -
  Infrastructure testing decisions
- [Validation Test Decision Matrix](./validation-test-decision-matrix.md) - Quick testing decisions

---

**End of Testing Overview & Philosophy Guide**
