/**
 * @fileoverview Character Assignment Grid Component
 * Provides drag-and-drop interface for mapping speakers to D&D characters
 */

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  Fade,
} from '@mui/material';
import {
  Person,
  Shield,
  LocalFireDepartment,
  Healing,
  Psychology,
  Add,
  Edit,
  Delete,
  DragIndicator,
  SwapHoriz,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { SpeakerProfile } from './SpeakerIdentificationPanel';

export interface CharacterProfile {
  id: string;
  name: string;
  class: string;
  race: string;
  level: number;
  description?: string;
  avatar?: string;
  speakerId?: string;
  createdAt: Date;
}

interface CharacterAssignmentGridProps {
  speakers: SpeakerProfile[];
  characters: CharacterProfile[];
  onCreateCharacter: (
    character: Omit<CharacterProfile, 'id' | 'createdAt'>
  ) => void;
  onUpdateCharacter: (id: string, updates: Partial<CharacterProfile>) => void;
  onDeleteCharacter: (id: string) => void;
  onAssignSpeaker: (characterId: string, speakerId: string | null) => void;
  onSwapAssignments: (characterId1: string, characterId2: string) => void;
}

const CharacterAssignmentGrid: React.FC<CharacterAssignmentGridProps> = ({
  speakers,
  characters,
  onCreateCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  onAssignSpeaker,
  onSwapAssignments: _onSwapAssignments,
}) => {
  const theme = useTheme();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] =
    useState<CharacterProfile | null>(null);
  const [draggedSpeaker, setDraggedSpeaker] = useState<SpeakerProfile | null>(
    null
  );
  const [dragOverCharacter, setDragOverCharacter] = useState<string | null>(
    null
  );
  const [newCharacter, setNewCharacter] = useState({
    name: '',
    class: '',
    race: '',
    level: 1,
    description: '',
  });

  const handleCreateCharacter = () => {
    if (newCharacter.name.trim() && newCharacter.class.trim()) {
      onCreateCharacter({
        ...newCharacter,
        name: newCharacter.name.trim(),
        class: newCharacter.class.trim(),
        race: newCharacter.race.trim() || 'Unknown',
      });
      setNewCharacter({
        name: '',
        class: '',
        race: '',
        level: 1,
        description: '',
      });
      setOpenDialog(false);
    }
  };

  const handleEditCharacter = (character: CharacterProfile) => {
    setEditingCharacter(character);
    setNewCharacter({
      name: character.name,
      class: character.class,
      race: character.race,
      level: character.level,
      description: character.description || '',
    });
    setOpenDialog(true);
  };

  const handleUpdateCharacter = () => {
    if (
      editingCharacter &&
      newCharacter.name.trim() &&
      newCharacter.class.trim()
    ) {
      onUpdateCharacter(editingCharacter.id, {
        ...newCharacter,
        name: newCharacter.name.trim(),
        class: newCharacter.class.trim(),
        race: newCharacter.race.trim() || 'Unknown',
      });
      setEditingCharacter(null);
      setNewCharacter({
        name: '',
        class: '',
        race: '',
        level: 1,
        description: '',
      });
      setOpenDialog(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCharacter(null);
    setNewCharacter({
      name: '',
      class: '',
      race: '',
      level: 1,
      description: '',
    });
  };

  const getCharacterIcon = (characterClass: string) => {
    const lowerClass = characterClass.toLowerCase();
    if (
      lowerClass.includes('fighter') ||
      lowerClass.includes('warrior') ||
      lowerClass.includes('paladin')
    ) {
      return <Shield />;
    }
    if (
      lowerClass.includes('wizard') ||
      lowerClass.includes('sorcerer') ||
      lowerClass.includes('warlock')
    ) {
      return <LocalFireDepartment />;
    }
    if (
      lowerClass.includes('cleric') ||
      lowerClass.includes('druid') ||
      lowerClass.includes('ranger')
    ) {
      return <Healing />;
    }
    return <Psychology />;
  };

  const getAssignedSpeaker = (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    return character?.speakerId
      ? speakers.find(s => s.id === character.speakerId)
      : null;
  };

  const getUnassignedSpeakers = () => {
    const assignedSpeakerIds = characters
      .map(c => c.speakerId)
      .filter(Boolean) as string[];
    return speakers.filter(s => !assignedSpeakerIds.includes(s.id));
  };

  const handleSpeakerDragStart = (speaker: SpeakerProfile) => {
    setDraggedSpeaker(speaker);
  };

  const handleSpeakerDragEnd = () => {
    setDraggedSpeaker(null);
    setDragOverCharacter(null);
  };

  const handleCharacterDragOver = (e: React.DragEvent, characterId: string) => {
    e.preventDefault();
    setDragOverCharacter(characterId);
  };

  const handleCharacterDragLeave = () => {
    setDragOverCharacter(null);
  };

  const handleCharacterDrop = (e: React.DragEvent, characterId: string) => {
    e.preventDefault();
    if (draggedSpeaker) {
      onAssignSpeaker(characterId, draggedSpeaker.id);
    }
    setDraggedSpeaker(null);
    setDragOverCharacter(null);
  };

  const unassignedSpeakers = getUnassignedSpeakers();

  return (
    <Card elevation={3}>
      <CardContent sx={{ p: 3 }}>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          sx={{ mb: 3 }}
        >
          <Typography variant='h5' component='h2'>
            Character Assignments
          </Typography>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
            size='small'
            sx={{
              bgcolor: theme.palette.primary.main,
              '&:hover': { bgcolor: theme.palette.primary.dark },
            }}
          >
            Add Character
          </Button>
        </Box>

        {/* Unassigned Speakers Pool */}
        {unassignedSpeakers.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant='h6'
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <DragIndicator color='action' />
              Unassigned Speakers
            </Typography>
            <Box display='flex' gap={1} flexWrap='wrap'>
              {unassignedSpeakers.map(speaker => (
                <Paper
                  key={speaker.id}
                  draggable
                  onDragStart={() => handleSpeakerDragStart(speaker)}
                  onDragEnd={handleSpeakerDragEnd}
                  sx={{
                    p: 1.5,
                    cursor: 'grab',
                    userSelect: 'none',
                    border: `2px solid ${theme.palette.secondary.main}`,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'action.hover',
                      transform: 'scale(1.02)',
                    },
                    '&:active': {
                      cursor: 'grabbing',
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Box display='flex' alignItems='center' gap={1}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.secondary.main,
                        width: 32,
                        height: 32,
                      }}
                    >
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant='body2' fontWeight='bold'>
                        {speaker.name}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {speaker.voiceSamples} samples
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        {/* Character Grid */}
        {characters.length === 0 ? (
          <Box
            display='flex'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            sx={{
              py: 6,
              color: 'text.secondary',
              textAlign: 'center',
            }}
          >
            <Shield sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
            <Typography variant='h6' gutterBottom>
              No Characters Created
            </Typography>
            <Typography variant='body2' sx={{ mb: 2 }}>
              Create D&D characters to assign speakers for voice mapping
            </Typography>
            <Button
              variant='outlined'
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Create First Character
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
            }}
          >
            {characters.map(character => {
              const assignedSpeaker = getAssignedSpeaker(character.id);
              const isDragOver = dragOverCharacter === character.id;

              return (
                <Box key={character.id}>
                  <Paper
                    onDragOver={e => handleCharacterDragOver(e, character.id)}
                    onDragLeave={handleCharacterDragLeave}
                    onDrop={e => handleCharacterDrop(e, character.id)}
                    sx={{
                      p: 2,
                      height: '100%',
                      border: `2px solid ${
                        isDragOver
                          ? theme.palette.success.main
                          : assignedSpeaker
                            ? theme.palette.primary.main
                            : theme.palette.divider
                      }`,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      bgcolor: isDragOver
                        ? 'success.light'
                        : 'background.paper',
                      opacity: isDragOver ? 0.9 : 1,
                      transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    <Box
                      display='flex'
                      justifyContent='space-between'
                      alignItems='flex-start'
                      sx={{ mb: 2 }}
                    >
                      <Box display='flex' alignItems='center' gap={1}>
                        <Avatar
                          sx={{
                            bgcolor: assignedSpeaker
                              ? theme.palette.primary.main
                              : theme.palette.grey[400],
                          }}
                        >
                          {getCharacterIcon(character.class)}
                        </Avatar>
                        <Box>
                          <Typography variant='h6' component='h3'>
                            {character.name}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Level {character.level} {character.race}{' '}
                            {character.class}
                          </Typography>
                        </Box>
                      </Box>
                      <Box display='flex' gap={0.5}>
                        <Tooltip title='Edit Character'>
                          <IconButton
                            size='small'
                            onClick={() => handleEditCharacter(character)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Delete Character'>
                          <IconButton
                            size='small'
                            onClick={() => onDeleteCharacter(character.id)}
                            color='error'
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {character.description && (
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mb: 2, fontStyle: 'italic' }}
                      >
                        {character.description}
                      </Typography>
                    )}

                    {assignedSpeaker ? (
                      <Fade in>
                        <Box
                          sx={{
                            bgcolor: 'success.light',
                            borderRadius: 1,
                            p: 2,
                            border: `1px solid ${theme.palette.success.main}`,
                          }}
                        >
                          <Box
                            display='flex'
                            justifyContent='space-between'
                            alignItems='center'
                          >
                            <Box display='flex' alignItems='center' gap={1}>
                              <Avatar
                                sx={{
                                  bgcolor: theme.palette.success.main,
                                  width: 28,
                                  height: 28,
                                }}
                              >
                                <Person />
                              </Avatar>
                              <Box>
                                <Typography variant='body2' fontWeight='bold'>
                                  {assignedSpeaker.name}
                                </Typography>
                                <Typography
                                  variant='caption'
                                  color='text.secondary'
                                >
                                  {assignedSpeaker.voiceSamples} voice samples
                                </Typography>
                              </Box>
                            </Box>
                            <Tooltip title='Unassign Speaker'>
                              <IconButton
                                size='small'
                                onClick={() =>
                                  onAssignSpeaker(character.id, null)
                                }
                              >
                                <SwapHoriz />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Fade>
                    ) : (
                      <Box
                        sx={{
                          bgcolor: isDragOver
                            ? 'success.light'
                            : 'action.hover',
                          borderRadius: 1,
                          p: 2,
                          border: `2px dashed ${
                            isDragOver
                              ? theme.palette.success.main
                              : theme.palette.divider
                          }`,
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Typography variant='body2' color='text.secondary'>
                          {isDragOver
                            ? 'Drop speaker here!'
                            : 'Drag a speaker here'}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              );
            })}
          </Box>
        )}

        {/* Tips Section */}
        {characters.length > 0 && (
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              Tips for character assignments:
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
              component='div'
            >
              • Drag unassigned speakers onto character cards to create voice
              mappings
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
              component='div'
            >
              • Use the swap icon to quickly reassign speakers between
              characters
            </Typography>
            <Typography
              variant='caption'
              color='text.secondary'
              component='div'
            >
              • Characters without speakers won&apos;t appear in real-time
              transcriptions
            </Typography>
          </Box>
        )}

        {/* Create/Edit Character Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth='md'
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              backgroundImage: 'none',
            },
          }}
        >
          <DialogTitle>
            {editingCharacter ? 'Edit Character' : 'Create New Character'}
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 2,
                mt: 1,
              }}
            >
              <TextField
                label='Character Name'
                fullWidth
                variant='outlined'
                value={newCharacter.name}
                onChange={e =>
                  setNewCharacter({ ...newCharacter, name: e.target.value })
                }
                placeholder='e.g., Thorin Ironshield'
              />
              <TextField
                label='Class'
                fullWidth
                variant='outlined'
                value={newCharacter.class}
                onChange={e =>
                  setNewCharacter({ ...newCharacter, class: e.target.value })
                }
                placeholder='e.g., Fighter, Wizard, Rogue'
              />
              <TextField
                label='Race'
                fullWidth
                variant='outlined'
                value={newCharacter.race}
                onChange={e =>
                  setNewCharacter({ ...newCharacter, race: e.target.value })
                }
                placeholder='e.g., Human, Elf, Dwarf'
              />
              <TextField
                label='Level'
                type='number'
                fullWidth
                variant='outlined'
                value={newCharacter.level}
                onChange={e =>
                  setNewCharacter({
                    ...newCharacter,
                    level: parseInt(e.target.value) || 1,
                  })
                }
                inputProps={{ min: 1, max: 20 }}
              />
              <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                <TextField
                  label='Description (Optional)'
                  fullWidth
                  multiline
                  rows={3}
                  variant='outlined'
                  value={newCharacter.description}
                  onChange={e =>
                    setNewCharacter({
                      ...newCharacter,
                      description: e.target.value,
                    })
                  }
                  placeholder='Brief character description or backstory...'
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseDialog} color='inherit'>
              Cancel
            </Button>
            <Button
              onClick={
                editingCharacter ? handleUpdateCharacter : handleCreateCharacter
              }
              variant='contained'
              disabled={!newCharacter.name.trim() || !newCharacter.class.trim()}
            >
              {editingCharacter ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CharacterAssignmentGrid;
