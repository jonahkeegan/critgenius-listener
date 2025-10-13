import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@mui/icons-material', () => ({
  Person: () => <span />,
  Shield: () => <span />,
  LocalFireDepartment: () => <span />,
  Healing: () => <span />,
  Psychology: () => <span />,
  VolumeUp: () => <span />,
  Warning: () => <span />,
}));

import SpeakerTranscriptLine from '../SpeakerTranscriptLine';
import { SpeakerProfile } from '../../speaker/SpeakerIdentificationPanel';
import { CharacterProfile } from '../../speaker/CharacterAssignmentGrid';
import { TranscriptEntry } from '../TranscriptWindow';

const theme = createTheme();
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('SpeakerTranscriptLine', () => {
  const baseEntry: TranscriptEntry = {
    id: 'entry-1',
    speakerId: 'sp-1',
    text: 'The relic is hidden beneath the old oak tree',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    confidence: 0.62,
    isProcessing: true,
    startTime: 95,
    endTime: 102,
  };

  const speaker: SpeakerProfile = {
    id: 'sp-1',
    name: 'Lore Keeper',
    voiceSamples: 3,
    confidence: 0.88,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastUpdated: new Date('2024-01-02T00:00:00Z'),
  };

  const character: CharacterProfile = {
    id: 'char-1',
    name: 'Eldric the Wise',
    class: 'Wizard',
    race: 'Elf',
    level: 12,
    description: 'Arcane scholar of the realm',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    speakerId: 'sp-1',
  };

  it('renders transcript data with highlights and status', () => {
    renderWithTheme(
      <SpeakerTranscriptLine
        entry={baseEntry}
        speaker={speaker}
        character={character}
        isHighlighted
        searchQuery='relic'
      />
    );

    expect(screen.getByText('Eldric the Wise')).toBeInTheDocument();
    expect(screen.getByText('(Lore Keeper)')).toBeInTheDocument();
    expect(
      screen.getByText(/The relic is hidden beneath the old oak tree/)
    ).toBeInTheDocument();
    expect(screen.getByText('1:35')).toBeInTheDocument();
    expect(screen.getByText('(processing...)')).toBeInTheDocument();
    expect(
      screen.getByText(/Low confidence transcription/i)
    ).toBeInTheDocument();
  });
});
