/**
 * @fileoverview Theme Module Exports
 * Central exports for CritGenius: Listener theme system
 */

export { critgeniusTheme, colors } from './critgeniusTheme';
export type { CritGeniusTheme } from './critgeniusTheme';

// Re-export MUI theme types for convenience
export type { Theme, ThemeOptions } from '@mui/material/styles';
export { alpha, darken, lighten } from '@mui/material/styles';
