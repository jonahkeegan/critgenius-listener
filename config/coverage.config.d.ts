import type {
  CoverageTheme,
  CoverageThresholds,
  CoverageTargetsMap,
  CoverageThemeMetadata,
  ThemeThresholdMap,
} from './coverage.config.types';

declare module '*coverage.config.mjs' {
  export const defaultCoverageThresholds: Readonly<CoverageThresholds>;
  export const coverageThemes: ReadonlyArray<Readonly<CoverageTheme>>;
  export function getCoverageTheme(key: string): CoverageTheme | null;
  export function getThemeThresholdMap(options?: {
    resolved?: boolean;
  }): ThemeThresholdMap;
  export function getCoverageTargets(): CoverageTargetsMap;
  export function getCoverageExecutionOrder(): string[];
  export function getThemesMetadata(): CoverageThemeMetadata[];
  export function getWorkspaceRoot(): string;
  export function getCoverageRoot(): string;
}
