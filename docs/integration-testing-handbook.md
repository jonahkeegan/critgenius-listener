# Integration Testing Handbook - Specialized Patterns Guide

**Version:** 1.1.0 **Last Updated:** 2025-11-04 **Target Audience:** Developers writing integration
tests **Status:** Complete

---

## Table of Contents

1. [Socket.IO Communication Patterns](#1-socketio-communication-patterns)
2. [AssemblyAI Mock Scenarios](#2-assemblyai-mock-scenarios)
3. [Cross-Package Audio Capture Workflow](#3-cross-package-audio-capture-workflow)
4. [Environment-Aware Test Execution](#4-environment-aware-test-execution)

---

## 1. Socket.IO Communication Patterns

Integration tests validate workflows that span multiple packages and services. This section provides
patterns for common integration scenarios.

### 1.1 Basic Client-Server Communication

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

### 1.2 Room-Based Communication

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

---

## 2. AssemblyAI Mock Scenarios

Mock AssemblyAI interactions to test transcript processing without making real API calls.

### 2.1 Creating Mock Scenarios

```typescript
import { createMockAssemblyAIScenario } from '@critgenius/test-utils/integration';

const scenario = createMockAssemblyAIScenario({
  sessionId: 'test-session-123',
  events: [{ text: 'Hello', speaker: 'SPEAKER_0', isFinal: true, confidence: 0.95 }],
});
```

### 2.2 Realistic Example: Multi-Speaker D&D Combat

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

---

## 3. Cross-Package Audio Capture Workflow

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

---

## 4. Environment-Aware Test Execution

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

## Related Documentation

- [Testing Overview](./testing-overview.md) - Testing philosophy and architecture
- [Testing Workflows](./testing-workflows.md) - Practical getting-started guides
- [Testing Infrastructure](./testing-infrastructure.md) - Technical configuration details
- [Testing Utilities](./testing-utilities.md) - Test utilities API reference
- [Performance Testing Guide](./performance-testing-guide.md) - Performance testing procedures
- [Testing Validation](./testing-validation.md) - Quality gates and CI/CD integration
- [Integration Testing Standards](./integration-testing-standards.md) - Integration test
  requirements
- [Integration Test Patterns](./integration-test-patterns.md) - Pattern catalog

---

**End of Integration Testing Handbook**
