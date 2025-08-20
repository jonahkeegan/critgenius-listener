/**
 * @fileoverview TwoColumnLayout Component
 * Flexible desktop/mobile layout switcher with configurable column ratios
 */

import React from 'react';
import { Box, Paper, PaperProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useFluidSpacing } from '../../hooks/useResponsiveLayout';

export interface TwoColumnLayoutProps {
  /** Left column content */
  leftColumn: React.ReactNode;
  /** Right column content */
  rightColumn: React.ReactNode;
  /** Column ratio on desktop (left/right) */
  columnRatio?: [number, number];
  /** Breakpoint to switch from two columns to stacked */
  stackBreakpoint?: 'xs' | 'sm' | 'md' | 'lg';
  /** Reverse order on mobile (right column first) */
  reverseOnMobile?: boolean;
  /** Add spacing between columns */
  spacing?: number;
  /** Wrap columns in Paper components */
  paperWrapper?: boolean;
  /** Paper elevation for wrapped columns */
  elevation?: number;
  /** Additional Paper props */
  paperProps?: PaperProps;
  /** Custom sx for the main container */
  sx?: object;
  /** Enable sticky positioning for left column on desktop */
  stickyLeft?: boolean;
  /** Enable sticky positioning for right column on desktop */
  stickyRight?: boolean;
  /** Custom height for the layout container */
  height?: string | number;
}

/**
 * TwoColumnLayout - Flexible desktop/mobile layout switcher
 *
 * Features:
 * - Configurable column ratios (e.g., 60/40, 70/30)
 * - Responsive breakpoint switching
 * - Support for audio capture controls + transcript display
 * - Mobile-first stacked layout
 * - Optional sticky positioning
 */
export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  leftColumn,
  rightColumn,
  columnRatio = [7, 5], // Default 7:5 ratio (approximately 60:40)
  stackBreakpoint = 'md',
  reverseOnMobile = false,
  spacing = 2,
  paperWrapper = false,
  elevation = 1,
  paperProps = {},
  sx = {},
  stickyLeft = false,
  stickyRight = false,
  height,
}) => {
  const theme = useTheme();
  const { sectionSpacing } = useFluidSpacing();

  // Calculate if we should stack columns based on current breakpoint
  const shouldStack = React.useMemo(() => {
    const breakpoints = theme.breakpoints.values;
    const currentBreakpoint = window.innerWidth;

    switch (stackBreakpoint) {
      case 'xs':
        return currentBreakpoint < breakpoints.xs;
      case 'sm':
        return currentBreakpoint < breakpoints.sm;
      case 'md':
        return currentBreakpoint < breakpoints.md;
      case 'lg':
        return currentBreakpoint < breakpoints.lg;
      default:
        return currentBreakpoint < breakpoints.md;
    }
  }, [theme.breakpoints, stackBreakpoint]);

  // Calculate column widths for Grid system (out of 12)
  const leftWidth = Math.round(
    (columnRatio[0] / (columnRatio[0] + columnRatio[1])) * 12
  );
  const rightWidth = 12 - leftWidth;

  // Column content with conditional wrapper
  const leftContent = paperWrapper ? (
    <Paper elevation={elevation} {...paperProps}>
      <Box sx={{ p: sectionSpacing }}>{leftColumn}</Box>
    </Paper>
  ) : (
    leftColumn
  );

  const rightContent = paperWrapper ? (
    <Paper elevation={elevation} {...paperProps}>
      <Box sx={{ p: sectionSpacing }}>{rightColumn}</Box>
    </Paper>
  ) : (
    rightColumn
  );

  // Sticky positioning styles
  const getStickyStyles = (isSticky: boolean) => ({
    ...(isSticky &&
      !shouldStack && {
        position: 'sticky' as const,
        top: theme.spacing(2),
        alignSelf: 'flex-start',
      }),
  });

  return (
    <Box
      sx={{
        width: '100%',
        ...(height && { height }),
        display: 'flex',
        flexDirection:
          shouldStack && reverseOnMobile
            ? 'column-reverse'
            : shouldStack
              ? 'column'
              : 'row',
        gap: theme.spacing(spacing),
        ...sx,
      }}
    >
      {/* Left Column */}
      <Box
        sx={{
          flex: shouldStack ? '1 1 auto' : `0 0 ${(leftWidth / 12) * 100}%`,
          ...getStickyStyles(stickyLeft),
        }}
      >
        {leftContent}
      </Box>

      {/* Right Column */}
      <Box
        sx={{
          flex: shouldStack ? '1 1 auto' : `0 0 ${(rightWidth / 12) * 100}%`,
          ...getStickyStyles(stickyRight),
        }}
      >
        {rightContent}
      </Box>
    </Box>
  );
};

export default TwoColumnLayout;
