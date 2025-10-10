import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { io as createClient, type Socket } from 'socket.io-client';
import {
  IntegrationTestHarness,
  type AssemblyAITestScenario,
  allocateAvailablePort,
  localDevelopmentPreset,
  mergePresets,
  waitForSocketEventWithTimeout as waitForSocketEvent,
} from '@critgenius/test-utils/integration';
import { waitForCondition } from '@critgenius/test-utils';
import { environmentSchema } from '@critgenius/shared/config/environment';
import {
  createIntegrationServer,
  type ServerUnderTest,
} from '../helpers/createIntegrationServer.js';

const assemblyAIScenarioRef = vi.hoisted(() => ({
  value: undefined as AssemblyAITestScenario | undefined,
}));

vi.mock('../../src/realtime/assemblyaiConnector.js', async () => {
  const { createMockAssemblyAIScenario } = await import(
    '@critgenius/test-utils/integration'
  );
  const scenario = createMockAssemblyAIScenario('socket-suite');
  assemblyAIScenarioRef.value = scenario;
  return {
    AssemblyAIConnector: scenario.Connector,
  };
});

function getAssemblyAIScenario(): AssemblyAITestScenario {
  const scenario = assemblyAIScenarioRef.value;
  if (!scenario) {
    throw new Error('AssemblyAI scenario not initialised');
  }
  return scenario;
}

describe('Socket.IO communication integration', () => {
  let harness: IntegrationTestHarness;
  let server: ServerUnderTest | null = null;
  let client: Socket | null = null;
  let scenario: AssemblyAITestScenario;

  beforeEach(async () => {
    vi.useRealTimers();
    scenario = getAssemblyAIScenario();
    scenario.reset();
    const serverPort = await allocateAvailablePort();
    const clientPort = await allocateAvailablePort();

    const preset = mergePresets(
      'socket-io-communication',
      localDevelopmentPreset,
      {
        name: 'socket-io-communication-ports',
        values: Object.freeze({
          PORT: String(serverPort),
          CLIENT_PORT: String(clientPort),
          CLIENT_SOCKET_URL: `http://localhost:${serverPort}`,
        }),
      }
    );

    harness = new IntegrationTestHarness({
      preset,
      workflowName: 'socket-io-communication',
    });

    harness.registerService({
      name: 'socket-server',
      start: async () => {
        const env = environmentSchema.parse(process.env);
        server = createIntegrationServer(env);
        await server.start();
      },
      stop: async () => {
        await server?.stop();
      },
    });

    await harness.setup();

    client = createClient(`http://localhost:${process.env.PORT}`, {
      transports: ['websocket'],
      reconnection: false,
    });

    await waitForSocketEvent(client!, 'connect', {
      timeoutMs: 5_000,
      message: 'Timeout waiting for Socket.IO client connection',
    });
  });

  afterEach(async () => {
    client?.removeAllListeners();
    client?.disconnect();
    client = null;
    await harness.teardown();
  });

  it('joins session and broadcasts transcription updates', async () => {
    const sessionId = 'integration-session-1';
    type TranscriptionUpdate = {
      sessionId: string;
      text: string;
      isFinal: boolean;
      confidence?: number;
    };

    const isProcessingUpdate = (
      value: unknown
    ): value is { uploadId: string; status: string } => {
      if (typeof value !== 'object' || value === null) {
        return false;
      }

      const candidate = value as { uploadId?: unknown; status?: unknown };
      return (
        typeof candidate.uploadId === 'string' &&
        typeof candidate.status === 'string'
      );
    };

    const isTranscriptionStatus = (
      value: unknown
    ): value is { sessionId: string; status: string } => {
      if (typeof value !== 'object' || value === null) {
        return false;
      }

      const candidate = value as { sessionId?: unknown; status?: unknown };
      return (
        typeof candidate.sessionId === 'string' &&
        typeof candidate.status === 'string'
      );
    };

    const transcriptionPromise = waitForSocketEvent<TranscriptionUpdate>(
      client!,
      'transcriptionUpdate',
      {
        timeoutMs: 5_000,
        message:
          'Timeout waiting for transcriptionUpdate event during socket integration test',
        filter: payload => payload.sessionId === sessionId,
      }
    );

    client!.emit('joinSession', { sessionId });

    await waitForSocketEvent(client!, 'processingUpdate', {
      timeoutMs: 5_000,
      message: 'Timeout waiting for join session acknowledgement',
      filter: payload =>
        isProcessingUpdate(payload) &&
        payload.uploadId === sessionId &&
        payload.status === 'pending',
    });

    client!.emit('startTranscription', { sessionId });

    await waitForSocketEvent(client!, 'transcriptionStatus', {
      timeoutMs: 5_000,
      message: 'Timeout waiting for transcription status running update',
      filter: payload =>
        isTranscriptionStatus(payload) &&
        payload.sessionId === sessionId &&
        payload.status === 'running',
    });

    scenario.emit(sessionId, {
      type: 'transcription',
      payload: {
        message_type: 'final',
        text: 'hello adventurers',
        confidence: 0.92,
      },
    });

    const transcript = await transcriptionPromise;

    expect(transcript).toMatchObject({
      sessionId,
      text: 'hello adventurers',
      isFinal: true,
    });

    client!.emit('audioChunk', {
      sessionId,
      chunk: new Uint8Array([1, 2, 3, 4]),
    });

    await waitForCondition(
      () => scenario.getAudioChunks(sessionId).length === 1,
      {
        timeout: 5_000,
        interval: 50,
        description: 'Waiting for AssemblyAI mock to receive first audio chunk',
      }
    );

    expect(scenario.getAudioChunks(sessionId)).toHaveLength(1);
  });
});
