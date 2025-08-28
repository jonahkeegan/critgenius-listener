/**
 * @fileoverview Transcript Window Component
 * Provides scrollable real-time transcript display with responsive text sizing
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Fab,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Clear,
  FilterList,
  Download,
  Pause,
  PlayArrow,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { SpeakerProfile } from '../speaker/SpeakerIdentificationPanel';
import { CharacterProfile } from '../speaker/CharacterAssignmentGrid';
import SpeakerTranscriptLine from './SpeakerTranscriptLine';

export interface TranscriptEntry {
  id: string;
  speakerId: string | null;
  text: string;
  timestamp: Date;
  confidence: number;
  isProcessing?: boolean;
  startTime: number; // seconds from session start
  endTime: number;
}

interface TranscriptWindowProps {
  transcriptEntries: TranscriptEntry[];
  speakers: SpeakerProfile[];
  characters: CharacterProfile[];
  isLive: boolean;
  sessionDuration: number; // in seconds
  onExportTranscript: () => void;
  onToggleLive: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const TranscriptWindow: React.FC<TranscriptWindowProps> = ({
  transcriptEntries,
  speakers,
  characters,
  isLive,
  sessionDuration,
  onExportTranscript,
  onToggleLive,
  searchQuery = '',
  onSearchChange,
}) => {
  const theme = useTheme();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(
    null
  );
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Auto-scroll to bottom for live updates
  useEffect(() => {
    if (autoScroll && isLive && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [transcriptEntries, autoScroll, isLive]);

  // Handle scroll events to show/hide scroll to bottom button
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          scrollContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollToBottom(!isNearBottom && transcriptEntries.length > 0);
        setAutoScroll(isNearBottom);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }

    return undefined;
  }, [transcriptEntries.length]);

  const handleSearchSubmit = () => {
    if (onSearchChange) {
      onSearchChange(searchInput);
    }
  };

  const handleSearchClear = () => {
    setSearchInput('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterMenuAnchor(null);
  };

  const toggleSpeakerFilter = (speakerId: string) => {
    setSelectedSpeakers(prev =>
      prev.includes(speakerId)
        ? prev.filter(id => id !== speakerId)
        : [...prev, speakerId]
    );
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  const formatSessionDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter transcript entries based on search and speaker filters
  const filteredEntries = transcriptEntries.filter(entry => {
    // Text search filter
    if (
      searchInput &&
      !entry.text.toLowerCase().includes(searchInput.toLowerCase())
    ) {
      return false;
    }

    // Speaker filter
    if (
      selectedSpeakers.length > 0 &&
      entry.speakerId &&
      !selectedSpeakers.includes(entry.speakerId)
    ) {
      return false;
    }

    return true;
  });

  const getCharacterForSpeaker = (speakerId: string | null) => {
    if (!speakerId) return null;
    const speaker = speakers.find(speaker => speaker.id === speakerId);
    if (!speaker?.character) return null;
    return characters.find(char => char.name === speaker.character) || null;
  };

  const getSpeaker = (speakerId: string | null) => {
    if (!speakerId) return null;
    return speakers.find(speaker => speaker.id === speakerId) || null;
  };

  return (
    <Card
      elevation={3}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <CardContent sx={{ p: 3, pb: 0, flexShrink: 0 }}>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          sx={{ mb: 2 }}
        >
          <Box>
            <Typography variant='h5' component='h2'>
              Live Transcript
            </Typography>
            <Box display='flex' alignItems='center' gap={2} sx={{ mt: 1 }}>
              <Chip
                label={isLive ? 'LIVE' : 'PAUSED'}
                color={isLive ? 'success' : 'warning'}
                size='small'
                variant='filled'
              />
              <Typography variant='body2' color='text.secondary'>
                Session: {formatSessionDuration(sessionDuration)}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Lines: {transcriptEntries.length}
              </Typography>
            </Box>
          </Box>
          <Box display='flex' gap={1}>
            <Tooltip
              title={isLive ? 'Pause Live Updates' : 'Resume Live Updates'}
            >
              <IconButton
                onClick={onToggleLive}
                color={isLive ? 'error' : 'success'}
              >
                {isLive ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>
            <Tooltip title='Export Transcript'>
              <IconButton onClick={onExportTranscript}>
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Search and Filter Controls */}
        <Box display='flex' gap={2} sx={{ mb: 2 }}>
          <TextField
            size='small'
            placeholder='Search transcript...'
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSearchSubmit()}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={handleSearchClear}>
                    <Clear />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <Tooltip title='Filter by Speaker'>
            <IconButton onClick={handleFilterClick}>
              <FilterList />
              {selectedSpeakers.length > 0 && (
                <Chip
                  label={selectedSpeakers.length}
                  size='small'
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 20,
                    height: 20,
                    bgcolor: 'primary.main',
                  }}
                />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Active Filters Display */}
        {(searchInput || selectedSpeakers.length > 0) && (
          <Box display='flex' gap={1} flexWrap='wrap' sx={{ mb: 2 }}>
            {searchInput && (
              <Chip
                label={`Search: "${searchInput}"`}
                size='small'
                onDelete={handleSearchClear}
                color='primary'
                variant='outlined'
              />
            )}
            {selectedSpeakers.map(speakerId => {
              const speaker = getSpeaker(speakerId);
              const character = getCharacterForSpeaker(speakerId);
              return (
                <Chip
                  key={speakerId}
                  label={
                    character ? character.name : speaker?.name || 'Unknown'
                  }
                  size='small'
                  onDelete={() => toggleSpeakerFilter(speakerId)}
                  color='secondary'
                  variant='outlined'
                />
              );
            })}
          </Box>
        )}
      </CardContent>

      {/* Transcript Content */}
      <Box
        ref={scrollContainerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          px: 3,
          pb: 3,
          position: 'relative',
        }}
      >
        {filteredEntries.length === 0 ? (
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            sx={{
              height: '100%',
              minHeight: 200,
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            <Typography variant='h6' gutterBottom>
              {transcriptEntries.length === 0
                ? 'No Transcript Available'
                : 'No Results Found'}
            </Typography>
            <Typography variant='body2'>
              {transcriptEntries.length === 0
                ? 'Start recording or upload audio files to see real-time transcription'
                : 'Try adjusting your search terms or speaker filters'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ pb: 2 }}>
            {filteredEntries.map(entry => {
              const speaker = getSpeaker(entry.speakerId);
              const character = getCharacterForSpeaker(entry.speakerId);

              return (
                <SpeakerTranscriptLine
                  key={entry.id}
                  entry={entry}
                  speaker={speaker}
                  character={character}
                  isHighlighted={
                    searchInput
                      ? entry.text
                          .toLowerCase()
                          .includes(searchInput.toLowerCase())
                      : false
                  }
                  searchQuery={searchInput}
                  showTimestamp={true}
                  sessionStartTime={
                    sessionDuration - (entry.endTime - entry.startTime)
                  }
                />
              );
            })}
          </Box>
        )}

        {/* Scroll to Bottom FAB */}
        {showScrollToBottom && (
          <Fab
            size='small'
            onClick={scrollToBottom}
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            <KeyboardArrowDown />
          </Fab>
        )}
      </Box>

      {/* Speaker Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterClose}
        PaperProps={{
          sx: {
            maxWidth: 300,
            bgcolor: 'background.paper',
          },
        }}
      >
        <MenuItem disabled>
          <Typography variant='body2' fontWeight='bold'>
            Filter by Speaker:
          </Typography>
        </MenuItem>
        {speakers.map(speaker => {
          const character = getCharacterForSpeaker(speaker.id);
          const isSelected = selectedSpeakers.includes(speaker.id);

          return (
            <MenuItem
              key={speaker.id}
              onClick={() => toggleSpeakerFilter(speaker.id)}
              sx={{
                bgcolor: isSelected ? 'action.selected' : 'transparent',
              }}
            >
              <Box
                display='flex'
                alignItems='center'
                gap={1}
                sx={{ width: '100%' }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: isSelected ? 'primary.main' : 'grey.400',
                  }}
                />
                <Box flexGrow={1}>
                  <Typography variant='body2'>
                    {character ? character.name : speaker.name}
                  </Typography>
                  {character && (
                    <Typography variant='caption' color='text.secondary'>
                      {speaker.name}
                    </Typography>
                  )}
                </Box>
                <Typography variant='caption' color='text.secondary'>
                  {
                    transcriptEntries.filter(e => e.speakerId === speaker.id)
                      .length
                  }{' '}
                  lines
                </Typography>
              </Box>
            </MenuItem>
          );
        })}
        {speakers.length === 0 && (
          <MenuItem disabled>
            <Typography variant='body2' color='text.secondary'>
              No speakers detected
            </Typography>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default TranscriptWindow;
