export interface FactoryBuildOptions<T> {
  overrides?: Partial<T>;
}

export abstract class BaseFactory<T> {
  private sequence = 0;

  build(overrides: Partial<T> = {}): T {
    this.sequence += 1;
    const base = this.create(this.sequence);
    return {
      ...base,
      ...overrides,
    };
  }

  buildList(
    count: number,
    overrideFactory?: (index: number) => Partial<T>
  ): T[] {
    return Array.from({ length: count }, (_, index) =>
      this.build(overrideFactory?.(index + 1) ?? {})
    );
  }

  protected abstract create(sequence: number): T;
}

export const createSequentialId = (
  namespace: string,
  sequence: number
): string => `${namespace}-${sequence.toString(36)}`;
