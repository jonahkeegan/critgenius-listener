/**
 * @fileoverview Speaker Components Exports
 * Barrel exports for speaker-related components
 */

export { default as SpeakerIdentificationPanel } from './SpeakerIdentificationPanel';
export { default as CharacterAssignmentGrid } from './CharacterAssignmentGrid';

// Re-export types for external consumption
export type { SpeakerProfile } from './SpeakerIdentificationPanel';
export type { CharacterProfile } from './CharacterAssignmentGrid';
