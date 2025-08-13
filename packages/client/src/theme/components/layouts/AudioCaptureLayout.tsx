/**
 * @fileoverview AudioCaptureLayout Component
 * Specialized layout for recording interface with responsive controls and audio visualization
 */

import React from 'react';
import { Box, Paper, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useResponsiveLayout, useFluidSpacing } from '../../hooks/useResponsiveLayout';

export interface AudioCaptureLayoutProps {
  /** Recording controls component */
  recordingControls: React.ReactNode;
  /** Audio visualization component */
  audioVisualizer?: React.ReactNode;
  /** File upload zone component */
  fileUploadZone?: React.ReactNode;
  /** Session info display */
  sessionInfo?: React.ReactNode;
  /** Additional actions or settings */
  actions?: React.ReactNode;
  /** Enable paper wrapper for elevated appearance */
  paperWrapper?: boolean;
  /** Paper elevation */
  elevation?: number;
  /** Custom container height */
  height?: string | number;
  /** Compact mode for smaller screens */
  compact?: boolean;
}

/**
 * AudioCaptureLayout - Specialized layout for recording interface
 * 
 * Features:
 * - Responsive recording controls with mobile-first design
 * - Optimized layout for audio visualization and level monitoring
 * - Touch-friendly controls with large tap targets on mobile
 * - Flexible arrangement that adapts to screen size and orientation
 * - Integrated file upload zone for audio file processing
 */
export const AudioCaptureLayout: React.FC<AudioCaptureLayoutProps> = ({
  recordingControls,
  audioVisualizer,
  fileUploadZone,
  sessionInfo,
  actions,
  paperWrapper = true,
  elevation = 2,
  height,
  compact = false,
}) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsiveLayout();
  const { sectionSpacing } = useFluidSpacing();

  // Determine layout orientation based on screen size and compact mode
  const isVerticalLayout = isMobile || compact;
  const spacing = isVerticalLayout ? 2 : 3;

  // Calculate responsive padding
  const getLayoutPadding = () => {
    if (isMobile) return theme.spacing(2);
    if (isTablet) return theme.spacing(3);
    return theme.spacing(4);
  };

  const containerSx = {
    width: '100%',
    ...(height && { height }),
    p: getLayoutPadding(),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(spacing),
    // Ensure proper touch targets on mobile
    minHeight: isMobile ? 'auto' : '400px',
    // Add subtle background gradient for depth
    ...(paperWrapper && {
      background: `linear-gradient(135deg, 
        ${theme.palette.background.paper} 0%, 
        ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'} 100%)`,
    }),
  } as const;

  const content = (
    <>
      {/* Session Info - Always at top when present */}
      {sessionInfo && (
        <Box
          sx={{
            order: -1,
            mb: theme.spacing(1),
          }}
        >
          {sessionInfo}
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: isVerticalLayout ? 'column' : 'row',
          gap: theme.spacing(spacing),
          alignItems: isVerticalLayout ? 'stretch' : 'center',
        }}
      >
        {/* Audio Visualizer Section */}
        {audioVisualizer && (
          <Box
            sx={{
              flex: isVerticalLayout ? '0 0 auto' : '1 1 auto',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: isVerticalLayout ? '120px' : '200px',
              // Add responsive constraints
              maxHeight: isVerticalLayout ? '200px' : '300px',
            }}
          >
            {audioVisualizer}
          </Box>
        )}

        {/* Recording Controls Section */}
        <Box
          sx={{
            flex: isVerticalLayout ? '0 0 auto' : '0 0 280px',
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2),
          }}
        >
          {recordingControls}

          {/* Actions positioned below controls */}
          {actions && (
            <Box
              sx={{
                mt: theme.spacing(1),
              }}
            >
              {actions}
            </Box>
          )}
        </Box>
      </Box>

      {/* File Upload Zone - Bottom section */}
      {fileUploadZone && (
        <Box
          sx={{
            mt: 'auto',
            pt: theme.spacing(2),
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          {fileUploadZone}
        </Box>
      )}
    </>
  );

  if (paperWrapper) {
    return (
      <Paper elevation={elevation} sx={containerSx}>
        {content}
      </Paper>
    );
  }

  return (
    <Box sx={containerSx}>
      {content}
    </Box>
  );
};

export default AudioCaptureLayout;