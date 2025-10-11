# Comprehensive Testing Guide

**Version:** 1.0.0  
**Last Updated:** 2025-01-11  
**Target Audience:** Expert developers familiar with testing concepts but new to CritGenius
Listener's testing patterns  
**Status:** Complete

---

## Table of Contents

1. [Overview & Philosophy](#1-overview--philosophy)
2. [Quick Start Workflows](#2-quick-start-workflows)
3. [Test Infrastructure Deep Dive](#3-test-infrastructure-deep-dive)
4. [Test Utilities Library](#4-test-utilities-library)
5. [Integration Testing Handbook](#5-integration-testing-handbook)
6. [Performance Testing Guide](#6-performance-testing-guide)
7. [Testing Best Practices](#7-testing-best-practices)
8. [Troubleshooting & Common Issues](#8-troubleshooting--common-issues)
9. [Validation & Quality Gates](#9-validation--quality-gates)

---

## 1. Overview & Philosophy

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

All code must meet these thresholds before merging:

| Metric      | Threshold | Enforcement         | Rationale                                     |
| ----------- | --------- | ------------------- | --------------------------------------------- |
| Statement   | 90%       | Vitest coverage     | Ensures comprehensive test coverage           |
| Branch      | 90%       | Vitest coverage     | Validates all code paths including edge cases |
| Function    | 90%       | Vitest coverage     | Confirms all functions are tested             |
| Line        | 90%       | Vitest coverage     | Catches untested code                         |
| Performance | <500ms    | Custom matchers     | Real-time processing requirement              |
| Regression  | <10%      | Baseline comparison | Prevents performance degradation              |

**Enforcement Points:**

1. **Pre-commit**: `pnpm precommit:validate` runs linting, type-checking, and fast unit tests
2. **CI Pipeline**: Full test suite including integration and performance tests
3. **PR Review**: Manual review of test quality and coverage reports

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

## 2. Quick Start Workflows

### 2.1 Writing Your First Unit Test

This workflow guides you through creating a unit test for a new feature. We'll test a speaker
identification algorithm.

#### Workflow Sequence Diagram

```sequenceDiagram
participant Dev as Developer
participant Factory as Data Factory
participant SUT as System Under Test
participant Runtime as Test Runtime
participant Assertions as Vitest Assertions

Dev->>Runtime: installTestRuntime()
Runtime->>Runtime: Configure fake timers, seeded RNG, UTC
Runtime-->>Dev: Deterministic environment ready

Dev->>Factory: createTestAudioChunk()
Factory->>Factory: Generate realistic audio data
Factory-->>Dev: AudioChunk with consistent ID

Dev->>SUT: identifySpeaker(audioChunk)
SUT->>SUT: Analyze audio features
SUT->>SUT: Match against voice profiles
SUT-->>Dev: SpeakerIdentification result

Dev->>Assertions: expect(result).toMatchObject(...)
Assertions->>Assertions: Deep equality check
Assertions-->>Dev: ✓ Test passes

Dev->>Dev: Run coverage report
Dev->>Dev: Verify 90% threshold met
```

#### Step-by-Step Implementation

**Step 1: Create the test file**

```bash
# Unit tests live next to the code they test
touch packages/shared/src/speaker/identifier.test.ts
```

**Step 2: Set up the test structure**

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { installTestRuntime } from '@critgenius/test-utils/runtime';
import { createTestAudioChunk, createTestVoiceProfile } from '@critgenius/test-utils/factories';
import { identifySpeaker } from './identifier';

describe('speaker identifier', () => {
  beforeAll(() => {
    // Install deterministic runtime for consistent test results
    installTestRuntime();
  });

  it('identifies known speaker from audio chunk', () => {
    // Test implementation follows...
  });
});
```

**Step 3: Write the test using Given-When-Then pattern**

```typescript
it('identifies known speaker from audio chunk', () => {
  // GIVEN: A known voice profile for a D&D character
  const elaraProfile = createTestVoiceProfile({
    speakerId: 'SPEAKER_0',
    characterName: 'Elara the Ranger',
    playerName: 'Alice',
    features: {
      pitchMean: 220.0,
      pitchStd: 15.5,
      tempo: 4.2,
      energy: 0.75,
    },
  });

  // AND: An audio chunk matching that profile
  const audioChunk = createTestAudioChunk({
    speakerId: 'SPEAKER_0',
    features: {
      pitchMean: 218.5, // Close to profile
      pitchStd: 16.0,
      tempo: 4.3,
      energy: 0.73,
    },
  });

  // WHEN: Identifying the speaker
  const result = identifySpeaker(audioChunk, [elaraProfile]);

  // THEN: Speaker is correctly identified with high confidence
  expect(result).toMatchObject({
    speakerId: 'SPEAKER_0',
    characterName: 'Elara the Ranger',
    playerName: 'Alice',
    confidence: expect.any(Number),
  });

  expect(result.confidence).toBeGreaterThan(0.9);
});
```

**Step 4: Run the test**

```bash
# Run just this test file
pnpm --filter @critgenius/shared test identifier.test.ts

# Run with coverage
pnpm --filter @critgenius/shared test --coverage

# Run in watch mode during development
pnpm --filter @critgenius/shared test --watch identifier.test.ts
```

**Step 5: Verify coverage**

```bash
# Check coverage report
open packages/shared/coverage/index.html

# Or use CLI summary
pnpm --filter @critgenius/shared test --coverage --reporter=text
```

### 2.2 Writing Your First Integration Test

Integration tests validate workflows spanning multiple packages. Here we'll test Socket.IO audio
streaming.

#### Workflow Sequence Diagram

```sequenceDiagram
participant Dev as Developer
participant Harness as IntegrationTestHarness
participant Server as Integration Server
participant Client as Socket.IO Client
participant Mock as Mock Service
participant Cleanup as Cleanup Handler

Dev->>Harness: new IntegrationTestHarness()
Harness->>Harness: Apply environment preset
Harness->>Harness: Register cleanup handlers
Harness-->>Dev: Test environment ready

Dev->>Server: createIntegrationServer(harness)
Server->>Server: Start Express app
Server->>Server: Initialize Socket.IO
Server->>Server: Configure routes
Server-->>Dev: Server running on port

Dev->>Client: createSocketIntegrationContext()
Client->>Server: Connect to server
Server-->>Client: Connection established
Client-->>Dev: Client socket ready

Dev->>Mock: createMockAssemblyAIScenario()
Mock-->>Dev: Mock scenario configured

Dev->>Client: emit('audio:start')
Client->>Server: Audio start event
Server->>Mock: Initialize AssemblyAI stream
Mock-->>Server: Stream ready

Dev->>Mock: simulateStreamingEvents()
Mock->>Server: Send transcript events
Server->>Server: Normalize transcripts
Server->>Client: Emit normalized events
Client-->>Dev: Receive events

Dev->>Dev: Assert on received data
Dev->>Dev: Verify event ordering
Dev->>Dev: Check data integrity

Dev->>Harness: harness.teardown()
Harness->>Server: Stop server
Harness->>Client: Close connections
Harness->>Cleanup: Run cleanup handlers
Cleanup-->>Harness: Cleanup complete
Harness-->>Dev: Test complete
```

#### Step-by-Step Implementation

**Step 1: Create the integration test file**

```bash
# Integration tests live in tests/integration/
mkdir -p packages/server/tests/integration
touch packages/server/tests/integration/audio-streaming.integration.test.ts
```

**Step 2: Set up the integration test structure**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  IntegrationTestHarness,
  createIntegrationServer,
  createMockAssemblyAIScenario,
  waitForSocketEventWithTimeout,
} from '@critgenius/test-utils/integration';
import { createTestSession } from '@critgenius/test-utils/factories';
import { io as ioClient, Socket } from 'socket.io-client';

describe('audio streaming integration', () => {
  let harness: IntegrationTestHarness;
  let server: ReturnType<typeof createIntegrationServer>;
  let clientSocket: Socket;

  beforeAll(async () => {
    // Create test harness with local development environment
    harness = new IntegrationTestHarness({
      workflowName: 'audio-streaming',
      preset: 'localDevelopment',
    });

    // Start integration server
    server = await createIntegrationServer(harness);

    // Connect client socket
    clientSocket = ioClient(`http://localhost:${server.port}`);

    // Wait for connection
    await waitForSocketEventWithTimeout(clientSocket, 'connect', {
      timeoutMs: 2000,
    });
  });

  afterAll(async () => {
    // Clean up resources
    clientSocket.close();
    await harness.teardown();
  });

  it('streams audio chunks to AssemblyAI and receives transcripts', async () => {
    // Test implementation follows...
  });
});
```

**Step 3: Implement the integration test**

```typescript
it('streams audio chunks to AssemblyAI and receives transcripts', async () => {
  // GIVEN: A D&D session with participants
  const session = createTestSession({
    id: 'session-123',
    participants: [
      { name: 'Alice', characterName: 'Elara the Ranger' },
      { name: 'Bob', characterName: 'Thorin Stonefist' },
    ],
  });

  // AND: Mock AssemblyAI scenario simulating real-time transcription
  const mockScenario = createMockAssemblyAIScenario({
    sessionId: session.id,
    events: [
      {
        text: 'I roll for',
        speaker: 'SPEAKER_0',
        isFinal: false,
        confidence: 0.82,
        timestamp: 1000,
      },
      {
        text: 'I roll for perception',
        speaker: 'SPEAKER_0',
        isFinal: true,
        confidence: 0.94,
        timestamp: 2000,
      },
      {
        text: "That's a natural twenty!",
        speaker: 'SPEAKER_1',
        isFinal: true,
        confidence: 0.97,
        timestamp: 3500,
      },
    ],
  });

  // WHEN: Client starts audio capture session
  clientSocket.emit('session:start', {
    sessionId: session.id,
    characterMappings: {
      SPEAKER_0: { characterName: 'Elara the Ranger', playerName: 'Alice' },
      SPEAKER_1: { characterName: 'Thorin Stonefist', playerName: 'Bob' },
    },
  });

  // AND: Mock AssemblyAI streams transcript events
  await mockScenario.simulateStreamingEvents(server.assemblyAIConnector);

  // THEN: Client receives partial transcript first
  const partial = await waitForSocketEventWithTimeout(clientSocket, 'transcript:partial', {
    timeoutMs: 3000,
    filter: data => data.speaker.id === 'SPEAKER_0',
  });

  expect(partial).toMatchObject({
    sessionId: session.id,
    text: 'I roll for',
    isFinal: false,
    confidence: 0.82,
    speaker: {
      id: 'SPEAKER_0',
      characterName: 'Elara the Ranger',
      playerName: 'Alice',
    },
  });

  // AND: Then receives final transcript
  const final = await waitForSocketEventWithTimeout(clientSocket, 'transcript:final', {
    timeoutMs: 3000,
    filter: data => data.speaker.id === 'SPEAKER_0',
  });

  expect(final).toMatchObject({
    sessionId: session.id,
    text: 'I roll for perception',
    isFinal: true,
    confidence: 0.94,
    speaker: {
      id: 'SPEAKER_0',
      characterName: 'Elara the Ranger',
      playerName: 'Alice',
    },
  });

  // AND: Receives transcript from second speaker
  const speaker2 = await waitForSocketEventWithTimeout(clientSocket, 'transcript:final', {
    timeoutMs: 3000,
    filter: data => data.speaker.id === 'SPEAKER_1',
  });

  expect(speaker2).toMatchObject({
    text: "That's a natural twenty!",
    speaker: {
      characterName: 'Thorin Stonefist',
      playerName: 'Bob',
    },
  });
});
```

**Step 4: Run the integration test**

```bash
# Run all integration tests in server package
pnpm --filter @critgenius/server test:integration

# Run specific integration test file
pnpm --filter @critgenius/server test integration/audio-streaming

# Run with verbose output for debugging
pnpm --filter @critgenius/server test:integration --reporter=verbose
```

**Step 5: Debug integration test failures**

If the test fails, use these debugging strategies:

```typescript
// Add detailed logging
console.log('Server started on port:', server.port);
console.log('Client connected:', clientSocket.connected);

// Inspect received events
clientSocket.on('transcript:partial', data => {
  console.log('Received partial:', JSON.stringify(data, null, 2));
});

// Check server logs
harness.enableDetailedLogging();

// Increase timeout for debugging
const result = await waitForSocketEventWithTimeout(
  clientSocket,
  'transcript:partial',
  { timeoutMs: 30000 } // 30 seconds for debugging
);
```

### 2.3 Running the Test Suite

This workflow shows how to execute tests at different scopes and interpret results.

#### Workflow Sequence Diagram

```sequenceDiagram
participant Dev as Developer
participant CLI as pnpm CLI
participant Vitest as Vitest Runner
participant Workspace as Workspace Orchestrator
participant Packages as Package Tests
participant Coverage as Coverage Reporter

Dev->>CLI: pnpm test
CLI->>Workspace: Execute workspace test script
Workspace->>Workspace: Identify all packages
Workspace->>Packages: Run tests in @critgenius/client
Packages->>Vitest: Execute client tests
Vitest->>Vitest: Apply shared config
Vitest->>Vitest: Run unit tests
Vitest->>Vitest: Run integration tests
Vitest->>Coverage: Collect coverage data
Coverage-->>Vitest: Coverage report

Workspace->>Packages: Run tests in @critgenius/server
Packages->>Vitest: Execute server tests
Vitest->>Vitest: Run unit + integration + perf tests
Vitest->>Coverage: Collect coverage data
Coverage-->>Vitest: Coverage report

Workspace->>Packages: Run tests in @critgenius/shared
Packages->>Vitest: Execute shared tests
Vitest->>Coverage: Collect coverage data
Coverage-->>Vitest: Coverage report

Workspace->>CLI: Aggregate results
CLI->>CLI: Check for failures
CLI->>CLI: Verify coverage thresholds

alt All tests pass
    CLI-->>Dev: ✓ All tests passed
    CLI-->>Dev: Coverage: 92% (meets 90% threshold)
else Tests fail
    CLI-->>Dev: ✗ 3 tests failed
    CLI-->>Dev: View detailed output above
end
```

#### Common Test Commands

```bash
# Run all tests across all packages
pnpm test

# Run tests in specific package
pnpm --filter @critgenius/client test
pnpm --filter @critgenius/server test
pnpm --filter @critgenius/shared test

# Run only unit tests (exclude integration and perf)
pnpm test --exclude='**/*.integration.test.*' --exclude='**/*.perf.test.*'

# Run only integration tests
pnpm test:integration

# Run only performance tests
pnpm test:performance

# Run tests with coverage
pnpm test --coverage

# Run tests in watch mode
pnpm --filter @critgenius/server test --watch

# Run specific test file
pnpm --filter @critgenius/shared test normalizer.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="speaker identifier"

# Run tests with verbose output
pnpm test --reporter=verbose

# Run tests and generate HTML coverage report
pnpm test --coverage --reporter=html
open coverage/index.html
```

#### Interpreting Test Results

**Successful Test Run:**

```
✓ packages/client/src/components/AudioCapture.test.tsx (5 tests) 145ms
✓ packages/server/src/transcript/normalizer.test.ts (8 tests) 52ms
✓ packages/shared/src/speaker/identifier.test.ts (12 tests) 89ms

Test Files  3 passed (3)
     Tests  25 passed (25)
  Start at  08:15:32
  Duration  2.41s (transform 124ms, setup 0ms, collect 892ms, tests 286ms)

 % Coverage report from v8
-----------|-----------|-----------|-----------|-----------
File       | % Stmts   | % Branch  | % Funcs   | % Lines
-----------|-----------|-----------|-----------|-----------
All files  |   92.45   |   91.23   |   93.18   |   92.45
-----------|-----------|-----------|-----------|-----------

✓ All coverage thresholds met
```

**Failed Test Run:**

```
✗ packages/server/src/transcript/normalizer.test.ts (8 tests | 1 failed) 156ms
  ✓ normalizes AssemblyAI transcript with character mapping
  ✓ handles missing character mapping gracefully
  ✗ filters out low-confidence words
    Expected: [{ text: 'Hello' }, { text: 'test' }]
    Received: [{ text: 'Hello' }, { text: 'world' }, { text: 'test' }]
  ✓ preserves timestamp information
  ...

Test Files  1 failed | 2 passed (3)
     Tests  1 failed | 24 passed (25)
  Start at  08:15:32
  Duration  2.63s

FAIL  Tests failed. See above for details.
```

**Coverage Threshold Failure:**

```
ERROR: Coverage for statements (88.45%) does not meet threshold (90%)
ERROR: Coverage for branches (87.23%) does not meet threshold (90%)

Uncovered files:
- packages/server/src/speaker/analyzer.ts (Lines: 45-67, 89-102)
- packages/shared/src/transcript/validator.ts (Lines: 23-34)
```

### 2.4 Common Commands Reference

| Command                   | Purpose                        | When to Use                  |
| ------------------------- | ------------------------------ | ---------------------------- |
| `pnpm test`               | Run all tests                  | Pre-commit, CI pipeline      |
| `pnpm test --coverage`    | Run tests with coverage        | Before creating PR           |
| `pnpm test --watch`       | Watch mode for TDD             | Active development           |
| `pnpm test:integration`   | Integration tests only         | After server changes         |
| `pnpm test:performance`   | Performance benchmarks         | Performance-critical changes |
| `pnpm perf:baseline`      | Establish performance baseline | After optimization work      |
| `pnpm perf:compare`       | Compare against baseline       | Before merging perf changes  |
| `pnpm validate:testing`   | Validate test structure        | After refactoring tests      |
| `pnpm precommit:validate` | Pre-commit checks              | Before committing            |

---

## 3. Test Infrastructure Deep Dive

### 3.1 Shared Vitest Configuration Factory

The `vitest.shared.config.ts` file provides a configuration factory that ensures consistency across
all packages while allowing customization.

#### Architecture

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

#### Key Features

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

### 3.2 Package-Level Configuration Patterns

Each package has its own `vitest.config.ts` that invokes the shared factory:

**Client Package (jsdom environment for React):**

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

**Server Package (node environment):**

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

### 3.3 Environment Setup and Teardown

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

### 3.4 Path Alias Resolution

The factory automatically synchronizes Vitest's path resolution with your `tsconfig.json`:

**How it works:**

1. Reads `compilerOptions.paths` from `tsconfig.json`
2. Resolves each alias to absolute paths
3. Configures Vitest's `resolve.alias` setting
4. Handles `extends` in tsconfig for inheritance

**Debug path resolution:**

```bash
# Enable path resolution debugging
DEBUG_VITEST_ALIASES=true pnpm test
```

This outputs the resolved alias map for troubleshooting.

**Path diagnostics for complex issues:**

```bash
# Enable detailed path diagnostics
DEBUG_VITEST_PATHS=true \
DEBUG_VITEST_PATH_LEVEL=debug \
DEBUG_VITEST_PATH_STACKS=true \
pnpm test
```

---

## 4. Test Utilities Library

The `@critgenius/test-utils` package provides reusable testing infrastructure. This section covers
each module with realistic examples.

### 4.1 Runtime Harness

The runtime harness provides deterministic test execution by controlling time, randomness, and
environment.

#### Installation

```typescript
import { installTestRuntime } from '@critgenius/test-utils/runtime';

describe('my test suite', () => {
  beforeAll(() => {
    installTestRuntime();
  });

  // Tests now run in deterministic environment
});
```

#### What it Does

1. **Fake Timers**: Replaces `setTimeout`, `setInterval`, `Date.now()` with controllable versions
2. **Seeded Random**: Seeds `Math.random()` for consistent random values
3. **UTC Timezone**: Forces `TZ=UTC` to eliminate timezone-dependent failures
4. **Global Polyfills**: Adds missing browser APIs in node environment

#### Realistic Example: Testing Audio Buffer Timestamps

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

### 4.2 Data Factories

Factories generate realistic test data with consistent IDs and structure.

#### Available Factories

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

#### Realistic Example: D&D Session Testing

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

### 4.3 Fixture Loader

The fixture system provides cached, type-safe access to test data files.

#### Loading Fixtures

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

#### Realistic Example: Testing Transcript Parser

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

### 4.4 Async Helpers and Mock Patterns

Utilities for managing asynchronous operations and creating test doubles.

#### Wait For Condition

```typescript
import { waitForCondition } from '@critgenius/test-utils/async';

it('waits for async state change', async () => {
  const session = startSession();

  // Wait up to 3 seconds for session to become active
  await waitForCondition(() => session.status === 'active', { timeoutMs: 3000, intervalMs: 100 });

  expect(session.status).toBe('active');
});
```

#### Create Deferred Promise

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

#### Realistic Example: Testing WebSocket Reconnection

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

### 4.5 Custom Matchers

Domain-specific assertions for transcript and audio testing.

#### Available Matchers

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

#### Realistic Example: Transcript Validation

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

### 4.6 Resilience Testing Patterns

Test failure scenarios and recovery mechanisms with the resilience scenario builder.

#### Creating Resilience Scenarios

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

#### Realistic Example: Testing Transcript Service Resilience

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

## 5. Integration Testing Handbook

Integration tests validate workflows that span multiple packages and services. This section provides
patterns for common integration scenarios.

### 5.1 Socket.IO Communication Patterns

#### Basic Client-Server Communication

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  IntegrationTestHarness,
  createIntegrationServer,
  waitForSocketEventWithTimeout,
} from '@critgenius/test-utils/integration';
import { io as ioClient } from 'socket.io-client';

describe('socket.io basic communication', () => {
  let harness: IntegrationTestHarness;
  let server: ReturnType<typeof createIntegrationServer>;
  let clientSocket: ReturnType<typeof ioClient>;

  beforeAll(async () => {
    harness = new IntegrationTestHarness({
      workflowName: 'socket-communication',
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

  it('exchanges messages between client and server', async () => {
    // GIVEN: Client emits message
    const testMessage = {
      type: 'chat',
      content: 'Hello from client',
      timestamp: Date.now(),
    };

    clientSocket.emit('message:send', testMessage);

    // THEN: Server echoes message back
    const received = await waitForSocketEventWithTimeout(clientSocket, 'message:received', {
      timeoutMs: 2000,
    });

    expect(received).toMatchObject({
      type: 'chat',
      content: 'Hello from client',
    });
  });
});
```

#### Room-Based Communication

```typescript
it('broadcasts to room participants only', async () => {
  // GIVEN: Two clients in same room, one outside
  const client1 = ioClient(`http://localhost:${server.port}`);
  const client2 = ioClient(`http://localhost:${server.port}`);
  const outsideClient = ioClient(`http://localhost:${server.port}`);

  await Promise.all([
    waitForSocketEventWithTimeout(client1, 'connect', { timeoutMs: 2000 }),
    waitForSocketEventWithTimeout(client2, 'connect', { timeoutMs: 2000 }),
    waitForSocketEventWithTimeout(outsideClient, 'connect', { timeoutMs: 2000 }),
  ]);

  const roomId = 'dnd-session-123';
  client1.emit('room:join', { roomId });
  client2.emit('room:join', { roomId });

  await Promise.all([
    waitForSocketEventWithTimeout(client1, 'room:joined', { timeoutMs: 2000 }),
    waitForSocketEventWithTimeout(client2, 'room:joined', { timeoutMs: 2000 }),
  ]);

  // WHEN: Client1 broadcasts to room
  client1.emit('room:broadcast', {
    roomId,
    message: 'Initiative roll: 18',
  });

  // THEN: Client2 receives broadcast
  const client2Received = await waitForSocketEventWithTimeout(client2, 'room:message', {
    timeoutMs: 2000,
  });

  expect(client2Received.message).toBe('Initiative roll: 18');

  // AND: Outside client does not receive broadcast
  let outsideReceived = false;
  outsideClient.once('room:message', () => {
    outsideReceived = true;
  });

  await new Promise(resolve => setTimeout(resolve, 1000));
  expect(outsideReceived).toBe(false);

  // Cleanup
  client1.close();
  client2.close();
  outsideClient.close();
});
```

### 5.2 AssemblyAI Mock Scenarios

Mock AssemblyAI interactions to test transcript processing without making real API calls.

#### Creating Mock Scenarios

```typescript
import { createMockAssemblyAIScenario } from '@critgenius/test-utils/integration';

const scenario = createMockAssemblyAIScenario({
  sessionId: 'test-session-123',
  events: [{ text: 'Hello', speaker: 'SPEAKER_0', isFinal: true, confidence: 0.95 }],
});
```

#### Realistic Example: Multi-Speaker D&D Combat

```typescript
it('handles complex multi-speaker combat scenario', async () => {
  const scenario = createMockAssemblyAIScenario({
    sessionId: 'combat-session',
    events: [
      // DM narration
      {
        text: 'Roll for initiative',
        speaker: 'SPEAKER_DM',
        isFinal: true,
        confidence: 0.96,
        timestamp: 0,
      },

      // Player responses
      { text: 'I rolled', speaker: 'SPEAKER_0', isFinal: false, confidence: 0.82, timestamp: 1000 },
      {
        text: 'I rolled eighteen',
        speaker: 'SPEAKER_0',
        isFinal: true,
        confidence: 0.94,
        timestamp: 1500,
      },

      {
        text: 'Natural twenty!',
        speaker: 'SPEAKER_1',
        isFinal: true,
        confidence: 0.98,
        timestamp: 2000,
      },

      // DM response
      {
        text: 'The goblin attacks',
        speaker: 'SPEAKER_DM',
        isFinal: false,
        confidence: 0.85,
        timestamp: 3000,
      },
      {
        text: 'The goblin attacks Elara',
        speaker: 'SPEAKER_DM',
        isFinal: true,
        confidence: 0.92,
        timestamp: 3500,
      },
    ],
  });

  // Simulate events
  await scenario.simulateStreamingEvents(server.assemblyAIConnector);

  // Verify all transcripts received in order
  const transcripts = await collectAllTranscripts(clientSocket, 6);

  expect(transcripts).toHaveLength(6);
  expect(transcripts[0].text).toBe('Roll for initiative');
  expect(transcripts[5].text).toBe('The goblin attacks Elara');
});
```

### 5.3 Cross-Package Audio Capture Workflow

Test the complete audio capture pipeline from client to server to AssemblyAI.

```typescript
describe('end-to-end audio capture workflow', () => {
  it('captures audio, transcribes, and maps to characters', async () => {
    // GIVEN: Complete D&D session setup
    const session = createTestSession({
      participants: [
        { name: 'Alice', characterName: 'Elara', voiceProfile: {...} },
        { name: 'Bob', characterName: 'Thorin', voiceProfile: {...} }
      ]
    });

    // Start session
    clientSocket.emit('session:start', { sessionId: session.id });

    // WHEN: Client streams audio chunks
    const audioChunks = [
      createTestAudioChunk({ speakerId: 'SPEAKER_0', duration: 1000 }),
      createTestAudioChunk({ speakerId: 'SPEAKER_0', duration: 500 }),
      createTestAudioChunk({ speakerId: 'SPEAKER_1', duration: 800 })
    ];

    for (const chunk of audioChunks) {
      clientSocket.emit('audio:chunk', chunk);
    }

    // AND: AssemblyAI processes and returns transcripts
    const mockScenario = createMockAssemblyAIScenario({
      events: [
        { text: 'I search for traps', speaker: 'SPEAKER_0', isFinal: true },
        { text: 'Roll perception', speaker: 'SPEAKER_1', isFinal: true }
      ]
    });

    await mockScenario.simulateStreamingEvents(server.assemblyAIConnector);

    // THEN: Transcripts mapped to characters
    const transcript1 = await waitForSocketEventWithTimeout(
      clientSocket,
      'transcript:final',
      { timeoutMs: 3000, filter: (t) => t.speaker.id === 'SPEAKER_0' }
    );

    expect(transcript1).toMatchObject({
      text: 'I search for traps',
      speaker: {
        id: 'SPEAKER_0',
        characterName: 'Elara',
        playerName: 'Alice'
      }
    });
  });
});
```

### 5.4 Environment-Aware Test Execution

Use environment helpers to skip or modify tests based on execution context.

```typescript
import {
  environmentAwareDescribe,
  environmentAwareTest,
  describeIf,
} from '@critgenius/test-utils/integration';

// Skip in CI environment
environmentAwareDescribe('local-only integration tests', { requireLocal: true }, () => {
  environmentAwareTest('uses local database', { requireLocal: true }, async () => {
    // Test implementation
  });
});

// Only run in CI
describeIf(process.env.CI === 'true', 'CI-specific tests', () => {
  it('validates production-like setup', async () => {
    // Test implementation
  });
});
```

---

## 6. Performance Testing Guide

Performance testing ensures the system meets sub-500ms latency requirements for real-time
processing.

### 6.1 Performance Testing Overview

CritGenius Listener uses a dedicated performance testing infrastructure with:

- Latency benchmarking helpers
- Baseline management
- Regression detection
- Workload scenarios

**Key Files:**

- `vitest.performance.config.ts` - Dedicated performance test configuration
- `.performance-baselines/baseline.json` - Performance baselines
- `packages/test-utils/src/performance/` - Performance utilities

### 6.2 Establishing Performance Baselines

#### Baseline Establishment Workflow

```sequenceDiagram
participant Dev as Developer
participant Script as Baseline Script
participant Runner as Metrics Runner
participant Scenarios as Workload Scenarios
participant Storage as Baseline JSON

Dev->>Script: pnpm perf:baseline
Script->>Runner: Execute all performance tests
Runner->>Scenarios: Run singleStream scenario
Scenarios->>Scenarios: Warmup iterations
Scenarios->>Scenarios: Measurement iterations
Scenarios-->>Runner: Latency metrics (mean, p95, p99, max)
Runner->>Scenarios: Run multiStreamBurst scenario
Scenarios-->>Runner: Latency metrics
Runner->>Scenarios: Run sustainedMultiStream scenario
Scenarios-->>Runner: Latency metrics
Runner->>Runner: Aggregate statistics
Runner->>Storage: Write baseline.json
Storage-->>Dev: Baseline established
Dev->>Dev: Review metrics
Dev->>Dev: Commit baseline.json
```

#### Commands

```bash
# Establish initial baseline
pnpm perf:baseline

# Run performance tests without baseline comparison
pnpm test:performance

# Compare current performance against baseline
pnpm perf:compare

# Generate HTML report
pnpm perf:report
```

### 6.3 Writing Performance Tests

#### Basic Performance Test

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { measureLatency, registerPerformanceMatchers } from '@critgenius/test-utils/performance';

describe('transcript processor performance', () => {
  beforeAll(() => {
    registerPerformanceMatchers();
  });

  it('processes transcript within latency threshold', async () => {
    const result = await measureLatency(
      async () => {
        return await processTranscript(createMockTranscript());
      },
      {
        iterations: 100,
        warmup: 10,
      }
    );

    expect(result).toBeWithinLatencyThreshold(100); // 100ms threshold
    expect(result.mean).toBeLessThan(50);
    expect(result.p95).toBeLessThan(100);
  });
});
```

#### Using Workload Scenarios

```typescript
import { runWorkloadScenario } from '@critgenius/test-utils/performance';

it('handles burst workload within performance targets', async () => {
  const summary = await runWorkloadScenario('multiStreamBurst', async () => {
    return await transcriptionService.processStream(mockAudioStream);
  });

  expect(summary).toNotRegressFromBaseline(
    '.performance-baselines/baseline.json',
    'transcription',
    'multiStreamBurst',
    { tolerance: 10 } // Allow 10% regression
  });
});
```

### 6.4 Custom Performance Benchmarks

Create custom benchmarks for specific scenarios:

```typescript
it('benchmarks character voice matching performance', async () => {
  const voiceProfiles = Array.from({ length: 10 }, (_, i) =>
    createTestVoiceProfile({ speakerId: `SPEAKER_${i}` })
  );

  const result = await measureLatency(
    async () => {
      return await voiceMatcher.findBestMatch(testAudioFeatures, voiceProfiles);
    },
    {
      iterations: 200,
      warmup: 20,
    }
  );

  // Assert latency targets
  expect(result.mean).toBeLessThan(10); // 10ms mean
  expect(result.p95).toBeLessThan(20); // 20ms p95
  expect(result.p99).toBeLessThan(30); // 30ms p99
  expect(result.max).toBeLessThan(50); // 50ms max
});
```

### 6.5 Performance Regression Detection

```bash
# In CI pipeline, compare against baseline
pnpm perf:compare --threshold=500 --tolerance=10

# Fail if mean latency exceeds threshold
# Fail if any metric regresses > 10%
```

The comparison script outputs:

```
Performance Comparison Report

Scenario: singleStream
  Mean:   45ms (baseline: 42ms) [+7.1%] ✓
  P95:    89ms (baseline: 85ms) [+4.7%] ✓
  P99:    125ms (baseline: 120ms) [+4.2%] ✓
  Max:    180ms (baseline: 175ms) [+2.9%] ✓

Scenario: multiStreamBurst
  Mean:   156ms (baseline: 140ms) [+11.4%] ✗ REGRESSION
  P95:    285ms (baseline: 260ms) [+9.6%] ✓

ERROR: Performance regression detected in multiStreamBurst (mean)
```

---

## 7. Testing Best Practices

### 7.1 Test Organization and Naming

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

### 7.2 Deterministic Test Design

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

### 7.3 Privacy-First Testing Principles

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

### 7.4 Error Scenario Coverage

**Test failure paths explicitly:**

```typescript
it('handles network errors gracefully', async () => {
  const scenario = createResilienceScenarioBuilder().withErrorRate(1.0).build();

  scenario.applyToConnector(connector);

  await expect(service.transcribe(audio)).rejects.toThrow('Network error');
});
```

### 7.5 Test Maintenance Guidelines

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

## 8. Troubleshooting & Common Issues

### 8.1 Test Timeouts

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

### 8.2 Flaky Tests

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

### 8.3 Mock Not Being Called

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

### 8.4 Path Resolution Failures

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

### 8.5 Coverage Threshold Failures

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

## 9. Validation & Quality Gates

### 9.1 Pre-Commit Validation

Run before every commit:

```bash
pnpm precommit:validate
```

This executes:

1. ESLint checks
2. TypeScript compilation
3. Fast unit tests
4. File naming validation

### 9.2 CI Pipeline Integration

CI pipeline runs full test suite:

```yaml
# .github/workflows/ci.yml
- name: Run tests
  run: pnpm test --coverage

- name: Run integration tests
  run: pnpm test:integration

- name: Run performance tests
  run: pnpm perf:compare
```

### 9.3 Documentation Validation

This comprehensive testing guide has its own validation test:

```typescript
// tests/infrastructure/comprehensive-testing-guide.test.ts
describe('comprehensive testing guide validation', () => {
  it('verifies all code examples compile', async () => {
    const examples = await extractCodeExamples('docs/comprehensive-testing-guide.md');

    for (const example of examples) {
      await expect(compileTypeScript(example.code)).resolves.not.toThrow();
    }
  });

  it('confirms all referenced files exist', async () => {
    const refs = await extractFileReferences('docs/comprehensive-testing-guide.md');

    for (const ref of refs) {
      expect(existsSync(ref)).toBe(true);
    }
  });

  it('validates all npm scripts are defined', async () => {
    const scripts = await extractScriptCommands('docs/comprehensive-testing-guide.md');

    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));

    for (const script of scripts) {
      expect(packageJson.scripts).toHaveProperty(script);
    }
  });
});
```

### 9.4 Quality Checklist

Before marking testing task complete, verify:

- [ ] All test types covered (unit, integration, performance)
- [ ] Test utilities library fully documented
- [ ] Realistic examples provided for each pattern
- [ ] Sequence diagrams included for workflows
- [ ] Troubleshooting guide complete
- [ ] Validation test suite passes
- [ ] Cross-references to supplementary docs accurate
- [ ] Code examples compile successfully

---

## Related Documentation

- [Testing Standards](./testing-standards.md) - File naming and configuration standards
- [Integration Testing Standards](./integration-testing-standards.md) - Integration test
  requirements
- [Integration Test Patterns](./integration-test-patterns.md) - Pattern catalog
- [Performance Testing Guide](./performance-testing-guide.md) - Performance testing procedures
- [Test Utils README](../packages/test-utils/README.md) - Test utilities overview

---

## Version History

| Version | Date       | Changes                             |
| ------- | ---------- | ----------------------------------- |
| 1.0.0   | 2025-01-11 | Initial comprehensive testing guide |

---

**End of Comprehensive Testing Guide**
