import { afterEach, beforeEach, vi } from 'vitest';

// Performance benchmarks rely on real timer behavior for jitter simulation.
beforeEach(() => {
  if (vi.isFakeTimers()) {
    vi.useRealTimers();
  }
});

afterEach(() => {
  if (vi.isFakeTimers()) {
    vi.useRealTimers();
  }
});
