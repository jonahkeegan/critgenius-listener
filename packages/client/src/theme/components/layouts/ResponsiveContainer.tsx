/**
 * @fileoverview ResponsiveContainer Component
 * Foundation container with fluid sizing and responsive padding
 */

import React from 'react';
import { Container, ContainerProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  useResponsiveLayout,
  useFluidSpacing,
} from '../../hooks/useResponsiveLayout';

export interface ResponsiveContainerProps
  extends Omit<ContainerProps, 'maxWidth'> {
  /** Maximum width configuration */
  maxWidth?: ContainerProps['maxWidth'] | 'xxl' | (string & {});
  /** Enable fluid padding that scales with screen size */
  fluidPadding?: boolean;
  /** Enable responsive margins */
  responsiveMargins?: boolean;
  /** Custom padding override */
  padding?: number | string;
  /** Center content vertically */
  centerVertically?: boolean;
  /** Minimum height for the container */
  minHeight?: string | number;
  /** Enable full viewport height */
  fullHeight?: boolean;
  /** Custom breakpoint behavior */
  behavior?: 'standard' | 'audio-focused' | 'reading-optimized';
}

// Utility helpers for breakpoint and maxWidth handling
const standardBreakpoints = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
type StandardBreakpoint = (typeof standardBreakpoints)[number];

function isStandardBreakpointName(v: string): v is StandardBreakpoint {
  return (standardBreakpoints as readonly string[]).includes(v);
}

function isCustomMaxWidthValue(
  v: ResponsiveContainerProps['maxWidth']
): v is string {
  return typeof v === 'string' && !isStandardBreakpointName(v);
}

/**
 * ResponsiveContainer - Foundation container with enhanced responsive capabilities
 *
 * Features:
 * - Fluid padding that adapts to screen size and content type
 * - Custom breakpoint configurations for different use cases
 * - Support for audio interface and reading-optimized layouts
 * - Automatic margin and spacing management
 * - Integration with the enhanced breakpoint system
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth = 'lg',
  fluidPadding = true,
  responsiveMargins = true,
  padding,
  centerVertically = false,
  minHeight,
  fullHeight = false,
  behavior = 'standard',
  sx = {},
  ...props
}) => {
  const theme = useTheme();
  const { isMobile } = useResponsiveLayout();
  const spacing = useFluidSpacing();

  // Determine container max width based on behavior and screen size
  const getMaxWidth = (): Exclude<ContainerProps['maxWidth'], undefined> => {
    if (typeof maxWidth === 'string') {
      switch (behavior) {
        case 'audio-focused':
          // Wider containers for audio interfaces
          if (maxWidth === 'lg') return 'xl';
          if (maxWidth === 'md') return 'lg';
          return maxWidth as Exclude<ContainerProps['maxWidth'], undefined>;

        case 'reading-optimized':
          // Narrower containers for better reading
          if (maxWidth === 'xl') return 'lg';
          if (maxWidth === 'lg') return 'md';
          return maxWidth as Exclude<ContainerProps['maxWidth'], undefined>;

        default:
          return maxWidth as Exclude<ContainerProps['maxWidth'], undefined>;
      }
    }
    return maxWidth as Exclude<ContainerProps['maxWidth'], undefined>;
  };

  // Calculate responsive padding
  const getContainerPadding = () => {
    if (padding !== undefined) return padding;
    if (!fluidPadding) return theme.spacing(2);

    switch (behavior) {
      case 'audio-focused':
        // More generous padding for touch interfaces
        return isMobile ? theme.spacing(3) : theme.spacing(4);

      case 'reading-optimized':
        // Optimized for text content
        return isMobile ? theme.spacing(2, 3) : theme.spacing(4, 6);

      default:
        return spacing.containerPadding;
    }
  };

  // Calculate responsive margins
  const getResponsiveMargins = () => {
    if (!responsiveMargins) return {};

    switch (behavior) {
      case 'audio-focused':
        return {
          my: isMobile ? 1 : 2,
        };

      case 'reading-optimized':
        return {
          my: isMobile ? 2 : 4,
        };

      default:
        return {
          my: spacing.componentSpacing,
        };
    }
  };

  const containerSx: NonNullable<ContainerProps['sx']> = {
    ...(fullHeight && { minHeight: '100vh' }),
    ...(minHeight && { minHeight }),
    ...(centerVertically && {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }),
    ...getResponsiveMargins(),
    ...sx,
  };

  // Render helper for custom maxWidth handling (e.g., 'xxl' or raw pixel values)
  const renderCustomMaxWidthContainer = () => (
    <Container
      maxWidth={false}
      sx={{
        px: getContainerPadding() as string | number,
        ...containerSx,
        '& > *': {
          width: '100%',
          maxWidth: maxWidth === 'xxl' ? '1920px' : (maxWidth as string),
          mx: 'auto',
        },
      }}
    >
      {children}
    </Container>
  );

  // Handle custom maxWidth values (like 'xxl' or pixel values) by using Container with maxWidth=false
  if (isCustomMaxWidthValue(maxWidth)) {
    return renderCustomMaxWidthContainer();
  }

  return (
    <Container
      maxWidth={getMaxWidth()}
      sx={{
        px: getContainerPadding() as string | number,
        ...containerSx,
      }}
      {...props}
    >
      {children}
    </Container>
  );
};

export default ResponsiveContainer;
