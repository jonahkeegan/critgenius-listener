import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

export async function runAction(action, payload = {}) {
  if (!action) {
    throw new Error('Action argument is required');
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const repoRoot = join(scriptDir, '..', '..', '..');
  const moduleHref = pathToFileURL(
    join(repoRoot, 'scripts', 'validate-versions.mjs')
  ).href;
  const moduleExports = await import(moduleHref);

  switch (action) {
    case 'parseVersion': {
      return moduleExports.parseVersion(payload.value);
    }
    case 'evaluateComparison': {
      return moduleExports.evaluateComparison({
        comparison: payload.comparison,
        expected: payload.expected,
        actualValue: payload.actualValue,
      });
    }
    case 'compareVersions': {
      return moduleExports.compareVersions(payload.a, payload.b);
    }
    case 'runValidation': {
      const policyPath = join(
        repoRoot,
        'config',
        'tooling-version-policy.json'
      );
      const policyJson = await readFile(policyPath, 'utf8');
  const baseCiYaml = `name: CI\njobs:\n  build:\n    steps:\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 18\n      - uses: pnpm/action-setup@v4\n`;

      const io = {
        async readFile(path, encoding = 'utf8') {
          void encoding;
          const normalizedPath = path.replace(/\\/g, '/');
          if (path === policyPath) {
            return policyJson;
          }
          if (normalizedPath.endsWith('package.json')) {
            const packageManager =
              payload.scenario === 'downgraded' ? 'pnpm@8.14.0' : 'pnpm@8.15.8';
            return JSON.stringify({
              name: 'stub',
              engines: { node: '>=18.0.0' },
              packageManager,
            });
          }
          if (normalizedPath.endsWith('.github/workflows/ci.yml')) {
            return baseCiYaml;
          }
          throw new Error(`Unexpected file read: ${path}`);
        },
        async writeFile() {},
        async mkdir() {},
        async exec(cmd) {
          if (cmd === 'git') {
            return { stdout: '', stderr: '' };
          }
          if (cmd === 'node') {
            return { stdout: 'v18.20.4\n', stderr: '' };
          }
          if (cmd === 'pnpm') {
            const version =
              payload.scenario === 'downgraded' ? '8.14.0' : '8.15.8';
            return { stdout: `${version}\n`, stderr: '' };
          }
          throw new Error(`Unexpected exec: ${cmd}`);
        },
      };

      const originalLog = console.log;
      const originalInfo = console.info;
      const originalWarn = console.warn;

      console.log = () => {};
      console.info = () => {};
      console.warn = () => {};

      try {
        const result = await moduleExports.runValidation({
          mode: 'staged',
          io,
          writeArtifacts: false,
        });
        return {
          hasFailures: result.hasFailures,
          issues: result.issues,
        };
      } finally {
        console.log = originalLog;
        console.info = originalInfo;
        console.warn = originalWarn;
      }
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}