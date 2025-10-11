# Integration Test Pattern Catalogue

The following patterns document approved approaches for validating cross-package workflows. Each
pattern references the shared helpers exposed through `@critgenius/test-utils/integration` and
includes a canonical example test.

## Socket.IO realtime communication

**Purpose:** Validate bi-directional event flow between the client and server packages.

- **Helper Stack:** `IntegrationTestHarness`, `ServiceLifecycleManager`, `createIntegrationServer`,
  `createSocketIntegrationContext` (for lightweight pairs).
- **Key Assertions:** Connection status, room participation, event payload normalization, audio
  chunk relay.
- **Example:** `packages/server/tests/integration/socket-io-communication.integration.test.ts`
  ensures transcription updates reach the initiating client and that audio chunks are forwarded to
  the mocked AssemblyAI connector.

## AssemblyAI transcription flow

**Purpose:** Verify streaming transcription behaviour without contacting the live AssemblyAI API.

- **Helper Stack:** `createMockAssemblyAIScenario`, `createResilienceScenarioBuilder` for error
  injection.
- **Key Assertions:** Normalized transcript payloads (`sessionId`, `text`, `isFinal`), structured
  error propagation (`TRANSCRIPTION_ERROR`), and connector lifecycle management
  (`onOpen`/`onClose`).
- **Example:** `assemblyai-transcription-flow.integration.test.ts` triggers simulated downstream
  failures and asserts the server emits resilience-friendly error objects.

## Cross-package audio capture workflow

**Purpose:** Exercise the journey from client emitted audio chunks to shared transcript
normalization.

- **Helper Stack:** `IntegrationTestHarness`, `createIntegrationServer`,
  `createMockAssemblyAIScenario`.
- **Key Assertions:** Transcript sequencing (partial → final), confidence propagation, diarization
  flag handling, and chunk storage via `getAudioChunks()`.
- **Example:** `audio-capture-workflow.integration.test.ts` demonstrates end-to-end audio streaming
  with deterministic AssemblyAI responses.

## Resilience failure injection

**Purpose:** Ensure degraded transport or downstream outages produce graceful fallbacks.

- **Helper Stack:** `createResilienceScenarioBuilder` combined with either a real Socket.IO server
  or `createSocketIntegrationContext`.
- **Key Assertions:** Metrics captured (`socketLatencyMs`, `assemblyAIErrors`), timeout handling,
  retry or graceful shutdown behaviours.
- **Example:** `assemblyai-transcription-flow.integration.test.ts` applies artificial latency before
  injecting an AssemblyAI error to validate failure telemetry.

## Environment-aware execution

**Purpose:** Skip or reconfigure suites based on execution context (local vs. CI).

- **Helper Stack:** `environmentAwareDescribe`, `environmentAwareTest`, `describeIf`/`testIf`
  wrappers.
- **Usage:** Gate expensive or optional suites behind environment flags. Example snippet:

```ts
environmentAwareDescribe('local-only workflow', { requireLocal: true }, () => {
  environmentAwareTest('runs fast path', { requireLocal: true }, async () => {
    // integration logic here
  });
});
```

## Documentation Conventions

- Keep sequence diagrams and timing expectations in this catalogue.
- Reference helpers using their exported names for traceability.
- When introducing a new pattern, update both this document and `integration-testing-standards.md`,
  then add an infrastructure test to guard regressions.
