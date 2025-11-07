/**
 * Audio UI Integration Patterns for Material-UI Accessibility Testing
 *
 * Provides specialized accessibility patterns and validation for D&D audio interface components
 * with integration to existing CritGenius accessibility infrastructure.
 */

import type { RunOptions, AxeResults } from 'axe-core';
import { runAxeAudit, type AccessibilityAuditTarget } from './helpers';

/**
 * Audio UI specific accessibility requirements based on CritGenius audio interface design
 */
export interface AudioUIAccessibilityRequirements {
  /**
   * ARIA live region requirements for real-time transcription
   */
  liveRegions: {
    politeness: 'polite' | 'assertive';
    atomic: boolean;
    relevant: 'additions' | 'text' | 'all';
  };

  /**
   * Media control accessibility requirements
   */
  mediaControls: {
    playPause: boolean;
    stop: boolean;
    volume: boolean;
    recording: boolean;
    keyboardShortcuts: string[];
  };

  /**
   * Speaker mapping accessibility requirements
   */
  speakerMapping: {
    visualIndicators: boolean;
    audioAnnouncements: boolean;
    colorBlindSupport: boolean;
    highContrast: boolean;
  };

  /**
   * Real-time transcription accessibility
   */
  transcriptionDisplay: {
    scrollBehavior: 'auto' | 'smooth';
    focusManagement: boolean;
    screenReaderOptimized: boolean;
    searchFunctionality: boolean;
  };

  /**
   * Session control accessibility
   */
  sessionControls: {
    startStop: boolean;
    participantManagement: boolean;
    settingsAccess: boolean;
    exportOptions: boolean;
  };
}

/**
 * D&D specific audio interface patterns
 */
export interface DnDAudioInterfacePatterns {
  /**
   * Multi-player session support
   */
  multiPlayerSupport: {
    participantCount: number;
    speakerIdentification: boolean;
    roleBasedAccess: boolean;
  };

  /**
   * Game-specific terminology and context
   */
  gameContext: {
    diceRollAnnouncements: boolean;
    initiativeTracking: boolean;
    spellCastingFeedback: boolean;
    combatRoundUpdates: boolean;
  };

  /**
   * Content creator features
   */
  contentCreation: {
    streamingIntegration: boolean;
    podcastExport: boolean;
    transcriptEditing: boolean;
    highlightMarking: boolean;
  };
}

/**
 * Audio UI component accessibility validator
 */
export class AudioUIAccessibilityValidator {
  private requirements: AudioUIAccessibilityRequirements;
  private readonly dndPatterns: DnDAudioInterfacePatterns;

  constructor(
    requirements: AudioUIAccessibilityRequirements,
    dndPatterns: DnDAudioInterfacePatterns
  ) {
    this.requirements = requirements;
    this.dndPatterns = dndPatterns;
  }

  /**
   * Validate audio UI component accessibility
   */
  async validateAudioUIComponent(target: AccessibilityAuditTarget): Promise<{
    isCompliant: boolean;
    violations: AudioUIAccessibilityViolation[];
    suggestions: string[];
    auditResults: AxeResults;
  }> {
    const violations: AudioUIAccessibilityViolation[] = [];
    const suggestions: string[] = [];

    // Run base accessibility audit
    const auditResults = await this.runAudioUISpecificAudit(target);

    // Validate ARIA live regions
    const liveRegionValidation = this.validateLiveRegions(target);
    violations.push(...liveRegionValidation.violations);
    suggestions.push(...liveRegionValidation.suggestions);

    // Validate media controls
    const mediaControlValidation = this.validateMediaControls(target);
    violations.push(...mediaControlValidation.violations);
    suggestions.push(...mediaControlValidation.suggestions);

    // Validate speaker mapping
    const speakerMappingValidation = this.validateSpeakerMapping(target);
    violations.push(...speakerMappingValidation.violations);
    violations.push(...speakerMappingValidation.warnings);
    suggestions.push(...speakerMappingValidation.suggestions);

    // Validate transcription display
    const transcriptionValidation = this.validateTranscriptionDisplay(target);
    violations.push(...transcriptionValidation.violations);
    suggestions.push(...transcriptionValidation.suggestions);

    // Validate session controls
    const sessionControlValidation = this.validateSessionControls(target);
    violations.push(...sessionControlValidation.violations);
    suggestions.push(...sessionControlValidation.suggestions);

    return {
      isCompliant: violations.length === 0,
      violations,
      suggestions: [...new Set(suggestions)], // Remove duplicates
      auditResults,
    };
  }

  /**
   * Run audio UI specific accessibility audit
   */
  private async runAudioUISpecificAudit(
    target: AccessibilityAuditTarget
  ): Promise<AxeResults> {
    const audioUISpecificRules: RunOptions = {
      rules: {
        // Enhanced rules for audio UI
        'aria-live': { enabled: true },
        'aria-label': { enabled: true },
        'aria-labelledby': { enabled: true },
        'aria-describedby': { enabled: true },
        'button-name': { enabled: true },
        'color-contrast': { enabled: true },
        'focus-order-semantics': { enabled: true },
        headings: { enabled: true },
        'html5-skip-links': { enabled: true },
        keyboard: { enabled: true },
        'landmark-one-main': { enabled: true },
        list: { enabled: true },
        listitem: { enabled: true },
        'meta-refresh': { enabled: false }, // Not applicable for real-time UI
        'page-has-heading-one': { enabled: false }, // Component-level validation
        region: { enabled: true },
        'skip-link': { enabled: false }, // Component-level validation
      },
    };

    return runAxeAudit(target, audioUISpecificRules);
  }

  /**
   * Validate ARIA live regions for real-time updates
   */
  private validateLiveRegions(target: AccessibilityAuditTarget): {
    violations: AudioUIAccessibilityViolation[];
    suggestions: string[];
  } {
    const violations: AudioUIAccessibilityViolation[] = [];
    const suggestions: string[] = [];

    const element = target as Element;

    // Check for live regions
    const liveRegions = element.querySelectorAll('[aria-live]');
    if (liveRegions.length === 0) {
      violations.push({
        type: 'missing-live-region',
        severity: 'critical',
        message: 'Audio UI missing ARIA live region for real-time updates',
        wcagCriteria: 'WCAG 4.1.3',
        component: 'transcription-display',
      });
      suggestions.push(
        'Add aria-live="polite" or aria-live="assertive" to live update regions'
      );
    } else {
      // Validate live region configuration
      liveRegions.forEach((region, index) => {
        const politeness = region.getAttribute('aria-live');
        const atomic = region.getAttribute('aria-atomic');
        const relevant = region.getAttribute('aria-relevant');

        if (!politeness) {
          violations.push({
            type: 'missing-live-politeness',
            severity: 'major',
            message: `Live region ${index + 1} missing aria-live politeness setting`,
            wcagCriteria: 'WCAG 4.1.3',
            component: 'transcription-display',
          });
          suggestions.push(
            'Set aria-live="polite" for general updates or "assertive" for critical updates'
          );
        }

        if (this.requirements.liveRegions.atomic && atomic !== 'true') {
          violations.push({
            type: 'missing-live-atomic',
            severity: 'minor',
            message: `Live region ${index + 1} should be atomic for complete updates`,
            wcagCriteria: 'WCAG 4.1.3',
            component: 'transcription-display',
          });
          suggestions.push(
            'Set aria-atomic="true" for complete content updates'
          );
        }

        const requiredRelevant = this.requirements.liveRegions.relevant;
        if (requiredRelevant && relevant !== requiredRelevant) {
          violations.push({
            type: 'incorrect-live-relevance',
            severity: 'minor',
            message: `Live region ${index + 1} should set aria-relevant="${requiredRelevant}"`,
            wcagCriteria: 'WCAG 4.1.3',
            component: 'transcription-display',
          });
          suggestions.push(
            `Set aria-relevant="${requiredRelevant}" to control screen reader announcements`
          );
        }
      });
    }

    return { violations, suggestions };
  }

  /**
   * Validate media control accessibility
   */
  private validateMediaControls(target: AccessibilityAuditTarget): {
    violations: AudioUIAccessibilityViolation[];
    suggestions: string[];
  } {
    const violations: AudioUIAccessibilityViolation[] = [];
    const suggestions: string[] = [];

    const element = target as Element;

    // Check for media control buttons
    const mediaButtons = element.querySelectorAll('button, [role="button"]');
    if (
      mediaButtons.length === 0 &&
      this.requirements.mediaControls.playPause
    ) {
      violations.push({
        type: 'missing-media-controls',
        severity: 'critical',
        message: 'Audio UI missing media control buttons',
        wcagCriteria: 'WCAG 2.1.1',
        component: 'media-controls',
      });
      suggestions.push('Add accessible play/pause, stop, and volume controls');
    }

    // Validate button labeling
    mediaButtons.forEach((button, index) => {
      const label =
        button.getAttribute('aria-label') ||
        button.getAttribute('aria-labelledby') ||
        button.textContent?.trim();

      if (!label) {
        violations.push({
          type: 'unlabeled-media-control',
          severity: 'major',
          message: `Media control button ${index + 1} missing accessible name`,
          wcagCriteria: 'WCAG 4.1.2',
          component: 'media-controls',
        });
        suggestions.push(
          'Add aria-label or visible text to all media control buttons'
        );
      }

      // Check for keyboard accessibility
      const tabIndex = button.getAttribute('tabindex');
      if (tabIndex === '-1' && !this.isNaturallyFocusable(button)) {
        violations.push({
          type: 'non-focusable-media-control',
          severity: 'minor',
          message: `Media control button ${index + 1} not keyboard accessible`,
          wcagCriteria: 'WCAG 2.1.1',
          component: 'media-controls',
        });
        suggestions.push(
          'Ensure media controls are keyboard accessible (tabindex="0" or semantic button)'
        );
      }
    });

    return { violations, suggestions };
  }

  /**
   * Validate speaker mapping accessibility
   */
  private validateSpeakerMapping(target: AccessibilityAuditTarget): {
    violations: AudioUIAccessibilityViolation[];
    warnings: AudioUIAccessibilityViolation[];
    suggestions: string[];
  } {
    const violations: AudioUIAccessibilityViolation[] = [];
    const warnings: AudioUIAccessibilityViolation[] = [];
    const suggestions: string[] = [];

    const element = target as Element;

    // Check for speaker identification
    const speakerIndicators = element.querySelectorAll(
      '[data-speaker], [role="listitem"]'
    );
    const requireSpeakerIndicators =
      this.requirements.speakerMapping.visualIndicators ||
      this.dndPatterns.multiPlayerSupport.speakerIdentification;

    if (speakerIndicators.length === 0 && requireSpeakerIndicators) {
      warnings.push({
        type: 'missing-speaker-indicators',
        severity: 'warning',
        message: 'Audio UI missing speaker identification indicators',
        wcagCriteria: 'WCAG 1.4.1',
        component: 'speaker-mapping',
      });
      suggestions.push(
        'Add visual speaker identification with color, text, or icons'
      );
    }

    // Check for color-blind support
    if (this.requirements.speakerMapping.colorBlindSupport) {
      const hasColorOnlyIndicators = this.usesColorOnlyIndicators(element);
      if (hasColorOnlyIndicators) {
        warnings.push({
          type: 'color-only-indicators',
          severity: 'warning',
          message: 'Speaker identification may rely on color alone',
          wcagCriteria: 'WCAG 1.4.1',
          component: 'speaker-mapping',
        });
        suggestions.push(
          'Use multiple visual indicators (color + text + shape) for speaker identification'
        );
      }
    }

    // Check for high contrast support
    if (this.requirements.speakerMapping.highContrast) {
      const hasHighContrastSupport = this.hasHighContrastSupport(element);
      if (!hasHighContrastSupport) {
        violations.push({
          type: 'missing-high-contrast',
          severity: 'major',
          message: 'Audio UI missing high contrast mode support',
          wcagCriteria: 'WCAG 1.4.6',
          component: 'speaker-mapping',
        });
        suggestions.push(
          'Implement high contrast mode support for better visibility'
        );
      }
    }

    return { violations, warnings, suggestions };
  }

  /**
   * Validate transcription display accessibility
   */
  private validateTranscriptionDisplay(target: AccessibilityAuditTarget): {
    violations: AudioUIAccessibilityViolation[];
    suggestions: string[];
  } {
    const violations: AudioUIAccessibilityViolation[] = [];
    const suggestions: string[] = [];

    const element = target as Element;

    // Check for transcription container
    const transcriptionContainer = element.querySelector(
      '[role="log"], [aria-label*="transcript"], [aria-label*="conversation"]'
    );
    if (!transcriptionContainer) {
      violations.push({
        type: 'missing-transcription-container',
        severity: 'major',
        message: 'Audio UI missing transcription display container',
        wcagCriteria: 'WCAG 1.3.1',
        component: 'transcription-display',
      });
      suggestions.push(
        'Add role="log" or appropriate ARIA label to transcription display area'
      );
    }

    // Check for focus management in scrolling areas
    if (this.requirements.transcriptionDisplay.scrollBehavior === 'smooth') {
      const scrollContainer = element.querySelector(
        '[style*="overflow"], .transcript-container'
      );
      if (scrollContainer) {
        // Validate that focus management is handled
        const hasFocusManagement =
          scrollContainer.hasAttribute('tabindex') ||
          this.hasFocusManagementScript(scrollContainer);
        if (!hasFocusManagement) {
          suggestions.push(
            'Implement focus management for smooth scrolling transcription display'
          );
        }
      }
    }

    return { violations, suggestions };
  }

  /**
   * Validate session control accessibility
   */
  private validateSessionControls(target: AccessibilityAuditTarget): {
    violations: AudioUIAccessibilityViolation[];
    suggestions: string[];
  } {
    const violations: AudioUIAccessibilityViolation[] = [];
    const suggestions: string[] = [];

    const element = target as Element;

    // Check for session start/stop controls
    const sessionButtons = element.querySelectorAll(
      'button[aria-label*="start"], button[aria-label*="stop"], button[aria-label*="record"]'
    );
    if (
      sessionButtons.length === 0 &&
      this.requirements.sessionControls.startStop
    ) {
      violations.push({
        type: 'missing-session-controls',
        severity: 'critical',
        message: 'Audio UI missing session start/stop controls',
        wcagCriteria: 'WCAG 2.1.1',
        component: 'session-controls',
      });
      suggestions.push(
        'Add accessible session start/stop controls with clear labeling'
      );
    }

    // Validate participant management
    if (this.requirements.sessionControls.participantManagement) {
      const participantControls = element.querySelectorAll(
        '[aria-label*="participant"], [aria-label*="player"]'
      );
      if (participantControls.length === 0) {
        suggestions.push(
          'Consider adding participant management controls for multi-player sessions'
        );
      }

      const expectedParticipants =
        this.dndPatterns.multiPlayerSupport.participantCount;
      if (
        this.dndPatterns.multiPlayerSupport.speakerIdentification &&
        expectedParticipants > 0 &&
        participantControls.length < expectedParticipants
      ) {
        violations.push({
          type: 'insufficient-participant-controls',
          severity: 'warning',
          message: `Audio UI provides participant controls for ${participantControls.length} users, expected at least ${expectedParticipants}`,
          wcagCriteria: 'WCAG 1.3.1',
          component: 'session-controls',
        });
        suggestions.push(
          `Ensure participant management scales to ${expectedParticipants} players for D&D sessions`
        );
      }
    }

    if (this.dndPatterns.multiPlayerSupport.roleBasedAccess) {
      const roleBasedElements = element.querySelectorAll(
        '[data-role], [aria-role]'
      );
      if (roleBasedElements.length === 0) {
        suggestions.push(
          'Provide role-based controls (e.g., DM vs player) to align with D&D session patterns'
        );
      }
    }

    return { violations, suggestions };
  }

  // Helper methods
  private isNaturallyFocusable(element: Element): boolean {
    const focusableSelectors = [
      'button',
      'input',
      'select',
      'textarea',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ];
    return focusableSelectors.some(selector => element.matches(selector));
  }

  private usesColorOnlyIndicators(element: Element): boolean {
    // Check for color-coded speaker indicators without additional visual cues
    const speakerElements = element.querySelectorAll('[data-speaker]');
    return Array.from(speakerElements).some(el => {
      const style = window.getComputedStyle(el);
      const hasText = el.textContent?.trim();
      const hasIcon = el.querySelector(
        'svg, [class*="icon"], [class*="symbol"]'
      );
      return style.color && !hasText && !hasIcon;
    });
  }

  private hasHighContrastSupport(element: Element): boolean {
    // Check for high contrast CSS or data attributes
    const hasHighContrastCSS = element.querySelector(
      '[data-high-contrast], .high-contrast'
    );
    const hasContrastMediaQuery = element.innerHTML.includes(
      '@media (prefers-contrast:'
    );
    return Boolean(hasHighContrastCSS || hasContrastMediaQuery);
  }

  private hasFocusManagementScript(element: Element): boolean {
    // This would check for focus management JavaScript in a real implementation
    return element.hasAttribute('data-focus-management');
  }
}

/**
 * Audio UI accessibility violation type
 */
export interface AudioUIAccessibilityViolation {
  type: string;
  severity: 'critical' | 'major' | 'minor' | 'warning';
  message: string;
  wcagCriteria: string;
  component: string;
}

/**
 * Default audio UI accessibility requirements for CritGenius
 */
export const DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS: AudioUIAccessibilityRequirements =
  {
    liveRegions: {
      politeness: 'polite',
      atomic: true,
      relevant: 'additions',
    },
    mediaControls: {
      playPause: true,
      stop: true,
      volume: true,
      recording: true,
      keyboardShortcuts: ['Space', 'Enter', 'ArrowUp', 'ArrowDown'],
    },
    speakerMapping: {
      visualIndicators: true,
      audioAnnouncements: true,
      colorBlindSupport: true,
      highContrast: true,
    },
    transcriptionDisplay: {
      scrollBehavior: 'smooth',
      focusManagement: true,
      screenReaderOptimized: true,
      searchFunctionality: true,
    },
    sessionControls: {
      startStop: true,
      participantManagement: true,
      settingsAccess: true,
      exportOptions: true,
    },
  };

/**
 * Default D&D audio interface patterns
 */
export const DEFAULT_DND_AUDIO_INTERFACE_PATTERNS: DnDAudioInterfacePatterns = {
  multiPlayerSupport: {
    participantCount: 4,
    speakerIdentification: true,
    roleBasedAccess: true,
  },
  gameContext: {
    diceRollAnnouncements: true,
    initiativeTracking: true,
    spellCastingFeedback: true,
    combatRoundUpdates: true,
  },
  contentCreation: {
    streamingIntegration: true,
    podcastExport: true,
    transcriptEditing: true,
    highlightMarking: true,
  },
};

/**
 * Create a CritGenius audio UI accessibility validator
 */
export const createCritgeniusAudioUIValidator =
  (): AudioUIAccessibilityValidator => {
    return new AudioUIAccessibilityValidator(
      DEFAULT_CRITGENIUS_AUDIO_UI_REQUIREMENTS,
      DEFAULT_DND_AUDIO_INTERFACE_PATTERNS
    );
  };

/**
 * Validate D&D session audio interface
 */
export const validateDnDAudioInterface = async (
  target: AccessibilityAuditTarget
): Promise<{
  isCompliant: boolean;
  violations: AudioUIAccessibilityViolation[];
  suggestions: string[];
  auditResults: AxeResults;
}> => {
  const validator = createCritgeniusAudioUIValidator();
  return validator.validateAudioUIComponent(target);
};

/**
 * Audio UI accessibility test patterns
 */
export const AUDIO_UI_ACCESSIBILITY_PATTERNS = {
  // ARIA live region patterns
  TRANSCRIPTION_LIVE_REGION: {
    'aria-live': 'polite',
    'aria-atomic': 'true',
    'aria-relevant': 'additions',
    role: 'log',
  },

  // Media control patterns
  PLAY_BUTTON: {
    'aria-label': 'Play audio',
    'aria-pressed': 'false',
    role: 'button',
  },

  PAUSE_BUTTON: {
    'aria-label': 'Pause audio',
    'aria-pressed': 'true',
    role: 'button',
  },

  STOP_BUTTON: {
    'aria-label': 'Stop audio',
    role: 'button',
  },

  // Speaker identification patterns
  SPEAKER_INDICATOR: {
    'data-speaker': 'player-1',
    'aria-label': 'Player 1 speaking',
    role: 'listitem',
  },

  // Session control patterns
  SESSION_START: {
    'aria-label': 'Start recording session',
    role: 'button',
  },

  SESSION_STOP: {
    'aria-label': 'Stop recording session',
    role: 'button',
  },
} as const;

/**
 * Get audio UI accessibility checklist for manual testing
 */
export const getAudioUIAccessibilityChecklist = (): string[] => {
  return [
    'Real-time transcription updates announced via ARIA live regions',
    'Media controls (play/pause/stop) are keyboard accessible with clear labels',
    'Speaker identification uses multiple visual cues (color + text + icon)',
    'High contrast mode support for speaker indicators',
    'Smooth scrolling transcription display with focus management',
    'Session start/stop controls are clearly labeled and keyboard accessible',
    'Volume controls are keyboard accessible with value announcements',
    'Recording status is clearly indicated visually and programmatically',
    'Error states and connection issues are announced to screen readers',
    'All functionality is available via keyboard navigation',
    'Color coding is not the only means of conveying information',
    'Text alternatives provided for all non-text content',
    'Focus order is logical and intuitive',
    'No keyboard traps in modal dialogs or complex interactions',
  ];
};
