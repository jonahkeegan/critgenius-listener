/**
 * @fileoverview Theme System Exports
 * Central export point for the CritGenius theme system
 */

// Core theme configuration
export { critgeniusTheme, responsiveSpacing } from './critgeniusTheme';

// Responsive layout hooks
export {
  useResponsiveLayout,
  useFluidSpacing,
  useAudioInterfaceLayout,
  useResponsiveValue,
} from './hooks/useResponsiveLayout';

// Layout components
export { default as ResponsiveContainer } from './components/layouts/ResponsiveContainer';
export type { ResponsiveContainerProps } from './components/layouts/ResponsiveContainer';

export { default as TwoColumnLayout } from './components/layouts/TwoColumnLayout';
export type { TwoColumnLayoutProps } from './components/layouts/TwoColumnLayout';

export { default as AudioCaptureLayout } from './components/layouts/AudioCaptureLayout';
export type { AudioCaptureLayoutProps } from './components/layouts/AudioCaptureLayout';

export { default as TranscriptLayout } from './components/layouts/TranscriptLayout';
export type { TranscriptLayoutProps } from './components/layouts/TranscriptLayout';

// Responsive audio components
export { AudioCapturePanel } from './components/ResponsiveAudioComponents';

// Theme type definitions
export interface ResponsiveSpacingConfig {
  containerPadding: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  sectionSpacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  componentSpacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  touchTargets: {
    minimum: string;
    comfortable: string;
    generous: string;
  };
  audioInterface: {
    controlSpacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
    visualizerHeight: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
    };
  };
}

// Enhanced breakpoint type definitions
declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    xxl: true;
  }
}

// Export utility functions for theme customization
export const getResponsiveValue = <T>(
  values: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', T>>,
  currentBreakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
): T | undefined => {
  const breakpointOrder = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'] as const;
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  
  for (let i = currentIndex; i < breakpointOrder.length; i++) {
    const bp = breakpointOrder[i];
    if (values[bp] !== undefined) {
      return values[bp];
    }
  }
  
  return undefined;
};

// Import critgeniusTheme for use in helper function
import { critgeniusTheme } from './critgeniusTheme';

// Theme configuration helpers
export const createResponsiveTheme = (customizations?: any) => {
  // Future: Allow theme customizations while maintaining responsive design system
  return critgeniusTheme;
};

export { critgeniusTheme as default };
