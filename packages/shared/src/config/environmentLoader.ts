import { z } from 'zod';
import {
  getSchemaForEnvironment,
  type EnvironmentConfig,
  type DevelopmentConfig,
  type StagingConfig,
  type ProductionConfig,
  type TestConfig,
} from './environment.js';

/**
 * CritGenius Listener Environment Loader
 *
 * This utility loads and validates environment variables at runtime,
 * providing type-safe access to configuration across all packages.
 */

// ===========================================
// Error Types
// ===========================================

export class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.ZodIssue[],
    public readonly environment: string
  ) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

export class EnvironmentLoadError extends Error {
  public readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'EnvironmentLoadError';
    this.cause = cause;
  }
}

// ===========================================
// Environment Loading Functions
// ===========================================

/**
 * Load and validate environment variables using Node.js process.env
 */
function loadProcessEnv(): Record<string, string> {
  if (typeof process === 'undefined' || !process.env) {
    throw new EnvironmentLoadError(
      'Environment variables are not available. Ensure this code runs in a Node.js environment.'
    );
  }

  // Convert all values to strings, filtering out undefined values
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value !== undefined) {
      env[key] = value;
    }
  }

  return env;
}

/**
 * Create detailed error message for validation failures
 */
function createValidationErrorMessage(
  issues: z.ZodIssue[],
  environment: string
): string {
  const errorsByPath = new Map<string, z.ZodIssue[]>();

  // Group errors by path
  issues.forEach(issue => {
    const path = issue.path.join('.');
    if (!errorsByPath.has(path)) {
      errorsByPath.set(path, []);
    }
    errorsByPath.get(path)!.push(issue);
  });

  const errorMessages = Array.from(errorsByPath.entries()).map(
    ([path, pathIssues]) => {
      const messages = pathIssues.map(formatZodIssue);
      return `  ${path}: ${messages.join(', ')}`;
    }
  );

  return [
    `Environment validation failed for ${environment} environment:`,
    ...errorMessages,
    '',
    'Please check your .env file and ensure all required variables are properly set.',
    'Refer to .env.example for the correct format and required variables.',
  ].join('\n');
}

/**
 * Format a Zod issue with strict typing (no `any`).
 * We only handle codes used by our schemas to avoid version-specific types.
 */
function formatZodIssue(issue: z.ZodIssue): string {
  // Use Zod-provided message to avoid relying on internal issue shape
  return issue.message || `Invalid value (${issue.code})`;
}

/**
 * Validate environment variables against schema
 */
function validateEnvironment<T>(
  env: Record<string, string>,
  schema: z.ZodSchema<T>,
  environment: string
): T {
  try {
    return schema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message = createValidationErrorMessage(error.issues, environment);
      throw new EnvironmentValidationError(message, error.issues, environment);
    }
    throw new EnvironmentLoadError(
      `Unexpected error during environment validation: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
}

// ===========================================
// Main Environment Loading API
// ===========================================

/**
 * Load and validate environment configuration
 * Automatically detects environment from NODE_ENV and applies appropriate schema
 */
export function loadEnvironment(): EnvironmentConfig {
  const env = loadProcessEnv();
  const nodeEnv = env.NODE_ENV || 'development';
  const schema = getSchemaForEnvironment(nodeEnv);

  return validateEnvironment(env, schema, nodeEnv);
}

/**
 * Load development environment configuration
 */
export function loadDevelopmentEnvironment(): DevelopmentConfig {
  const env = loadProcessEnv();
  const schema = getSchemaForEnvironment('development');
  return validateEnvironment(env, schema, 'development') as DevelopmentConfig;
}

/**
 * Load staging environment configuration
 */
export function loadStagingEnvironment(): StagingConfig {
  const env = loadProcessEnv();
  const schema = getSchemaForEnvironment('staging');
  return validateEnvironment(env, schema, 'staging') as StagingConfig;
}

/**
 * Load production environment configuration
 */
export function loadProductionEnvironment(): ProductionConfig {
  const env = loadProcessEnv();
  const schema = getSchemaForEnvironment('production');
  return validateEnvironment(env, schema, 'production') as ProductionConfig;
}

/**
 * Load test environment configuration
 */
export function loadTestEnvironment(): TestConfig {
  const env = loadProcessEnv();
  const schema = getSchemaForEnvironment('test');
  return validateEnvironment(env, schema, 'test') as TestConfig;
}

/**
 * Validate environment variables without loading
 * Useful for CI/CD validation or configuration checking
 */
export function validateEnvironmentVariables(
  env?: Record<string, string>
): { valid: true } | { valid: false; errors: z.ZodIssue[]; message: string } {
  try {
    const envVars = env || loadProcessEnv();
    const nodeEnv = envVars.NODE_ENV || 'development';
    const schema = getSchemaForEnvironment(nodeEnv);

    schema.parse(envVars);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const nodeEnv = (env || loadProcessEnv()).NODE_ENV || 'development';
      const message = createValidationErrorMessage(error.issues, nodeEnv);
      return {
        valid: false,
        errors: error.issues,
        message,
      };
    }
    throw error;
  }
}

// ===========================================
// Environment Checking Utilities
// ===========================================

/**
 * Check if running in development environment
 */
export function isDevelopment(): boolean {
  return (process.env.NODE_ENV || 'development') === 'development';
}

/**
 * Check if running in staging environment
 */
export function isStaging(): boolean {
  return process.env.NODE_ENV === 'staging';
}

/**
 * Check if running in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

// ===========================================
// Configuration Helpers
// ===========================================

/**
 * Get current environment name
 */
export function getCurrentEnvironment(): string {
  return process.env.NODE_ENV || 'development';
}

/**
 * Check if environment variable exists
 */
export function hasEnvironmentVariable(key: string): boolean {
  return process.env[key] !== undefined;
}

/**
 * Get environment variable with fallback
 */
export function getEnvironmentVariable(
  key: string,
  fallback?: string
): string | undefined {
  return process.env[key] || fallback;
}

/**
 * Require environment variable (throws if missing)
 */
export function requireEnvironmentVariable(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new EnvironmentLoadError(
      `Required environment variable ${key} is missing`
    );
  }
  return value;
}

// ===========================================
// Startup Validation
// ===========================================

/**
 * Validate environment on startup with detailed logging
 * Call this during application initialization
 */
export function validateEnvironmentOnStartup(): EnvironmentConfig {
  const startTime = Date.now();

  try {
    console.log('🔍 Validating environment configuration...');

    const config = loadEnvironment();
    const duration = Date.now() - startTime;

    console.log(`✅ Environment validation successful (${duration}ms)`);
    console.log(`📍 Environment: ${config.NODE_ENV}`);
    console.log(
      `🔧 Configuration loaded with ${Object.keys(config).length} variables`
    );

    // Log some key configuration details (without sensitive data)
    console.log(`🌐 Server will run on: ${config.HOST}:${config.PORT}`);
    console.log(`📊 Logging level: ${config.LOG_LEVEL}`);
    console.log(
      `🔒 Security features: ${config.HELMET_ENABLED ? '✓' : '✗'} Helmet, ${config.CSP_ENABLED ? '✓' : '✗'} CSP`
    );

    return config;
  } catch (error) {
    console.error('❌ Environment validation failed!');

    if (error instanceof EnvironmentValidationError) {
      console.error('\n' + error.message + '\n');

      // In development, show more detailed error information
      if (isDevelopment()) {
        console.error('🔧 Development Mode: Detailed validation errors:');
        error.issues.forEach((issue, index) => {
          console.error(
            `  ${index + 1}. ${issue.path.join('.')}: ${issue.message}`
          );
        });
      }
    } else {
      console.error(error instanceof Error ? error.message : String(error));
    }

    console.error('\n💡 Quick fixes:');
    console.error('  1. Copy .env.example to .env');
    console.error('  2. Fill in all required environment variables');
    console.error('  3. Check variable formats (URLs, numbers, booleans)');
    console.error('  4. Ensure NODE_ENV is set correctly\n');

    throw error;
  }
}

// ===========================================
// Default Export
// ===========================================

export default {
  loadEnvironment,
  loadDevelopmentEnvironment,
  loadStagingEnvironment,
  loadProductionEnvironment,
  loadTestEnvironment,
  validateEnvironmentVariables,
  validateEnvironmentOnStartup,
  isDevelopment,
  isStaging,
  isProduction,
  isTest,
  getCurrentEnvironment,
  hasEnvironmentVariable,
  getEnvironmentVariable,
  requireEnvironmentVariable,
  EnvironmentValidationError,
  EnvironmentLoadError,
};
