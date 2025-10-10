import { afterAll, describe, expect, it, vi } from 'vitest';
import {
  IntegrationTestHarness,
  localDevelopmentPreset,
  ciPreset,
  mergePresets,
  createSocketIntegrationContext,
  createMockAssemblyAIScenario,
  createResilienceScenarioBuilder,
} from '../../src/integration/index';

const ORIGINAL_PORT = process.env.PORT;

describe('IntegrationTestHarness', () => {
  it('applies presets and starts registered services automatically', async () => {
    const harness = new IntegrationTestHarness({
      preset: localDevelopmentPreset,
    });

    const startSpy = vi.fn();
    const stopSpy = vi.fn();

    harness.registerService({
      name: 'mock-service',
      start: async () => startSpy(),
      stop: async () => stopSpy(),
      metadata: { package: 'test' },
    });

    const context = await harness.setup();
    expect(startSpy).toHaveBeenCalledTimes(1);
    expect(context.workflowName).toBe('unnamed-workflow');
    expect(process.env.PORT).toBe(localDevelopmentPreset.values.PORT);

    await harness.teardown();
    expect(stopSpy).toHaveBeenCalledTimes(1);
  });

  it('restores environment variables after teardown', async () => {
    process.env.PORT = '9999';
    const harness = new IntegrationTestHarness({ preset: ciPreset });
    await harness.setup();
    expect(process.env.PORT).toBe(ciPreset.values.PORT);
    await harness.teardown();
    expect(process.env.PORT).toBe('9999');
  });
});

describe('Environment preset utilities', () => {
  it('merges presets with later presets winning conflicts', () => {
    const merged = mergePresets('merged', localDevelopmentPreset, ciPreset);
    expect(merged.values.PORT).toBe(ciPreset.values.PORT);
    expect(merged.values.CLIENT_PORT).toBe(ciPreset.values.CLIENT_PORT);
    expect(merged.name).toBe('merged');
  });
});

describe('Socket.IO integration helper', () => {
  it('creates a connected client + server pair', async () => {
    const context = await createSocketIntegrationContext();
    expect(context.client.connected).toBe(true);
    context.client.emit('custom-event', { payload: 'test' });
    await context.cleanup();
  });
});

describe('AssemblyAI test scenarios', () => {
  it('delivers queued events to registered handlers', async () => {
    const scenario = createMockAssemblyAIScenario('assemblyai-test');
    const handlers = {
      onTranscription: vi.fn(),
      onStatus: vi.fn(),
      onError: vi.fn(),
      onClose: vi.fn(),
    };

    const connector = new scenario.Connector(
      'session-123',
      {
        apiKey: 'test-key',
        sampleRate: 16000,
      },
      handlers
    );

    await connector.connect();
    scenario.emit('session-123', {
      type: 'transcription',
      payload: { text: 'hello world', message_type: 'final' },
    });
    scenario.emit('session-123', {
      type: 'error',
      payload: new Error('failure'),
    });

    expect(handlers.onTranscription).toHaveBeenCalledWith({
      text: 'hello world',
      message_type: 'final',
    });
    expect(handlers.onError).toHaveBeenCalledWith(expect.any(Error));
    connector.close();
  });
});

describe('ResilienceScenarioBuilder', () => {
  it('records socket latency and AssemblyAI errors', async () => {
    const resilience = createResilienceScenarioBuilder();
    const context = await createSocketIntegrationContext();
    resilience.applySocketLatency(context, 5);

    const scenario = createMockAssemblyAIScenario();
    resilience.triggerAssemblyAIError(scenario, 'session-1', 'mock failure');

    expect(resilience.metrics.socketLatencyMs).toBe(5);
    expect(resilience.metrics.assemblyAIErrors).toContain('mock failure');

    resilience.reset();
    await context.cleanup();
  });
});

afterAll(() => {
  if (ORIGINAL_PORT === undefined) {
    delete process.env.PORT;
  } else {
    process.env.PORT = ORIGINAL_PORT;
  }
});
