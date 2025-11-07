/**
 * Material-UI Accessibility Testing Framework
 *
 * This module provides comprehensive accessibility testing utilities for Material-UI components
 * while maintaining framework independence in the test-utils package.
 */

import type { RunOptions, AxeResults } from 'axe-core';
import type { RenderResult, RenderOptions } from '@testing-library/react';

import { runAxeAudit, type AccessibilityAuditTarget } from './helpers';

/**
 * Component type for Material-UI accessibility testing
 */
export type MaterialUIComponentType =
  | 'button'
  | 'form'
  | 'dialog'
  | 'input'
  | 'navigation'
  | 'audio-ui'
  | 'custom';

export type MaterialUIAccessibilityPattern = {
  requiredAttributes?: readonly string[];
  requiredRoles?: readonly string[];
  forbiddenAttributes?: readonly string[];
  keyboardSupport?: readonly string[];
  focusManagement?: boolean;
  mediaControls?: boolean;
  screenReaderSupport?: boolean;
  headingStructure?: boolean;
};

type MaterialUIAccessibilityPatternKey = Exclude<
  MaterialUIComponentType,
  'custom'
>;

export type MaterialUIAccessibilityPatternMap = Record<
  MaterialUIAccessibilityPatternKey,
  MaterialUIAccessibilityPattern
>;

/**
 * Enhanced render options for Material-UI accessibility testing
 */
export interface MaterialUIRenderOptions {
  /**
   * Whether to automatically run accessibility audit after rendering
   * Default: true
   */
  accessibilityCheck?: boolean;

  /**
   * Additional axe run options for the accessibility audit
   */
  axeOptions?: RunOptions;

  /**
   * Component type for specialized Material-UI accessibility rules
   */
  componentType?: MaterialUIComponentType;

  /**
   * Accessibility audit callback - called with audit results if accessibilityCheck is true
   */
  onAccessibilityAudit?(results: AxeResults): void;

  /**
   * Additional render options passed to testing library render
   */
  renderOptions?: Omit<RenderOptions, 'wrapper'>;

  /**
   * Custom wrapper component for theming and accessibility setup
   */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Result of Material-UI accessibility render
 */
export interface MaterialUIRenderResult extends RenderResult {
  /**
   * Run accessibility audit on the rendered component
   */
  auditAccessibility: (options?: RunOptions) => Promise<AxeResults>;

  /**
   * Get the root element for accessibility testing
   */
  getA11yTarget: () => AccessibilityAuditTarget;

  /**
   * Component type for specialized testing
   */
  componentType?: MaterialUIComponentType;
}

/**
 * Material-UI specific accessibility audit with specialized rules
 */
export const auditMaterialUIComponent = async (
  target: AccessibilityAuditTarget,
  componentType: MaterialUIComponentType = 'custom',
  options?: RunOptions
): Promise<AxeResults> => {
  // Apply Material-UI specific rules based on component type
  const materialUISpecificOptions: RunOptions = {
    ...options,
    rules: {
      ...options?.rules,
      // Material-UI specific accessibility rules
      'color-contrast':
        componentType !== 'audio-ui' ? { enabled: true } : { enabled: false },
      'button-name':
        componentType === 'button' ? { enabled: true } : { enabled: true },
      'form-field-multiple-labels':
        componentType === 'form' ? { enabled: true } : { enabled: true },
      label: componentType === 'input' ? { enabled: true } : { enabled: true },
      'dialog-name':
        componentType === 'dialog' ? { enabled: true } : { enabled: true },
      'heading-order':
        componentType === 'navigation' ? { enabled: true } : { enabled: true },
    },
  };

  return runAxeAudit(target, materialUISpecificOptions);
};

/**
 * Enhanced render function for Material-UI components with accessibility support
 *
 * This function provides a framework-agnostic way to render Material-UI components
 * with automatic accessibility validation. The actual rendering is delegated to
 * the caller who provides the render function and wrapper components.
 */
export const createMaterialUIAccessibilityRenderer = (
  renderFunction: (
    ui: React.ReactElement,
    options?: RenderOptions
  ) => RenderResult
) => {
  return <T extends React.ReactElement>(
    ui: T,
    options: MaterialUIRenderOptions = {}
  ): MaterialUIRenderResult & { component: T } => {
    const {
      accessibilityCheck = true,
      axeOptions,
      componentType = 'custom',
      onAccessibilityAudit,
      renderOptions,
      wrapper: CustomWrapper,
    } = options;

    // Prepare render options with optional wrapper
    const finalRenderOptions: RenderOptions = {
      ...renderOptions,
      ...(CustomWrapper && { wrapper: CustomWrapper }),
    };

    // Render the component
    const baseResult = renderFunction(ui, finalRenderOptions);

    /**
     * Run accessibility audit on the rendered component
     */
    const auditAccessibility = async (
      auditOptions?: RunOptions
    ): Promise<AxeResults> => {
      const target = baseResult.container;
      const results = await auditMaterialUIComponent(
        target,
        componentType,
        auditOptions || axeOptions
      );

      if (onAccessibilityAudit) {
        onAccessibilityAudit(results);
      }

      return results;
    };

    /**
     * Get the root element for accessibility testing
     */
    const getA11yTarget = (): AccessibilityAuditTarget => {
      return baseResult.container;
    };

    const result: MaterialUIRenderResult = {
      ...baseResult,
      auditAccessibility,
      getA11yTarget,
      componentType,
    };

    // Automatically run accessibility audit if requested
    if (accessibilityCheck) {
      auditAccessibility().catch(error => {
        console.warn('Accessibility audit failed during render:', error);
      });
    }

    return {
      ...result,
      component: ui,
    };
  };
};

/**
 * Create an isolated testing environment for Material-UI components
 */
export const createMaterialUITestEnvironment = () => {
  const setup = () => {
    // Ensure proper JSDOM setup for Material-UI
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Set up proper focus management for testing
      try {
        Object.defineProperty(document, 'activeElement', {
          get: () => document.body,
          set: () => {},
          configurable: true,
        });
      } catch {
        // Ignore if property cannot be redefined
      }

      // Set up IntersectionObserver mock for Material-UI components
      if (!window.IntersectionObserver) {
        class MockIntersectionObserver implements IntersectionObserver {
          readonly root: Element | Document | null = null;
          readonly rootMargin = '0px';
          readonly thresholds: ReadonlyArray<number> = [];

          constructor(
            _callback: IntersectionObserverCallback,
            _options?: IntersectionObserverInit
          ) {}

          disconnect(): void {}
          observe(): void {}
          takeRecords(): IntersectionObserverEntry[] {
            return [];
          }
          unobserve(): void {}
        }

        Object.defineProperty(window, 'IntersectionObserver', {
          configurable: true,
          writable: true,
          value: MockIntersectionObserver,
        });
      }
    }
  };

  const cleanup = () => {
    // Clean up after tests
    if (typeof document !== 'undefined') {
      try {
        Object.defineProperty(document, 'activeElement', {
          get: () => document.body,
          set: () => {},
          configurable: true,
        });
      } catch {
        // Ignore if property cannot be redefined
      }
    }
  };

  return { setup, cleanup };
};

/**
 * Material-UI Component Accessibility Validation Patterns
 */
export const MaterialUIAccessibilityPatterns = {
  /**
   * Button component accessibility requirements
   */
  button: {
    requiredAttributes: ['aria-label', 'aria-labelledby'],
    requiredRoles: ['button'],
    forbiddenAttributes: ['disabled'],
    keyboardSupport: ['Enter', 'Space'],
  },

  /**
   * Form component accessibility requirements
   */
  form: {
    requiredAttributes: ['aria-describedby'],
    requiredRoles: ['form'],
    keyboardSupport: ['Tab', 'Shift+Tab', 'Enter'],
  },

  /**
   * Dialog component accessibility requirements
   */
  dialog: {
    requiredAttributes: ['aria-modal', 'role="dialog"'],
    requiredRoles: ['dialog'],
    focusManagement: true,
    keyboardSupport: ['Escape', 'Tab', 'Shift+Tab'],
  },

  /**
   * Input component accessibility requirements
   */
  input: {
    requiredAttributes: ['aria-label', 'aria-labelledby', 'id'],
    requiredRoles: ['textbox'],
    keyboardSupport: ['Tab', 'Shift+Tab'],
  },

  /**
   * Navigation component accessibility requirements
   */
  navigation: {
    requiredAttributes: [],
    requiredRoles: ['navigation'],
    headingStructure: true,
    keyboardSupport: ['Tab', 'Shift+Tab', 'Arrow keys'],
  },

  /**
   * Audio UI specific accessibility patterns
   */
  'audio-ui': {
    requiredAttributes: ['aria-live', 'aria-label'],
    requiredRoles: ['application'],
    mediaControls: true,
    screenReaderSupport: true,
    keyboardSupport: ['Space', 'Enter', 'Arrow keys'],
  },
} as const satisfies MaterialUIAccessibilityPatternMap;

export const getMaterialUIAccessibilityPattern = (
  componentType: MaterialUIComponentType
): MaterialUIAccessibilityPattern | undefined => {
  if (componentType === 'custom') {
    return undefined;
  }

  return MaterialUIAccessibilityPatterns[componentType];
};

/**
 * Validate Material-UI component against accessibility patterns
 */
export const validateMaterialUIAccessibility = (
  element: Element,
  componentType: MaterialUIComponentType
): {
  isValid: boolean;
  violations: string[];
  suggestions: string[];
} => {
  const pattern = getMaterialUIAccessibilityPattern(componentType);
  const violations: string[] = [];
  const suggestions: string[] = [];

  if (!pattern) {
    return { isValid: true, violations: [], suggestions: [] };
  }

  // Check required attributes
  if (pattern.requiredAttributes) {
    for (const attr of pattern.requiredAttributes) {
      const hasAttribute =
        element.hasAttribute(attr) ||
        (attr.includes('-') &&
          element.getAttribute(attr.replace('aria-', 'data-')) !== null);

      if (!hasAttribute) {
        violations.push(`Missing required attribute: ${attr}`);
        suggestions.push(
          `Add ${attr} attribute to ensure proper accessibility`
        );
      }
    }
  }

  // Check required roles
  if (pattern.requiredRoles) {
    const role = element.getAttribute('role');
    if (!role || !pattern.requiredRoles.includes(role)) {
      violations.push(
        `Missing or incorrect role. Expected one of: ${pattern.requiredRoles.join(', ')}`
      );
      suggestions.push(
        `Add appropriate role attribute: ${pattern.requiredRoles.join(' or ')}`
      );
    }
  }

  // Check focus management for dialogs
  if (pattern.focusManagement && componentType === 'dialog') {
    const hasFocusTrap =
      element.querySelector(
        '[tabindex], button, input, select, textarea, a[href]'
      ) !== null;
    if (!hasFocusTrap) {
      violations.push('Dialog lacks focus management');
      suggestions.push('Ensure dialog has proper focus trap and initial focus');
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
    suggestions,
  };
};
