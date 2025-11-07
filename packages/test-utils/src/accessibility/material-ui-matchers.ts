/**
 * Custom Material-UI Accessibility Matchers
 *
 * Extends Vitest matchers with Material-UI specific accessibility validation
 */

import { expect } from 'vitest';
import type { RunOptions } from 'axe-core';
import type { MaterialUIComponentType } from './material-ui-renderers';
import {
  auditMaterialUIComponent,
  validateMaterialUIAccessibility,
  getMaterialUIAccessibilityPattern,
  type MaterialUIAccessibilityPattern,
} from './material-ui-renderers';
import { runAxeAudit, type AccessibilityAuditTarget } from './helpers';

type ElementLike = Element | Document | DocumentFragment;

const DOCUMENT_NODE =
  typeof Node !== 'undefined' ? Node.DOCUMENT_NODE : /* DOM Level 2 */ 9;
const DOCUMENT_FRAGMENT_NODE =
  typeof Node !== 'undefined'
    ? Node.DOCUMENT_FRAGMENT_NODE
    : /* DOM Level 2 */ 11;

const isElementNode = (value: unknown): value is Element =>
  value instanceof Element;

const isDocumentNode = (value: unknown): value is Document =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'nodeType' in (value as { nodeType?: number }) &&
      (value as { nodeType?: number }).nodeType === DOCUMENT_NODE
  );

const isDocumentFragmentNode = (value: unknown): value is DocumentFragment =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'nodeType' in (value as { nodeType?: number }) &&
      (value as { nodeType?: number }).nodeType === DOCUMENT_FRAGMENT_NODE
  );

const ensureElementLike = (value: unknown): ElementLike => {
  if (
    isElementNode(value) ||
    isDocumentNode(value) ||
    isDocumentFragmentNode(value)
  ) {
    return value;
  }

  throw new TypeError(
    'Material-UI accessibility matchers expect a DOM Element, Document, or DocumentFragment target.'
  );
};

const resolveElementTarget = (target: ElementLike): Element => {
  if (target instanceof Element) {
    return target;
  }

  if (isDocumentNode(target) && target.documentElement) {
    return target.documentElement;
  }

  const fragmentElement = (target as DocumentFragment).firstElementChild;
  if (fragmentElement) {
    return fragmentElement;
  }

  throw new TypeError(
    'Unable to derive an Element from the provided accessibility target.'
  );
};

const toAccessibilityTarget = (target: unknown): AccessibilityAuditTarget => {
  return ensureElementLike(target);
};

const toElement = (target: unknown): Element => {
  return resolveElementTarget(ensureElementLike(target));
};

const formatErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown accessibility matcher error';
  }
};

const getAccessibilityPattern = (
  componentType?: MaterialUIComponentType
): MaterialUIAccessibilityPattern | undefined => {
  if (!componentType || componentType === 'custom') {
    return undefined;
  }

  return getMaterialUIAccessibilityPattern(componentType);
};

/**
 * Material-UI specific accessibility matchers
 */
const materialUIMatchers: MaterialUIAccessibilityMatchers = {
  toBeA11yCompliant(
    this: unknown,
    target: unknown,
    componentType: MaterialUIComponentType = 'custom',
    options?: RunOptions
  ) {
    const auditTarget = toAccessibilityTarget(target);

    return auditMaterialUIComponent(auditTarget, componentType, options)
      .then(results => {
        const pass = results.violations.length === 0;
        const message = pass
          ? 'Expected component not to be accessibility compliant, but it is'
          : `Expected component to be accessibility compliant, but found ${results.violations.length} violations: ${results.violations
              .map(violation => violation.id)
              .join(', ')}`;

        return {
          pass,
          message: () => message,
          actual: results,
        };
      })
      .catch((error: unknown) => {
        const formatted = formatErrorMessage(error);
        return {
          pass: false,
          message: () => `Accessibility audit failed: ${formatted}`,
          actual: { error },
        };
      });
  },

  toHaveProperContrast(this: unknown, target: unknown) {
    const auditTarget = toAccessibilityTarget(target);

    return runAxeAudit(auditTarget, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },
      },
    })
      .then(results => {
        const contrastViolations = results.violations.filter(
          violation =>
            violation.id === 'color-contrast' ||
            violation.id === 'color-contrast-enhanced'
        );

        const pass = contrastViolations.length === 0;
        const message = pass
          ? 'Expected element to have improper contrast, but all contrast checks passed'
          : `Expected element to have proper contrast, but found ${contrastViolations.length} contrast violations`;

        return {
          pass,
          message: () => message,
          actual: {
            violations: contrastViolations,
            counts: {
              passes: results.passes.length,
              violations: results.violations.length,
              incomplete: results.incomplete.length,
              inapplicable: results.inapplicable.length,
            },
          },
        };
      })
      .catch((error: unknown) => ({
        pass: false,
        message: () =>
          `Accessibility audit failed: ${formatErrorMessage(error)}`,
        actual: { error },
      }));
  },

  toSupportKeyboardNavigation(
    this: unknown,
    target: unknown,
    componentType?: MaterialUIComponentType
  ) {
    const pattern = getAccessibilityPattern(componentType);
    const requiredKeys = pattern?.keyboardSupport ?? [];

    if (requiredKeys.length === 0) {
      return Promise.resolve({
        pass: true,
        message: () =>
          'No specific keyboard requirements for this component type',
        actual: { expectedKeys: [] },
      });
    }

    const auditTarget = toAccessibilityTarget(target);

    return runAxeAudit(auditTarget, {
      rules: {
        keyboard: { enabled: true },
        'keyboard-no-empty': { enabled: true },
      },
    })
      .then(results => {
        const keyboardViolations = results.violations.filter(
          violation =>
            violation.id === 'keyboard' || violation.id === 'keyboard-no-empty'
        );

        const pass = keyboardViolations.length === 0;
        const message = pass
          ? 'Expected element to not support keyboard navigation, but it does'
          : `Expected element to support keyboard navigation (${requiredKeys.join(
              ', '
            )}), but found ${keyboardViolations.length} keyboard violations`;

        return {
          pass,
          message: () => message,
          actual: {
            violations: keyboardViolations,
            expectedKeys: requiredKeys,
          },
        };
      })
      .catch((error: unknown) => ({
        pass: false,
        message: () =>
          `Accessibility audit failed: ${formatErrorMessage(error)}`,
        actual: { error },
      }));
  },

  toHaveProperAriaAttributes(
    this: unknown,
    target: unknown,
    componentType?: MaterialUIComponentType
  ) {
    const element = toElement(target);
    const pattern = getAccessibilityPattern(componentType);
    const requiredAttributes = pattern?.requiredAttributes ?? [];

    if (requiredAttributes.length === 0) {
      return {
        pass: true,
        message: () => 'No specific ARIA requirements for this component type',
        actual: { requiredAttributes: [] },
      };
    }

    const missingAttributes: string[] = [];
    const violations: string[] = [];

    for (const attribute of requiredAttributes) {
      const hasAttribute =
        element.hasAttribute(attribute) ||
        (attribute.includes('-') &&
          element.getAttribute(attribute.replace('aria-', 'data-')) !== null);

      if (!hasAttribute) {
        missingAttributes.push(attribute);
        violations.push(`Missing required ARIA attribute: ${attribute}`);
      }
    }

    const pass = missingAttributes.length === 0;
    const message = pass
      ? 'Expected element to have missing ARIA attributes, but all required attributes are present'
      : `Expected element to have proper ARIA attributes, but missing: ${missingAttributes.join(
          ', '
        )}`;

    return {
      pass,
      message: () => message,
      actual: {
        missingAttributes,
        violations,
        requiredAttributes,
        presentAttributes: Array.from(element.attributes).map(
          attribute => attribute.name
        ),
      },
    };
  },

  toBeScreenReaderCompatible(this: unknown, target: unknown) {
    const auditTarget = toAccessibilityTarget(target);

    return runAxeAudit(auditTarget, {
      rules: {
        'aria-roles': { enabled: true },
        'aria-valid-attr': { enabled: true },
        'aria-valid-attr-value': { enabled: true },
        'link-name': { enabled: true },
        'button-name': { enabled: true },
        'input-button-name': { enabled: true },
        'image-redundant-alt': { enabled: true },
      },
    })
      .then(results => {
        const screenReaderViolations = results.violations.filter(
          violation =>
            violation.id.includes('aria') ||
            violation.id === 'link-name' ||
            violation.id === 'button-name' ||
            violation.id === 'input-button-name' ||
            violation.id === 'image-redundant-alt'
        );

        const pass = screenReaderViolations.length === 0;
        const message = pass
          ? 'Expected element to not be screen reader compatible, but it is'
          : `Expected element to be screen reader compatible, but found ${screenReaderViolations.length} violations: ${screenReaderViolations
              .map(violation => violation.id)
              .join(', ')}`;

        return {
          pass,
          message: () => message,
          actual: {
            violations: screenReaderViolations,
            counts: {
              passes: results.passes.length,
              violations: results.violations.length,
            },
          },
        };
      })
      .catch((error: unknown) => ({
        pass: false,
        message: () =>
          `Accessibility audit failed: ${formatErrorMessage(error)}`,
        actual: { error },
      }));
  },

  toMatchMaterialUIPattern(
    this: unknown,
    target: unknown,
    componentType: MaterialUIComponentType
  ) {
    const element = toElement(target);
    const validation = validateMaterialUIAccessibility(element, componentType);

    const pass = validation.isValid;
    const message = pass
      ? `Expected element not to match Material-UI ${componentType} pattern, but it does`
      : `Expected element to match Material-UI ${componentType} pattern, but found violations: ${validation.violations.join(
          ', '
        )}`;

    return {
      pass,
      message: () => message,
      actual: validation,
    };
  },

  toHaveProperFocusManagement(
    this: unknown,
    target: unknown,
    componentType?: MaterialUIComponentType
  ) {
    const requiresFocusManagement =
      componentType === 'dialog' || componentType === 'button';

    if (!requiresFocusManagement) {
      return {
        pass: true,
        message: () =>
          'This component type does not require specific focus management',
        actual: { componentType },
      };
    }

    const element = toElement(target);
    const focusSelectors = [
      'button',
      '[href]',
      'input',
      'select',
      'textarea',
      '[tabindex]:not([tabindex="-1"])',
    ];

    const focusableElements = element.querySelectorAll(
      focusSelectors.join(', ')
    );
    const hasFocusTrap =
      componentType === 'dialog' ? focusableElements.length > 0 : false;
    const pass =
      componentType === 'dialog' ? hasFocusTrap : focusableElements.length > 0;

    const message = pass
      ? 'Expected element to not have proper focus management, but it does'
      : `Expected element to have proper focus management, but ${componentType} lacks focusable elements or focus trap`;

    return {
      pass,
      message: () => message,
      actual: {
        componentType,
        focusableElements: focusableElements.length,
        hasFocusTrap,
        focusableSelectors: focusSelectors,
      },
    };
  },

  toHaveAudioUIAccessibility(this: unknown, target: unknown) {
    const element = toElement(target);

    const features = {
      ariaLive:
        element.hasAttribute('aria-live') ||
        element.querySelector('[aria-live]') !== null,
      ariaLabel:
        element.hasAttribute('aria-label') ||
        element.hasAttribute('aria-labelledby') ||
        element.querySelector('[aria-label], [aria-labelledby]') !== null,
      mediaControls:
        element.querySelector('button, [role="button"], [role="menuitem"]') !==
        null,
    } as const;

    const missing = Object.entries(features)
      .filter(([, present]) => !present)
      .map(([feature]) => feature);

    const pass = missing.length === 0;
    const message = pass
      ? 'Expected element to not have audio UI accessibility features, but it does'
      : `Expected element to have audio UI accessibility features (aria-live, aria-label, media controls), but missing: ${missing.join(
          ', '
        )}`;

    return {
      pass,
      message: () => message,
      actual: {
        ...features,
        missing,
      },
    };
  },
};

let materialUIMatchersRegistered = false;

/**
 * Register Material-UI specific accessibility matchers
 */
export const registerMaterialUIMatchers = (): void => {
  if (materialUIMatchersRegistered) {
    return;
  }

  expect.extend(materialUIMatchers as Parameters<typeof expect.extend>[0]);
  materialUIMatchersRegistered = true;
};

/**
 * Material-UI specific accessibility matcher types for TypeScript support
 */
type MatcherOutcome = { pass: boolean; message: () => string; actual: unknown };

export type MaterialUIAccessibilityMatchers = {
  toBeA11yCompliant: (
    this: unknown,
    target: AccessibilityAuditTarget,
    componentType?: MaterialUIComponentType,
    options?: RunOptions
  ) => Promise<MatcherOutcome>;

  toHaveProperContrast: (
    this: unknown,
    target: AccessibilityAuditTarget
  ) => Promise<MatcherOutcome>;

  toSupportKeyboardNavigation: (
    this: unknown,
    target: AccessibilityAuditTarget,
    componentType?: MaterialUIComponentType
  ) => Promise<MatcherOutcome>;

  toHaveProperAriaAttributes: (
    this: unknown,
    target: AccessibilityAuditTarget,
    componentType?: MaterialUIComponentType
  ) => MatcherOutcome;

  toBeScreenReaderCompatible: (
    this: unknown,
    target: AccessibilityAuditTarget
  ) => Promise<MatcherOutcome>;

  toMatchMaterialUIPattern: (
    this: unknown,
    target: AccessibilityAuditTarget,
    componentType: MaterialUIComponentType
  ) => MatcherOutcome;

  toHaveProperFocusManagement: (
    this: unknown,
    target: AccessibilityAuditTarget,
    componentType?: MaterialUIComponentType
  ) => MatcherOutcome;

  toHaveAudioUIAccessibility: (
    this: unknown,
    target: AccessibilityAuditTarget
  ) => MatcherOutcome;
};

export { materialUIMatchers };
