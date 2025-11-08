/**
 * Material-UI renderer utility tests
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
import type { ReactElement } from 'react';
import type { AxeResults } from 'axe-core';
import { JSDOM } from 'jsdom';
import * as accessibilityHelpers from '../../../src/accessibility/helpers';
import {
  auditMaterialUIComponent,
  createMaterialUIAccessibilityRenderer,
  createMaterialUITestEnvironment,
  MaterialUIAccessibilityPatterns,
  getMaterialUIAccessibilityPattern,
  validateMaterialUIAccessibility,
} from '../../../src/accessibility/material-ui-renderers';
let runAxeAuditMock: MockInstance<typeof accessibilityHelpers.runAxeAudit>;
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
  activeDom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  });
  setDomGlobals(activeDom);
  runAxeAuditMock = vi
    .spyOn(accessibilityHelpers, 'runAxeAudit')
    .mockResolvedValue(createAxeResults());
});

afterEach(() => {
  activeDom?.window.close();
  activeDom = undefined;
  clearDomGlobals();
  runAxeAuditMock.mockReset();
});

describe('auditMaterialUIComponent', () => {
  it('delegates to runAxeAudit with Material-UI rule overrides', async () => {
    const target = document.createElement('div');

    await auditMaterialUIComponent(target, 'button');

    expect(runAxeAuditMock).toHaveBeenCalledWith(
      target,
      expect.objectContaining({
        rules: expect.objectContaining({ 'button-name': { enabled: true } }),
      })
    );
  });
});

describe('createMaterialUIAccessibilityRenderer', () => {
  it('returns renderer that runs accessibility audits on demand', async () => {
    const container = document.createElement('div');
    const renderFn = vi.fn(() => ({
      container,
    }) as unknown as import('@testing-library/react').RenderResult);

  const render = createMaterialUIAccessibilityRenderer(renderFn);
  const element = {} as ReactElement;
    const result = render(element, {
      accessibilityCheck: false,
      componentType: 'dialog',
    });

    await result.auditAccessibility();

    expect(runAxeAuditMock).toHaveBeenCalledWith(
      container,
      expect.objectContaining({ rules: expect.any(Object) })
    );
    expect(result.component).toBe(element);
    expect(renderFn).toHaveBeenCalled();
  });
});

describe('createMaterialUITestEnvironment', () => {
  it('provides setup and cleanup helpers without throwing', () => {
    const { setup, cleanup } = createMaterialUITestEnvironment();

    expect(() => setup()).not.toThrow();
    expect(() => cleanup()).not.toThrow();
  });
});

describe('MaterialUIAccessibilityPatterns', () => {
  it('exposes expected pattern definitions', () => {
    expect(MaterialUIAccessibilityPatterns.button.requiredAttributes).toEqual(
      expect.arrayContaining(['aria-label'])
    );
    expect(
      MaterialUIAccessibilityPatterns['audio-ui'].keyboardSupport
    ).toContain('Space');
  });
});

describe('getMaterialUIAccessibilityPattern', () => {
  it('returns undefined for custom components', () => {
    expect(getMaterialUIAccessibilityPattern('custom')).toBeUndefined();
  });

  it('returns concrete pattern for known components', () => {
    expect(getMaterialUIAccessibilityPattern('dialog')).toBe(
      MaterialUIAccessibilityPatterns.dialog
    );
  });
});

describe('validateMaterialUIAccessibility', () => {
  it('identifies missing attributes and roles', () => {
    const element = document.createElement('button');

    const result = validateMaterialUIAccessibility(element, 'button');

    expect(result.isValid).toBe(false);
    expect(result.violations).toContainEqual(
      expect.stringContaining('Missing required attribute')
    );
    expect(result.suggestions).not.toHaveLength(0);
  });
});
