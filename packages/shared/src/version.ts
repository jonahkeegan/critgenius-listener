/**
 * @fileoverview Version information for CritGenius Shared package
 */

// Version from package.json (this would be updated during build)
export const version = '0.1.0';

/**
 * Get comprehensive version information
 */
export function getVersionInfo(): {
  version: string;
  buildTime: string;
  nodeVersion: string;
} {
  return {
    version,
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
  };
}
