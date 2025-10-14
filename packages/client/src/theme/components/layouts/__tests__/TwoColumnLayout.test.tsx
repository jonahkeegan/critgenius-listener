import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../../hooks/useResponsiveLayout', async () => ({
  ...(await vi.importActual<
    typeof import('../../../hooks/useResponsiveLayout')
  >('../../../hooks/useResponsiveLayout')),
  useFluidSpacing: vi.fn(),
}));

import { useFluidSpacing } from '../../../hooks/useResponsiveLayout';
import TwoColumnLayout from '../TwoColumnLayout';

const mockedSpacing = vi.mocked(useFluidSpacing);
const theme = createTheme();
const originalInnerWidth = window.innerWidth;

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

beforeEach(() => {
  mockedSpacing.mockReturnValue({
    sectionSpacing: '24px',
    containerPadding: '16px',
    componentSpacing: '12px',
    touchTarget: {
      minimum: '44px',
      comfortable: '48px',
      large: '56px',
    },
    audioInterface: {
      controlSpacing: '10px',
      visualizerHeight: '160px',
    },
  });
});

afterEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: originalInnerWidth,
  });
});

describe('TwoColumnLayout', () => {
  it('renders side-by-side columns with paper wrappers on desktop', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1400,
    });

    renderWithTheme(
      <TwoColumnLayout
        leftColumn={<div data-testid='left'>left</div>}
        rightColumn={<div data-testid='right'>right</div>}
        paperWrapper
        stickyLeft
        stickyRight
        columnRatio={[8, 4]}
      />
    );

    const left = screen.getByTestId('left').parentElement
      ?.parentElement as HTMLElement;
    const right = screen.getByTestId('right').parentElement
      ?.parentElement as HTMLElement;

    expect(left).toHaveClass('MuiPaper-root');
    expect(right).toHaveClass('MuiPaper-root');

    const leftColumn = left.parentElement as HTMLElement;
    const rightColumn = right.parentElement as HTMLElement;
    const leftStyles = window.getComputedStyle(leftColumn);
    const rightStyles = window.getComputedStyle(rightColumn);
    expect(parseFloat(leftStyles.flexBasis)).toBeCloseTo(66.66, 1);
    expect(parseFloat(rightStyles.flexBasis)).toBeCloseTo(33.33, 1);
  });

  it('stacks columns and reverses order on mobile when configured', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    renderWithTheme(
      <TwoColumnLayout
        leftColumn={<div>left</div>}
        rightColumn={<div data-testid='right'>right</div>}
        reverseOnMobile
        stackBreakpoint='md'
      />
    );

    const container = screen.getByTestId('right').parentElement
      ?.parentElement as HTMLElement;
    const styles = window.getComputedStyle(container);
    expect(styles.flexDirection).toBe('column-reverse');
  });
});
