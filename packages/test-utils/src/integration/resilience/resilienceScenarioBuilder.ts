import type { SocketIntegrationContext } from '../socket/socketIOIntegrationHelper.js';
import type { AssemblyAITestScenario } from '../assemblyai/assemblyAITestScenarios.js';

export type ResilienceMetrics = {
  socketLatencyMs: number;
  assemblyAIErrors: string[];
};

export type ResilienceScenario = {
  metrics: Readonly<ResilienceMetrics>;
  applySocketLatency: (
    context: SocketIntegrationContext,
    latencyMs: number
  ) => void;
  triggerAssemblyAIError: (
    scenario: AssemblyAITestScenario,
    sessionId: string,
    message: string
  ) => void;
  reset: () => void;
};

export function createResilienceScenarioBuilder(): ResilienceScenario {
  const metrics: ResilienceMetrics = {
    socketLatencyMs: 0,
    assemblyAIErrors: [],
  };

  const cleanupFns: Array<() => void> = [];

  return {
    metrics,
    applySocketLatency: (context, latencyMs) => {
      if (latencyMs <= 0) {
        return;
      }

      metrics.socketLatencyMs = latencyMs;
      const originalEmit = context.client.emit.bind(context.client);

      context.client.emit = function patchedEmit(
        event: string,
        ...args: unknown[]
      ) {
        setTimeout(() => {
          originalEmit(event, ...args);
        }, latencyMs);
        return context.client;
      } as typeof context.client.emit;

      cleanupFns.push(() => {
        context.client.emit = originalEmit;
        metrics.socketLatencyMs = 0;
      });
    },
    triggerAssemblyAIError: (scenario, sessionId, message) => {
      metrics.assemblyAIErrors.push(message);
      scenario.emit(sessionId, { type: 'error', payload: new Error(message) });
    },
    reset: () => {
      for (const cleanup of cleanupFns.splice(0, cleanupFns.length)) {
        cleanup();
      }
      metrics.assemblyAIErrors.length = 0;
    },
  };
}
