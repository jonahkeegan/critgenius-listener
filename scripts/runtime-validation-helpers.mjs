/**
 * Runtime Validation Helpers
 *
 * Lightweight utility functions for validating configuration at application startup.
 * These helpers provide zero-maintenance validation by failing fast with clear error
 * messages when configuration is invalid.
 * 
 * @module runtime-validation-helpers
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Validates configuration at runtime with actionable error messages
 * 
 * @param {string} configPath - Path to config file (relative to project root)
 * @param {function(any): {valid: boolean, errors?: string[], fix?: string}} validator - Validation function
 * @throws {Error} with descriptive message if validation fails
 * @returns {any} The loaded configuration if valid
 * 
 * @example
 * validateConfigAtRuntime('config/my-config.json', (config) => {
 *   if (!config.apiEndpoint) {
 *     return {
 *       valid: false,
 *       errors: ['Missing required field: apiEndpoint'],
 *       fix: 'Add "apiEndpoint" to config/my-config.json'
 *     };
 *   }
 *   return { valid: true };
 * });
 */
export function validateConfigAtRuntime(configPath, validator) {
  const absolutePath = resolve(configPath);
  
  if (!existsSync(absolutePath)) {
    const error = new Error(
      `[Runtime Validation] Configuration file not found: ${configPath}\n\n` +
      `Fix: Create the configuration file at ${absolutePath}`
    );
    console.error(error.message);
    process.exit(1);
  }
  
  let config;
  try {
    const content = readFileSync(absolutePath, 'utf8');
    config = JSON.parse(content);
  } catch (parseError) {
    const error = new Error(
      `[Runtime Validation] Failed to parse configuration file: ${configPath}\n` +
      `Error: ${parseError.message}\n\n` +
      `Fix: Ensure ${configPath} contains valid JSON`
    );
    console.error(error.message);
    process.exit(1);
  }
  
  try {
    const result = validator(config);
    
    if (!result.valid) {
      const errorList = result.errors?.length 
        ? result.errors.map(e => `  - ${e}`).join('\n')
        : '  - Validation failed (no details provided)';
      
      const fix = result.fix 
        ? `\n\nFix: ${result.fix}`
        : '';
      
      const error = new Error(
        `[Runtime Validation] Configuration validation failed for ${configPath}:\n` +
        errorList +
        fix
      );
      console.error(error.message);
      process.exit(1);
    }
    
    return config;
  } catch (validatorError) {
    const error = new Error(
      `[Runtime Validation] Validator function threw an error for ${configPath}:\n` +
      `  ${validatorError.message}\n\n` +
      `Fix: Check the validator function implementation`
    );
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Asserts that required environment variables are present and non-empty
 * 
 * @param {string[]} requiredVars - Array of required environment variable names
 * @param {Object} options - Optional configuration
 * @param {string} [options.exampleFile='.env.example'] - Path to example env file
 * @throws {Error} if any required variable is missing or empty
 * 
 * @example
 * assertRequiredEnvVars(['DATABASE_URL', 'JWT_SECRET', 'API_KEY']);
 * 
 * @example
 * assertRequiredEnvVars(
 *   ['DATABASE_URL', 'JWT_SECRET'], 
 *   { exampleFile: '.env.production.example' }
 * );
 */
export function assertRequiredEnvVars(requiredVars, options = {}) {
  const { exampleFile = '.env.example' } = options;
  
  if (!Array.isArray(requiredVars) || requiredVars.length === 0) {
    console.warn('[Runtime Validation] assertRequiredEnvVars called with no variables to check');
    return;
  }
  
  const missing = requiredVars.filter(varName => {
    const value = process.env[varName];
    return value === undefined || value === '';
  });
  
  if (missing.length > 0) {
    const error = new Error(
      `[Runtime Validation] Missing required environment variables:\n` +
      missing.map(v => `  - ${v}`).join('\n') +
      `\n\nFix: Set these variables in your environment or .env file\n` +
      `Refer to ${exampleFile} for required variables`
    );
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Detects configuration drift between multiple related config files
 * 
 * @param {Array<{path: string, key: string}>} configs - Array of config file paths and keys to check
 * @param {function(any[]): {hasDrift: boolean, message?: string}} driftDetector - Function to detect drift
 * @throws {Error} if drift is detected
 * 
 * @example
 * detectConfigDrift(
 *   [
 *     { path: 'packages/client/tsconfig.json', key: 'compilerOptions.target' },
 *     { path: 'packages/server/tsconfig.json', key: 'compilerOptions.target' }
 *   ],
 *   (values) => {
 *     const allSame = values.every(v => v === values[0]);
 *     return {
 *       hasDrift: !allSame,
 *       message: allSame ? null : 'TypeScript target versions must be consistent'
 *     };
 *   }
 * );
 */
export function detectConfigDrift(configs, driftDetector) {
  if (!Array.isArray(configs) || configs.length < 2) {
    console.warn('[Runtime Validation] detectConfigDrift requires at least 2 configs to compare');
    return;
  }
  
  const values = [];
  const loadedConfigs = [];
  
  for (const { path: configPath, key } of configs) {
    const absolutePath = resolve(configPath);
    
    if (!existsSync(absolutePath)) {
      const error = new Error(
        `[Runtime Validation] Configuration file not found: ${configPath}\n\n` +
        `Fix: Ensure all configuration files exist before checking for drift`
      );
      console.error(error.message);
      process.exit(1);
    }
    
    try {
      const content = readFileSync(absolutePath, 'utf8');
      const config = JSON.parse(content);
      loadedConfigs.push({ path: configPath, config });
      
      // Navigate to nested key (e.g., 'compilerOptions.target')
      const keys = key.split('.');
      let value = config;
      for (const k of keys) {
        value = value?.[k];
      }
      
      values.push(value);
    } catch (error) {
      const err = new Error(
        `[Runtime Validation] Failed to load or parse ${configPath}:\n` +
        `  ${error.message}\n\n` +
        `Fix: Ensure ${configPath} contains valid JSON`
      );
      console.error(err.message);
      process.exit(1);
    }
  }
  
  try {
    const result = driftDetector(values);
    
    if (result.hasDrift) {
      const configList = configs.map(c => `  - ${c.path} (${c.key})`).join('\n');
      const message = result.message || 'Configuration drift detected';
      
      const error = new Error(
        `[Runtime Validation] ${message}\n\n` +
        `Affected configurations:\n${configList}\n\n` +
        `Fix: Ensure these configurations are consistent across packages`
      );
      console.error(error.message);
      process.exit(1);
    }
  } catch (detectorError) {
    const error = new Error(
      `[Runtime Validation] Drift detector function threw an error:\n` +
      `  ${detectorError.message}\n\n` +
      `Fix: Check the drift detector function implementation`
    );
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Validates that required files exist at specified paths
 * 
 * @param {string[]} filePaths - Array of file paths that must exist
 * @param {Object} options - Optional configuration
 * @param {string} [options.context] - Context description for error message
 * @throws {Error} if any required file is missing
 * 
 * @example
 * assertRequiredFiles(
 *   ['package.json', 'tsconfig.json', 'vitest.config.ts'],
 *   { context: 'project root' }
 * );
 */
export function assertRequiredFiles(filePaths, options = {}) {
  const { context = 'project' } = options;
  
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    console.warn('[Runtime Validation] assertRequiredFiles called with no files to check');
    return;
  }
  
  const missing = filePaths.filter(filePath => {
    const absolutePath = resolve(filePath);
    return !existsSync(absolutePath);
  });
  
  if (missing.length > 0) {
    const error = new Error(
      `[Runtime Validation] Missing required files for ${context}:\n` +
      missing.map(f => `  - ${f}`).join('\n') +
      `\n\nFix: Ensure these files exist before running the application`
    );
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Validates that specified files do NOT exist (useful for ensuring clean state)
 * 
 * @param {string[]} filePaths - Array of file paths that should not exist
 * @param {Object} options - Optional configuration
 * @param {string} [options.reason] - Reason why these files shouldn't exist
 * @throws {Error} if any prohibited file exists
 * 
 * @example
 * assertFilesNotExist(
 *   ['packages/client/.eslintrc', 'packages/server/.eslintrc'],
 *   { reason: 'Packages must use root-level ESLint config only' }
 * );
 */
export function assertFilesNotExist(filePaths, options = {}) {
  const { reason = 'these files should not exist' } = options;
  
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    console.warn('[Runtime Validation] assertFilesNotExist called with no files to check');
    return;
  }
  
  const existing = filePaths.filter(filePath => {
    const absolutePath = resolve(filePath);
    return existsSync(absolutePath);
  });
  
  if (existing.length > 0) {
    const error = new Error(
      `[Runtime Validation] Found prohibited files (${reason}):\n` +
      existing.map(f => `  - ${f}`).join('\n') +
      `\n\nFix: Remove these files to maintain proper configuration structure`
    );
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Creates a custom validation helper with specific error context
 * 
 * @param {string} validationName - Name of the validation for error messages
 * @returns {function(boolean, string, string): void} Validation function
 * 
 * @example
 * const validateBuildConfig = createValidator('Build Configuration');
 * validateBuildConfig(
 *   config.minify === true,
 *   'Minification must be enabled in production',
 *   'Set config.minify = true'
 * );
 */
export function createValidator(validationName) {
  return function validate(condition, message, fix) {
    if (!condition) {
      const error = new Error(
        `[Runtime Validation] ${validationName} validation failed:\n` +
        `  ${message}\n\n` +
        `Fix: ${fix}`
      );
      console.error(error.message);
      process.exit(1);
    }
  };
}
