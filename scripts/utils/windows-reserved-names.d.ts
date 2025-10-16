export declare const WINDOWS_RESERVED_NAMES: ReadonlySet<string>;
export declare function isWindowsReservedName(filename: string): boolean;
export declare function sanitizeWindowsFilename(
  filename: string,
  fallback: string
): string;
export declare function getReservedNameError(filename: string): string | null;
