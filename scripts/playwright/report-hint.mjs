import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const reportDir = path.join(
  repoRoot,
  'packages',
  'client',
  'playwright-report'
);
const reportIndex = path.join(reportDir, 'index.html');

const lines = [''];
lines.push('Playwright report helper');
lines.push('-------------------------');
lines.push(
  'Note: Ignore the generic Playwright hint above and use the commands below.'
);
lines.push('');

try {
  await access(reportIndex);
  lines.push('Latest report detected at:');
  lines.push(`  ${reportDir}`);
  lines.push('Open it with:');
  lines.push('  pnpm run test:e2e:report');
} catch (error) {
  if (error && typeof error === 'object' && error && error.code === 'ENOENT') {
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
console.log(lines.join('\n'));
