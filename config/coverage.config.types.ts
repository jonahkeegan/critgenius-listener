export type CoverageThresholds = {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
};

export type CoverageTheme = {
  key: string;
  label: string;
  description: string;
  workspaceRelativeConfigPath: string;
  configPath: string;
  packageDir?: string;
  packageName?: string;
  reportsDirectory: string;
  summaryFile: string;
  thresholds: CoverageThresholds;
  coverageCommand?: string[];
  includeInThematic?: boolean;
};

export type CoverageTargetsMap = Record<
  string,
  {
    description: string;
    command: string[];
  }
>;

export type CoverageThemeMetadata = {
  key: string;
  label: string;
  summaryFile: string;
  reportsDirectory: string;
};

export type ThemeThresholdMap = Record<string, CoverageThresholds>;

export interface CoverageConfigModule {
  defaultCoverageThresholds: Readonly<CoverageThresholds>;
  coverageThemes: ReadonlyArray<Readonly<CoverageTheme>>;
  getCoverageTheme: (key: string) => CoverageTheme | null;
  getThemeThresholdMap: (options?: { resolved?: boolean }) => ThemeThresholdMap;
  getCoverageTargets: () => CoverageTargetsMap;
  getCoverageExecutionOrder: () => string[];
  getThemesMetadata: () => CoverageThemeMetadata[];
}
