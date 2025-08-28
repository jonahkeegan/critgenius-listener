/**
 * @fileoverview Speaker Identification Panel Component
 * Provides voice profile creation and management interface for speaker-character mapping
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import {
  Mic,
  Stop,
  Person,
  Edit,
  Delete,
  VolumeUp,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export interface SpeakerProfile {
  id: string;
  name: string;
  voiceSamples: number;
  confidence: number;
  character?: string;
  createdAt: Date;
  lastUpdated: Date;
}

interface SpeakerIdentificationPanelProps {
  speakers: SpeakerProfile[];
  onCreateSpeaker: (name: string) => void;
  onUpdateSpeaker: (id: string, updates: Partial<SpeakerProfile>) => void;
  onDeleteSpeaker: (id: string) => void;
  onRecordSample: (speakerId: string) => void;
  onPlaySample: (speakerId: string) => void;
  isRecording?: boolean;
  recordingSpeakerId?: string;
}

const SpeakerIdentificationPanel: React.FC<SpeakerIdentificationPanelProps> = ({
  speakers,
  onCreateSpeaker,
  onUpdateSpeaker,
  onDeleteSpeaker,
  onRecordSample,
  onPlaySample,
  isRecording = false,
  recordingSpeakerId,
}) => {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const [newSpeakerName, setNewSpeakerName] = useState('');
  const [editingSpeaker, setEditingSpeaker] = useState<SpeakerProfile | null>(
    null
  );

  const handleCreateSpeaker = () => {
    if (newSpeakerName.trim()) {
      onCreateSpeaker(newSpeakerName.trim());
      setNewSpeakerName('');
      setOpenDialog(false);
    }
  };

  const handleEditSpeaker = (speaker: SpeakerProfile) => {
    setEditingSpeaker(speaker);
    setNewSpeakerName(speaker.name);
    setOpenDialog(true);
  };

  const handleUpdateSpeaker = () => {
    if (editingSpeaker && newSpeakerName.trim()) {
      onUpdateSpeaker(editingSpeaker.id, { name: newSpeakerName.trim() });
      setEditingSpeaker(null);
      setNewSpeakerName('');
      setOpenDialog(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSpeaker(null);
    setNewSpeakerName('');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle />;
    if (confidence >= 0.6) return <Warning />;
    return <Warning />;
  };

  return (
    <Card elevation={3} sx={{ height: 'fit-content' }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          sx={{ mb: 3 }}
        >
          <Typography variant='h5' component='h2'>
            Speaker Profiles
          </Typography>
          <Button
            variant='contained'
            startIcon={<Person />}
            onClick={() => setOpenDialog(true)}
            size='small'
            sx={{
              bgcolor: theme.palette.secondary.main,
              '&:hover': { bgcolor: theme.palette.secondary.dark },
            }}
          >
            Add Speaker
          </Button>
        </Box>

        {speakers.length === 0 ? (
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            sx={{
              py: 4,
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            <Person sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant='h6' gutterBottom>
              No Speaker Profiles
            </Typography>
            <Typography variant='body2' sx={{ mb: 2 }}>
              Create speaker profiles to enable voice-to-character mapping
            </Typography>
            <Button
              variant='outlined'
              startIcon={<Person />}
              onClick={() => setOpenDialog(true)}
            >
              Create First Profile
            </Button>
          </Box>
        ) : (
          <List sx={{ px: 0 }}>
            {speakers.map(speaker => (
              <ListItem
                key={speaker.id}
                sx={{
                  bgcolor: 'background.paper',
                  mb: 2,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  px: 2,
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Avatar
                  sx={{
                    bgcolor: speaker.character
                      ? theme.palette.primary.main
                      : theme.palette.grey[400],
                    mr: 2,
                  }}
                >
                  <Person />
                </Avatar>
                <ListItemText
                  primary={
                    <Box display='flex' alignItems='center' gap={1}>
                      <Typography variant='subtitle1' fontWeight='bold'>
                        {speaker.name}
                      </Typography>
                      {speaker.character && (
                        <Chip
                          label={speaker.character}
                          size='small'
                          color='primary'
                          variant='outlined'
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      <Box
                        display='flex'
                        alignItems='center'
                        gap={1}
                        sx={{ mb: 0.5 }}
                      >
                        <Typography variant='caption' color='text.secondary'>
                          Voice Samples: {speaker.voiceSamples}
                        </Typography>
                        <Tooltip
                          title={`Confidence: ${(speaker.confidence * 100).toFixed(1)}%`}
                        >
                          <Chip
                            icon={getConfidenceIcon(speaker.confidence)}
                            label={`${(speaker.confidence * 100).toFixed(0)}%`}
                            size='small'
                            color={getConfidenceColor(speaker.confidence)}
                            variant='outlined'
                          />
                        </Tooltip>
                      </Box>
                      {isRecording && recordingSpeakerId === speaker.id && (
                        <Box
                          display='flex'
                          alignItems='center'
                          gap={1}
                          sx={{ mt: 1 }}
                        >
                          <Typography variant='caption' color='error'>
                            Recording sample...
                          </Typography>
                          <LinearProgress
                            color='error'
                            sx={{ flexGrow: 1, maxWidth: 100, height: 4 }}
                          />
                        </Box>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box display='flex' gap={0.5}>
                    <Tooltip title='Record Voice Sample'>
                      <IconButton
                        size='small'
                        onClick={() => onRecordSample(speaker.id)}
                        disabled={isRecording}
                        color={
                          isRecording && recordingSpeakerId === speaker.id
                            ? 'error'
                            : 'default'
                        }
                      >
                        {isRecording && recordingSpeakerId === speaker.id ? (
                          <Stop />
                        ) : (
                          <Mic />
                        )}
                      </IconButton>
                    </Tooltip>
                    {speaker.voiceSamples > 0 && (
                      <Tooltip title='Play Sample'>
                        <IconButton
                          size='small'
                          onClick={() => onPlaySample(speaker.id)}
                          disabled={isRecording}
                        >
                          <VolumeUp />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title='Edit Profile'>
                      <IconButton
                        size='small'
                        onClick={() => handleEditSpeaker(speaker)}
                      >
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title='Delete Profile'>
                      <IconButton
                        size='small'
                        onClick={() => onDeleteSpeaker(speaker.id)}
                        color='error'
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}

        <Box
          sx={{ mt: 3, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}
        >
          <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
            Tips for better voice recognition:
          </Typography>
          <Typography variant='caption' color='text.secondary' component='div'>
            • Record 3-5 voice samples per speaker for optimal accuracy
          </Typography>
          <Typography variant='caption' color='text.secondary' component='div'>
            • Ensure clear audio quality and minimal background noise
          </Typography>
          <Typography variant='caption' color='text.secondary' component='div'>
            • Each sample should be 10-30 seconds of natural speech
          </Typography>
        </Box>

        {/* Create/Edit Speaker Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth='sm'
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              backgroundImage: 'none',
            },
          }}
        >
          <DialogTitle>
            {editingSpeaker
              ? 'Edit Speaker Profile'
              : 'Create New Speaker Profile'}
          </DialogTitle>
          <DialogContent>
            <TextField
              margin='dense'
              label='Speaker Name'
              fullWidth
              variant='outlined'
              value={newSpeakerName}
              onChange={e => setNewSpeakerName(e.target.value)}
              placeholder='e.g., Player 1, Sarah, DM'
              sx={{ mt: 2 }}
            />
            <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
              Choose a recognizable name for this speaker. You can assign them
              to a character later.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} color='inherit'>
              Cancel
            </Button>
            <Button
              onClick={
                editingSpeaker ? handleUpdateSpeaker : handleCreateSpeaker
              }
              variant='contained'
              disabled={!newSpeakerName.trim()}
            >
              {editingSpeaker ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default SpeakerIdentificationPanel;
