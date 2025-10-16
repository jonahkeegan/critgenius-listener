import { describe, expect, it } from 'vitest';
import {
  WINDOWS_RESERVED_NAMES,
  isWindowsReservedName,
  sanitizeWindowsFilename,
  getReservedNameError,
} from '../../scripts/utils/windows-reserved-names.js';

describe('Windows Reserved Names Validation', () => {
  describe('WINDOWS_RESERVED_NAMES constant', () => {
    it('should include all device names', () => {
      expect(WINDOWS_RESERVED_NAMES.has('CON')).toBe(true);
      expect(WINDOWS_RESERVED_NAMES.has('PRN')).toBe(true);
      expect(WINDOWS_RESERVED_NAMES.has('AUX')).toBe(true);
      expect(WINDOWS_RESERVED_NAMES.has('NUL')).toBe(true);
    });

    it('should include all serial ports COM1-COM9', () => {
      for (let i = 1; i <= 9; i++) {
        expect(WINDOWS_RESERVED_NAMES.has(`COM${i}`)).toBe(true);
      }
    });

    it('should include all parallel ports LPT1-LPT9', () => {
      for (let i = 1; i <= 9; i++) {
        expect(WINDOWS_RESERVED_NAMES.has(`LPT${i}`)).toBe(true);
      }
    });

    it('should be immutable (ReadonlySet)', () => {
      // TypeScript enforces ReadonlySet, but verify it's a Set
      expect(WINDOWS_RESERVED_NAMES).toBeInstanceOf(Set);
      expect(WINDOWS_RESERVED_NAMES.size).toBe(22);
    });
  });

  describe('isWindowsReservedName()', () => {
    describe('reserved device names', () => {
      it('should detect NUL (case variations)', () => {
        expect(isWindowsReservedName('nul')).toBe(true);
        expect(isWindowsReservedName('NUL')).toBe(true);
        expect(isWindowsReservedName('Nul')).toBe(true);
        expect(isWindowsReservedName('nUl')).toBe(true);
      });

      it('should detect CON (case variations)', () => {
        expect(isWindowsReservedName('con')).toBe(true);
        expect(isWindowsReservedName('CON')).toBe(true);
        expect(isWindowsReservedName('Con')).toBe(true);
      });

      it('should detect PRN (case variations)', () => {
        expect(isWindowsReservedName('prn')).toBe(true);
        expect(isWindowsReservedName('PRN')).toBe(true);
        expect(isWindowsReservedName('Prn')).toBe(true);
      });

      it('should detect AUX (case variations)', () => {
        expect(isWindowsReservedName('aux')).toBe(true);
        expect(isWindowsReservedName('AUX')).toBe(true);
        expect(isWindowsReservedName('Aux')).toBe(true);
      });
    });

    describe('reserved names with extensions', () => {
      it('should detect reserved names with common extensions', () => {
        expect(isWindowsReservedName('nul.txt')).toBe(true);
        expect(isWindowsReservedName('NUL.log')).toBe(true);
        expect(isWindowsReservedName('con.json')).toBe(true);
        expect(isWindowsReservedName('PRN.xml')).toBe(true);
        expect(isWindowsReservedName('aux.csv')).toBe(true);
      });

      it('should detect reserved names with multiple dots', () => {
        expect(isWindowsReservedName('nul.output.txt')).toBe(true);
        expect(isWindowsReservedName('con.test.log')).toBe(true);
      });

      it('should detect reserved names with no extension', () => {
        expect(isWindowsReservedName('nul')).toBe(true);
        expect(isWindowsReservedName('con')).toBe(true);
      });
    });

    describe('serial and parallel ports', () => {
      it('should detect all COM ports (COM1-COM9)', () => {
        for (let i = 1; i <= 9; i++) {
          expect(isWindowsReservedName(`COM${i}`)).toBe(true);
          expect(isWindowsReservedName(`com${i}`)).toBe(true);
          expect(isWindowsReservedName(`Com${i}`)).toBe(true);
        }
      });

      it('should detect all LPT ports (LPT1-LPT9)', () => {
        for (let i = 1; i <= 9; i++) {
          expect(isWindowsReservedName(`LPT${i}`)).toBe(true);
          expect(isWindowsReservedName(`lpt${i}`)).toBe(true);
          expect(isWindowsReservedName(`Lpt${i}`)).toBe(true);
        }
      });

      it('should detect COM/LPT ports with extensions', () => {
        expect(isWindowsReservedName('COM1.txt')).toBe(true);
        expect(isWindowsReservedName('lpt5.log')).toBe(true);
      });

      it('should not detect invalid port numbers', () => {
        expect(isWindowsReservedName('COM0')).toBe(false);
        expect(isWindowsReservedName('COM10')).toBe(false);
        expect(isWindowsReservedName('LPT0')).toBe(false);
        expect(isWindowsReservedName('LPT10')).toBe(false);
      });
    });

    describe('valid filenames', () => {
      it('should return false for normal filenames', () => {
        expect(isWindowsReservedName('data.txt')).toBe(false);
        expect(isWindowsReservedName('output.log')).toBe(false);
        expect(isWindowsReservedName('myfile.json')).toBe(false);
        expect(isWindowsReservedName('test-results.xml')).toBe(false);
      });

      it('should return false for filenames containing reserved words', () => {
        expect(isWindowsReservedName('console.txt')).toBe(false);
        expect(isWindowsReservedName('printer.log')).toBe(false);
        expect(isWindowsReservedName('auxiliary.json')).toBe(false);
        expect(isWindowsReservedName('null-data.txt')).toBe(false);
      });

      it('should return false for reserved words as part of filename', () => {
        expect(isWindowsReservedName('data-nul.txt')).toBe(false);
        expect(isWindowsReservedName('nul-output.log')).toBe(false);
        expect(isWindowsReservedName('my-con-file.json')).toBe(false);
      });
    });

    describe('path handling', () => {
      it('should handle absolute paths', () => {
        expect(isWindowsReservedName('C:\\temp\\nul')).toBe(true);
        expect(isWindowsReservedName('/tmp/nul')).toBe(true);
        expect(isWindowsReservedName('C:\\data\\nul.txt')).toBe(true);
      });

      it('should handle relative paths', () => {
        expect(isWindowsReservedName('./nul')).toBe(true);
        expect(isWindowsReservedName('../nul.log')).toBe(true);
        expect(isWindowsReservedName('coverage/nul')).toBe(true);
      });

      it('should handle paths with valid filenames', () => {
        expect(isWindowsReservedName('/tmp/output.txt')).toBe(false);
        expect(isWindowsReservedName('C:\\data\\results.json')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should handle empty string', () => {
        expect(isWindowsReservedName('')).toBe(false);
      });

      it('should handle null', () => {
        expect(isWindowsReservedName(null as any)).toBe(false);
      });

      it('should handle undefined', () => {
        expect(isWindowsReservedName(undefined as any)).toBe(false);
      });

      it('should handle non-string values', () => {
        expect(isWindowsReservedName(123 as any)).toBe(false);
        expect(isWindowsReservedName({} as any)).toBe(false);
        expect(isWindowsReservedName([] as any)).toBe(false);
      });

      it('should handle whitespace', () => {
        expect(isWindowsReservedName('  nul  ')).toBe(true);
        expect(isWindowsReservedName('\tnul\n')).toBe(true);
      });
    });
  });

  describe('sanitizeWindowsFilename()', () => {
    describe('reserved name replacement', () => {
      it('should replace reserved names with fallback', () => {
        expect(sanitizeWindowsFilename('nul', 'output.txt')).toBe('output.txt');
        expect(sanitizeWindowsFilename('CON', 'console.log')).toBe(
          'console.log'
        );
        expect(sanitizeWindowsFilename('PRN', 'printer.txt')).toBe(
          'printer.txt'
        );
        expect(sanitizeWindowsFilename('AUX', 'auxiliary.log')).toBe(
          'auxiliary.log'
        );
      });

      it('should replace reserved names with extensions', () => {
        expect(sanitizeWindowsFilename('nul.txt', 'output.txt')).toBe(
          'output.txt'
        );
        expect(sanitizeWindowsFilename('COM1.log', 'serial.log')).toBe(
          'serial.log'
        );
        expect(sanitizeWindowsFilename('LPT5.dat', 'parallel.dat')).toBe(
          'parallel.dat'
        );
      });

      it('should handle case-insensitive reserved names', () => {
        expect(sanitizeWindowsFilename('NUL', 'output.txt')).toBe('output.txt');
        expect(sanitizeWindowsFilename('nul', 'output.txt')).toBe('output.txt');
        expect(sanitizeWindowsFilename('Nul', 'output.txt')).toBe('output.txt');
      });
    });

    describe('valid filename preservation', () => {
      it('should preserve valid filenames', () => {
        expect(sanitizeWindowsFilename('data.txt', 'fallback.txt')).toBe(
          'data.txt'
        );
        expect(sanitizeWindowsFilename('output.log', 'fallback.log')).toBe(
          'output.log'
        );
        expect(sanitizeWindowsFilename('results.json', 'fallback.json')).toBe(
          'results.json'
        );
      });

      it('should preserve filenames containing reserved words', () => {
        expect(sanitizeWindowsFilename('console.txt', 'fallback.txt')).toBe(
          'console.txt'
        );
        expect(sanitizeWindowsFilename('data-nul.log', 'fallback.log')).toBe(
          'data-nul.log'
        );
        expect(
          sanitizeWindowsFilename('null-output.json', 'fallback.json')
        ).toBe('null-output.json');
      });
    });

    describe('fallback handling', () => {
      it('should use different fallback names', () => {
        expect(sanitizeWindowsFilename('nul', 'safe-output.txt')).toBe(
          'safe-output.txt'
        );
        expect(sanitizeWindowsFilename('nul', 'diagnostic-log.txt')).toBe(
          'diagnostic-log.txt'
        );
        expect(sanitizeWindowsFilename('nul', 'test-results.json')).toBe(
          'test-results.json'
        );
      });

      it('should handle empty fallback', () => {
        expect(sanitizeWindowsFilename('nul', '')).toBe('');
      });
    });
  });

  describe('getReservedNameError()', () => {
    describe('error messages for reserved names', () => {
      it('should return error for NUL', () => {
        const error = getReservedNameError('nul');
        expect(error).toContain('nul');
        expect(error).toContain('Windows reserved device name');
        expect(error).toContain('cannot be used as a filename');
      });

      it('should return error for other reserved names', () => {
        expect(getReservedNameError('CON')).toContain('CON');
        expect(getReservedNameError('PRN')).toContain('PRN');
        expect(getReservedNameError('AUX')).toContain('AUX');
      });

      it('should return error for COM/LPT ports', () => {
        expect(getReservedNameError('COM1')).toContain('COM1');
        expect(getReservedNameError('LPT5')).toContain('LPT5');
      });

      it('should return error for reserved names with extensions', () => {
        expect(getReservedNameError('nul.txt')).toContain('nul');
        expect(getReservedNameError('COM1.log')).toContain('COM1');
      });

      it('should preserve case in error message', () => {
        expect(getReservedNameError('nul')).toContain('nul');
        expect(getReservedNameError('NUL')).toContain('NUL');
        expect(getReservedNameError('Nul')).toContain('Nul');
      });
    });

    describe('null return for valid names', () => {
      it('should return null for valid filenames', () => {
        expect(getReservedNameError('data.txt')).toBeNull();
        expect(getReservedNameError('output.log')).toBeNull();
        expect(getReservedNameError('results.json')).toBeNull();
      });

      it('should return null for filenames containing reserved words', () => {
        expect(getReservedNameError('console.txt')).toBeNull();
        expect(getReservedNameError('data-nul.log')).toBeNull();
        expect(getReservedNameError('null-output.json')).toBeNull();
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should handle typical diagnostic logging scenario', () => {
      const userProvidedPath = 'coverage/nul';

      // Check if reserved
      expect(isWindowsReservedName(userProvidedPath)).toBe(true);

      // Get error message
      const error = getReservedNameError(userProvidedPath);
      expect(error).toBeTruthy();

      // Sanitize with fallback
      const safePath = sanitizeWindowsFilename(
        userProvidedPath,
        'coverage/diagnostic-output.txt'
      );
      expect(safePath).toBe('coverage/diagnostic-output.txt');
    });

    it('should handle environment variable scenario', () => {
      // User sets DEBUG_VITEST_PATH_OUTPUT=nul (intending /dev/null)
      const envValue = 'nul';

      if (isWindowsReservedName(envValue)) {
        // Don't create file, return undefined or safe alternative
        expect(getReservedNameError(envValue)).toBeTruthy();
      }
    });

    it('should allow valid diagnostic output paths', () => {
      const validPaths = [
        'coverage/vitest-paths.txt',
        'diagnostic-output.log',
        'test-results.json',
        './output/paths.txt',
      ];

      validPaths.forEach(path => {
        expect(isWindowsReservedName(path)).toBe(false);
        expect(getReservedNameError(path)).toBeNull();
        expect(sanitizeWindowsFilename(path, 'fallback.txt')).toBe(path);
      });
    });
  });
});
