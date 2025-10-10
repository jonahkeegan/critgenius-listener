export type ComparisonMode = 'minimum' | 'exact';

export interface ValidationIssue {
  tool: string;
  file: string;
  detail: string;
}

export interface ValidationOutcome {
  report: {
    generatedAt: string;
    mode: string;
    changedFiles: string[];
    toolsEvaluated: string[];
    failures: ValidationIssue[];
    summaries: Array<Record<string, unknown>>;
  };
  hasFailures: boolean;
  issues: ValidationIssue[];
}

export interface ValidationIO {
  readFile(path: string, encoding?: string): Promise<string>;
  writeFile(path: string, data: string): Promise<void>;
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  exec(
    cmd: string,
    args: string[],
    options?: Record<string, unknown>
  ): Promise<{ stdout: string; stderr: string }>;
}

export interface ValidationOptions {
  mode?: 'staged' | 'ci' | 'diff';
  baseRef?: string;
  forceAll?: boolean;
  debug?: boolean;
  io?: ValidationIO;
  writeArtifacts?: boolean;
}

export function runValidation(
  options?: ValidationOptions
): Promise<ValidationOutcome>;
export function evaluateComparison(args: {
  comparison: ComparisonMode;
  expected: string;
  actualValue: string;
}): { ok: boolean; detail?: string };
export function parseVersion(
  value: string
): { major: number; minor: number; patch: number; raw: string } | null;
export function compareVersions(
  a: { major: number; minor: number; patch: number },
  b: { major: number; minor: number; patch: number }
): number;
export function loadPolicy(
  io?: ValidationIO
): Promise<Array<Record<string, unknown>>>;
export function selectToolsForValidation(
  tools: Array<Record<string, unknown>>,
  changedFiles: string[],
  options?: { forceAll?: boolean }
): Array<Record<string, unknown>>;
export function getChangedFiles(
  args: { mode?: string; baseRef?: string },
  io?: ValidationIO
): Promise<string[]>;
export function validateTools(
  tools: Array<Record<string, unknown>>,
  io: ValidationIO,
  logger: Record<string, unknown>
): Promise<{
  summaries: Array<Record<string, unknown>>;
  issues: ValidationIssue[];
}>;
