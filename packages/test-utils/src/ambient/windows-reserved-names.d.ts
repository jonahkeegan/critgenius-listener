declare module '../../../../scripts/utils/windows-reserved-names.mjs' {
  export const WINDOWS_RESERVED_NAMES: ReadonlySet<string>;
  export function isWindowsReservedName(filename: string): boolean;
  export function sanitizeWindowsFilename(
    filename: string,
    fallback: string
  ): string;
  export function getReservedNameError(filename: string): string | null;
}

declare module '../../../../scripts/utils/windows-reserved-names.cjs' {
  export const WINDOWS_RESERVED_NAMES: ReadonlySet<string>;
  export function isWindowsReservedName(filename: string): boolean;
  export function sanitizeWindowsFilename(
    filename: string,
    fallback: string
  ): string;
  export function getReservedNameError(filename: string): string | null;
}
