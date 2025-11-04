import { test, expect } from '@playwright/test';
import {
  snapshotComponent,
  takeResponsiveSnapshot,
  validateSnapshotSuccess,
  PercyTestUtils,
} from '../helpers/percy-helpers';
import { characterScenarios } from '../fixtures/character-data';
import { speakerScenarios } from '../fixtures/speaker-data';
import { transcriptScenarios } from '../fixtures/transcript-data';
import {
  resetVisualTestDom,
  renderCharacterAssignmentGrid,
  renderSpeakerIdentificationPanel,
  renderTranscriptWindow,
  renderSpeakerTranscriptLineStates,
} from '../helpers/component-setup';

test.describe('Percy Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await resetVisualTestDom(page);
  });

  test.afterEach(async ({ page }) => {
    await validateSnapshotSuccess(page);
  });

  test.describe('CharacterAssignmentGrid Component', () => {
    test('captures default party layout', async ({ page }) => {
      await snapshotComponent(
        page,
        'character-assignment-grid-default',
        async () => {
          await renderCharacterAssignmentGrid(page, characterScenarios.default);
          await PercyTestUtils.waitForMUIComponents(page);
        }
      );

      await expect(
        page.locator('[data-testid="character-assignment-grid"]')
      ).toBeVisible();
    });

    test('captures injured character states', async ({ page }) => {
      await snapshotComponent(
        page,
        'character-assignment-grid-injured',
        async () => {
          await renderCharacterAssignmentGrid(
            page,
            characterScenarios.injuredCharacters
          );
          await PercyTestUtils.waitForMUIComponents(page);
        }
      );
    });
  });

  test.describe('SpeakerIdentificationPanel Component', () => {
    test('captures mixed speaking states', async ({ page }) => {
      await snapshotComponent(
        page,
        'speaker-identification-panel-mixed',
        async () => {
          await renderSpeakerIdentificationPanel(
            page,
            speakerScenarios.mixedSpeakingStates
          );
          await PercyTestUtils.waitForMUIComponents(page);
        }
      );
    });

    test('captures large roster state', async ({ page }) => {
      await snapshotComponent(
        page,
        'speaker-identification-panel-many',
        async () => {
          await renderSpeakerIdentificationPanel(
            page,
            speakerScenarios.manySpeakers
          );
          await PercyTestUtils.waitForMUIComponents(page);
        }
      );
    });
  });

  test.describe('TranscriptWindow Component', () => {
    test('captures highlighted transcript entries', async ({ page }) => {
      await snapshotComponent(
        page,
        'transcript-window-highlighted',
        async () => {
          await renderTranscriptWindow(
            page,
            transcriptScenarios.highlightedEntries
          );
          await PercyTestUtils.waitForMUIComponents(page);
        }
      );
    });

    test('captures dice roll transcript entries', async ({ page }) => {
      await snapshotComponent(
        page,
        'transcript-window-dice-rolls',
        async () => {
          await renderTranscriptWindow(page, transcriptScenarios.diceRolls);
          await PercyTestUtils.waitForMUIComponents(page);
        }
      );
    });
  });

  test.describe('SpeakerTranscriptLine Component', () => {
    test('captures primary states', async ({ page }) => {
      await snapshotComponent(
        page,
        'speaker-transcript-line-states',
        async () => {
          await renderSpeakerTranscriptLineStates(page);
          await PercyTestUtils.waitForMUIComponents(page);
        }
      );

      await takeResponsiveSnapshot(
        page,
        'speaker-transcript-line-states-responsive'
      );
    });
  });
});
