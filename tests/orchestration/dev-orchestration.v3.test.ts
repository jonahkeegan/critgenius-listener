import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

function topo(services: Record<string, { dependencies?: string[] }>) {
  const script = path.resolve(
    process.cwd(),
    'scripts/orchestration-v3-bridge.cjs'
  );
  const out = execFileSync('node', [script, JSON.stringify(services)], {
    encoding: 'utf8',
  });
  return JSON.parse(out);
}

describe('dev-orchestration.v3 topology', () => {
  it('orders simple dependency chain', () => {
    const services = {
      a: { dependencies: [] },
      b: { dependencies: ['a'] },
      c: { dependencies: ['b'] },
    };
    const order = topo(services);
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('throws on cycle', () => {
    const services = {
      a: { dependencies: ['c'] },
      b: { dependencies: ['a'] },
      c: { dependencies: ['b'] },
    };
    expect(() => topo(services)).toThrow(
      /Cycle detected in service dependency graph: a -> c -> b -> a/
    );
  });
});
