/**
 * TypeScript declarations for Windows Reserved Names Utility
 */

/**
 * Set of Windows reserved device names (case-insensitive)
 */
export const WINDOWS_RESERVED_NAMES: ReadonlySet<string>;

/**
 * Check if a filename is a Windows reserved device name.
 *
 * This check is case-insensitive and works with or without file extensions.
 *
 * @param filename - The filename to check (with or without path, with or without extension)
 * @returns True if the filename is a Windows reserved name, false otherwise
 */
export function isWindowsReservedName(filename: string): boolean;

/**
 * Sanitize a filename by replacing Windows reserved names with a safe alternative.
 *
 * If the filename is a reserved name, returns the fallback.
 * If the filename is valid, returns the original filename unchanged.
 *
 * @param filename - The original filename to sanitize
 * @param fallback - The fallback filename to use if original is reserved
 * @returns The safe filename (original if valid, fallback if reserved)
 */
export function sanitizeWindowsFilename(
  filename: string,
  fallback: string
): string;

/**
 * Get a descriptive message for why a filename is invalid.
 *
 * @param filename - The filename to check
 * @returns Error message if invalid, null if valid
 */
export function getReservedNameError(filename: string): string | null;
