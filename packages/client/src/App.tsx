/**
 * @fileoverview Main React component for CritGenius Listener
 * Provides the primary user interface for audio capture and processing with MUI theme
 */

import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  LinearProgress,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Mic,
  Stop,
  Upload,
  AudioFile,
  PlayArrow,
  Settings,
  Info,
} from '@mui/icons-material';
import { version } from '@critgenius/shared';
import { useTheme } from '@mui/material/styles';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const theme = useTheme();
  
  // Initialize socket connection
  const {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emit,
    on
  } = useSocket();

  // Connect to socket on component mount
  useEffect(() => {
    connect();
    
    // Generate a unique session ID
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    
    // Join the session
    emit('joinSession', { sessionId: newSessionId });
    
    // Cleanup on unmount
    return () => {
      emit('leaveSession', { sessionId: newSessionId });
      disconnect();
    };
  }, [connect, disconnect, emit]);

  // Listen for processing updates
  useEffect(() => {
    const cleanup = on('processingUpdate', (data) => {
      console.log('Processing update:', data);
      // TODO: Update UI with processing status
    });
    
    return cleanup;
  }, [on]);

  // Listen for transcription updates
  useEffect(() => {
    const cleanup = on('transcriptionUpdate', (data) => {
      console.log('Transcription update:', data);
      // TODO: Update UI with transcription data
    });
    
    return cleanup;
  }, [on]);

  // Listen for errors
  useEffect(() => {
    const cleanup = on('error', (error) => {
      console.error('Socket error:', error);
      // TODO: Show error to user
    });
    
    return cleanup;
  }, [on]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAudioFiles(Array.from(files));
    }
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    if (sessionId) {
      emit('startRecording', { sessionId });
    }
    console.log('Starting audio recording...');
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (sessionId) {
      emit('stopRecording', { sessionId });
    }
    console.log('Stopping audio recording...');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 3,
        }}
      >
        <Container maxWidth='lg'>
          <Box
            display='flex'
            justifyContent='space-between'
            alignItems='center'
          >
            <Box>
              <Typography variant='h2' component='h1' gutterBottom>
                CritGenius Listener
              </Typography>
              <Typography variant='h6' color='text.secondary'>
                Real-time audio capture and processing for D&D sessions
              </Typography>
            </Box>
            <Box display='flex' alignItems='center' gap={2}>
              <Chip
                label={`v${version}`}
                color='secondary'
                size='small'
                variant='outlined'
              />
              <IconButton color='primary'>
                <Settings />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Main Content */}
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box display='flex' flexDirection={{ xs: 'column', md: 'row' }} gap={4}>
          {/* Audio Capture Section */}
          <Box flex={1} sx={{ minWidth: 0 }}>
            <Card elevation={3}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant='h4' gutterBottom>
                  Audio Capture
                </Typography>

                {/* Recording Controls */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant='h6' gutterBottom>
                    Live Recording
                  </Typography>
                  <Box display='flex' gap={2} alignItems='center'>
                    {!isRecording ? (
                      <Button
                        variant='contained'
                        size='large'
                        startIcon={<Mic />}
                        onClick={handleStartRecording}
                        sx={{
                          bgcolor: theme.palette.success.main,
                          '&:hover': { bgcolor: theme.palette.success.dark },
                        }}
                      >
                        Start Recording
                      </Button>
                    ) : (
                      <Button
                        variant='contained'
                        size='large'
                        startIcon={<Stop />}
                        onClick={handleStopRecording}
                        sx={{
                          bgcolor: theme.palette.error.main,
                          '&:hover': { bgcolor: theme.palette.error.dark },
                        }}
                      >
                        Stop Recording
                      </Button>
                    )}
                    {isRecording && (
                      <Box display='flex' alignItems='center' gap={1}>
                        <Typography variant='body2' color='error'>
                          Recording in progress...
                        </Typography>
                        <LinearProgress sx={{ width: 100 }} color='error' />
                      </Box>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* File Upload */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant='h6' gutterBottom>
                    Upload Audio Files
                  </Typography>
                  <Button
                    variant='outlined'
                    component='label'
                    startIcon={<Upload />}
                    size='large'
                  >
                    Choose Audio Files
                    <input
                      type='file'
                      multiple
                      accept='audio/*'
                      onChange={handleFileUpload}
                      style={{ display: 'none' }}
                    />
                  </Button>
                </Box>

                {/* File List */}
                {audioFiles.length > 0 && (
                  <Box>
                    <Typography variant='h6' gutterBottom>
                      Selected Files ({audioFiles.length})
                    </Typography>
                    <List>
                      {audioFiles.map((file, index) => (
                        <ListItem
                          key={index}
                          sx={{
                            bgcolor: 'background.paper',
                            mb: 1,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <ListItemIcon>
                            <AudioFile color='primary' />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                          />
                          <IconButton color='secondary' size='small'>
                            <PlayArrow />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Processing Status Sidebar */}
          <Box sx={{ width: { xs: '100%', md: '350px' } }}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant='h5' gutterBottom>
                  Processing Status
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Connection Status
                  </Typography>
                  {isConnecting && (
                    <Chip
                      label='Connecting...'
                      color='warning'
                      size='small'
                      icon={<Info />}
                    />
                  )}
                  {isConnected && (
                    <Chip
                      label='Connected'
                      color='success'
                      size='small'
                      icon={<Info />}
                    />
                  )}
                  {!isConnected && !isConnecting && (
                    <Chip
                      label='Disconnected'
                      color='error'
                      size='small'
                      icon={<Info />}
                    />
                  )}
                  {error && (
                    <Typography variant='caption' color='error' display='block' sx={{ mt: 1 }}>
                      {error}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Audio Engine
                  </Typography>
                  <Typography variant='body1'>
                    Idle - No files processing
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Speaker Detection
                  </Typography>
                  <Typography variant='body1'>
                    Ready for voice mapping
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    gutterBottom
                  >
                    Session Stats
                  </Typography>
                  <Typography variant='caption' display='block'>
                    Files processed: 0
                  </Typography>
                  <Typography variant='caption' display='block'>
                    Total runtime: 00:00:00
                  </Typography>
                  <Typography variant='caption' display='block'>
                    Speakers detected: 0
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Theme Demo Card */}
            <Card elevation={3} sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  CritGenius Theme Demo
                </Typography>
                <Box display='flex' flexWrap='wrap' gap={1} sx={{ mb: 2 }}>
                  <Chip label='Primary' color='primary' />
                  <Chip label='Secondary' color='secondary' />
                  <Chip label='Success' color='success' />
                  <Chip label='Warning' color='warning' />
                  <Chip label='Error' color='error' />
                </Box>
                <Typography variant='body2' color='text.secondary'>
                  Dark mode optimized for D&D gaming sessions with high contrast
                  and accessibility features.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Container>

      {/* Footer */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderTop: `1px solid ${theme.palette.divider}`,
          py: 3,
          mt: 6,
        }}
      >
        <Container maxWidth='lg'>
          <Typography variant='body2' color='text.secondary' align='center'>
            &copy; 2024 CritGenius Listener. Built with React + TypeScript +
            Material-UI
          </Typography>
        </Container>
      </Paper>
    </Box>
  );
}

export default App;
