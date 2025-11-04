# Testing Utilities - API Reference Guide

**Version:** 1.1.0 **Last Updated:** 2025-11-04 **Target Audience:** Developers using
@critgenius/test-utils package **Status:** Complete

---

## Table of Contents

1. [Runtime Harness](#1-runtime-harness)
2. [Data Factories](#2-data-factories)
3. [Fixture Loader](#3-fixture-loader)
4. [Async Helpers and Mock Patterns](#4-async-helpers-and-mock-patterns)
5. [Custom Matchers](#5-custom-matchers)
6. [Resilience Testing Patterns](#6-resilience-testing-patterns)

---

## 1. Runtime Harness

The runtime harness provides deterministic test execution by controlling time, randomness, and
environment.

### 1.1 Installation

```typescript
import { installTestRuntime } from '@critgenius/test-utils/runtime';

describe('my test suite', () => {
  beforeAll(() => {
    installTestRuntime();
  });

  // Tests now run in deterministic environment
});
```

### 1.2 What it Does

1. **Fake Timers**: Replaces `setTimeout`, `setInterval`, `Date.now()` with controllable versions
2. **Seeded Random**: Seeds `Math.random()` for consistent random values
3. **UTC Timezone**: Forces `TZ=UTC` to eliminate timezone-dependent failures
4. **Global Polyfills**: Adds missing browser APIs in node environment

### 1.3 Realistic Example: Testing Audio Buffer Timestamps

```typescript
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { installTestRuntime } from '@critgenius/test-utils/runtime';
import { processAudioBuffer } from './audio-processor';

describe('audio buffer processor', () => {
  beforeAll(() => {
    installTestRuntime();
  });

  it('assigns consistent timestamps to audio chunks', () => {
    // GIVEN: Current time is controlled
    vi.setSystemTime(new Date('2025-01-11T10:00:00Z'));

    // WHEN: Processing audio buffer
    const chunks = processAudioBuffer(createMockAudioBuffer());

    // THEN: Timestamps are deterministic
    expect(chunks[0].timestamp).toBe(1736589600000); // Always same value
    expect(chunks[1].timestamp).toBe(1736589600100); // 100ms later
  });

  it('handles debounced operations consistently', () => {
    // GIVEN: Debounced function with 500ms delay
    const callback = vi.fn();
    const debounced = debounce(callback, 500);

    // WHEN: Calling multiple times rapidly
    debounced();
    debounced();
    debounced();

    // THEN: Callback not yet called
    expect(callback).not.toHaveBeenCalled();

    // WHEN: Advancing time by 500ms
    vi.advanceTimersByTime(500);

    // THEN: Callback called exactly once
    expect(callback).toHaveBeenCalledOnce();
  });
});
```

---

## 2. Data Factories

Factories generate realistic test data with consistent IDs and structure.

### 2.1 Available Factories

```typescript
import {
  createTestSession,
  createTestUser,
  createTestAudioChunk,
  createTestTranscript,
  createTestVoiceProfile,
  createMockTranscriptSegment,
} from '@critgenius/test-utils/factories';
```

### 2.2 Realistic Example: D&D Session Testing

```typescript
import { describe, it, expect } from 'vitest';
import { createTestSession, createTestUser } from '@critgenius/test-utils/factories';
import { SessionManager } from './session-manager';

describe('session manager', () => {
  it('creates session with participants and character mappings', () => {
    // GIVEN: D&D session with three players
    const dm = createTestUser({
      name: 'GameMaster',
      role: 'dm',
    });

    const players = [
      createTestUser({ name: 'Alice', characterName: 'Elara the Ranger' }),
      createTestUser({ name: 'Bob', characterName: 'Thorin Stonefist' }),
      createTestUser({ name: 'Carol', characterName: 'Mystara' }),
    ];

    const session = createTestSession({
      id: 'session-dnd-001',
      dm,
      participants: players,
      settings: {
        recordingEnabled: true,
        transcriptionEnabled: true,
        characterMappingEnabled: true,
      },
    });

    // WHEN: Starting the session
    const manager = new SessionManager();
    manager.startSession(session);

    // THEN: All participants are registered with character mappings
    expect(manager.getActiveSession()).toMatchObject({
      id: 'session-dnd-001',
      participants: expect.arrayContaining([
        expect.objectContaining({
          name: 'Alice',
          characterName: 'Elara the Ranger',
        }),
      ]),
      status: 'active',
    });
  });
});
```

---

## 3. Fixture Loader

The fixture system provides cached, type-safe access to test data files.

### 3.1 Loading Fixtures

```typescript
import {
  loadTranscriptFixture,
  loadAudioFixture,
  loadJsonFixture,
} from '@critgenius/test-utils/fixtures';

// Load pre-recorded D&D transcript
const transcript = await loadTranscriptFixture('dnd-session-01.json');

// Load audio sample
const audioBuffer = await loadAudioFixture('sample-dialogue.wav');

// Load custom JSON fixture
const config = await loadJsonFixture('test-config.json');
```

### 3.2 Realistic Example: Testing Transcript Parser

```typescript
import { describe, it, expect } from 'vitest';
import { loadTranscriptFixture } from '@critgenius/test-utils/fixtures';
import { parseTranscript } from './transcript-parser';

describe('transcript parser', () => {
  it('parses real D&D session transcript with speaker identification', async () => {
    // GIVEN: Actual transcript from recorded D&D session
    const rawTranscript = await loadTranscriptFixture('dnd-session-combat.json');

    // WHEN: Parsing the transcript
    const parsed = parseTranscript(rawTranscript);

    // THEN: Speaker turns are correctly identified
    expect(parsed.turns).toHaveLength(12);
    expect(parsed.turns[0]).toMatchObject({
      speaker: 'SPEAKER_0',
      text: 'I ready my bow and aim at the goblin',
      confidence: expect.any(Number),
    });

    // AND: Combat-specific terminology is preserved
    const combatTerms = ['goblin', 'bow', 'attack', 'damage', 'initiative'];
    const transcriptText = parsed.turns.map(t => t.text).join(' ');

    for (const term of combatTerms) {
      expect(transcriptText.toLowerCase()).toContain(term);
    }
  });
});
```

---

## 4. Async Helpers and Mock Patterns

Utilities for managing asynchronous operations and creating test doubles.

### 4.1 Wait For Condition

```typescript
import { waitForCondition } from '@critgenius/test-utils/async';

it('waits for async state change', async () => {
  const session = startSession();

  // Wait up to 3 seconds for session to become active
  await waitForCondition(() => session.status === 'active', { timeoutMs: 3000, intervalMs: 100 });

  expect(session.status).toBe('active');
});
```

### 4.2 Create Deferred Promise

```typescript
import { createDeferredPromise } from '@critgenius/test-utils/async';

it('controls promise resolution timing', async () => {
  const { promise, resolve, reject } = createDeferredPromise<string>();

  // Start async operation
  const resultPromise = processWithCallback(async () => {
    return await promise;
  });

  // Control when promise resolves
  resolve('test-result');

  const result = await resultPromise;
  expect(result).toBe('test-result');
});
```

### 4.3 Realistic Example: Testing WebSocket Reconnection

```typescript
import { describe, it, expect, vi } from 'vitest';
import { waitForCondition, createDeferredPromise } from '@critgenius/test-utils/async';
import { WebSocketClient } from './websocket-client';

describe('websocket reconnection', () => {
  it('reconnects after connection loss', async () => {
    // GIVEN: WebSocket client with reconnection logic
    const client = new WebSocketClient('ws://localhost:3000');
    const { promise: connectionPromise, resolve: resolveConnection } = createDeferredPromise();

    client.on('connected', resolveConnection);

    // WHEN: Connection is established
    await client.connect();
    await connectionPromise;

    expect(client.isConnected()).toBe(true);

    // AND: Connection is lost
    client.simulateDisconnection();

    expect(client.isConnected()).toBe(false);

    // THEN: Client reconnects automatically within 5 seconds
    await waitForCondition(() => client.isConnected(), { timeoutMs: 5000, intervalMs: 200 });

    expect(client.isConnected()).toBe(true);
    expect(client.getReconnectionAttempts()).toBeGreaterThan(0);
  });
});
```

---

## 5. Custom Matchers

Domain-specific assertions for transcript and audio testing.

### 5.1 Available Matchers

```typescript
import { registerMatchers } from '@critgenius/test-utils/matchers';

beforeAll(() => {
  registerMatchers();
});

// Use custom matchers
expect(transcript).toBeValidTranscript();
expect(audioChunk).toBeValidAudioChunk();
expect(session).toBeValidSession();
expect(result).toMatchSpeakerProfile(expectedProfile);
```

### 5.2 Realistic Example: Transcript Validation

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { registerMatchers } from '@critgenius/test-utils/matchers';
import { normalizeTranscript } from './normalizer';

describe('transcript validation', () => {
  beforeAll(() => {
    registerMatchers();
  });

  it('produces valid transcript with all required fields', () => {
    const raw = createMockTranscriptSegment({
      text: 'I cast fireball at the dragon',
      speaker: 'SPEAKER_0',
      confidence: 0.94,
    });

    const normalized = normalizeTranscript(raw, {});

    // Custom matcher validates all required fields
    expect(normalized).toBeValidTranscript();

    // Equivalent to:
    // - has sessionId (string)
    // - has text (non-empty string)
    // - has isFinal (boolean)
    // - has confidence (0-1 number)
    // - has speaker object with id
    // - has timestamp (number)
  });

  it('matches expected speaker profile', () => {
    const result = identifySpeaker(audioChunk, profiles);

    expect(result).toMatchSpeakerProfile({
      speakerId: 'SPEAKER_0',
      characterName: 'Elara the Ranger',
      confidence: expect.toBeGreaterThan(0.9),
    });
  });
});
```

---

## 6. Resilience Testing Patterns

Test failure scenarios and recovery mechanisms with the resilience scenario builder.

### 6.1 Creating Resilience Scenarios

```typescript
import { createResilienceScenarioBuilder } from '@critgenius/test-utils/resilience';

const scenario = createResilienceScenarioBuilder()
  .withLatency({ minMs: 100, maxMs: 500 })
  .withErrorRate(0.1) // 10% error rate
  .withCircuitBreakerTransition({
    from: 'closed',
    to: 'open',
    after: 5,
  })
  .build();
```

### 6.2 Realistic Example: Testing Transcript Service Resilience

```typescript
import { describe, it, expect } from 'vitest';
import { createResilienceScenarioBuilder } from '@critgenius/test-utils/resilience';
import { TranscriptService } from './transcript-service';

describe('transcript service resilience', () => {
  it('handles AssemblyAI intermittent failures gracefully', async () => {
    // GIVEN: Scenario with 20% error rate and latency
    const scenario = createResilienceScenarioBuilder()
      .withErrorRate(0.2)
      .withLatency({ minMs: 50, maxMs: 200 })
      .build();

    const service = new TranscriptService();

    // Apply scenario to mock AssemblyAI connector
    const connector = service.getAssemblyAIConnector();
    scenario.applyToConnector(connector);

    // WHEN: Processing 100 transcript requests
    const results = [];
    for (let i = 0; i < 100; i++) {
      try {
        const result = await service.transcribe(createMockAudioChunk());
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error });
      }
    }

    // THEN: Service handles failures gracefully
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    expect(successful).toBeGreaterThan(70); // At least 70% success despite 20% error rate
    expect(failed).toBeLessThan(30);

    // AND: Metrics are recorded
    const metrics = scenario.getMetrics();
    expect(metrics.totalRequests).toBe(100);
    expect(metrics.errors).toBeGreaterThan(0);
    expect(metrics.retriesAttempted).toBeGreaterThan(0);
  });

  it('triggers circuit breaker after threshold failures', async () => {
    // GIVEN: Scenario that transitions circuit breaker to open after 5 failures
    const scenario = createResilienceScenarioBuilder()
      .withErrorRate(1.0) // 100% errors to force circuit breaker
      .withCircuitBreakerTransition({
        from: 'closed',
        to: 'open',
        after: 5,
      })
      .build();

    const service = new TranscriptService();
    scenario.applyToConnector(service.getAssemblyAIConnector());

    // WHEN: Making requests that all fail
    for (let i = 0; i < 10; i++) {
      try {
        await service.transcribe(createMockAudioChunk());
      } catch (error) {
        // Expected failures
      }
    }

    // THEN: Circuit breaker opened after threshold
    const metrics = scenario.getMetrics();
    expect(metrics.circuitBreakerState).toBe('open');
    expect(metrics.circuitBreakerTransitions).toHaveLength(1);
    expect(metrics.circuitBreakerTransitions[0]).toMatchObject({
      from: 'closed',
      to: 'open',
      reason: 'error_threshold_exceeded',
    });
  });
});
```

---

## Related Documentation

- [Testing Overview](./testing-overview.md) - Testing philosophy and architecture
- [Testing Workflows](./testing-workflows.md) - Practical getting-started guides
- [Testing Infrastructure](./testing-infrastructure.md) - Technical configuration details
- [Integration Testing Handbook](./integration-testing-handbook.md) - Integration test patterns
- [Performance Testing Guide](./performance-testing-guide.md) - Performance testing procedures
- [Testing Validation](./testing-validation.md) - Quality gates and CI/CD integration
- [Integration Testing Standards](./integration-testing-standards.md) - Integration test
  requirements
- [Integration Test Patterns](./integration-test-patterns.md) - Pattern catalog
- [Test Utils README](../packages/test-utils/README.md) - Test utilities overview

---

**End of Testing Utilities Guide**
