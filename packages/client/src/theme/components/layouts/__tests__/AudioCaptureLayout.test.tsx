import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, expect, it, beforeEach, vi } from 'vitest';

vi.mock('../../../hooks/useResponsiveLayout', async () => {
  const actual = await vi.importActual<
    typeof import('../../../hooks/useResponsiveLayout')
  >('../../../hooks/useResponsiveLayout');
  return {
    ...actual,
    useResponsiveLayout: vi.fn(),
  };
});

import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import AudioCaptureLayout from '../AudioCaptureLayout';

const mockedLayout = vi.mocked(useResponsiveLayout);
const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

beforeEach(() => {
  mockedLayout.mockReturnValue({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeScreen: false,
    currentBreakpoint: 'lg',
    isTouchDevice: false,
  });
});

describe('AudioCaptureLayout', () => {
  it('renders all sections with paper wrapper by default', () => {
    renderWithTheme(
      <AudioCaptureLayout
        recordingControls={<div>controls</div>}
        audioVisualizer={<div>visualizer</div>}
        fileUploadZone={<div>upload</div>}
        sessionInfo={<div>session</div>}
        actions={<button type='button'>extra</button>}
      />
    );

    expect(screen.getByText('session')).toBeInTheDocument();
    expect(screen.getByText('visualizer')).toBeInTheDocument();
    expect(screen.getByText('controls')).toBeInTheDocument();
    expect(screen.getByText('upload')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'extra' })).toBeInTheDocument();
    expect(
      screen.getByText('controls').closest('.MuiPaper-root')
    ).not.toBeNull();
  });

  it('supports compact mode without paper wrapper', () => {
    mockedLayout.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isLargeScreen: false,
      currentBreakpoint: 'xs',
      isTouchDevice: true,
    });

    const { container } = renderWithTheme(
      <AudioCaptureLayout
        recordingControls={<div data-testid='controls'>controls</div>}
        compact
        paperWrapper={false}
        height='420px'
      />
    );

    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(window.getComputedStyle(root).height).toBe('420px');
    expect(window.getComputedStyle(root).display).toBe('flex');
  });
});
