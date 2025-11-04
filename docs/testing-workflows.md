# Testing Workflows - Practical Getting Started Guide

**Version:** 1.1.0 **Last Updated:** 2025-11-04 **Target Audience:** Developers writing their first
tests **Status:** Complete

---

## Table of Contents

1. [Writing Your First Unit Test](#1-writing-your-first-unit-test)
2. [Writing Your First Integration Test](#2-writing-your-first-integration-test)
3. [Running the Test Suite](#3-running-the-test-suite)
4. [Common Commands Reference](#4-common-commands-reference)
5. [Browser E2E Workflow](#5-browser-e2e-workflow)

---

## 1. Writing Your First Unit Test

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

---

## 2. Writing Your First Integration Test

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

---

## 3. Running the Test Suite

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

---

## 4. Common Commands Reference

| Command                     | Purpose                        | When to Use                  |
| --------------------------- | ------------------------------ | ---------------------------- |
| `pnpm test`                 | Run all tests                  | Pre-commit, CI pipeline      |
| `pnpm test --coverage`      | Run tests with coverage        | Before creating PR           |
| `pnpm test --watch`         | Watch mode for TDD             | Active development           |
| `pnpm test:integration`     | Integration tests only         | After server changes         |
| `pnpm test:performance`     | Performance benchmarks         | Performance-critical changes |
| `pnpm run test:e2e`         | Browser E2E suite (headless)   | End-to-end regression pass   |
| `pnpm run test:e2e:headed`  | Browser E2E suite (headed)     | Debugging interactive flows  |
| `pnpm run test:e2e:install` | Install Playwright browsers    | First run or version update  |
| `pnpm run test:e2e:report`  | Open last Playwright report    | Inspecting failures          |
| `pnpm perf:baseline`        | Establish performance baseline | After optimization work      |
| `pnpm perf:compare`         | Compare against baseline       | Before merging perf changes  |
| `pnpm validate:testing`     | Validate test structure        | After refactoring tests      |
| `pnpm precommit:validate`   | Pre-commit checks              | Before committing            |

---

## 5. Browser E2E Workflow

- **Install browsers**: `pnpm run test:e2e:install` downloads the Chromium/Firefox/WebKit builds
  that `packages/client/playwright.config.ts` targets. Re-run after upgrading Playwright.
- **Headless regression**: `pnpm run test:e2e` fans into
  `pnpm --filter @critgenius/client test:browser` so the root orchestrates the client Playwright
  suite without extra setup.
- **Parallelization defaults**: Playwright scales workers automatically (local = half cores, CI =
  2). See `docs/playwright-parallelization-guide.md` for tuning guidance and verification checks.
- **Sharding (optional)**: Export `SHARD=1/2` (or similar) then run
  `pnpm --filter @critgenius/client test:browser:shard` to split large suites while preserving
  deterministic failure reproduction.
- **Debug modes**: `pnpm run test:e2e:headed` launches visible browsers, while
  `pnpm run test:e2e:ui` opens the Playwright UI runner for selective replays.
- **Report review**: `pnpm run test:e2e:report` serves the latest HTML report, keeping failed trace
  attachments accessible long after the run exits.
- **CI alignment**: The commands are workspace-aware, so CI can invoke them from the repo root with
  consistent tooling versions and without leaking package-specific scripts.

---

## Related Documentation

- [Testing Overview](./testing-overview.md) - Testing philosophy and architecture
- [Testing Infrastructure](./testing-infrastructure.md) - Technical configuration details
- [Testing Utilities](./testing-utilities.md) - Test utilities API reference
- [Integration Testing Handbook](./integration-testing-handbook.md) - Integration test patterns
- [Performance Testing Guide](./performance-testing-guide.md) - Performance testing procedures
- [Testing Validation](./testing-validation.md) - Quality gates and CI/CD integration
- [Playwright Testing Guide](./playwright-testing-guide.md) - Core testing patterns and workflows
- [Playwright Parallelization Guide](./playwright-parallelization-guide.md) - Worker allocation and
  sharding procedures

---

**End of Testing Workflows Guide**
