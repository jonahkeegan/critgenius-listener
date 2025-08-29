/**
 * @fileoverview Tests for version utilities
 */

import { describe, it, expect } from 'vitest';
import { version, getVersionInfo } from './version.js';

describe('Version utilities', () => {
  it('should export a valid version', () => {
    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('should return comprehensive version info', () => {
    const versionInfo = getVersionInfo();

    expect(versionInfo).toBeDefined();
    expect(versionInfo.version).toBe(version);
    expect(versionInfo.buildTime).toBeDefined();
    expect(versionInfo.nodeVersion).toBeDefined();

    // Validate ISO date format
    expect(new Date(versionInfo.buildTime).toISOString()).toBe(
      versionInfo.buildTime
    );

    // Validate Node.js version format
    expect(versionInfo.nodeVersion).toMatch(/^v\d+\.\d+\.\d+/);
  });
});
