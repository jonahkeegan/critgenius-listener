/**
 * @fileoverview Speaker Transcript Line Component
 * Individual transcript entry display with speaker identification and responsive text sizing
 */

import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Person,
  Shield,
  LocalFireDepartment,
  Healing,
  Psychology,
  VolumeUp,
  Warning,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { SpeakerProfile } from '../speaker/SpeakerIdentificationPanel';
import { CharacterProfile } from '../speaker/CharacterAssignmentGrid';
import { TranscriptEntry } from './TranscriptWindow';

interface SpeakerTranscriptLineProps {
  entry: TranscriptEntry;
  speaker: SpeakerProfile | null;
  character: CharacterProfile | null;
  isHighlighted?: boolean;
  searchQuery?: string;
  showTimestamp?: boolean;
  sessionStartTime?: number;
}

const SpeakerTranscriptLine: React.FC<SpeakerTranscriptLineProps> = ({
  entry,
  speaker,
  character,
  isHighlighted = false,
  searchQuery = '',
  showTimestamp = true,
  sessionStartTime = 0,
}) => {
  const theme = useTheme();

  const getCharacterIcon = (characterClass: string) => {
    const lowerClass = characterClass.toLowerCase();
    if (lowerClass.includes('fighter') || lowerClass.includes('warrior') || lowerClass.includes('paladin')) {
      return <Shield />;
    }
    if (lowerClass.includes('wizard') || lowerClass.includes('sorcerer') || lowerClass.includes('warlock')) {
      return <LocalFireDepartment />;
    }
    if (lowerClass.includes('cleric') || lowerClass.includes('druid') || lowerClass.includes('ranger')) {
      return <Healing />;
    }
    return <Psychology />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const highlightSearchText = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span
          key={index}
          style={{
            backgroundColor: theme.palette.warning.light,
            color: theme.palette.warning.contrastText,
            padding: '0 2px',
            borderRadius: '2px',
            fontWeight: 'bold',
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const displayName = character?.name || speaker?.name || 'Unknown Speaker';
  const speakerInfo = character ? `${speaker?.name}` : null;

  return (
    <Paper
      elevation={isHighlighted ? 2 : 0}
      sx={{
        mb: 1,
        p: 2,
        bgcolor: isHighlighted 
          ? 'warning.light' 
          : entry.isProcessing 
          ? 'action.hover' 
          : 'background.paper',
        borderLeft: `4px solid ${
          character 
            ? theme.palette.primary.main 
            : speaker 
            ? theme.palette.secondary.main 
            : theme.palette.grey[400]
        }`,
        border: `1px solid ${
          isHighlighted 
            ? theme.palette.warning.main 
            : theme.palette.divider
        }`,
        borderRadius: 1,
        transition: 'all 0.2s ease',
        opacity: entry.isProcessing ? 0.7 : 1,
        position: 'relative',
      }}
    >
      <Box display="flex" gap={2}>
        {/* Speaker Avatar */}
        <Box sx={{ flexShrink: 0 }}>
          <Avatar
            sx={{
              bgcolor: character 
                ? theme.palette.primary.main 
                : speaker 
                ? theme.palette.secondary.main 
                : theme.palette.grey[400],
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
            }}
          >
            {character ? getCharacterIcon(character.class) : <Person />}
          </Avatar>
        </Box>

        {/* Content */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {/* Header with Speaker Info and Timestamp */}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="flex-start" 
            sx={{ mb: 1 }}
            flexWrap={{ xs: 'wrap', sm: 'nowrap' }}
            gap={{ xs: 1, sm: 2 }}
          >
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography 
                  variant="subtitle2" 
                  fontWeight="bold"
                  sx={{
                    color: character 
                      ? theme.palette.primary.main 
                      : speaker 
                      ? theme.palette.secondary.main 
                      : theme.palette.text.secondary,
                  }}
                >
                  {displayName}
                </Typography>
                
                {character && (
                  <Chip
                    label={`${character.race} ${character.class}`}
                    size="small"
                    variant="outlined"
                    color="primary"
                  />
                )}
                
                {speakerInfo && (
                  <Typography variant="caption" color="text.secondary">
                    ({speakerInfo})
                  </Typography>
                )}
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
              {/* Confidence Indicator */}
              <Tooltip title={`Confidence: ${(entry.confidence * 100).toFixed(1)}%`}>
                <Chip
                  icon={entry.confidence >= 0.9 ? <VolumeUp /> : <Warning />}
                  label={`${(entry.confidence * 100).toFixed(0)}%`}
                  size="small"
                  color={getConfidenceColor(entry.confidence)}
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.75rem',
                    height: 20,
                  }}
                />
              </Tooltip>
              
              {/* Timestamp */}
              {showTimestamp && (
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  sx={{ 
                    fontFamily: 'monospace',
                    minWidth: 'fit-content',
                  }}
                >
                  {formatTimestamp(entry.startTime)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Transcript Text */}
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.6,
              fontSize: {
                xs: '0.875rem',  // 14px on mobile
                sm: '1rem',      // 16px on tablet+
              },
              wordBreak: 'break-word',
              color: entry.isProcessing ? 'text.secondary' : 'text.primary',
            }}
          >
            {searchQuery ? highlightSearchText(entry.text, searchQuery) : entry.text}
            {entry.isProcessing && (
              <Typography
                component="span"
                sx={{
                  ml: 1,
                  fontStyle: 'italic',
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                }}
              >
                (processing...)
              </Typography>
            )}
          </Typography>

          {/* Additional Info for Low Confidence */}
          {entry.confidence < 0.7 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="warning.main" sx={{ fontStyle: 'italic' }}>
                ⚠️ Low confidence transcription - may contain errors
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Processing Indicator */}
      {entry.isProcessing && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            bgcolor: 'primary.main',
            opacity: 0.6,
            animation: 'pulse 1.5s ease-in-out infinite alternate',
          }}
        />
      )}
    </Paper>
  );
};

export default SpeakerTranscriptLine;