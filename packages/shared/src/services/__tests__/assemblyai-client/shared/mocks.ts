/**
 * Shared mock setup for AssemblyAI SDK used across client tests.
 */

import { vi } from 'vitest';

const assemblyAiMocks = vi.hoisted(() => {
  const mockTranscriberConnect = vi.fn<() => Promise<void> | void>();
  const mockTranscriberSendAudio = vi.fn<(data: ArrayBuffer) => unknown>();
  const mockTranscriberClose = vi.fn<() => Promise<void> | void>();
  const mockTranscriberOn =
    vi.fn<(event: string, callback: (...args: any[]) => void) => void>();

  const mockTranscriber = {
    connect: mockTranscriberConnect,
    sendAudio: mockTranscriberSendAudio,
    close: mockTranscriberClose,
    on: mockTranscriberOn,
  };

  const transcriberFactory = vi
    .fn<(options?: Record<string, unknown>) => typeof mockTranscriber>()
    .mockImplementation(() => mockTranscriber);

  const createAssemblyAIInstance = () => ({
    realtime: {
      transcriber: transcriberFactory,
    },
  });

  const mockAssemblyAI = vi.fn().mockImplementation(createAssemblyAIInstance);

  const reset = () => {
    mockTranscriberConnect.mockReset();
    mockTranscriberSendAudio.mockReset();
    mockTranscriberClose.mockReset();
    mockTranscriberOn.mockReset();
    transcriberFactory.mockReset();
    transcriberFactory.mockImplementation(() => mockTranscriber);
    mockAssemblyAI.mockReset();
    mockAssemblyAI.mockImplementation(createAssemblyAIInstance);
  };

  return {
    mockAssemblyAI,
    mockTranscriber,
    mockTranscriberConnect,
    mockTranscriberSendAudio,
    mockTranscriberClose,
    mockTranscriberOn,
    transcriberFactory,
    reset,
  };
});

vi.mock('assemblyai', () => {
  const { mockAssemblyAI } = assemblyAiMocks;
  return {
    AssemblyAI: mockAssemblyAI,
    RealtimeTranscriber: vi.fn(),
  };
});

const {
  mockAssemblyAI,
  mockTranscriber,
  mockTranscriberConnect,
  mockTranscriberSendAudio,
  mockTranscriberClose,
  mockTranscriberOn,
  transcriberFactory,
  reset: resetAssemblyAIMocks,
} = assemblyAiMocks;

export {
  assemblyAiMocks,
  mockAssemblyAI,
  mockTranscriber,
  mockTranscriberConnect,
  mockTranscriberSendAudio,
  mockTranscriberClose,
  mockTranscriberOn,
  transcriberFactory,
  resetAssemblyAIMocks,
};
