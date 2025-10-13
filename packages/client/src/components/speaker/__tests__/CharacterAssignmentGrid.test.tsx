import React from 'react';
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import CharacterAssignmentGrid, {
  CharacterProfile,
} from '../CharacterAssignmentGrid';
import { SpeakerProfile } from '../SpeakerIdentificationPanel';

vi.mock('@mui/icons-material', () => ({
  Person: () => <span />,
  Shield: () => <span />,
  LocalFireDepartment: () => <span />,
  Healing: () => <span />,
  Psychology: () => <span />,
  Add: () => <span />,
  Edit: () => <span />,
  Delete: () => <span />,
  DragIndicator: () => <span />,
  SwapHoriz: () => <span />,
}));

class ResizeObserverMock {
  constructor(_callback: ResizeObserverCallback) {}
  observe(_target: Element) {}
  unobserve(_target: Element) {}
  disconnect() {}
}

class MutationObserverMock {
  constructor(_callback: MutationCallback) {}
  observe(_target: Node, _options?: MutationObserverInit) {}
  disconnect() {}
  takeRecords(): MutationRecord[] {
    return [];
  }
}

beforeAll(() => {
  (
    globalThis as typeof globalThis & {
      ResizeObserver: typeof ResizeObserverMock;
      MutationObserver: typeof MutationObserverMock;
    }
  ).ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

  (
    globalThis as typeof globalThis & {
      ResizeObserver: typeof ResizeObserverMock;
      MutationObserver: typeof MutationObserverMock;
    }
  ).MutationObserver =
    MutationObserverMock as unknown as typeof MutationObserver;
});

const theme = createTheme();

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('CharacterAssignmentGrid', () => {
  const baseSpeakers: SpeakerProfile[] = [
    {
      id: 'speaker-1',
      name: 'Aria',
      voiceSamples: 3,
      confidence: 0.82,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      lastUpdated: new Date('2024-01-02T00:00:00Z'),
    },
    {
      id: 'speaker-2',
      name: 'Bram',
      voiceSamples: 2,
      confidence: 0.74,
      character: 'Knight Errant',
      createdAt: new Date('2024-01-03T00:00:00Z'),
      lastUpdated: new Date('2024-01-04T00:00:00Z'),
    },
  ];

  const baseCharacters: CharacterProfile[] = [
    {
      id: 'char-1',
      name: 'Knight Errant',
      class: 'Fighter',
      race: 'Human',
      level: 5,
      speakerId: 'speaker-2',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      description: 'Stalwart defender of the realm.',
    },
  ];

  it('renders characters and unassigned speakers with actions', () => {
    renderWithTheme(
      <CharacterAssignmentGrid
        speakers={baseSpeakers}
        characters={baseCharacters}
        onCreateCharacter={vi.fn()}
        onUpdateCharacter={vi.fn()}
        onDeleteCharacter={vi.fn()}
        onAssignSpeaker={vi.fn()}
        onSwapAssignments={vi.fn()}
      />
    );

    expect(screen.getByText('Character Assignments')).toBeInTheDocument();
    expect(screen.getByText('Knight Errant')).toBeInTheDocument();
    expect(screen.getByText('Aria')).toBeInTheDocument();
    expect(
      screen.getByText('Stalwart defender of the realm.')
    ).toBeInTheDocument();
  });

  it('creates a character through dialog workflow', async () => {
    vi.useRealTimers();
    try {
      const user = userEvent.setup();
      const handleCreate = vi.fn();

      renderWithTheme(
        <CharacterAssignmentGrid
          speakers={baseSpeakers}
          characters={[]}
          onCreateCharacter={handleCreate}
          onUpdateCharacter={vi.fn()}
          onDeleteCharacter={vi.fn()}
          onAssignSpeaker={vi.fn()}
          onSwapAssignments={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /add character/i }));

      const nameInput = (await screen.findByLabelText('Character Name', {
        selector: 'input',
      })) as HTMLInputElement;
      const dialogElement = nameInput.closest(
        '[role="dialog"]'
      ) as HTMLElement | null;
      expect(dialogElement).toBeTruthy();
      const dialog = within(dialogElement!);

      await user.type(nameInput, 'Seer of Dawn');
      const classInput = dialog.getByLabelText('Class') as HTMLInputElement;
      const raceInput = dialog.getByLabelText('Race') as HTMLInputElement;
      await user.type(classInput, 'Wizard');
      await user.type(raceInput, 'Elf');
      const levelInput = dialog.getByLabelText('Level') as HTMLInputElement;
      await user.click(levelInput);
      await user.keyboard('{Control>}a{/Control}7');

      expect(nameInput).toHaveValue('Seer of Dawn');
      expect(classInput).toHaveValue('Wizard');
      expect(raceInput).toHaveValue('Elf');
      expect(levelInput).toHaveValue(7);

      await user.click(dialog.getByRole('button', { name: /^Create$/ }));
      await waitForElementToBeRemoved(dialogElement!);

      await waitFor(() => expect(handleCreate).toHaveBeenCalledTimes(1));
      expect(handleCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Seer of Dawn',
          class: 'Wizard',
          race: 'Elf',
          level: 7,
        })
      );
    } finally {
      vi.useFakeTimers();
    }
  });

  it('edits an existing character profile', async () => {
    vi.useRealTimers();
    try {
      const user = userEvent.setup();
      const handleUpdate = vi.fn();

      renderWithTheme(
        <CharacterAssignmentGrid
          speakers={baseSpeakers}
          characters={baseCharacters}
          onCreateCharacter={vi.fn()}
          onUpdateCharacter={handleUpdate}
          onDeleteCharacter={vi.fn()}
          onAssignSpeaker={vi.fn()}
          onSwapAssignments={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: /edit character/i }));

      const editNameInput = (await screen.findByLabelText('Character Name', {
        selector: 'input',
      })) as HTMLInputElement;
      const editDialogElement = editNameInput.closest(
        '[role="dialog"]'
      ) as HTMLElement | null;
      expect(editDialogElement).toBeTruthy();
      const editDialog = within(editDialogElement!);

      await user.clear(editNameInput);
      await user.type(editNameInput, 'Knight Errant Prime');

      expect(editNameInput).toHaveValue('Knight Errant Prime');

      await user.click(editDialog.getByRole('button', { name: /^Update$/ }));
      await waitForElementToBeRemoved(editDialogElement!);

      await waitFor(() => expect(handleUpdate).toHaveBeenCalledTimes(1));
      expect(handleUpdate).toHaveBeenCalledWith(
        'char-1',
        expect.objectContaining({ name: 'Knight Errant Prime' })
      );
    } finally {
      vi.useFakeTimers();
    }
  });
});
