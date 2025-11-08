/**
 * Material-UI accessibility matcher tests
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from 'vitest';
import { JSDOM } from 'jsdom';
import type { AxeResults } from 'axe-core';

import {
  registerMaterialUIMatchers,
  materialUIMatchers,
} from '../../../src/accessibility/material-ui-matchers';
import * as materialUiRenderers from '../../../src/accessibility/material-ui-renderers';
import * as accessibilityHelpers from '../../../src/accessibility/helpers';

let runAxeAuditMock: MockInstance<typeof accessibilityHelpers.runAxeAudit>;
let validateMaterialUIAccessibilityMock: MockInstance<
  typeof materialUiRenderers.validateMaterialUIAccessibility
>;

let activeDom: JSDOM | undefined;

const setDomGlobals = (dom: JSDOM) => {
  const { window } = dom;
  const globalAny = globalThis as Record<string, unknown>;
  globalAny.window = window;
  globalAny.document = window.document;
  globalAny.Element = window.Element;
  globalAny.Document = window.Document;
  globalAny.DocumentFragment = window.DocumentFragment;
  globalAny.getComputedStyle = window.getComputedStyle.bind(window);
};

const clearDomGlobals = () => {
  const globalAny = globalThis as Record<string, unknown>;
  delete globalAny.window;
  delete globalAny.document;
  delete globalAny.Element;
  delete globalAny.Document;
  delete globalAny.DocumentFragment;
  delete globalAny.getComputedStyle;
};

const createAxeResults = (overrides: Partial<AxeResults> = {}): AxeResults => ({
  toolOptions: {},
  testEngine: { name: 'axe-core', version: 'test' },
  testRunner: { name: 'vitest' },
  testEnvironment: {
    userAgent: 'Vitest',
    windowWidth: 1024,
    windowHeight: 768,
  },
  timestamp: '2024-01-01T00:00:00.000Z',
  url: 'http://localhost',
  violations: [],
  passes: [],
  incomplete: [],
  inapplicable: [],
  ...overrides,
});

beforeEach(() => {
  activeDom = new JSDOM('<!doctype html><html><body></body></html>');
  setDomGlobals(activeDom);

  runAxeAuditMock = vi
    .spyOn(accessibilityHelpers, 'runAxeAudit')
    .mockResolvedValue(createAxeResults());

  validateMaterialUIAccessibilityMock = vi
    .spyOn(materialUiRenderers, 'validateMaterialUIAccessibility')
    .mockReturnValue({
      isValid: true,
      violations: [],
      suggestions: [],
    });
});

afterEach(() => {
  activeDom?.window.close();
  activeDom = undefined;
  clearDomGlobals();
  runAxeAuditMock.mockReset();
  validateMaterialUIAccessibilityMock.mockReset();
});

describe('registerMaterialUIMatchers', () => {
  it('extends expect with Material-UI matchers', () => {
    const extendSpy = vi.spyOn(expect, 'extend');

    registerMaterialUIMatchers();

    expect(extendSpy).toHaveBeenCalledWith(materialUIMatchers);
    extendSpy.mockRestore();
  });
});

describe('materialUIMatchers.toBeA11yCompliant', () => {
  it('returns failure details when audit reports violations', async () => {
    runAxeAuditMock.mockResolvedValueOnce(
      createAxeResults({
        violations: [
          {
            id: 'color-contrast',
            impact: 'serious',
            description: 'Insufficient contrast',
          } as AxeResults['violations'][number],
        ],
      })
    );

    const target = (document as Document).createElement('button');
    target.textContent = 'Play';
    document.body.appendChild(target);

    const result = await materialUIMatchers.toBeA11yCompliant.call(
      {},
      target,
      'button'
    );

    expect(result.pass).toBe(false);
    expect(result.message()).toContain('color-contrast');
    const actual = result.actual as AxeResults;
    expect(actual.violations).toHaveLength(1);
  });
});

describe('materialUIMatchers.toHaveProperAriaAttributes', () => {
  it('identifies missing required ARIA attributes', () => {
    const target = (document as Document).createElement('button');
    document.body.appendChild(target);

    const result = materialUIMatchers.toHaveProperAriaAttributes.call(
      {},
      target,
      'button'
    );

    expect(result.pass).toBe(false);
    expect((result.actual as { missingAttributes: string[] }).missingAttributes).toEqual([
      'aria-label',
      'aria-labelledby',
    ]);
  });
});

describe('materialUIMatchers.toHaveProperContrast', () => {
  it('filters contrast-specific violations from audit response', async () => {
    runAxeAuditMock.mockResolvedValueOnce(
      createAxeResults({
        violations: [
          { id: 'color-contrast', impact: 'serious' } as AxeResults['violations'][number],
          { id: 'button-name', impact: 'minor' } as AxeResults['violations'][number],
        ],
      })
    );

    const target = (document as Document).createElement('div');
    target.textContent = 'Test';
    target.setAttribute('style', 'color:#aaa;background:#fff;');
    document.body.appendChild(target);

    const result = await materialUIMatchers.toHaveProperContrast.call(
      {},
      target
    );

    expect(result.pass).toBe(false);
    const actual = result.actual as { violations: AxeResults['violations'] };
    expect(actual.violations).toHaveLength(1);
    expect(actual.violations[0]?.id).toBe('color-contrast');
  });
});

describe('materialUIMatchers.toMatchMaterialUIPattern', () => {
  it('uses validateMaterialUIAccessibility to validate components', () => {
    const target = (document as Document).createElement('button');
    target.setAttribute('aria-label', 'Play');
    target.textContent = 'Play';
    document.body.appendChild(target);

    validateMaterialUIAccessibilityMock.mockReturnValueOnce({
      isValid: false,
      violations: ['Missing keyboard support'],
      suggestions: ['Add Enter key handling'],
    });

    const result = materialUIMatchers.toMatchMaterialUIPattern.call(
      {},
      target,
      'button'
    );

    expect(result.pass).toBe(false);
    expect((result.actual as { violations: string[] }).violations).toEqual([
      'Missing keyboard support',
    ]);
  });
});
