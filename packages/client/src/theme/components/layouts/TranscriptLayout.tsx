/**
 * @fileoverview TranscriptLayout Component
 * Specialized layout for transcript display with responsive text and speaker management
 */

import React from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useResponsiveLayout, useFluidSpacing } from '../../hooks/useResponsiveLayout';

export interface TranscriptLayoutProps {
  /** Main transcript content */
  transcript: React.ReactNode;
  /** Speaker identification panel */
  speakerPanel?: React.ReactNode;
  /** Transcript controls (search, export, etc.) */
  controls?: React.ReactNode;
  /** Status information (recording time, word count, etc.) */
  statusInfo?: React.ReactNode;
  /** Enable paper wrapper for elevated appearance */
  paperWrapper?: boolean;
  /** Paper elevation */
  elevation?: number;
  /** Layout mode: side-by-side vs stacked */
  layoutMode?: 'auto' | 'stacked' | 'side-by-side';
  /** Enable sticky speaker panel on desktop */
  stickySpeakerPanel?: boolean;
  /** Maximum width for transcript content (reading optimization) */
  maxContentWidth?: string;
  /** Custom height for the layout container */
  height?: string | number;
}

/**
 * TranscriptLayout - Specialized layout for transcript display
 * 
 * Features:
 * - Reading-optimized text layout with responsive typography
 * - Speaker identification panel with mobile-friendly stacking
 * - Responsive layout switching between side-by-side and stacked
 * - Touch-friendly controls and navigation
 * - Optimized text contrast and readability
 * - Sticky speaker panel option for longer transcripts
 */
export const TranscriptLayout: React.FC<TranscriptLayoutProps> = ({
  transcript,
  speakerPanel,
  controls,
  statusInfo,
  paperWrapper = true,
  elevation = 1,
  layoutMode = 'auto',
  stickySpeakerPanel = false,
  maxContentWidth = '65ch', // Optimal reading line length
  height,
}) => {
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsiveLayout();
  const { sectionSpacing } = useFluidSpacing();

  // Determine effective layout mode
  const shouldStack = React.useMemo(() => {
    if (layoutMode === 'stacked') return true;
    if (layoutMode === 'side-by-side') return false;
    return isMobile || isTablet;
  }, [layoutMode, isMobile, isTablet]);

  // Calculate responsive padding and spacing
  const getLayoutPadding = () => {
    if (isMobile) return theme.spacing(2, 2);
    if (isTablet) return theme.spacing(3, 3);
    return theme.spacing(4, 4);
  };

  const containerSx = {
    width: '100%',
    ...(height && { height }),
    p: getLayoutPadding(),
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(shouldStack ? 2 : 1),
    // Optimize for reading
    backgroundColor: paperWrapper ? theme.palette.background.paper : 'transparent',
    position: 'relative',
  } as const;

  // Speaker panel positioning styles
  const speakerPanelSx = {
    flex: shouldStack ? '0 0 auto' : '0 0 280px',
    ...(stickySpeakerPanel && !shouldStack && {
      position: 'sticky',
      top: theme.spacing(2),
      alignSelf: 'flex-start',
      maxHeight: 'calc(100vh - 120px)',
      overflowY: 'auto',
    }),
  };

  // Transcript content area styles
  const transcriptContentSx = {
    flex: 1,
    maxWidth: shouldStack ? '100%' : maxContentWidth,
    mx: shouldStack ? 0 : 'auto',
    // Optimize typography for reading
    '& .transcript-text': {
      fontSize: isMobile ? 'clamp(0.875rem, 2.8vw, 1rem)' : 'clamp(1rem, 2.5vw, 1.125rem)',
      lineHeight: 1.7,
      letterSpacing: '0.01em',
      color: theme.palette.text.primary,
    },
    // Speaker labels styling
    '& .speaker-label': {
      fontWeight: 600,
      color: theme.palette.primary.main,
      fontSize: '0.875em',
      marginBottom: theme.spacing(0.5),
    },
    // Timestamp styling
    '& .timestamp': {
      fontSize: '0.75em',
      color: theme.palette.text.secondary,
      fontFamily: theme.typography.fontFamily,
    },
  };

  const content = (
    <>
      {/* Header Section: Controls and Status */}
      {(controls || statusInfo) && (
        <Box
          sx={
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: theme.spacing(2),
            mb: theme.spacing(2),
            pb: theme.spacing(2),
            borderBottom: `1px solid ${theme.palette.divider}`,
          }
        >
          {/* Controls */}
          {controls && (
            <Box sx={{ flex: 1 }}>
              {controls}
            </Box>
          )}

          {/* Status Info */}
          {statusInfo && (
            <Box sx={{ flex: isMobile ? 1 : '0 0 auto' }}>
              {statusInfo}
            </Box>
          )}
        </Box>
      )}

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: shouldStack ? 'column' : 'row',
          gap: theme.spacing(shouldStack ? 3 : 4),
          alignItems: shouldStack ? 'stretch' : 'flex-start',
        }}
      >
        {/* Transcript Content */}
        <Box sx={transcriptContentSx}>
          {transcript}
        </Box>

        {/* Speaker Panel */}
        {speakerPanel && (
          <Box sx={speakerPanelSx}>
            {speakerPanel}
          </Box>
        )}
      </Box>
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

export default TranscriptLayout;