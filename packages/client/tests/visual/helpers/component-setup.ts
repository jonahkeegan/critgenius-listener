import type { Page } from '@playwright/test';
import type { Character } from '../fixtures/character-data';
import type { SpeakerProfile } from '../fixtures/speaker-data';
import type { VisualTranscriptEntry } from '../fixtures/transcript-data';

/**
 * Ensures each test starts from a clean document body.
 */
export async function resetVisualTestDom(page: Page): Promise<void> {
  await page.setContent(
    '<!DOCTYPE html><html><head></head><body></body></html>'
  );
}

/**
 * Render a lightweight representation of the CharacterAssignmentGrid component.
 */
export async function renderCharacterAssignmentGrid(
  page: Page,
  characters: Character[]
): Promise<void> {
  await page.evaluate((characterList: Character[]) => {
    const grid = document.createElement('div');
    grid.setAttribute('data-testid', 'character-assignment-grid');
    grid.style.display = 'flex';
    grid.style.flexWrap = 'wrap';
    grid.style.gap = '16px';
    grid.style.padding = '16px';
    grid.style.backgroundColor = '#f5f5f5';
    grid.style.borderRadius = '8px';

    const characterHtml = characterList
      .slice(0, 8)
      .map(character => {
        const effects = character.statusEffects?.join(', ') ?? 'None';
        return (
          `<div style="background:white;border-radius:8px;padding:16px;box-shadow:0 2px 4px rgba(0,0,0,0.1);width:220px;">` +
          `<div style="font-size:18px;font-weight:700;margin-bottom:8px;color:#1976d2;">${character.name}</div>` +
          `<div style="font-size:14px;color:#666;margin-bottom:8px;">${character.class}</div>` +
          `<div style="font-size:12px;color:#333;line-height:1.4;">` +
          `Level: ${character.level ?? 1}<br/>` +
          `Status: ${character.isAlive ? 'Alive' : 'Fallen'}<br/>` +
          `HP: ${character.hitPoints ?? '—'} / ${character.maxHitPoints ?? '—'}<br/>` +
          `Effects: ${effects}` +
          `</div>` +
          '</div>'
        );
      })
      .join('');

    grid.innerHTML = characterHtml;
    document.body.appendChild(grid);
  }, characters);
}

/**
 * Render a lightweight representation of the SpeakerIdentificationPanel component.
 */
export async function renderSpeakerIdentificationPanel(
  page: Page,
  speakers: SpeakerProfile[]
): Promise<void> {
  await page.evaluate((speakerList: SpeakerProfile[]) => {
    const panel = document.createElement('div');
    panel.setAttribute('data-testid', 'speaker-identification-panel');
    panel.style.backgroundColor = '#f5f5f5';
    panel.style.padding = '16px';
    panel.style.borderRadius = '8px';
    panel.style.maxWidth = '420px';

    let content =
      '<h3 style="margin:0 0 16px;color:#1976d2;">Active Speakers</h3>' +
      '<div style="display:flex;flex-direction:column;gap:12px;">';

    speakerList.slice(0, 5).forEach(speaker => {
      const initial = speaker.name.charAt(0).toUpperCase();
      const statusColor =
        speaker.speakingState === 'speaking'
          ? '#43a047'
          : speaker.speakingState === 'muted'
            ? '#e53935'
            : '#999999';

      content +=
        '<div style="background:white;border-radius:8px;padding:12px;box-shadow:0 2px 4px rgba(0,0,0,0.1);display:flex;align-items:center;gap:12px;">' +
        `<div style="width:40px;height:40px;border-radius:50%;background:${statusColor};display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${initial}</div>` +
        '<div style="flex:1;line-height:1.4;">' +
        `<div style="font-weight:700;font-size:14px;color:#333;">${speaker.name}</div>` +
        `<div style="font-size:12px;color:#666;">${speaker.speakingState}</div>` +
        '</div>' +
        '</div>';
    });

    content += '</div>';
    panel.innerHTML = content;
    document.body.appendChild(panel);
  }, speakers);
}

/**
 * Render a lightweight representation of the TranscriptWindow component.
 */
export async function renderTranscriptWindow(
  page: Page,
  transcriptEntries: VisualTranscriptEntry[]
): Promise<void> {
  await page.evaluate((entries: VisualTranscriptEntry[]) => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'transcript-window');
    container.style.backgroundColor = 'white';
    container.style.borderRadius = '8px';
    container.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
    container.style.padding = '16px';
    container.style.maxHeight = '420px';
    container.style.overflowY = 'auto';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.width = '640px';

    let transcriptHtml =
      '<h3 style="margin:0 0 16px;color:#1976d2;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">Session Transcript</h3>' +
      '<div style="display:flex;flex-direction:column;gap:16px;">';

    entries.slice(0, 6).forEach(entry => {
      const bgColor = entry.isHighlighted ? '#e3f2fd' : 'transparent';
      const borderColor = entry.isHighlighted ? '#1976d2' : '#e0e0e0';
      const timestamp = new Date(entry.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      transcriptHtml +=
        `<div style="padding:12px;border-radius:8px;background:${bgColor};border-left:4px solid ${borderColor};">` +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
        `<div style="width:24px;height:24px;border-radius:50%;background-color:#1976d2;color:white;font-weight:700;font-size:12px;display:flex;align-items:center;justify-content:center;">${entry.speakerName.charAt(0)}</div>` +
        `<span style="font-weight:700;font-size:14px;color:#333;">${entry.speakerName}</span>` +
        (entry.characterName
          ? `<span style="font-size:12px;color:#666;">(${entry.characterName})</span>`
          : '') +
        '</div>' +
        `<span data-testid="timestamp" style="font-size:12px;color:#999;">${timestamp}</span>` +
        '</div>' +
        `<div style="font-size:14px;line-height:1.5;color:#333;">${entry.text}</div>` +
        (entry.hasCorrection
          ? `<div style="margin-top:8px;padding:8px;border-radius:6px;background:#fff3e0;color:#f57c00;font-size:12px;">Edited. Original: ${entry.originalText ?? ''}</div>`
          : '') +
        '</div>';
    });

    transcriptHtml += '</div>';
    container.innerHTML = transcriptHtml;
    document.body.appendChild(container);
  }, transcriptEntries);
}

/**
 * Render sample speaker transcript line states side-by-side.
 */
export async function renderSpeakerTranscriptLineStates(
  page: Page
): Promise<void> {
  await page.evaluate(() => {
    const container = document.createElement('div');
    container.setAttribute('data-testid', 'speaker-transcript-line-container');
    container.style.padding = '16px';
    container.style.backgroundColor = '#f5f5f5';
    container.style.borderRadius = '8px';
    container.style.maxWidth = '640px';

    container.innerHTML =
      '<h3 style="margin:0 0 16px;color:#1976d2;">Speaker Transcript Lines</h3>' +
      '<div style="padding:12px;margin:8px 0;border-radius:8px;background:white;border-left:4px solid #4caf50;display:flex;align-items:center;gap:12px;">' +
      '<div style="width:32px;height:32px;border-radius:50%;background-color:#4caf50;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;">G</div>' +
      '<div style="flex:1;">' +
      '<div style="font-weight:bold;font-size:14px;color:#333;margin-bottom:4px;">Gandalf (Gandalf)</div>' +
      '<div style="font-size:14px;color:#333;line-height:1.5;">You shall not pass!</div>' +
      '<div data-testid="timestamp" style="font-size:12px;color:#666;margin-top:4px;">18:45 • Confidence: 98%</div>' +
      '</div>' +
      '</div>' +
      '<div style="padding:12px;margin:8px 0;border-radius:8px;background:#e3f2fd;border-left:4px solid #1976d2;display:flex;align-items:center;gap:12px;">' +
      '<div style="width:32px;height:32px;border-radius:50%;background-color:#1976d2;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;">A</div>' +
      '<div style="flex:1;">' +
      '<div style="font-weight:bold;font-size:14px;color:#333;margin-bottom:4px;">Aragorn (Aragorn)</div>' +
      '<div style="font-size:14px;color:#333;line-height:1.5;">I am Arathorn\'s son, Isildur\'s heir.</div>' +
      '<div data-testid="timestamp" style="font-size:12px;color:#666;margin-top:4px;">18:46 • Confidence: 95%</div>' +
      '</div>' +
      '</div>';

    document.body.appendChild(container);
  });
}
