/**
 * @fileoverview Barrel export for speaker components
 * Provides clean imports for speaker identification and character assignment functionality
 */

export { default as SpeakerIdentificationPanel } from './SpeakerIdentificationPanel';
export { default as CharacterAssignmentGrid } from './CharacterAssignmentGrid';

// Re-export types for external consumption
export type { SpeakerProfile } from './SpeakerIdentificationPanel';
export type { CharacterProfile } from './CharacterAssignmentGrid';
