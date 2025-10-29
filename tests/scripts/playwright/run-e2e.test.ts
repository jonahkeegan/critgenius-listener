import { describe, it, expect, vi } from 'vitest';

import {
  runPlaywrightSuite,
  repoRoot,
} from '../../../scripts/playwright/run-e2e-lib.mjs';

describe('runPlaywrightSuite', () => {
  it('returns the Playwright exit code and prints the hint', async () => {
    const spawn = vi.fn().mockReturnValue({ status: 0 });
    const reportHint = vi.fn().mockResolvedValue(undefined);

    const exitCode = await runPlaywrightSuite({ spawn, reportHint });

    expect(exitCode).toBe(0);
    expect(spawn).toHaveBeenCalledWith(
      'pnpm',
      ['--filter', '@critgenius/client', 'test:browser'],
      expect.objectContaining({ cwd: repoRoot })
    );
    expect(reportHint).toHaveBeenCalledOnce();
  });

  it('propagates failing exit codes', async () => {
    const spawn = vi.fn().mockReturnValue({ status: 1 });
    const reportHint = vi.fn().mockResolvedValue(undefined);

    const exitCode = await runPlaywrightSuite({ spawn, reportHint });

    expect(exitCode).toBe(1);
    expect(reportHint).toHaveBeenCalledOnce();
  });

  it('falls back to failure when spawn does not return status', async () => {
    const spawn = vi.fn().mockReturnValue({ error: new Error('boom') });
    const logger = { error: vi.fn() };
    const reportHint = vi.fn().mockResolvedValue(undefined);

    const exitCode = await runPlaywrightSuite({
      spawn,
      reportHint,
      logger,
    });

    expect(exitCode).toBe(1);
    expect(logger.error).toHaveBeenCalled();
  });

  it('logs when report hint throws', async () => {
    const spawn = vi.fn().mockReturnValue({ status: 0 });
    const logger = { error: vi.fn() };
    const reportHint = vi.fn().mockRejectedValue(new Error('hint-fail'));

    const exitCode = await runPlaywrightSuite({
      spawn,
      reportHint,
      logger,
    });

    expect(exitCode).toBe(0);
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to display Playwright report hint',
      expect.any(Error)
    );
  });
});
