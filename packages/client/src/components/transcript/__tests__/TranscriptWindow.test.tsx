import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@mui/icons-material', () => ({
  Search: () => <span />,
  Clear: () => <span />,
  FilterList: () => <span />,
  Download: () => <span />,
  Pause: () => <span />,
  PlayArrow: () => <span />,
  KeyboardArrowDown: () => <span />,
  Person: () => <span />,
  Shield: () => <span />,
  LocalFireDepartment: () => <span />,
  Healing: () => <span />,
  Psychology: () => <span />,
  VolumeUp: () => <span />,
  Warning: () => <span />,
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  (
    globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }
  ).ResizeObserver = ResizeObserverMock;
});

import TranscriptWindow, { TranscriptEntry } from '../TranscriptWindow';
import { SpeakerProfile } from '../../speaker/SpeakerIdentificationPanel';
import { CharacterProfile } from '../../speaker/CharacterAssignmentGrid';

const theme = createTheme();
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('TranscriptWindow', () => {
  const speakers: SpeakerProfile[] = [
    {
      id: 'sp-1',
      name: 'Mira',
      voiceSamples: 4,
      confidence: 0.9,
      character: 'Captain Selene',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      lastUpdated: new Date('2024-01-02T00:00:00Z'),
    },
    {
      id: 'sp-2',
      name: 'Dorian',
      voiceSamples: 1,
      confidence: 0.65,
      createdAt: new Date('2024-01-03T00:00:00Z'),
      lastUpdated: new Date('2024-01-04T00:00:00Z'),
    },
  ];

  const characters: CharacterProfile[] = [
    {
      id: 'ch-1',
      name: 'Captain Selene',
      class: 'Paladin',
      race: 'Human',
      level: 6,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      speakerId: 'sp-1',
    },
  ];

  const entries: TranscriptEntry[] = [
    {
      id: 'line-1',
      speakerId: 'sp-1',
      text: "Hidden runes glow beneath the captain's map.",
      timestamp: new Date('2024-01-01T10:00:00Z'),
      confidence: 0.91,
      startTime: 12,
      endTime: 16,
    },
    {
      id: 'line-2',
      speakerId: 'sp-2',
      text: 'Prepare the crew for departure.',
      timestamp: new Date('2024-01-01T10:01:00Z'),
      confidence: 0.74,
      startTime: 32,
      endTime: 36,
    },
  ];

  it('renders transcript content and responds to interactions', () => {
    const handleExport = vi.fn();
    const handleToggleLive = vi.fn();
    const handleSearchChange = vi.fn();

    renderWithTheme(
      <TranscriptWindow
        transcriptEntries={entries}
        speakers={speakers}
        characters={characters}
        isLive
        sessionDuration={245}
        onExportTranscript={handleExport}
        onToggleLive={handleToggleLive}
        onSearchChange={handleSearchChange}
      />
    );

    expect(screen.getByText('Live Transcript')).toBeInTheDocument();
    expect(screen.getByText('Session: 4:05')).toBeInTheDocument();
    expect(
      screen.getByText("Hidden runes glow beneath the captain's map.")
    ).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search transcript...');
    fireEvent.change(searchInput, { target: { value: 'hidden' } });
    fireEvent.keyPress(searchInput, { key: 'Enter', charCode: 13 });
    expect(handleSearchChange).toHaveBeenCalledWith('hidden');

    fireEvent.click(
      screen.getByRole('button', { name: /pause live updates/i })
    );
    expect(handleToggleLive).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /export transcript/i }));
    expect(handleExport).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /filter by speaker/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Captain Selene/i }));
    expect(
      screen.queryByText('Prepare the crew for departure.')
    ).not.toBeInTheDocument();
  });

  it('shows empty state when no entries exist', () => {
    renderWithTheme(
      <TranscriptWindow
        transcriptEntries={[]}
        speakers={[]}
        characters={[]}
        isLive={false}
        sessionDuration={0}
        onExportTranscript={vi.fn()}
        onToggleLive={vi.fn()}
      />
    );

    expect(screen.getByText('No Transcript Available')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Start recording or upload audio files to see real-time transcription'
      )
    ).toBeInTheDocument();
  });
});
