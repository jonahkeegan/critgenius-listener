/**
 * @fileoverview Responsive Audio Interface Components
 * Example components demonstrating the enhanced breakpoint and typography system
 */

import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Typography,
  LinearProgress,
  useTheme,
} from '@mui/material';
import { Mic, Pause, Stop, Settings } from '@mui/icons-material';
import {
  useResponsiveLayout,
  useFluidSpacing,
  useAudioInterfaceLayout,
  useResponsiveValue,
} from '../hooks/useResponsiveLayout';
import { typographyUtilities, typographyHelpers } from '../critgeniusTheme';

// Mobile-optimized recording controls component
export const AudioCapturePanel: React.FC = () => {
  const theme = useTheme();
  const { isMobile, isTouchDevice } = useResponsiveLayout();
  const spacing = useFluidSpacing();
  const { audioControls } = useAudioInterfaceLayout();

  const buttonMinHeight = useResponsiveValue({
    xs: spacing.touchTarget.minimum,
    md: spacing.touchTarget.comfortable,
    xl: spacing.touchTarget.large,
  });

  return (
    <Card
      sx={{
        p: spacing.containerPadding,
        background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
        border: `1px solid ${theme.palette.primary.main}20`,
      }}
    >
      <CardContent>
        <Typography
          variant='h5'
          sx={{
            ...typographyUtilities.audioControls,
            mb: spacing.componentSpacing,
            textAlign: isMobile ? 'center' : 'left',
          }}
        >
          Audio Capture
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 3,
            alignItems: 'center',
            justifyContent: isMobile ? 'center' : 'flex-start',
          }}
        >
          {/* Primary recording button */}
          <Button
            variant='contained'
            startIcon={<Mic />}
            sx={{
              minHeight: buttonMinHeight,
              minWidth: isTouchDevice ? buttonMinHeight : 'auto',
              borderRadius: theme.spacing(1),
              fontSize: typographyUtilities.audioControls.fontSize,
              fontWeight: typographyUtilities.audioControls.fontWeight,
              px: isMobile ? 4 : 3,
              py: isMobile ? 1.5 : 1,
              ...typographyHelpers.readingOptimization,
            }}
          >
            {audioControls.showLabels ? 'Start Recording' : ''}
          </Button>

          {/* Secondary controls */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              size={isMobile ? 'large' : 'medium'}
              sx={{
                minHeight: isTouchDevice ? spacing.touchTarget.minimum : 'auto',
                minWidth: isTouchDevice ? spacing.touchTarget.minimum : 'auto',
                color: theme.palette.warning.main,
              }}
            >
              <Pause />
            </IconButton>

            <IconButton
              size={isMobile ? 'large' : 'medium'}
              sx={{
                minHeight: isTouchDevice ? spacing.touchTarget.minimum : 'auto',
                minWidth: isTouchDevice ? spacing.touchTarget.minimum : 'auto',
                color: theme.palette.error.main,
              }}
            >
              <Stop />
            </IconButton>

            <IconButton
              size={isMobile ? 'large' : 'medium'}
              sx={{
                minHeight: isTouchDevice ? spacing.touchTarget.minimum : 'auto',
                minWidth: isTouchDevice ? spacing.touchTarget.minimum : 'auto',
              }}
            >
              <Settings />
            </IconButton>
          </Box>
        </Box>

        {/* Audio level indicator */}
        <Box sx={{ mt: spacing.componentSpacing }}>
          <Typography
            variant='body2'
            sx={{
              ...typographyUtilities.timestamp,
              mb: 1,
              color: theme.palette.text.secondary,
            }}
          >
            Audio Level
          </Typography>
          <LinearProgress
            variant='determinate'
            value={75}
            sx={{
              height: isMobile ? 8 : 6,
              borderRadius: 4,
              backgroundColor: theme.palette.background.default,
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette.primary.main,
              },
            }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default AudioCapturePanel;
