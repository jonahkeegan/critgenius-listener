import { describe, it, expect } from 'vitest';
import { ESLint, Linter } from 'eslint';
import path from 'node:path';

const root = path.resolve(__dirname, '..', '..');

async function runLint(file: string) {
  const eslint = new ESLint({ cwd: root });
  const results = await eslint.lintFiles([file]);
  if (!results.length) throw new Error('No lint result for ' + file);
  return results[0];
}

describe('ESLint accessibility rule regression', () => {
  it('flags intentional accessibility violations', async () => {
    const resultInvalid = await runLint(
      'tests/eslint/__fixtures__/a11y-invalid.tsx'
    );
    const ruleIds = (resultInvalid!.messages as Linter.LintMessage[])
      .map(m => m.ruleId)
      .filter((r): r is string => Boolean(r));
    expect(ruleIds).toContain('jsx-a11y/alt-text');
    expect(ruleIds).toContain('jsx-a11y/no-autofocus');
    // interactive button missing key handlers should trigger either click-events-have-key-events or interactive-supports-focus
    expect(
      ruleIds.some(r =>
        [
          'jsx-a11y/click-events-have-key-events',
          'jsx-a11y/interactive-supports-focus',
        ].includes(r)
      )
    ).toBe(true);
  });

  it('does not flag valid accessibility patterns', async () => {
    const resultValid = await runLint(
      'tests/eslint/__fixtures__/a11y-valid.tsx'
    );
    const errorRuleIds = (resultValid!.messages as Linter.LintMessage[])
      .map(m => m.ruleId)
      .filter((r): r is string => Boolean(r));
    expect(errorRuleIds).not.toContain('jsx-a11y/alt-text');
    expect(errorRuleIds).not.toContain('jsx-a11y/no-autofocus');
  });
});
