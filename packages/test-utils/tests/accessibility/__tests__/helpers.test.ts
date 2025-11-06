import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from 'vitest';
import { JSDOM } from 'jsdom';
import type { AxeResults, RunOptions } from 'axe-core';
import * as accessibilityHelpers from '../../../src/accessibility/helpers';

const {
  bindWindowGlobals,
  configureAxe,
  createA11yTestContext,
  getAxeConfiguration,
  isAxeRuleEnforced,
  resetAxeConfiguration,
  runAxeAudit,
  __setAxeInstanceForTesting,
} = accessibilityHelpers as typeof accessibilityHelpers & {
  __setAxeInstanceForTesting: (
    instance?: Pick<
      typeof import('axe-core'),
      'configure' | 'reset' | 'run'
    > & {
      getRules?: (typeof import('axe-core'))['getRules'];
    }
  ) => void;
};

const axeMock = {
  configure: vi.fn(),
  run: vi.fn(),
  reset: vi.fn(),
  getRules: vi.fn(),
};

const buildAxeResults = (overrides: Partial<AxeResults> = {}): AxeResults =>
  ({
    violations: [],
    passes: [],
    incomplete: [],
    inapplicable: [],
    ...overrides,
  }) as AxeResults;

const getGlobalRef = () =>
  globalThis as typeof globalThis & Record<string, unknown>;

beforeEach(() => {
  axeMock.configure.mockClear();
  axeMock.run.mockReset();
  axeMock.reset.mockClear();
  axeMock.getRules.mockReset();
  axeMock.run.mockImplementation(async () => buildAxeResults());
  __setAxeInstanceForTesting(axeMock as unknown as typeof import('axe-core'));
  resetAxeConfiguration();
});

afterEach(() => {
  const globalRef = getGlobalRef();
  const keysToDelete = [
    '__critgeniusAxeBindingId__',
    'window',
    'document',
    'navigator',
    'self',
    'HTMLElement',
    'HTMLCanvasElement',
    'Document',
    'DocumentFragment',
    'Text',
    'Element',
    'Node',
  ];

  for (const key of keysToDelete) {
    Reflect.deleteProperty(globalRef, key);
  }

  __setAxeInstanceForTesting(axeMock as unknown as typeof import('axe-core'));
});

afterAll(() => {
  __setAxeInstanceForTesting();
});

describe('axe accessibility helpers', () => {
  it('resets axe configuration to defaults', () => {
    configureAxe({
      spec: { branding: { team: 'QA' } },
      runOptions: { reporter: 'raw' } as RunOptions,
    });

    axeMock.configure.mockClear();
    axeMock.reset.mockClear();

    resetAxeConfiguration();

    expect(axeMock.reset).toHaveBeenCalledTimes(1);
    const snapshot = getAxeConfiguration();
    expect(snapshot.spec.branding?.application).toBe(
      'CritGenius Listener Accessibility Tests'
    );
    expect(snapshot.runOptions.reporter).toBe('v2');
  });

  it('merges custom spec and run options', () => {
    const customRunOptions = {
      reporter: 'raw',
      runOnly: {
        type: 'tag' as const,
        values: ['wcag2a'],
      },
      resultTypes: ['violations'],
      rules: {
        'custom-run-rule': { enabled: true },
      },
    } satisfies RunOptions;

    configureAxe({
      reset: true,
      spec: {
        branding: { product: 'TestHarness' },
        reporter: 'raw',
        checks: [{ id: 'custom-check' } as Record<string, unknown>],
        locale: { language: 'en-US' },
        rules: {
          'video-caption': { enabled: true },
          'custom-spec-rule': { enabled: true },
        },
      },
      runOptions: customRunOptions,
    });

    const snapshot = getAxeConfiguration();
    expect(snapshot.spec.branding?.product).toBe('TestHarness');
    expect(snapshot.spec.rules?.['video-caption']?.enabled).toBe(true);
    expect(
      snapshot.spec.checks?.some(
        check => (check as { id?: string }).id === 'custom-check'
      )
    ).toBe(true);
    expect(snapshot.spec.locale?.language).toBe('en-US');
    expect(snapshot.spec.reporter).toBe('raw');

    expect(snapshot.runOptions.reporter).toBe('raw');
    expect(snapshot.runOptions.resultTypes).toEqual(['violations']);
    expect(
      (snapshot.runOptions.runOnly as { values: string[] }).values
    ).toEqual(['wcag2a']);
    expect(
      (snapshot.runOptions.rules as Record<string, { enabled: boolean }>)[
        'custom-run-rule'
      ]?.enabled
    ).toBe(true);
    expect(snapshot.runOptions.runOnly).toEqual({
      type: 'tag',
      values: ['wcag2a'],
    });
  });

  it('runs axe audits with normalized document targets and restores globals', async () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><main><button>Roll</button></main></body></html>',
      { url: 'http://localhost' }
    );
    const documentTarget = dom.window.document;
    const originalGlobals = {
      window: getGlobalRef().window,
      document: getGlobalRef().document,
    };

    const overrideOptions = {
      resultTypes: ['violations', 'passes'],
      rules: {
        'custom-override': { enabled: false },
      },
    } satisfies RunOptions;

    const auditResult = await runAxeAudit(documentTarget, overrideOptions);

    expect(axeMock.run).toHaveBeenCalledTimes(1);
    const [contextArg, optionsArg] = axeMock.run.mock.calls[0]!;
    expect(contextArg).toBe(documentTarget.documentElement);
    expect((optionsArg as RunOptions).resultTypes).toEqual([
      'violations',
      'passes',
    ]);
    expect(
      (
        (optionsArg as RunOptions).rules as Record<string, { enabled: boolean }>
      )['custom-override']?.enabled
    ).toBe(false);
    expect(auditResult.violations).toEqual([]);

    const currentGlobals = getGlobalRef();
    expect(currentGlobals.window).toBe(originalGlobals.window);
    expect(currentGlobals.document).toBe(originalGlobals.document);

    dom.window.close();
  });

  it('converts document fragments into container elements before auditing', async () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost',
    });
    const fragment = dom.window.document.createDocumentFragment();
    const span = dom.window.document.createElement('span');
    span.textContent = 'fragment node';
    fragment.appendChild(span);

    await runAxeAudit(fragment);

    const [contextArg] = axeMock.run.mock.calls.at(-1)!;
    const container = contextArg as Element;
    expect(container.nodeName).toBe('DIV');
    expect(container.innerHTML).toContain('fragment node');

    dom.window.close();
  });

  it('returns undefined when binding globals without a window', () => {
    const originalWindow = getGlobalRef().window;
    const restore = bindWindowGlobals(null);
    expect(restore).toBeUndefined();
    expect(getGlobalRef().window).toBe(originalWindow);
  });

  it('binds window globals and restores previous values on cleanup', () => {
    const globalRef = getGlobalRef();
    const originalHTMLElement =
      (globalRef.HTMLElement as typeof globalThis.HTMLElement | undefined) ??
      (function OriginalHTMLElement() {} as unknown as typeof globalThis.HTMLElement);
    globalRef.HTMLElement = originalHTMLElement;

    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost',
    });
    const restore = bindWindowGlobals(dom.window as unknown as Window);

    expect(globalRef.window).toBe(dom.window);
    expect(globalRef.document).toBe(dom.window.document);
    expect(globalRef.__critgeniusAxeBindingId__).toBeDefined();

    restore?.();

    expect(globalRef.window).toBeUndefined();
    expect(globalRef.document).toBeUndefined();
    expect(globalRef.HTMLElement).toBe(originalHTMLElement);
    expect(globalRef.__critgeniusAxeBindingId__).toBeUndefined();

    dom.window.close();
  });

  it('creates accessibility test contexts that merge override options', async () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost',
    });
    const target = dom.window.document;

    const baseOverrides = { reporter: 'json' } satisfies RunOptions;
    const additionalOverrides = {
      resultTypes: ['incomplete', 'violations'],
    } satisfies RunOptions;

    const context = createA11yTestContext(target, baseOverrides);
    await context.audit(additionalOverrides);

    const [, optionsArg] = axeMock.run.mock.calls.at(-1)!;
    expect(optionsArg).toMatchObject({
      reporter: 'json',
      resultTypes: ['incomplete', 'violations'],
    });

    dom.window.close();
  });

  it('serializes concurrent axe audits to avoid overlapping executions', async () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost',
    });
    const target = dom.window.document;

    let activeRuns = 0;
    let peakConcurrency = 0;
    axeMock.run.mockImplementation(async () => {
      activeRuns += 1;
      peakConcurrency = Math.max(peakConcurrency, activeRuns);
      await Promise.resolve();
      activeRuns -= 1;
      return buildAxeResults();
    });

    await Promise.all([
      runAxeAudit(target),
      runAxeAudit(target),
      runAxeAudit(target),
    ]);

    expect(peakConcurrency).toBe(1);
    dom.window.close();
  });

  it('reports whether a default axe rule is enforced', () => {
    expect(isAxeRuleEnforced('color-contrast')).toBe(true);
    expect(isAxeRuleEnforced('video-caption')).toBe(false);
    expect(isAxeRuleEnforced('non-existent-rule')).toBe(true);
  });
});
