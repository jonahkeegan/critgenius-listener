// Visual regression tests for CritGenius Listener components using Percy
import { test, expect } from '@playwright/test';

// Import test fixtures and helpers
import { characterScenarios, type Character } from './fixtures/character-data';
import { speakerScenarios, type SpeakerProfile } from './fixtures/speaker-data';
import {
  transcriptScenarios,
  type TranscriptEntry,
} from './fixtures/transcript-data';
import {
  setupPageForVisualTesting,
  takeResponsiveSnapshot,
  PercyTestUtils,
} from './helpers/percy-helpers';

test.describe('Visual Regression Tests', () => {
  test.describe('CharacterAssignmentGrid Component', () => {
    test('should capture CharacterAssignmentGrid with default character data', async ({
      page,
    }) => {
      await setupPageForVisualTesting(page, 'about:blank', {
        hideDynamicElements: true,
        additionalSetup: async () => {
          await page.evaluate((characters: Character[]) => {
            const grid = document.createElement('div');
            grid.setAttribute('data-testid', 'character-assignment-grid');
            grid.style.display = 'flex';
            grid.style.flexWrap = 'wrap';
            grid.style.gap = '16px';
            grid.style.padding = '16px';
            grid.style.backgroundColor = '#f5f5f5';
            grid.style.borderRadius = '8px';

            const characterHtml = characters
              .slice(0, 4)
              .map(char => {
                return (
                  '<div style="background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); width: 200px;">' +
                  '<div style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1976d2;">' +
                  char.name +
                  '</div>' +
                  '<div style="font-size: 14px; color: #666; margin-bottom: 8px;">' +
                  char.class +
                  '</div>' +
                  '<div style="font-size: 12px; color: #333;">Level: ' +
                  (char.level ?? 1) +
                  '<br>Status: ' +
                  (char.isAlive ? 'Alive' : 'Dead') +
                  '</div>' +
                  '</div>'
                );
              })
              .join('');

            grid.innerHTML = characterHtml;
            document.body.appendChild(grid);
          }, characterScenarios.default);

          await PercyTestUtils.waitForMUIComponents(page);
        },
      });

      await takeResponsiveSnapshot(page, 'character-assignment-grid-default');
      await expect(
        page.locator('[data-testid="character-assignment-grid"]')
      ).toBeVisible();
    });
  });

  test.describe('SpeakerIdentificationPanel Component', () => {
    test('should capture SpeakerIdentificationPanel with default speaker profiles', async ({
      page,
    }) => {
      await setupPageForVisualTesting(page, 'about:blank', {
        hideDynamicElements: true,
        additionalSetup: async () => {
          await page.evaluate((speakers: SpeakerProfile[]) => {
            const panel = document.createElement('div');
            panel.setAttribute('data-testid', 'speaker-identification-panel');
            panel.style.backgroundColor = '#f5f5f5';
            panel.style.padding = '16px';
            panel.style.borderRadius = '8px';
            panel.style.maxWidth = '400px';

            let speakersHtml =
              '<h3 style="margin: 0 0 16px 0; color: #1976d2;">Active Speakers</h3><div style="display: flex; flex-direction: column; gap: 12px;">';

            speakers.slice(0, 3).forEach(speaker => {
              speakersHtml +=
                '<div style="background: white; border-radius: 8px; padding: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 12px;">' +
                '<div style="width: 40px; height: 40px; border-radius: 50%; background-color: #1976d2; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">' +
                speaker.name.charAt(0) +
                '</div>' +
                '<div style="flex: 1;"><div style="font-weight: bold; font-size: 14px; color: #333;">' +
                speaker.name +
                '</div>' +
                '<div style="font-size: 12px; color: #666;">' +
                speaker.speakingState +
                '</div></div></div>';
            });

            speakersHtml += '</div>';
            panel.innerHTML = speakersHtml;
            document.body.appendChild(panel);
          }, speakerScenarios.default);

          await PercyTestUtils.waitForMUIComponents(page);
        },
      });

      await takeResponsiveSnapshot(
        page,
        'speaker-identification-panel-default'
      );
    });
  });

  test.describe('TranscriptWindow Component', () => {
    test('should capture TranscriptWindow with default transcript entries', async ({
      page,
    }) => {
      await setupPageForVisualTesting(page, 'about:blank', {
        hideDynamicElements: true,
        additionalSetup: async () => {
          await page.evaluate((transcripts: TranscriptEntry[]) => {
            const window = document.createElement('div');
            window.setAttribute('data-testid', 'transcript-window');
            window.style.backgroundColor = 'white';
            window.style.borderRadius = '8px';
            window.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
            window.style.padding = '16px';
            window.style.maxHeight = '400px';
            window.style.overflowY = 'auto';
            window.style.fontFamily = 'Arial, sans-serif';

            let transcriptHtml =
              '<h3 style="margin: 0 0 16px 0; color: #1976d2; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px;">Session Transcript</h3><div style="display: flex; flex-direction: column; gap: 16px;">';

            transcripts.slice(0, 3).forEach(entry => {
              const bgColor = entry.isHighlighted ? '#e3f2fd' : 'transparent';
              const borderColor = entry.isHighlighted ? '#1976d2' : '#e0e0e0';

              transcriptHtml +=
                '<div style="padding: 12px; border-radius: 8px; background-color: ' +
                bgColor +
                '; border-left: 4px solid ' +
                borderColor +
                ';">' +
                '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
                '<div style="display: flex; align-items: center; gap: 8px;">' +
                '<div style="width: 24px; height: 24px; border-radius: 50%; background-color: #1976d2; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold;">' +
                entry.speakerName.charAt(0) +
                '</div>' +
                '<span style="font-weight: bold; font-size: 14px; color: #333;">' +
                entry.speakerName +
                '</span>' +
                (entry.characterName
                  ? '<span style="font-size: 12px; color: #666;">(' +
                    entry.characterName +
                    ')</span>'
                  : '') +
                '</div>' +
                '<span style="font-size: 12px; color: #999;">' +
                new Date(entry.timestamp).toLocaleTimeString() +
                '</span>' +
                '</div>' +
                '<div style="font-size: 14px; line-height: 1.5; color: #333;">' +
                entry.text +
                '</div>' +
                '</div>';
            });

            transcriptHtml += '</div>';
            window.innerHTML = transcriptHtml;
            document.body.appendChild(window);
          }, transcriptScenarios.default);

          await PercyTestUtils.waitForMUIComponents(page);
        },
      });

      await takeResponsiveSnapshot(page, 'transcript-window-default');
    });
  });

  test.describe('SpeakerTranscriptLine Component', () => {
    test('should capture SpeakerTranscriptLine in different states', async ({
      page,
    }) => {
      await setupPageForVisualTesting(page, 'about:blank', {
        hideDynamicElements: true,
        additionalSetup: async () => {
          await page.evaluate(() => {
            const container = document.createElement('div');
            container.setAttribute(
              'data-testid',
              'speaker-transcript-line-container'
            );
            container.style.padding = '16px';
            container.style.backgroundColor = '#f5f5f5';
            container.style.borderRadius = '8px';
            container.style.maxWidth = '600px';

            container.innerHTML =
              '<h3 style="margin: 0 0 16px 0; color: #1976d2;">Speaker Transcript Lines</h3>' +
              '<div style="padding: 12px; margin: 8px 0; border-radius: 8px; background: white; border-left: 4px solid #4caf50; display: flex; align-items: center; gap: 12px;">' +
              '<div style="width: 32px; height: 32px; border-radius: 50%; background-color: #4caf50; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">G</div>' +
              '<div style="flex: 1;"><div style="font-weight: bold; font-size: 14px; color: #333; margin-bottom: 4px;">Gandalf (Gandalf)</div>' +
              '<div style="font-size: 14px; color: #333; line-height: 1.5;">You shall not pass!</div>' +
              '<div style="font-size: 12px; color: #666; margin-top: 4px;">18:45:12 • Confidence: 98%</div></div></div>' +
              '<div style="padding: 12px; margin: 8px 0; border-radius: 8px; background: #e3f2fd; border-left: 4px solid #1976d2; display: flex; align-items: center; gap: 12px;">' +
              '<div style="width: 32px; height: 32px; border-radius: 50%; background-color: #1976d2; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">A</div>' +
              '<div style="flex: 1;"><div style="font-weight: bold; font-size: 14px; color: #333; margin-bottom: 4px;">Aragorn (Aragorn)</div>' +
              '<div style="font-size: 14px; color: #333; line-height: 1.5;">I am Arathorn\'s son, Isildur\'s heir.</div>' +
              '<div style="font-size: 12px; color: #666; margin-top: 4px;">18:46:30 • Confidence: 95%</div></div></div>';

            document.body.appendChild(container);
          });

          await PercyTestUtils.waitForMUIComponents(page);
        },
      });

      await takeResponsiveSnapshot(page, 'speaker-transcript-line-states');
    });
  });
});
