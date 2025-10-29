import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..', '..');
export const defaultReportDir = path.join(
  repoRoot,
  'packages',
  'client',
  'playwright-report'
);

function buildReportIndexPath(reportDir) {
  return path.join(reportDir, 'index.html');
}

export async function buildReportHint({
  reportDir = defaultReportDir,
  accessFn = access,
} = {}) {
  const reportIndex = buildReportIndexPath(reportDir);
  const lines = [''];
  lines.push('Playwright report helper');
  lines.push('-------------------------');
  lines.push(
    'Note: Ignore the generic Playwright hint above and use the commands below.'
  );
  lines.push('');

  try {
    await accessFn(reportIndex);
    lines.push('Latest report detected at:');
    lines.push(`  ${reportDir}`);
    lines.push('Open it with:');
    lines.push('  pnpm run test:e2e:report');
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      lines.push('No Playwright report found. Generate one by running:');
      lines.push(
        '  pnpm --filter @critgenius/client exec -- playwright test --project=chromium-desktop'
      );
      lines.push('After it completes, open the HTML output with:');
      lines.push('  pnpm run test:e2e:report');
    } else {
      lines.push('Unable to verify Playwright report status.');
      lines.push(`Error: ${String(error)}`);
    }
  }

  lines.push('');
  return { lines, reportDir, reportIndex };
}

export async function printReportHint(options = {}, logger = console.log) {
  const { lines } = await buildReportHint(options);
  logger(lines.join('\n'));
  return lines;
}