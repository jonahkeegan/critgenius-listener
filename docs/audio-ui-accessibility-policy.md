# Audio UI Accessibility Policy

**Version:** 1.0.0  
**Last Updated:** 2025-10-17  
**Status:** Active

## Overview

CritGenius Listener is an **audio-first** application designed for real-time D&D session capture and
transcription. This document defines our accessibility approach for audio interfaces and clarifies
the current scope of media accessibility rules.

## Core Accessibility Principles

### Current Scope: Audio-Only Interface

The CritGenius Listener MVP focuses exclusively on **audio capture and transcription**:

- Real-time microphone input and recording controls
- Live transcript display with speaker identification
- Audio playback controls (planned)
- Session management and export

All UI components are designed to be keyboard-navigable and screen-reader accessible, with
particular emphasis on:

1. **Audio Controls Accessibility**
   - All interactive elements (start/stop recording, playback, volume) are keyboard-accessible
   - Clear ARIA labels for all audio control buttons
   - Visual and programmatic state indicators (recording/paused/stopped)
   - Keyboard shortcuts documented and announced

2. **Transcript Accessibility**
   - Real-time transcript serves as text alternative to audio
   - Searchable and navigable via keyboard
   - Speaker labels clearly identified
   - High contrast and customizable text display

3. **Interactive Element Standards**
   - All clickable elements support keyboard interaction
   - Focus indicators meet WCAG 2.1 AA standards
   - Interactive elements have appropriate ARIA roles
   - No autofocus on form elements (prevents disruption)

## ESLint Rule Configuration

### Enforced Rules

The following `eslint-plugin-jsx-a11y` rules are **strictly enforced** (errors):

- `jsx-a11y/alt-text` — All images require descriptive alt text
- `jsx-a11y/no-autofocus` — Prevents autofocus disruption
- `jsx-a11y/interactive-supports-focus` — Interactive elements must be focusable
- `jsx-a11y/click-events-have-key-events` — Click handlers require keyboard equivalents

### Disabled Rules (Current Scope)

- **`jsx-a11y/media-has-caption`** — Currently **disabled**

  **Rationale:** CritGenius Listener's audio elements are the **source** of transcription, not the
  media requiring captions. The application itself generates the text alternative (live transcript)
  that serves as the accessible equivalent to the audio being processed.

  **Example:** When recording a D&D session, the app captures audio and produces a live transcript.
  The transcript IS the caption/text alternative—it would be redundant and technically infeasible to
  caption the very audio being transcribed in real-time.

### Video Scope (Future Consideration)

**If video elements are introduced** (e.g., webcam integration, session recordings with video):

1. Re-enable `jsx-a11y/media-has-caption` as a **warning** initially
2. Implement caption tracks for pre-recorded video content
3. For live video, ensure live transcript covers all spoken content
4. Document specific video accessibility requirements
5. Update this policy with video-specific guidelines

## Keyboard Navigation Requirements

All audio interface components must support:

- **Tab/Shift+Tab** — Navigate between controls
- **Enter/Space** — Activate buttons and controls
- **Arrow keys** — Adjust volume, seek in playback (when applicable)
- **Esc** — Cancel actions, close modals
- **Custom shortcuts** — Documented and configurable (e.g., `Ctrl+R` to start/stop recording)

## Screen Reader Support

- All state changes announced (recording started/stopped, errors)
- Progress indicators include text alternatives
- Dynamic content updates (live transcript) use ARIA live regions
- Error messages associated with relevant form fields

## Testing Standards

### Manual Testing Checklist

- [ ] All controls navigable via keyboard only
- [ ] Focus indicators visible and meet contrast requirements
- [ ] Screen reader announces all state changes
- [ ] No keyboard traps
- [ ] Custom shortcuts documented in help/settings

### Automated Testing

- ESLint accessibility rules enforced on all components
- Dedicated accessibility test fixtures in `tests/eslint/__fixtures__/`
- Integration tests verify keyboard navigation paths
- CI blocks commits that introduce accessibility violations

## Compliance Target

**WCAG 2.1 Level AA** for all user-facing components.

### Key WCAG Success Criteria for Audio UI

- **1.1.1 Non-text Content** — Live transcript serves as text alternative
- **2.1.1 Keyboard** — All functionality available via keyboard
- **2.1.2 No Keyboard Trap** — Users can navigate away from all components
- **2.4.7 Focus Visible** — Focus indicators always visible
- **3.2.2 On Input** — UI changes don't occur without user action
- **4.1.2 Name, Role, Value** — All controls have accessible names and roles

## Exceptions and Justifications

### `media-has-caption` Rule Disabled

**Why:** CritGenius Listener's core function is to **generate captions** (transcripts) from audio.
The app does not play media requiring captions—it processes raw audio input to create text.

**When to Revisit:** If we introduce:

- Pre-recorded audio playback with voiceover/narration
- Video elements with spoken content
- Embedded third-party media players

In these cases, we will enable the rule and ensure appropriate caption tracks.

## Maintenance and Updates

- **Policy Owner:** Development Infrastructure Team
- **Review Cadence:** Quarterly or when introducing new media types
- **Update Triggers:**
  - New video/multimedia features
  - WCAG guideline updates
  - User feedback on accessibility barriers
  - Assistive technology compatibility issues

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [eslint-plugin-jsx-a11y Rules](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y#supported-rules)
- [Web Audio API Accessibility Considerations](https://www.w3.org/WAI/media/av/)
- [ARIA Authoring Practices for Audio Controls](https://www.w3.org/WAI/ARIA/apg/)

## Contact

For accessibility questions or to report barriers:

- Open an issue: [GitHub Issues][repo-issues]
- Label with: `accessibility`, `a11y`

<!-- Internal link reference to keep repo URL centralized -->

[repo-issues]: https://github.com/jonahkeegan/critgenius-listener/issues

---

**Document History:**

- **v1.0.0** (2025-10-17) — Initial policy establishing audio-first scope and `media-has-caption`
  rationale
