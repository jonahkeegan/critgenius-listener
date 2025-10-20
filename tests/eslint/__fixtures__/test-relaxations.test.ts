import { describe, expect, it } from 'vitest';

describe('test file relaxations', () => {
  it('allows unsafe patterns when mocking', () => {
    const payload: any = { value: 'mock' };
    const result: any = payload.value;
    expect(result).toBe('mock');
  });
});
