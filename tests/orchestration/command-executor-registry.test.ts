import { describe, it, expect } from 'vitest';
import {
  getExecutor,
  registerExecutor,
  listExecutorTypes,
} from '../../scripts/command-executors/registry.mjs';

describe('command executor registry', () => {
  it('returns pnpm executor by default', () => {
    const Cls = getExecutor('pnpm');
    expect(Cls).toBeTypeOf('function');
  });

  it('can register and retrieve a custom executor', () => {
    class MockExec {}
    registerExecutor('mock', MockExec);
    const Cls = getExecutor('mock');
    expect(Cls).toBe(MockExec);
    expect(listExecutorTypes()).toContain('mock');
  });
});
