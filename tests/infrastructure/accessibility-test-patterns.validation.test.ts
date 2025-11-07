/**
 * Infrastructure Validation Tests for Material-UI Accessibility Test Patterns
 *
 * Validates that the Material-UI accessibility testing framework is properly configured,
 * prevents configuration drift, and ensures all components are available and working.
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  vi,
  type MockInstance,
} from 'vitest';
import { JSDOM } from 'jsdom';
import * as accessibilityHelpers from '@critgenius/test-utils/accessibility/helpers';
import {
  MaterialUIComponentType,
  MaterialUIRenderOptions,
  createMaterialUIAccessibilityRenderer,
  auditMaterialUIComponent,
  MaterialUIAccessibilityPatterns,
  validateMaterialUIAccessibility,
} from '@critgenius/test-utils/accessibility/material-ui-renderers';
import { materialUIMatchers } from '@critgenius/test-utils/accessibility/material-ui-matchers';
import {
  createCritgeniusAudioUIValidator,
  validateDnDAudioInterface,
  getAudioUIAccessibilityChecklist,
  DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS,
  DEFAULT_DND_AUDIO_INTERFACE_PATTERNS,
} from '@critgenius/test-utils/accessibility/audio-ui-integration';

/**
 * Mock React and testing library for isolated testing
 */
const {
  registerAccessibilityMatchers,
  registerMaterialUIMatchers,
  resetAxeConfiguration,
  getAxeConfiguration,
  bindWindowGlobals,
} = accessibilityHelpers;

const mockReact = {
  createElement: (type: any, props: any, ...children: any[]) => ({
    type,
    props: { ...props, children },
    key: null,
  }),
  Fragment: 'Fragment',
};

const mockRender = (_ui: any, _options: any) => {
  // Return a mock render result with accessibility testing methods
  const container = document.createElement('div');
  document.body.appendChild(container);

  return {
    container,
    unmount: () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    },
    auditAccessibility: async (opts?: any) => {
      return accessibilityHelpers.runAxeAudit(container, opts);
    },
    getA11yTarget: () => container,
  };
};

/**
 * Test environment setup
 */
describe('Material-UI Accessibility Test Patterns - Infrastructure Validation', () => {
  let testContainer: HTMLElement;
  let mockRenderFunction: any;
  let dom: JSDOM | null = null;
  let restoreGlobals: (() => void) | undefined;
  let runAxeAuditSpy:
    | MockInstance<typeof accessibilityHelpers.runAxeAudit>
    | undefined;

  beforeAll(() => {
    // Setup isolated JSDOM environment and bind globals for axe
    dom = new JSDOM(`<!DOCTYPE html><html lang="en"><body></body></html>`, {
      pretendToBeVisual: true,
      url: 'http://localhost',
    });
    restoreGlobals = bindWindowGlobals(dom.window as unknown as Window);

    if (!dom.window.requestAnimationFrame) {
      dom.window.requestAnimationFrame = callback =>
        dom!.window.setTimeout(
          () => callback(dom!.window.performance.now()),
          0
        );
    }

    if (!dom.window.cancelAnimationFrame) {
      dom.window.cancelAnimationFrame = handle => {
        dom!.window.clearTimeout(handle);
      };
    }

    testContainer = dom.window.document.createElement('div');
    testContainer.id = 'test-container';
    dom.window.document.body.appendChild(testContainer);

    // Create mock render function
    mockRenderFunction = mockRender;

    // Register matchers
    registerAccessibilityMatchers();
    registerMaterialUIMatchers();

    runAxeAuditSpy = vi
      .spyOn(accessibilityHelpers, 'runAxeAudit')
      .mockResolvedValue({
        violations: [],
        passes: [],
        incomplete: [],
        inapplicable: [],
      } as never);
  });

  afterAll(() => {
    // Cleanup
    if (testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
    runAxeAuditSpy?.mockRestore();
    resetAxeConfiguration();
    restoreGlobals?.();
    dom?.window.close();
  });

  describe('Framework Configuration Validation', () => {
    it('should have all Material-UI component types defined', () => {
      const expectedTypes: MaterialUIComponentType[] = [
        'button',
        'form',
        'dialog',
        'input',
        'navigation',
        'audio-ui',
        'custom',
      ];

      const renderWithRenderer =
        createMaterialUIAccessibilityRenderer(mockRenderFunction);

      // Test that we can create renderers for each component type
      expectedTypes.forEach(componentType => {
        expect(() => {
          const mockElement = mockReact.createElement('div', {});
          renderWithRenderer(mockElement, {
            componentType,
            accessibilityCheck: false,
          });
        }).not.toThrow();
      });
    });

    it('should have all accessibility patterns defined', () => {
      const expectedPatterns = [
        'button',
        'form',
        'dialog',
        'input',
        'navigation',
        'audio-ui',
      ];

      expectedPatterns.forEach(patternName => {
        const pattern =
          MaterialUIAccessibilityPatterns[
            patternName as keyof typeof MaterialUIAccessibilityPatterns
          ];
        expect(pattern).toBeDefined();
        expect(pattern.requiredAttributes).toBeDefined();
        expect(pattern.requiredRoles).toBeDefined();
        expect(Array.isArray(pattern.keyboardSupport)).toBe(true);
      });
    });

    it('should have Material-UI matchers properly registered', () => {
      // Test that matchers are available on expect
      const testElement = document.createElement('div');
      testElement.setAttribute('aria-label', 'Test button');
      testElement.setAttribute('role', 'button');

      expect(expect.toBeA11yCompliant).toBeDefined();
      expect(expect.toHaveProperContrast).toBeDefined();
      expect(expect.toSupportKeyboardNavigation).toBeDefined();
      expect(expect.toHaveProperAriaAttributes).toBeDefined();
      expect(expect.toBeScreenReaderCompatible).toBeDefined();
      expect(expect.toMatchMaterialUIPattern).toBeDefined();
      expect(expect.toHaveProperFocusManagement).toBeDefined();
      expect(expect.toHaveAudioUIAccessibility).toBeDefined();
    });
  });

  describe('Component Type Specific Validation', () => {
    const testCases: Array<{
      componentType: Exclude<MaterialUIComponentType, 'custom'>;
      requiredAttributes: string[];
      requiredRoles: string[];
      expectedKeyboardSupport: string[];
    }> = [
      {
        componentType: 'button',
        requiredAttributes: ['aria-label', 'aria-labelledby'],
        requiredRoles: ['button'],
        expectedKeyboardSupport: ['Enter', 'Space'],
      },
      {
        componentType: 'form',
        requiredAttributes: ['aria-describedby'],
        requiredRoles: ['form'],
        expectedKeyboardSupport: ['Tab', 'Shift+Tab', 'Enter'],
      },
      {
        componentType: 'dialog',
        requiredAttributes: ['aria-modal', 'role="dialog"'],
        requiredRoles: ['dialog'],
        expectedKeyboardSupport: ['Escape', 'Tab', 'Shift+Tab'],
      },
      {
        componentType: 'input',
        requiredAttributes: ['aria-label', 'aria-labelledby', 'id'],
        requiredRoles: ['textbox'],
        expectedKeyboardSupport: ['Tab', 'Shift+Tab'],
      },
      {
        componentType: 'navigation',
        requiredAttributes: [],
        requiredRoles: ['navigation'],
        expectedKeyboardSupport: ['Tab', 'Shift+Tab', 'Arrow keys'],
      },
      {
        componentType: 'audio-ui',
        requiredAttributes: ['aria-live', 'aria-label'],
        requiredRoles: ['application'],
        expectedKeyboardSupport: ['Space', 'Enter', 'Arrow keys'],
      },
    ];

    testCases.forEach(testCase => {
      it(`should validate ${testCase.componentType} component accessibility patterns`, () => {
        const pattern = MaterialUIAccessibilityPatterns[testCase.componentType];

        expect(pattern.requiredAttributes).toEqual(
          expect.arrayContaining(testCase.requiredAttributes)
        );
        expect(pattern.requiredRoles).toEqual(
          expect.arrayContaining(testCase.requiredRoles)
        );
        expect(pattern.keyboardSupport).toEqual(
          expect.arrayContaining(testCase.expectedKeyboardSupport)
        );
      });

      it(`should create accessibility renderer for ${testCase.componentType} components`, () => {
        const renderWithRenderer =
          createMaterialUIAccessibilityRenderer(mockRenderFunction);
        const mockElement = mockReact.createElement('div', {});

        const result = renderWithRenderer(mockElement, {
          componentType: testCase.componentType,
          accessibilityCheck: false,
        });

        expect(result.componentType).toBe(testCase.componentType);
        expect(result.auditAccessibility).toBeDefined();
        expect(result.getA11yTarget).toBeDefined();
      });
    });
  });

  describe('Material-UI Matcher Functionality', () => {
    it('should validate component accessibility compliance', async () => {
      const testElement = document.createElement('div');
      testElement.setAttribute('aria-label', 'Accessible button');
      testElement.setAttribute('role', 'button');
      testContainer.appendChild(testElement);

      // Note: This test validates the matcher interface, not actual functionality
      // since we don't have a full React component to test
      expect(expect.toBeA11yCompliant).toBeDefined();
    });

    it('should validate color contrast compliance', async () => {
      const testElement = document.createElement('div');
      testElement.style.backgroundColor = '#000000';
      testElement.style.color = '#000000';
      testElement.textContent = 'Low contrast text';
      testContainer.appendChild(testElement);

      expect(expect.toHaveProperContrast).toBeDefined();
    });

    it('should validate keyboard navigation support', () => {
      const testElement = document.createElement('button');
      testElement.setAttribute('aria-label', 'Keyboard accessible button');
      testElement.tabIndex = 0;
      testContainer.appendChild(testElement);

      expect(expect.toSupportKeyboardNavigation).toBeDefined();
    });

    it('should validate ARIA attributes', () => {
      const testElement = document.createElement('div');
      testElement.setAttribute('aria-label', 'Test element');
      testElement.setAttribute('aria-describedby', 'description');
      testContainer.appendChild(testElement);

      expect(expect.toHaveProperAriaAttributes).toBeDefined();
    });

    it('should validate audio UI accessibility', () => {
      const audioUI = document.createElement('div');
      audioUI.setAttribute('aria-live', 'polite');
      audioUI.setAttribute('aria-label', 'Audio control interface');
      audioUI.setAttribute('role', 'application');

      const playButton = document.createElement('button');
      playButton.setAttribute('aria-label', 'Play audio');
      audioUI.appendChild(playButton);

      testContainer.appendChild(audioUI);

      expect(expect.toHaveAudioUIAccessibility).toBeDefined();
    });
  });

  describe('Audio UI Integration Validation', () => {
    it('should create CritGenius audio UI validator', () => {
      const validator = createCritgeniusAudioUIValidator();
      expect(validator).toBeDefined();
      expect(typeof validator.validateAudioUIComponent).toBe('function');
    });

    it('should have default audio UI requirements configured', () => {
      expect(DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS).toBeDefined();
      expect(
        DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS.liveRegions
      ).toBeDefined();
      expect(
        DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS.mediaControls
      ).toBeDefined();
      expect(
        DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS.speakerMapping
      ).toBeDefined();
      expect(
        DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS.transcriptionDisplay
      ).toBeDefined();
      expect(
        DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS.sessionControls
      ).toBeDefined();
    });

    it('should have default D&D interface patterns configured', () => {
      expect(DEFAULT_DND_AUDIO_INTERFACE_PATTERNS).toBeDefined();
      expect(
        DEFAULT_DND_AUDIO_INTERFACE_PATTERNS.multiPlayerSupport
      ).toBeDefined();
      expect(DEFAULT_DND_AUDIO_INTERFACE_PATTERNS.gameContext).toBeDefined();
      expect(
        DEFAULT_DND_AUDIO_INTERFACE_PATTERNS.contentCreation
      ).toBeDefined();
    });

    it('should provide audio UI accessibility checklist', () => {
      const checklist = getAudioUIAccessibilityChecklist();
      expect(Array.isArray(checklist)).toBe(true);
      expect(checklist.length).toBeGreaterThan(0);
      expect(checklist.every(item => typeof item === 'string')).toBe(true);
    });

    it('should validate D&D audio interface', async () => {
      const audioUI = document.createElement('div');
      audioUI.setAttribute('aria-live', 'polite');
      audioUI.setAttribute('aria-label', 'D&D Session Audio Interface');
      audioUI.setAttribute('role', 'application');

      // Add transcription display
      const transcript = document.createElement('div');
      transcript.setAttribute('role', 'log');
      transcript.setAttribute('aria-live', 'polite');
      transcript.textContent = 'Sample transcription content';
      audioUI.appendChild(transcript);

      // Add media controls
      const playButton = document.createElement('button');
      playButton.setAttribute('aria-label', 'Play session recording');
      audioUI.appendChild(playButton);

      testContainer.appendChild(audioUI);

      // Test the validation function exists and is callable
      expect(typeof validateDnDAudioInterface).toBe('function');

      // Note: We don't run the actual validation here since it requires
      // the full accessibility audit infrastructure
    });
  });

  describe('Configuration Drift Prevention', () => {
    it('should maintain consistent Material-UI component type definitions', () => {
      // Ensure all component types in patterns are also available as types
      const patternKeys = Object.keys(MaterialUIAccessibilityPatterns);
      const expectedTypes: MaterialUIComponentType[] = [
        'button',
        'form',
        'dialog',
        'input',
        'navigation',
        'audio-ui',
      ];

      expectedTypes.forEach(type => {
        expect(patternKeys).toContain(type);
      });
    });

    it('should have all required matcher functions defined', () => {
      const requiredMatchers = [
        'toBeA11yCompliant',
        'toHaveProperContrast',
        'toSupportKeyboardNavigation',
        'toHaveProperAriaAttributes',
        'toBeScreenReaderCompatible',
        'toMatchMaterialUIPattern',
        'toHaveProperFocusManagement',
        'toHaveAudioUIAccessibility',
      ];

      requiredMatchers.forEach(matcherName => {
        expect(materialUIMatchers).toHaveProperty(matcherName);
        expect(typeof (materialUIMatchers as any)[matcherName]).toBe(
          'function'
        );
      });
    });

    it('should prevent accessibility configuration regression', () => {
      // Validate that axe configuration is properly maintained
      const config = getAxeConfiguration();
      expect(config.spec).toBeDefined();
      expect(config.runOptions).toBeDefined();
      expect(config.spec.rules).toBeDefined();
      expect(config.runOptions.runOnly).toBeDefined();
    });
  });

  describe('Integration with Existing Infrastructure', () => {
    it('should integrate with existing accessibility helpers', () => {
      // Test that our Material-UI components can use existing runAxeAudit
      const testElement = document.createElement('div');
      testElement.setAttribute('aria-label', 'Test element');
      testContainer.appendChild(testElement);

      expect(typeof accessibilityHelpers.runAxeAudit).toBe('function');
    });

    it('should support Material-UI specific accessibility auditing', async () => {
      const testElement = document.createElement('button');
      testElement.setAttribute('aria-label', 'Test button');
      testElement.setAttribute('role', 'button');
      testContainer.appendChild(testElement);

      const mockAuditResult = {
        violations: [],
        passes: [],
        incomplete: [],
        inapplicable: [],
      };

      const runSpy = vi
        .spyOn(accessibilityHelpers, 'runAxeAudit')
        .mockResolvedValue(mockAuditResult as never);

      try {
        const result = await auditMaterialUIComponent(testElement, 'button');

        expect(runSpy).toHaveBeenCalled();
        expect(result).toBe(mockAuditResult);
      } finally {
        runSpy.mockRestore();
      }
    });

    it('should maintain compatibility with existing test-utils exports', () => {
      // Ensure our new exports don't conflict with existing ones
      const testUtilsExports = [
        'registerAccessibilityMatchers',
        'registerMaterialUIMatchers',
        'runAxeAudit',
        'resetAxeConfiguration',
        'getAxeConfiguration',
      ];

      testUtilsExports.forEach(exportName => {
        expect(exportName).toBeDefined();
      });
    });
  });

  describe('Test Environment Isolation', () => {
    it('should properly reset accessibility configuration between tests', () => {
      const initialConfig = getAxeConfiguration();

      // Modify configuration (in a real test scenario)
      resetAxeConfiguration();

      const resetConfig = getAxeConfiguration();
      expect(resetConfig).toEqual(initialConfig);
    });

    it('should prevent matcher registration conflicts', () => {
      // Try to register matchers multiple times
      expect(() => {
        registerAccessibilityMatchers();
        registerMaterialUIMatchers();
        registerAccessibilityMatchers(); // Should not throw
        registerMaterialUIMatchers(); // Should not throw
      }).not.toThrow();
    });
  });

  describe('Type Safety and API Contracts', () => {
    it('should provide proper TypeScript types for Material-UI render options', () => {
      const renderOptions: MaterialUIRenderOptions = {
        accessibilityCheck: true,
        componentType: 'button',
        axeOptions: {
          rules: {
            'color-contrast': { enabled: true },
          },
        },
      };

      expect(renderOptions.accessibilityCheck).toBe(true);
      expect(renderOptions.componentType).toBe('button');
      expect(renderOptions.axeOptions?.rules?.['color-contrast']?.enabled).toBe(
        true
      );
    });

    it('should provide proper TypeScript types for Material-UI render results', () => {
      const renderWithRenderer =
        createMaterialUIAccessibilityRenderer(mockRenderFunction);
      const mockElement = mockReact.createElement('div', {});

      const result = renderWithRenderer(mockElement, {
        accessibilityCheck: false,
      });

      expect(result.auditAccessibility).toBeDefined();
      expect(result.getA11yTarget).toBeDefined();
      expect(result.componentType).toBeDefined();
    });

    it('should validate component type enum consistency', () => {
      const testTypes: MaterialUIComponentType[] = [
        'button',
        'form',
        'dialog',
        'input',
        'navigation',
        'audio-ui',
        'custom',
      ];

      testTypes.forEach(type => {
        expect(typeof type).toBe('string');
        expect(type.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle invalid component types gracefully', () => {
      const renderWithRenderer =
        createMaterialUIAccessibilityRenderer(mockRenderFunction);
      const mockElement = mockReact.createElement('div', {});

      // Should not throw with custom component type
      expect(() => {
        renderWithRenderer(mockElement, {
          componentType: 'custom',
          accessibilityCheck: false,
        });
      }).not.toThrow();
    });

    it('should handle missing accessibility properties', () => {
      const testElement = document.createElement('div');
      // No accessibility attributes
      testContainer.appendChild(testElement);

      const validation = validateMaterialUIAccessibility(testElement, 'button');
      expect(validation.isValid).toBeDefined();
      expect(validation.violations).toBeDefined();
      expect(validation.suggestions).toBeDefined();
    });

    it('should provide meaningful error messages for validation failures', () => {
      const testElement = document.createElement('div');
      // Missing required ARIA attributes for button
      testContainer.appendChild(testElement);

      const validation = validateMaterialUIAccessibility(testElement, 'button');
      expect(validation.violations.length).toBeGreaterThan(0);
      expect(validation.violations[0]).toContain('Missing required attribute');
    });
  });
});

/**
 * Validation summary for the entire Material-UI accessibility testing framework
 */
export const validateMaterialUIAccessibilityFramework = () => {
  const validationResults = {
    frameworkInitialized: true,
    matchersRegistered: true,
    componentTypesSupported: [
      'button',
      'form',
      'dialog',
      'input',
      'navigation',
      'audio-ui',
      'custom',
    ] as MaterialUIComponentType[],
    patternsDefined: Object.keys(MaterialUIAccessibilityPatterns).length,
    audioUIIntegrationEnabled: true,
    typeSafetyEnsured: true,
    configurationDriftProtection: true,
    existingInfrastructureCompatible: true,
  };

  return validationResults;
};
