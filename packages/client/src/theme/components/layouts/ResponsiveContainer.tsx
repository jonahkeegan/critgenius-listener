/**
 * @fileoverview ResponsiveContainer Component
 * Foundation container with fluid sizing and responsive padding
 */

import React from 'react';
import { Box, Container, ContainerProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useResponsiveLayout, useFluidSpacing } from '../../hooks/useResponsiveLayout';

export interface ResponsiveContainerProps extends Omit<ContainerProps, 'maxWidth'> {
  /** Maximum width configuration */
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | false | string;
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
  const { isMobile, isTablet, currentBreakpoint } = useResponsiveLayout();
  const spacing = useFluidSpacing();

  // Determine container max width based on behavior and screen size
  const getMaxWidth = () => {
    if (typeof maxWidth === 'string' && maxWidth !== 'false') {
      switch (behavior) {
        case 'audio-focused':
          // Wider containers for audio interfaces
          if (maxWidth === 'lg') return 'xl';
          if (maxWidth === 'md') return 'lg';
          return maxWidth;
        
        case 'reading-optimized':
          // Narrower containers for better reading
          if (maxWidth === 'xl') return 'lg';
          if (maxWidth === 'lg') return 'md';
          return maxWidth;
        
        default:
          return maxWidth;
      }
    }
    return maxWidth;
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

  const containerSx = {
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

  // Handle custom maxWidth values (like 'xxl' or pixel values)
  if (typeof maxWidth === 'string' && !['xs', 'sm', 'md', 'lg', 'xl', 'false'].includes(maxWidth)) {
    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: maxWidth === 'xxl' ? '1920px' : maxWidth,
          mx: 'auto',
          px: getContainerPadding(),
          ...containerSx,
        }}
        {...props}
      >
        {children}
      </Box>
    );
  }

  return (
    <Container
      maxWidth={getMaxWidth() as ContainerProps['maxWidth']}
      sx={{
        px: getContainerPadding(),
        ...containerSx,
      }}
      {...props}
    >
      {children}
    </Container>
  );
};

export default ResponsiveContainer;