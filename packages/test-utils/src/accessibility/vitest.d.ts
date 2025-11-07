import type { RunOptions } from 'axe-core';
import type { MaterialUIComponentType } from './material-ui-renderers';

declare module 'vitest' {
  interface Assertion {
    toPassA11yAudit(options?: RunOptions): Promise<this>;
    toBeA11yCompliant(
      componentType?: MaterialUIComponentType,
      options?: RunOptions
    ): Promise<this>;
    toHaveProperContrast(): Promise<this>;
    toSupportKeyboardNavigation(
      componentType?: MaterialUIComponentType
    ): Promise<this>;
    toHaveProperAriaAttributes(componentType?: MaterialUIComponentType): this;
    toBeScreenReaderCompatible(): Promise<this>;
    toMatchMaterialUIPattern(componentType: MaterialUIComponentType): this;
    toHaveProperFocusManagement(componentType?: MaterialUIComponentType): this;
    toHaveAudioUIAccessibility(): this;
  }

  interface AsymmetricMatchersContaining {
    toPassA11yAudit(options?: RunOptions): unknown;
    toBeA11yCompliant(
      componentType?: MaterialUIComponentType,
      options?: RunOptions
    ): Promise<boolean> | boolean;
    toHaveProperContrast(): Promise<boolean> | boolean;
    toSupportKeyboardNavigation(
      componentType?: MaterialUIComponentType
    ): Promise<boolean> | boolean;
    toHaveProperAriaAttributes(
      componentType?: MaterialUIComponentType
    ): boolean;
    toBeScreenReaderCompatible(): Promise<boolean> | boolean;
    toMatchMaterialUIPattern(componentType: MaterialUIComponentType): boolean;
    toHaveProperFocusManagement(
      componentType?: MaterialUIComponentType
    ): boolean;
    toHaveAudioUIAccessibility(): boolean;
  }
}

export type AccessibilityMatcherTarget =
  import('./helpers').AccessibilityAuditTarget;
