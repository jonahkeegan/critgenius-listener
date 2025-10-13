import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('../../hooks/useResponsiveLayout', async () => {
  const actual = await vi.importActual<
    typeof import('../../hooks/useResponsiveLayout')
  >('../../hooks/useResponsiveLayout');
  return {
    ...actual,
    useResponsiveLayout: vi.fn(),
    useFluidSpacing: vi.fn(),
  };
});

import {
  useResponsiveLayout,
  useFluidSpacing,
} from '../../hooks/useResponsiveLayout';
import ResponsiveContainer from '../layouts/ResponsiveContainer.tsx';

const mockedUseResponsiveLayout = vi.mocked(useResponsiveLayout);
const mockedUseFluidSpacing = vi.mocked(useFluidSpacing);

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={createTheme()}>{ui}</ThemeProvider>);

beforeEach(() => {
  cleanup();
  mockedUseResponsiveLayout.mockReturnValue({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeScreen: false,
    currentBreakpoint: 'lg',
    isTouchDevice: false,
  });
  mockedUseFluidSpacing.mockReturnValue({
    containerPadding: '16px',
    sectionSpacing: '24px',
    componentSpacing: '12px',
    touchTarget: {
      minimum: '44px',
      comfortable: '48px',
      large: '56px',
    },
    audioInterface: {
      controlSpacing: '10px',
      visualizerHeight: '120px',
    },
  });
});

describe('ResponsiveContainer', () => {
  it('renders with default configuration and forwards props', () => {
    renderWithTheme(
      <ResponsiveContainer data-testid='container'>
        <div>content</div>
      </ResponsiveContainer>
    );

    const container = screen.getByTestId('container');
    expect(container).toBeInTheDocument();
    expect(mockedUseResponsiveLayout).toHaveBeenCalled();
    expect(mockedUseFluidSpacing).toHaveBeenCalled();
  });

  it('adjusts layout for audio-focused behavior on mobile', () => {
    mockedUseResponsiveLayout.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isLargeScreen: false,
      currentBreakpoint: 'xs',
      isTouchDevice: true,
    });

    renderWithTheme(
      <ResponsiveContainer data-testid='audio' behavior='audio-focused'>
        <div>audio</div>
      </ResponsiveContainer>
    );

    const container = screen.getByTestId('audio');
    expect(container).toBeInTheDocument();
  });

  it('supports custom max width values like xxl', () => {
    renderWithTheme(
      <ResponsiveContainer data-testid='custom' maxWidth='xxl'>
        <div>wide</div>
      </ResponsiveContainer>
    );

    const element = screen.getByTestId('custom');
    expect(element).toBeInTheDocument();
  });

  it('renders reading-optimized layouts with responsive margins', () => {
    mockedUseResponsiveLayout.mockReturnValue({
      isMobile: false,
      isTablet: true,
      isDesktop: false,
      isLargeScreen: false,
      currentBreakpoint: 'lg',
      isTouchDevice: false,
    });

    renderWithTheme(
      <ResponsiveContainer
        data-testid='reading'
        behavior='reading-optimized'
        responsiveMargins
      >
        <div>reading</div>
      </ResponsiveContainer>
    );

    const element = screen.getByTestId('reading');
    expect(element).toBeInTheDocument();
  });
});
