/**
 * Audio UI accessibility integration tests
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  type MockInstance,
} from 'vitest';
import { JSDOM } from 'jsdom';
import type { AxeResults } from 'axe-core';
import * as accessibilityHelpers from '../../../src/accessibility/helpers';
import {
  AudioUIAccessibilityValidator,
  DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS,
  DEFAULT_DND_AUDIO_INTERFACE_PATTERNS,
  createCritgeniusAudioUIValidator,
  validateDnDAudioInterface,
  getAudioUIAccessibilityChecklist,
} from '../../../src/accessibility/audio-ui-integration';
let runAxeAuditMock: MockInstance<typeof accessibilityHelpers.runAxeAudit>;

const createAxeResults = (overrides: Partial<AxeResults> = {}): AxeResults => ({
  toolOptions: {},
  testEngine: { name: 'axe-core', version: 'test' },
  testRunner: { name: 'vitest' },
  testEnvironment: {
    userAgent: 'Vitest',
    windowWidth: 1024,
    windowHeight: 768,
  },
  timestamp: '2024-01-01T00:00:00.000Z',
  url: 'http://localhost',
  violations: [],
  passes: [],
  incomplete: [],
  inapplicable: [],
  ...overrides,
});

const baseAuditResult = createAxeResults();

const createDom = (markup: string) =>
  new JSDOM(`<!doctype html><html><body>${markup}</body></html>`, {
    url: 'http://localhost',
  });

const setDomGlobals = (dom: JSDOM) => {
  const { window } = dom;
  const globalAny = globalThis as Record<string, unknown>;
  globalAny.window = window;
  globalAny.document = window.document;
  globalAny.Element = window.Element;
  globalAny.Document = window.Document;
  globalAny.DocumentFragment = window.DocumentFragment;
  globalAny.getComputedStyle = window.getComputedStyle.bind(window);
};

const clearDomGlobals = () => {
  const globalAny = globalThis as Record<string, unknown>;
  delete globalAny.window;
  delete globalAny.document;
  delete globalAny.Element;
  delete globalAny.Document;
  delete globalAny.DocumentFragment;
  delete globalAny.getComputedStyle;
};

const withDom = async (
  markup: string,
  run: (dom: JSDOM) => Promise<void> | void
) => {
  const dom = createDom(markup);
  setDomGlobals(dom);
  try {
    await run(dom);
  } finally {
    dom.window.close();
    clearDomGlobals();
  }
};

const buildAccessibleAudioUi = (document: Document) => {
  const root = document.createElement('div');
  root.setAttribute('id', 'audio-ui');
  root.setAttribute('role', 'application');

  const liveRegion = document.createElement('div');
  liveRegion.setAttribute('role', 'log');
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.setAttribute('aria-relevant', 'additions');
  root.appendChild(liveRegion);

  const transcriptionContainer = document.createElement('div');
  transcriptionContainer.className = 'transcript-container';
  transcriptionContainer.setAttribute('tabindex', '0');
  transcriptionContainer.setAttribute('style', 'overflow:auto');
  root.appendChild(transcriptionContainer);

  const controls = document.createElement('div');
  controls.setAttribute('aria-label', 'Audio controls');
  const controlLabels = ['Play audio', 'Stop session', 'Record audio'];
  controlLabels.forEach(label => {
    const button = document.createElement('button');
    button.setAttribute('aria-label', label);
    controls.appendChild(button);
  });
  root.appendChild(controls);

  const speakers = document.createElement('div');
  speakers.setAttribute('aria-label', 'Speaker indicators');
  const createSpeaker = (id: string) => {
    const el = document.createElement('div');
    el.setAttribute('data-speaker', id);
    el.setAttribute('data-high-contrast', 'true');
    el.textContent = id;
    return el;
  };
  speakers.appendChild(createSpeaker('player-1'));
  speakers.appendChild(createSpeaker('player-2'));
  root.appendChild(speakers);

  const participantControls = document.createElement('div');
  participantControls.setAttribute('data-role', 'dm-controls');
  const sessionButtons = [
    'start session',
    'stop session',
    'participant 1',
    'participant 2',
    'participant 3',
    'participant 4',
  ];
  sessionButtons.forEach(label => {
    const button = document.createElement('button');
    button.setAttribute('aria-label', label);
    participantControls.appendChild(button);
  });
  root.appendChild(participantControls);

  const style = document.createElement('style');
  style.textContent =
    '@media (prefers-contrast: more) { #audio-ui { color: #000; } }';
  root.appendChild(style);

  return root;
};

beforeEach(() => {
  runAxeAuditMock = vi
    .spyOn(accessibilityHelpers, 'runAxeAudit')
    .mockResolvedValue(baseAuditResult);
});

afterEach(() => {
  runAxeAuditMock.mockReset();
});

describe('AudioUIAccessibilityValidator', () => {
  it('reports violations when critical requirements are missing', async () => {
    await withDom('<div id="audio-ui"></div>', async dom => {
      const element = dom.window.document.getElementById('audio-ui');
      expect(element).not.toBeNull();

      const validator = new AudioUIAccessibilityValidator(
        DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS,
        DEFAULT_DND_AUDIO_INTERFACE_PATTERNS
      );

      const result = await validator.validateAudioUIComponent(element!);

      expect(result.isCompliant).toBe(false);
      expect(result.violations.some(v => v.type === 'missing-live-region')).toBe(
        true
      );
      expect(
        result.violations.some(v => v.type === 'missing-session-controls')
      ).toBe(true);
    });
  });

  it('returns compliant result for a well-structured audio UI', async () => {
    await withDom('', async dom => {
      const root = buildAccessibleAudioUi(dom.window.document);
      dom.window.document.body.appendChild(root);

      const validator = new AudioUIAccessibilityValidator(
        DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS,
        DEFAULT_DND_AUDIO_INTERFACE_PATTERNS
      );

      const result = await validator.validateAudioUIComponent(root);

      expect(result.isCompliant).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(runAxeAuditMock).toHaveBeenCalledWith(
        root,
        expect.objectContaining({ rules: expect.any(Object) })
      );
    });
  });
});

describe('Audio UI helper factories', () => {
  it('creates validator with default settings', () => {
    const validator = createCritgeniusAudioUIValidator();
    expect(validator).toBeInstanceOf(AudioUIAccessibilityValidator);
  });

  it('validates D&D audio interface with default pipeline', async () => {
    await withDom('', async dom => {
      const root = buildAccessibleAudioUi(dom.window.document);
      dom.window.document.body.appendChild(root);

      const result = await validateDnDAudioInterface(root);

      expect(result.isCompliant).toBe(true);
      expect(runAxeAuditMock).toHaveBeenCalled();
    });
  });

  it('provides an accessibility checklist for implementers', () => {
    const checklist = getAudioUIAccessibilityChecklist();
    expect(Array.isArray(checklist)).toBe(true);
    expect(checklist.length).toBeGreaterThan(0);
    expect(checklist.some(item => item.toLowerCase().includes('keyboard'))).toBe(
      true
    );
  });
});
