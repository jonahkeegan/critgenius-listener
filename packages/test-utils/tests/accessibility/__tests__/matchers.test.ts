import { describe, it, expect, vi } from 'vitest';
import type { AxeResults, RunOptions } from 'axe-core';

type ModuleSetup = {
  matchersModule: typeof import('../../../src/accessibility/matchers');
  helpers: typeof import('../../../src/accessibility/helpers');
  toHaveNoViolationsMock?: ReturnType<typeof vi.fn>;
};

type ModuleOptions = {
  includeMatcher?: boolean;
};

const createModule = async (
  options: ModuleOptions = {}
): Promise<ModuleSetup> => {
  vi.resetModules();

  const configureMock = vi.fn();
  const runMock = vi.fn();
  const resetMock = vi.fn();
  vi.doMock('axe-core', () => ({
    __esModule: true,
    default: {
      configure: configureMock,
      run: runMock,
      reset: resetMock,
    },
    configure: configureMock,
    run: runMock,
    reset: resetMock,
  }));

  vi.doMock('vitest-axe/extend-expect', () => ({}));

  const toHaveNoViolationsMock = vi.fn().mockReturnValue({
    pass: true,
    message: () => 'ok',
  });

  vi.doMock('vitest-axe/matchers', () => {
    if (options.includeMatcher === false) {
      return { __esModule: true, default: {} };
    }

    return {
      __esModule: true,
      default: { toHaveNoViolations: toHaveNoViolationsMock },
      toHaveNoViolations: toHaveNoViolationsMock,
    };
  });

  const helpers = await import('../../../src/accessibility/helpers');
  helpers.resetAxeConfiguration();
  const matchersModule = await import('../../../src/accessibility/matchers');

  return { matchersModule, helpers, toHaveNoViolationsMock };
};

describe('accessibility matchers', () => {
  it('registers vitest-axe matchers exactly once and exposes toPassA11yAudit', async () => {
    const { matchersModule, toHaveNoViolationsMock } = await createModule();
    if (!toHaveNoViolationsMock) {
      throw new Error('vitest-axe matcher mock not initialized');
    }
    const extendSpy = vi.spyOn(expect, 'extend');

    matchersModule.registerAccessibilityMatchers();

    expect(extendSpy).toHaveBeenCalledTimes(1);
    const extended = extendSpy.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(typeof extended.toPassA11yAudit).toBe('function');
    expect(extended.toHaveNoViolations).toBe(toHaveNoViolationsMock);

    extendSpy.mockClear();
    matchersModule.registerAccessibilityMatchers();
    expect(extendSpy).not.toHaveBeenCalled();

    extendSpy.mockRestore();
  });

  it('delegates to runAxeAudit and base matcher', async () => {
    const { matchersModule, helpers, toHaveNoViolationsMock } =
      await createModule();
    if (!toHaveNoViolationsMock) {
      throw new Error('vitest-axe matcher mock not initialized');
    }
    const fakeResults = {
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: [],
    } as unknown as AxeResults;

    const runSpy = vi
      .spyOn(helpers, 'runAxeAudit')
      .mockResolvedValue(fakeResults);

    const context = { isNot: false } as unknown;
    const target = { nodeType: 1 };
    const options = { reporter: 'json' } as RunOptions;

    await matchersModule.toPassA11yAudit.call(context, target, options);

    expect(runSpy).toHaveBeenCalledWith(target, options);
    expect(toHaveNoViolationsMock).toHaveBeenCalledWith(fakeResults);
    expect(toHaveNoViolationsMock.mock.instances[0]).toBe(context);

    runSpy.mockRestore();
  });

  it('throws when base matcher is unavailable', async () => {
    const { matchersModule, helpers } = await createModule({
      includeMatcher: false,
    });
    const fakeResults = {
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: [],
    } as unknown as AxeResults;

    vi.spyOn(helpers, 'runAxeAudit').mockResolvedValue(fakeResults);

    await expect(
      matchersModule.toPassA11yAudit.call({}, {}, undefined)
    ).rejects.toThrow('toHaveNoViolations');
  });
});
