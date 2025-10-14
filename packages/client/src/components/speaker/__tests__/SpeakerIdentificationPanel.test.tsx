import React from 'react';
import {
  render,
  screen,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@mui/icons-material', () => ({
  Mic: () => <span />,
  Stop: () => <span />,
  Person: () => <span />,
  Edit: () => <span />,
  Delete: () => <span />,
  VolumeUp: () => <span />,
  CheckCircle: () => <span />,
  Warning: () => <span />,
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class MutationObserverMock {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

beforeAll(() => {
  (
    globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }
  ).ResizeObserver = ResizeObserverMock;
  (
    globalThis as unknown as { MutationObserver: typeof MutationObserverMock }
  ).MutationObserver = MutationObserverMock;
});

import SpeakerIdentificationPanel, {
  SpeakerProfile,
} from '../SpeakerIdentificationPanel';

const theme = createTheme();
const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('SpeakerIdentificationPanel', () => {
  const speakerList: SpeakerProfile[] = [
    {
      id: 'sp-1',
      name: 'Aveline',
      voiceSamples: 2,
      confidence: 0.86,
      character: 'Oracle',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      lastUpdated: new Date('2024-01-02T00:00:00Z'),
    },
    {
      id: 'sp-2',
      name: 'Corin',
      voiceSamples: 0,
      confidence: 0.52,
      createdAt: new Date('2024-01-03T00:00:00Z'),
      lastUpdated: new Date('2024-01-04T00:00:00Z'),
    },
  ];

  it('shows empty state when no speakers exist', () => {
    renderWithTheme(
      <SpeakerIdentificationPanel
        speakers={[]}
        onCreateSpeaker={vi.fn()}
        onUpdateSpeaker={vi.fn()}
        onDeleteSpeaker={vi.fn()}
        onRecordSample={vi.fn()}
        onPlaySample={vi.fn()}
        isRecording={false}
      />
    );

    expect(screen.getByText('No Speaker Profiles')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create first profile/i })
    ).toBeInTheDocument();
  });

  it('renders speaker list and triggers actions', async () => {
    vi.useRealTimers();
    try {
      const user = userEvent.setup();
      const handleCreate = vi.fn();
      const handleUpdate = vi.fn();
      const handleDelete = vi.fn();
      const handleRecord = vi.fn();
      const handlePlay = vi.fn();

      renderWithTheme(
        <SpeakerIdentificationPanel
          speakers={speakerList}
          onCreateSpeaker={handleCreate}
          onUpdateSpeaker={handleUpdate}
          onDeleteSpeaker={handleDelete}
          onRecordSample={handleRecord}
          onPlaySample={handlePlay}
          isRecording={false}
        />
      );

      const addSpeakerButton = screen.getByRole('button', {
        name: /add speaker/i,
      });

      await user.click(addSpeakerButton);

      const createDialog = await screen.findByRole('dialog', {
        name: /create new speaker profile/i,
        hidden: true,
      });
      const create = within(createDialog);

      await user.type(create.getByLabelText('Speaker Name'), 'New Voice');
      expect(create.getByLabelText('Speaker Name')).toHaveValue('New Voice');
      await user.click(create.getByRole('button', { name: 'Create' }));
      await waitForElementToBeRemoved(createDialog);

      expect(handleCreate).toHaveBeenCalledTimes(1);
      expect(handleCreate).toHaveBeenCalledWith('New Voice');

      expect(screen.getByText('Speaker Profiles')).toBeInTheDocument();
      expect(screen.getByText('Aveline')).toBeInTheDocument();
      expect(screen.getByText('Voice Samples: 2')).toBeInTheDocument();

      const recordButtons = screen.getAllByRole('button', {
        name: /record voice sample/i,
      });
      await user.click(recordButtons[0]!);
      expect(handleRecord).toHaveBeenCalledWith('sp-1');

      await user.click(screen.getByRole('button', { name: /play sample/i }));
      expect(handlePlay).toHaveBeenCalledWith('sp-1');

      const deleteButtons = screen.getAllByRole('button', {
        name: /delete profile/i,
      });
      await user.click(deleteButtons[0]!);
      expect(handleDelete).toHaveBeenCalledWith('sp-1');

      const editButtons = screen.getAllByRole('button', {
        name: /edit profile/i,
      });
      await user.click(editButtons[0]!);

      const editDialog = await screen.findByRole('dialog', {
        name: /edit speaker profile/i,
        hidden: true,
      });
      const edit = within(editDialog);

      await user.clear(edit.getByLabelText('Speaker Name'));
      await user.type(edit.getByLabelText('Speaker Name'), 'Aveline Stormborn');
      await user.click(edit.getByRole('button', { name: 'Update' }));
      await waitForElementToBeRemoved(editDialog);

      expect(handleUpdate).toHaveBeenCalledTimes(1);
      expect(handleUpdate).toHaveBeenCalledWith(
        'sp-1',
        expect.objectContaining({ name: 'Aveline Stormborn' })
      );
    } finally {
      vi.useFakeTimers();
    }
  });
});
