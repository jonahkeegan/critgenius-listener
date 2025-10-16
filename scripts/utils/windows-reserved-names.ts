/**
 * Windows Reserved Names Utility
 *
 * Provides validation and sanitization for Windows reserved device names.
 * These names cannot be used as filenames on Windows systems and will cause
 * file system errors if attempted.
 *
 * Reserved names include:
 * - Device names: CON, PRN, AUX, NUL
 * - Serial ports: COM1-COM9
 * - Parallel ports: LPT1-LPT9
 *
 * These names are reserved even with file extensions (e.g., "NUL.txt" is invalid)
 * and are case-insensitive (e.g., "nul", "NUL", "Nul" are all invalid).
 */

import { basename } from 'path';

/**
 * Set of Windows reserved device names (case-insensitive)
 */
export const WINDOWS_RESERVED_NAMES: ReadonlySet<string> = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]);

/**
 * Check if a filename is a Windows reserved device name.
 *
 * This check is case-insensitive and works with or without file extensions.
 * For example:
 * - isWindowsReservedName('nul') → true
 * - isWindowsReservedName('NUL.txt') → true
 * - isWindowsReservedName('COM1') → true
 * - isWindowsReservedName('myfile.txt') → false
 *
 * @param filename - The filename to check (with or without path, with or without extension)
 * @returns True if the filename is a Windows reserved name, false otherwise
 *
 * @example
 * isWindowsReservedName('nul'); // true
 * isWindowsReservedName('NUL.txt'); // true
 * isWindowsReservedName('data.json'); // false
 */
function normalizeCandidate(
  filename: string
): { normalized: string; display: string } | null {
  if (!filename || typeof filename !== 'string') {
    return null;
  }

  const baseName = basename(filename).trim();
  if (!baseName) {
    return null;
  }

  const withoutTrailingDots = baseName.replace(/[.\s]+$/u, '');
  const [primary] = withoutTrailingDots.split('.');
  const candidate = (primary ?? withoutTrailingDots).trim();

  if (!candidate) {
    return null;
  }

  return {
    normalized: candidate.toUpperCase(),
    display: candidate,
  };
}

export function isWindowsReservedName(filename: string): boolean {
  const candidate = normalizeCandidate(filename);
  if (!candidate) {
    return false;
  }

  return WINDOWS_RESERVED_NAMES.has(candidate.normalized);
}

/**
 * Sanitize a filename by replacing Windows reserved names with a safe alternative.
 *
 * If the filename is a reserved name, returns the fallback.
 * If the filename is valid, returns the original filename unchanged.
 *
 * @param filename - The original filename to sanitize
 * @param fallback - The fallback filename to use if original is reserved
 * @returns The safe filename (original if valid, fallback if reserved)
 *
 * @example
 * sanitizeWindowsFilename('nul', 'output.txt'); // 'output.txt'
 * sanitizeWindowsFilename('data.json', 'output.txt'); // 'data.json'
 * sanitizeWindowsFilename('COM1.log', 'serial.log'); // 'serial.log'
 */
export function sanitizeWindowsFilename(
  filename: string,
  fallback: string
): string {
  if (isWindowsReservedName(filename)) {
    return fallback;
  }
  return filename;
}

/**
 * Get a descriptive message for why a filename is invalid.
 *
 * @param filename - The filename to check
 * @returns Error message if invalid, null if valid
 *
 * @example
 * getReservedNameError('nul');
 * // '"nul" is a Windows reserved device name and cannot be used as a filename'
 * getReservedNameError('data.json'); // null
 */
export function getReservedNameError(filename: string): string | null {
  const candidate = normalizeCandidate(filename);
  if (!candidate) {
    return null;
  }

  if (!WINDOWS_RESERVED_NAMES.has(candidate.normalized)) {
    return null;
  }

  return `"${candidate.display}" is a Windows reserved device name and cannot be used as a filename`;
}
