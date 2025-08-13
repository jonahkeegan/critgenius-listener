/**
 * @fileoverview Responsive Layout Hooks
 * Custom React hooks for responsive design and layout management
 */

import { useTheme, useMediaQuery } from '@mui/material';
import { useState, useEffect, useMemo } from 'react';
import { responsiveSpacing } from '../critgeniusTheme';

// Breakpoint detection hook
export const useResponsiveLayout = () => {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'xl'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('xl'));
  const isLargeScreen = useMediaQuery('(min-width: 1920px)'); // Custom xxl breakpoint

  // Current breakpoint detection
  const currentBreakpoint = useMemo(() => {
    if (isLargeScreen) return 'xxl';
    if (isDesktop) return 'xl';
    if (isTablet) return 'lg';
    if (useMediaQuery(theme.breakpoints.between('sm', 'md'))) return 'md';
    if (useMediaQuery(theme.breakpoints.between('xs', 'sm'))) return 'sm';
    return 'xs';
  }, [theme, isMobile, isTablet, isDesktop, isLargeScreen]);

  // Screen size information
  const screenInfo = useMemo(() => ({
    isMobile,
    isTablet, 
    isDesktop,
    isLargeScreen,
    currentBreakpoint,
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  }), [isMobile, isTablet, isDesktop, isLargeScreen, currentBreakpoint]);

  return screenInfo;
};

// Responsive spacing hook
export const useFluidSpacing = () => {
  const { currentBreakpoint } = useResponsiveLayout();
  
  const getSpacing = (category: 'containerPadding' | 'sectionSpacing' | 'componentSpacing') => {
    const spacingObj = responsiveSpacing[category];
    const key = currentBreakpoint as keyof typeof spacingObj;
    return spacingObj[key] || spacingObj.md || spacingObj.xs;
  };

  const spacingUtils = useMemo(() => ({
    containerPadding: getSpacing('containerPadding'),
    sectionSpacing: getSpacing('sectionSpacing'),
    componentSpacing: getSpacing('componentSpacing'),
    touchTarget: responsiveSpacing.touchTargets,
    audioInterface: {
      controlSpacing: responsiveSpacing.audioInterface.controlSpacing[currentBreakpoint as keyof typeof responsiveSpacing.audioInterface.controlSpacing] ||
                     responsiveSpacing.audioInterface.controlSpacing.md,
      visualizerHeight: responsiveSpacing.audioInterface.visualizerHeight[currentBreakpoint as keyof typeof responsiveSpacing.audioInterface.visualizerHeight] ||
                       responsiveSpacing.audioInterface.visualizerHeight.md,
    },
  }), [currentBreakpoint]);

  return spacingUtils;
};

// Audio interface layout hook
export const useAudioInterfaceLayout = () => {
  const { isMobile, isTablet, isDesktop, isTouchDevice } = useResponsiveLayout();
  const spacing = useFluidSpacing();

  const layoutConfig = useMemo(() => ({
    // Audio controls configuration
    audioControls: {
      orientation: isMobile ? 'vertical' : 'horizontal' as const,
      buttonSize: isTouchDevice ? 'large' : 'medium' as const,
      spacing: spacing.audioInterface.controlSpacing,
      showLabels: !isMobile,
      compactMode: isMobile,
    },

    // Speaker mapping UI configuration
    speakerMapping: {
      layout: isMobile ? 'list' : isTablet ? 'grid-2' : 'grid-3' as const,
      cardSize: isMobile ? 'compact' : 'standard' as const,
      showAvatars: !isMobile,
      dragAndDrop: !isTouchDevice, // Disable on touch devices for better UX
    },

    // Transcript display configuration
    transcriptDisplay: {
      maxWidth: isMobile ? '100%' : isTablet ? '80%' : '70%',
      fontSize: isMobile ? 'clamp(0.875rem, 2.8vw, 1.125rem)' : 'clamp(0.875rem, 2.8vw, 1.25rem)',
      lineHeight: isMobile ? 1.6 : 1.7,
      showTimestamps: !isMobile,
      showSpeakerAvatars: isDesktop,
      compactMode: isMobile,
    },

    // Audio visualizer configuration  
    visualizer: {
      height: spacing.audioInterface.visualizerHeight,
      showFrequencyBars: isDesktop,
      animationLevel: isTouchDevice ? 'reduced' : 'full' as const,
      responsiveScale: isMobile ? 0.8 : 1,
    },

    // Layout helpers
    layout: {
      shouldStack: isMobile,
      shouldUseDrawer: isMobile || isTablet,
      mainContentWidth: isDesktop ? 'calc(100% - 280px)' : '100%',
      sidebarWidth: isDesktop ? '280px' : '100%',
      headerHeight: isMobile ? '56px' : '64px',
    },
  }), [isMobile, isTablet, isDesktop, isTouchDevice, spacing]);

  return layoutConfig;
};

// Theme-aware responsive values hook
export const useResponsiveValue = <T>(values: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  xxl?: T;
}) => {
  const { currentBreakpoint } = useResponsiveLayout();
  
  return useMemo(() => {
    // Find the appropriate value, falling back to smaller breakpoints if needed
    const breakpointOrder = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs'] as const;
    const currentIndex = breakpointOrder.indexOf(currentBreakpoint as any);
    
    // If current breakpoint is found, start from there, otherwise start from beginning
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    
    for (let i = startIndex; i < breakpointOrder.length; i++) {
      const bp = breakpointOrder[i];
      if (bp && values[bp] !== undefined) {
        return values[bp];
      }
    }
    
    // Final fallback
    return values.xs;
  }, [values, currentBreakpoint]);
};