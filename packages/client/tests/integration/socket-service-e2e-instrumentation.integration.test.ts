import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import type { ServerToClientEvents } from '../../src/types/socket';

type TestGlobal = typeof globalThis & {
  __critgeniusSocketService?: unknown;
  __critgeniusSocketEvents?: Array<{
    event: keyof ServerToClientEvents;
    payload: ReadonlyArray<unknown>;
    timestamp: number;
  }>;
};

type ImportMetaWithEnv = ImportMeta & {
  env?: Record<string, string | undefined>;
};

function getWritableEnv(): Record<string, string | undefined> {
  const meta = import.meta as ImportMetaWithEnv;
  if (!meta.env) {
    meta.env = {};
  }
  return meta.env;
}

const originalViteE2E = getWritableEnv().VITE_E2E;
const originalProcessViteE2E = process.env.VITE_E2E;

function setViteE2E(value: string | undefined): void {
  const currentEnv = getWritableEnv();
  if (typeof value === 'string') {
    currentEnv.VITE_E2E = value;
    process.env.VITE_E2E = value;
  } else {
    delete currentEnv.VITE_E2E;
    delete process.env.VITE_E2E;
  }
}

async function importSocketServiceWithFlag(
  flag: string | undefined
): Promise<typeof import('../../src/services/socketService')> {
  vi.resetModules();
  setViteE2E(flag);
  return await import('../../src/services/socketService');
}

afterEach(() => {
  vi.restoreAllMocks();
  const testGlobal = globalThis as TestGlobal;
  delete testGlobal.__critgeniusSocketService;
  delete testGlobal.__critgeniusSocketEvents;
});

afterAll(() => {
  setViteE2E(originalViteE2E);
  if (typeof originalProcessViteE2E === 'string') {
    process.env.VITE_E2E = originalProcessViteE2E;
  } else {
    delete process.env.VITE_E2E;
  }
});

describe('socketService E2E instrumentation', () => {
  it('registers socket hooks on the global scope when VITE_E2E is true', async () => {
    const testGlobal = globalThis as TestGlobal;

    const { default: socketService } =
      await importSocketServiceWithFlag('true');

    expect(testGlobal.__critgeniusSocketService).toBe(socketService);
    expect(Array.isArray(testGlobal.__critgeniusSocketEvents)).toBe(true);
    expect(testGlobal.__critgeniusSocketEvents).toHaveLength(0);
  });

  it('records emitted events through emitTestEvent when instrumentation is active', async () => {
    const testGlobal = globalThis as TestGlobal;
    const fakeNow = 1735603200000;
    vi.spyOn(Date, 'now').mockReturnValue(fakeNow);

    const { default: socketService } =
      await importSocketServiceWithFlag('true');

    const payload = {
      sessionId: 'session-123',
      text: 'Mock transcript',
      timestamp: '2025-10-30T00:00:00.000Z',
      confidence: 0.98,
    } satisfies Parameters<ServerToClientEvents['transcriptionUpdate']>[0];

    socketService.emitTestEvent('transcriptionUpdate', payload);

    expect(testGlobal.__critgeniusSocketEvents).toEqual([
      {
        event: 'transcriptionUpdate',
        payload: [payload],
        timestamp: fakeNow,
      },
    ]);
  });

  it('leaves globals untouched and drops test events when VITE_E2E is not true', async () => {
    const testGlobal = globalThis as TestGlobal;

    const { default: socketService } =
      await importSocketServiceWithFlag(undefined);

    expect(testGlobal.__critgeniusSocketService).toBeUndefined();
    expect(testGlobal.__critgeniusSocketEvents).toBeUndefined();

    const payload = {
      sessionId: 'session-123',
      text: 'Mock transcript',
      timestamp: '2025-10-30T00:00:00.000Z',
    } satisfies Parameters<ServerToClientEvents['transcriptionUpdate']>[0];

    socketService.emitTestEvent('transcriptionUpdate', payload);

    expect(testGlobal.__critgeniusSocketEvents).toBeUndefined();
  });
});
