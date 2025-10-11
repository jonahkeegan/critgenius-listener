/**
 * @fileoverview Main entry point for CritGenius Shared package
 * Exports all shared types, utilities, constants, and interfaces
 * for use across client and server applications
 */

// Export all types
export * from './types/index';

// Export all utilities
export * from './utils/index';

// Export all constants
export * from './constants/index';

// Export all interfaces
export * from './interfaces/index';

// Export version information
export { version, getVersionInfo } from './version';

// Export environment configuration and validation
export * from './config/environment';
export * from './config/environmentLoader';
export * from './config/proxyRegistry';
export * from './config/toolingVersionPolicy';

// Export AssemblyAI configuration (explicit import to avoid naming conflicts)
export {
  loadAssemblyAIConfig,
  getConfigSummary,
  sanitizeConfig,
  DEFAULT_ASSEMBLYAI_CONFIG,
  ASSEMBLYAI_ENV_VARS,
  AssemblyAIConfigError,
} from './config/assemblyai.js';

// Re-export AssemblyAI config type with alias to avoid conflict
export type { AssemblyAIConfig as AssemblyAISDKConfig } from './config/assemblyai.js';
