import { describe, it, expect } from 'vitest';

import {
  TOOLING_VERSION_POLICY,
  getToolPolicyById,
  toolingVersionPolicySchema,
} from '@critgenius/shared/config/toolingVersionPolicy';
import { assertIsSubset } from '@critgenius/test-utils';

describe('tooling version policy manifest', () => {
  it('matches the published schema', () => {
    const result = toolingVersionPolicySchema.safeParse(TOOLING_VERSION_POLICY);
    expect(result.success).toBe(true);
  });

  it('includes mandatory tool policies', () => {
    const toolIds = TOOLING_VERSION_POLICY.tools.map(tool => tool.id);
    assertIsSubset(
      ['node', 'pnpm'],
      toolIds,
      'policy must include node and pnpm entries'
    );
  });

  it('enforces Node.js minimum version', () => {
    const nodePolicy = getToolPolicyById('node');
    expect(nodePolicy).toBeDefined();
    expect(nodePolicy?.expected.minimum).toBe('20.0.0');
    expect(
      nodePolicy?.versionSources.some(source => source.file === 'package.json')
    ).toBe(true);
    expect(
      nodePolicy?.cliChecks.some(check => check.command.includes('node'))
    ).toBe(true);
  });

  it('enforces pnpm exact version', () => {
    const pnpmPolicy = getToolPolicyById('pnpm');
    expect(pnpmPolicy).toBeDefined();
    expect(pnpmPolicy?.expected.version).toBe('8.15.8');
    expect(
      pnpmPolicy?.versionSources.some(source => source.file === 'package.json')
    ).toBe(true);
    expect(
      pnpmPolicy?.cliChecks.some(check => check.command[0] === 'pnpm')
    ).toBe(true);
  });
});
