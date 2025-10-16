'use strict';

const WINDOWS_RESERVED_NAMES = new Set([
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

function getBaseName(filepath) {
  if (typeof filepath !== 'string') {
    return '';
  }

  const normalized = filepath.replace(/\\+/g, '/');
  const segments = normalized.split('/');
  return segments[segments.length - 1] ?? '';
}

function normalizeCandidate(filename) {
  if (!filename || typeof filename !== 'string') {
    return null;
  }

  const baseName = getBaseName(filename).trim();
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

function isWindowsReservedName(filename) {
  const candidate = normalizeCandidate(filename);
  if (!candidate) {
    return false;
  }

  return WINDOWS_RESERVED_NAMES.has(candidate.normalized);
}

function sanitizeWindowsFilename(filename, fallback) {
  if (isWindowsReservedName(filename)) {
    return fallback;
  }
  return filename;
}

function getReservedNameError(filename) {
  const candidate = normalizeCandidate(filename);
  if (!candidate) {
    return null;
  }

  if (!WINDOWS_RESERVED_NAMES.has(candidate.normalized)) {
    return null;
  }

  return `"${candidate.display}" is a Windows reserved device name and cannot be used as a filename`;
}

module.exports = {
  WINDOWS_RESERVED_NAMES,
  isWindowsReservedName,
  sanitizeWindowsFilename,
  getReservedNameError,
};
