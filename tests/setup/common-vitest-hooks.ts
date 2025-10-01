import { afterEach, beforeEach, vi } from 'vitest';

if (!process.env.TZ) {
  process.env.TZ = 'UTC';
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.resetModules();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.resetModules();
  vi.useRealTimers();
});
