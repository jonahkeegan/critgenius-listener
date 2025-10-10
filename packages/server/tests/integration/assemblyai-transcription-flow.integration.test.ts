import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { io as createClient, type Socket } from 'socket.io-client';
import {
  IntegrationTestHarness,
  createResilienceScenarioBuilder,
  type SocketIntegrationContext,
  type AssemblyAITestScenario,
  allocateAvailablePort,
  localDevelopmentPreset,
  mergePresets,
  waitForSocketEventWithTimeout as waitForSocketEvent,
} from '@critgenius/test-utils/integration';
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
  const scenario = createMockAssemblyAIScenario('assemblyai-flow');
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

describe('AssemblyAI transcription flow integration', () => {
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
      'assemblyai-transcription-flow',
      localDevelopmentPreset,
      {
        name: 'assemblyai-transcription-flow-ports',
        values: Object.freeze({
          PORT: String(serverPort),
          CLIENT_PORT: String(clientPort),
          CLIENT_SOCKET_URL: `http://localhost:${serverPort}`,
        }),
      }
    );

    harness = new IntegrationTestHarness({
      preset,
      workflowName: 'assemblyai-transcription-flow',
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
      message:
        'Timeout waiting for Socket.IO client connection (assemblyai integration)',
    });
  });

  afterEach(async () => {
    client?.removeAllListeners();
    client?.disconnect();
    client = null;
    await harness.teardown();
  });

  it('emits structured error when AssemblyAI reports a failure', async () => {
    const sessionId = 'assemblyai-session-error';
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

    const errorPromise = waitForSocketEvent<{ code: string; message: string }>(
      client!,
      'error',
      {
        timeoutMs: 5_000,
        message:
          'Timeout waiting for error event during AssemblyAI transcription flow integration',
        filter: payload =>
          typeof payload === 'object' &&
          payload !== null &&
          'code' in payload &&
          (payload as { code?: unknown }).code === 'TRANSCRIPTION_ERROR',
      }
    );

    const resilience = createResilienceScenarioBuilder();
    const context: SocketIntegrationContext = {
      io: server!.io,
      httpServer: server!.httpServer,
      client: client!,
      port: Number(process.env.PORT ?? 0),
      cleanup: async () => {},
      waitForClientEvent: async () => {
        throw new Error('waitForClientEvent not available in this scenario');
      },
    };

    resilience.applySocketLatency(context, 10);

    client!.emit('joinSession', { sessionId });

    await waitForSocketEvent(client!, 'processingUpdate', {
      timeoutMs: 5_000,
      message:
        'Timeout waiting for join session acknowledgement (assemblyai flow)',
      filter: payload =>
        isProcessingUpdate(payload) &&
        payload.uploadId === sessionId &&
        payload.status === 'pending',
    });

    client!.emit('startTranscription', { sessionId });

    await waitForSocketEvent(client!, 'transcriptionStatus', {
      timeoutMs: 5_000,
      message:
        'Timeout waiting for transcription status running update (assemblyai flow)',
      filter: payload =>
        isTranscriptionStatus(payload) &&
        payload.sessionId === sessionId &&
        payload.status === 'running',
    });

    resilience.triggerAssemblyAIError(
      scenario,
      sessionId,
      'simulated downstream failure'
    );

    const errorPayload = await errorPromise;

    expect(errorPayload).toMatchObject({
      code: 'TRANSCRIPTION_ERROR',
    });

    expect(resilience.metrics.assemblyAIErrors).toContain(
      'simulated downstream failure'
    );

    resilience.reset();
  });
});
