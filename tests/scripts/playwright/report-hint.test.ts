import { describe, it, expect, vi } from 'vitest';

import {
  buildReportHint,
  defaultReportDir,
} from '../../../scripts/playwright/report-hint-lib.mjs';

describe('buildReportHint', () => {
  it('reports existing HTML output', async () => {
    const accessFn = vi.fn().mockResolvedValue(undefined);
    const { lines } = await buildReportHint({
      reportDir: defaultReportDir,
      accessFn,
    });

    expect(accessFn).toHaveBeenCalledOnce();
    expect(lines.join('\n')).toContain('Latest report detected at:');
  });

  it('guides generation when report is missing', async () => {
    const missingError = Object.assign(new Error('not found'), {
      code: 'ENOENT',
    });
    const accessFn = vi.fn().mockRejectedValue(missingError);

    const { lines } = await buildReportHint({
      reportDir: '/tmp/non-existent',
      accessFn,
    });

    const output = lines.join('\n');
    expect(output).toContain(
      'No Playwright report found. Generate one by running:'
    );
    expect(output).toContain('playwright test --project=chromium-desktop');
  });

  it('surfaces unexpected filesystem errors', async () => {
    const failure = Object.assign(new Error('permission denied'), {
      code: 'EACCES',
    });
    const accessFn = vi.fn().mockRejectedValue(failure);

    const { lines } = await buildReportHint({
      reportDir: '/tmp/protected',
      accessFn,
    });

    const output = lines.join('\n');
    expect(output).toContain('Unable to verify Playwright report status.');
    expect(output).toContain('permission denied');
  });
});
