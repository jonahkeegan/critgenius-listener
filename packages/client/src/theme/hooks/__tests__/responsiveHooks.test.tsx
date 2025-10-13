import { renderHook } from '@testing-library/react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@mui/material', async () => {
  const actual =
    await vi.importActual<typeof import('@mui/material')>('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(),
  };
});

import * as Material from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import {
  useAudioInterfaceLayout,
  useResponsiveValue,
} from '../useResponsiveLayout';

const theme = createTheme();
const mediaQueryMock = vi.mocked(Material.useMediaQuery);

const setBreakpointScenario = (scenario: {
  isMobile?: boolean;
  isTablet?: boolean;
  isDesktop?: boolean;
  isLargeScreen?: boolean;
}) => {
  mediaQueryMock.mockImplementation(queryInput => {
    const query =
      typeof queryInput === 'function' ? queryInput(theme) : queryInput;

    switch (query) {
      case theme.breakpoints.down('md'): {
        return Boolean(scenario.isMobile);
      }
      case theme.breakpoints.between('md', 'xl'): {
        return Boolean(scenario.isTablet);
      }
      case theme.breakpoints.up('xl'): {
        return Boolean(scenario.isDesktop);
      }
      case '(min-width: 1920px)': {
        return Boolean(scenario.isLargeScreen);
      }
      default:
        return false;
    }
  });
};

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

beforeEach(() => {
  setBreakpointScenario({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeScreen: false,
  });
});

afterEach(() => {
  mediaQueryMock.mockReset();
  delete (window as unknown as { ontouchstart?: unknown }).ontouchstart;
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: 0,
    configurable: true,
  });
});

describe('responsive layout hooks', () => {
  it('derives responsive values based on current breakpoint', () => {
    const { result } = renderHook(
      () =>
        useResponsiveValue({
          xs: 'mobile',
          md: 'tablet',
          lg: 'desktop',
        }),
      { wrapper }
    );

    expect(result.current).toBe('desktop');

    setBreakpointScenario({
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      isLargeScreen: false,
    });

    const fallback = renderHook(
      () =>
        useResponsiveValue({
          xs: 'fallback',
          md: 'mid',
        }),
      { wrapper }
    );

    expect(fallback.result.current).toBe('mid');
  });

  it('builds audio interface layout values from responsive data', () => {
    setBreakpointScenario({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isLargeScreen: false,
    });

    Object.defineProperty(window, 'ontouchstart', {
      value: () => undefined,
      configurable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 2,
      configurable: true,
    });

    const { result } = renderHook(() => useAudioInterfaceLayout(), { wrapper });

    expect(result.current.audioControls.orientation).toBe('vertical');
    expect(result.current.speakerMapping.layout).toBe('list');
    expect(result.current.transcriptDisplay.compactMode).toBe(true);
    expect(result.current.visualizer.animationLevel).toBe('reduced');
  });
});
