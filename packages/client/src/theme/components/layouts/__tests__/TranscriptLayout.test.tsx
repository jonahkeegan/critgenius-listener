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
import TranscriptLayout from '../TranscriptLayout';

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

describe('TranscriptLayout', () => {
  it('stacks content when in auto mode on mobile screens', () => {
    mockedLayout.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false,
      isLargeScreen: false,
      currentBreakpoint: 'xs',
      isTouchDevice: true,
    });

    renderWithTheme(
      <TranscriptLayout
        transcript={<div data-testid='transcript'>transcript</div>}
        speakerPanel={<div>panel</div>}
        controls={<button type='button'>controls</button>}
        statusInfo={<span>status</span>}
      />
    );

    expect(screen.getByText('panel')).toBeInTheDocument();
    expect(screen.getByText('status')).toBeInTheDocument();
    const container = screen
      .getByTestId('transcript')
      .closest('.MuiPaper-root');
    expect(container).not.toBeNull();
  });

  it('keeps columns side-by-side with sticky speaker panel when requested', () => {
    mockedLayout.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      isLargeScreen: true,
      currentBreakpoint: 'xl',
      isTouchDevice: false,
    });

    renderWithTheme(
      <TranscriptLayout
        transcript={<div data-testid='transcript'>transcript</div>}
        speakerPanel={<div data-testid='speaker'>speaker</div>}
        controls={<div>controls</div>}
        statusInfo={<div>status</div>}
        paperWrapper={false}
        layoutMode='side-by-side'
        stickySpeakerPanel
        maxContentWidth='500px'
      />
    );

    const speaker = screen.getByTestId('speaker');
    const speakerContainer = speaker.parentElement as HTMLElement;
    expect(window.getComputedStyle(speakerContainer).position).toBe('sticky');
    const transcriptContainer = screen.getByTestId('transcript')
      .parentElement as HTMLElement;
    expect(window.getComputedStyle(transcriptContainer).maxWidth).toBe('500px');
  });
});
