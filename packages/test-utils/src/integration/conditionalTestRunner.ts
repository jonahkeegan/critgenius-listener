import { describe, it } from 'vitest';

type TestLike = typeof it;
type DescribeLike = typeof describe;

type Condition = boolean | (() => boolean);

type ConditionalOptions = {
  reason?: string;
};

function resolveCondition(condition: Condition): boolean {
  return typeof condition === 'function' ? condition() : condition;
}

export function describeIf(
  condition: Condition,
  name: Parameters<DescribeLike>[0],
  factory: Parameters<DescribeLike>[1],
  options: ConditionalOptions = {}
): void {
  const resolved = resolveCondition(condition);
  const target = resolved ? describe : describe.skip;
  const label =
    resolved || !options.reason ? name : `${name} (skipped: ${options.reason})`;
  target(label, factory);
}

export function testIf(
  condition: Condition,
  name: Parameters<TestLike>[0],
  factory: Parameters<TestLike>[1],
  options: ConditionalOptions = {}
): void {
  const resolved = resolveCondition(condition);
  const target = resolved ? it : it.skip;
  const label =
    resolved || !options.reason ? name : `${name} (skipped: ${options.reason})`;
  target(label, factory);
}

export function testUnless(
  condition: Condition,
  name: Parameters<TestLike>[0],
  factory: Parameters<TestLike>[1],
  options: ConditionalOptions = {}
): void {
  testIf(!resolveCondition(condition), name, factory, options);
}
