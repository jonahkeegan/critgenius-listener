import { z } from 'zod';

/**
 * CritGenius Listener Environment Configuration Schema
 *
 * This file defines the complete schema for environment variables across all environments.
 * It provides runtime validation, TypeScript types, and categorized organization.
 */

// ===========================================
// Base Schema Definitions
// ===========================================

const nodeEnvSchema = z
  .enum(['development', 'staging', 'production', 'test'])
  .default('development');
const portSchema = z.coerce.number().int().min(1000).max(65535);
const urlSchema = z.string().url();
const booleanSchema = z.coerce.boolean();
const nonEmptyStringSchema = z.string().min(1);
const optionalStringSchema = z.string().optional();

// ===========================================
// Categorized Environment Variable Schemas
// ===========================================

// Node.js Environment Configuration
const nodeConfigSchema = z.object({
  NODE_ENV: nodeEnvSchema,
  PORT: portSchema.default(3100),
  CLIENT_PORT: portSchema.default(3101),
  HOST: z.string().default('localhost'),
});

// AssemblyAI Configuration
const assemblyaiConfigSchema = z.object({
  ASSEMBLYAI_API_KEY: nonEmptyStringSchema,
  ASSEMBLYAI_WEBHOOK_URL: urlSchema.optional(),
});

// Database Configuration
const databaseConfigSchema = z.object({
  MONGODB_URI: urlSchema,
  MONGODB_DB_NAME: nonEmptyStringSchema.default('critgenius-listener'),
  REDIS_URL: urlSchema,
  REDIS_PASSWORD: optionalStringSchema,
  REDIS_DB: z.coerce.number().int().min(0).max(15).default(0),
});

// CritGenius Ecosystem Configuration
const ecosystemConfigSchema = z.object({
  CRITGENIUS_ECOSYSTEM_BASE_URL: urlSchema.optional(),
  CRITGENIUS_PROMPTER_URL: urlSchema.optional(),
  CRITGENIUS_LLM_URL: urlSchema.optional(),
  CRITGENIUS_PUBLISHER_URL: urlSchema.optional(),
  CRITGENIUS_ECOSYSTEM_API_KEY: optionalStringSchema,
  CRITGENIUS_SERVICE_TOKEN: optionalStringSchema,
});

// Security Configuration
const securityConfigSchema = z.object({
  JWT_SECRET: nonEmptyStringSchema,
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3101,http://localhost:3000'),
  CSP_ENABLED: booleanSchema.default(true),
  HELMET_ENABLED: booleanSchema.default(true),
  RATE_LIMIT_ENABLED: booleanSchema.default(true),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().default(100),
});

// Audio Processing Configuration
const audioConfigSchema = z.object({
  MAX_AUDIO_FILE_SIZE: z.coerce.number().int().default(52428800), // 50MB
  MAX_AUDIO_DURATION: z.coerce.number().int().default(3600), // 1 hour
  SUPPORTED_AUDIO_FORMATS: z.string().default('wav,mp3,m4a,flac,ogg'),
});

// Session Configuration
const sessionConfigSchema = z.object({
  SESSION_TIMEOUT: z.coerce.number().int().default(60), // minutes
  MAX_CONCURRENT_SESSIONS: z.coerce.number().int().default(10),
});

// Export Configuration
const exportConfigSchema = z.object({
  EXPORT_TEMP_DIR: z.string().default('./temp-exports'),
  EXPORT_MAX_SIZE: z.coerce.number().int().default(104857600), // 100MB
});

// Data Retention Configuration
const dataRetentionConfigSchema = z.object({
  AUTO_CLEANUP_ENABLED: booleanSchema.default(true),
  CLEANUP_INTERVAL_HOURS: z.coerce.number().int().default(24),
  DEFAULT_RETENTION_DAYS: z.coerce.number().int().default(30),
});

// Privacy Configuration
const privacyConfigSchema = z.object({
  GDPR_ENABLED: booleanSchema.default(true),
  DATA_ANONYMIZATION_ENABLED: booleanSchema.default(true),
  CONSENT_REQUIRED: booleanSchema.default(true),
});

// Logging Configuration
const loggingConfigSchema = z.object({
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
  LOG_FILE_PATH: z.string().default('./logs/app.log'),
});

// Performance Configuration
const performanceConfigSchema = z.object({
  WS_HEARTBEAT_INTERVAL: z.coerce.number().int().default(30000),
  WS_MAX_CONNECTIONS: z.coerce.number().int().default(100),
  CACHE_TTL: z.coerce.number().int().default(300),
  CACHE_MAX_SIZE: z.coerce.number().int().default(1000),
});

// Monitoring Configuration
const monitoringConfigSchema = z.object({
  HEALTH_CHECK_ENABLED: booleanSchema.default(true),
  METRICS_ENABLED: booleanSchema.default(true),
  SLACK_WEBHOOK_URL: optionalStringSchema,
  DISCORD_WEBHOOK_URL: optionalStringSchema,
});

// Development Configuration
const developmentConfigSchema = z.object({
  DEBUG: optionalStringSchema,
  DEBUG_SQL: booleanSchema.default(false),
  DEBUG_REDIS: booleanSchema.default(false),
  HOT_RELOAD: booleanSchema.default(true),
  WATCH_FILES: booleanSchema.default(true),
});

// Testing Configuration
const testingConfigSchema = z.object({
  TEST_MONGODB_URI: urlSchema.optional(),
  TEST_REDIS_URL: urlSchema.optional(),
  MOCK_ASSEMBLYAI: booleanSchema.default(false),
  MOCK_ECOSYSTEM_SERVICES: booleanSchema.default(false),
});

// Production Configuration
const productionConfigSchema = z.object({
  SSL_ENABLED: booleanSchema.default(false),
  SSL_CERT_PATH: optionalStringSchema,
  SSL_KEY_PATH: optionalStringSchema,
  CSP_REPORT_URI: z.string().default('/api/csp-report'),
});

// Client (Browser) Configuration
// These are server-provided values that may be exposed to the client build. They are
// intentionally optional so that sensible defaults can be derived from HOST/PORT when absent.
// Never place secrets here – this list is for PUBLIC values only.
const clientConfigSchema = z.object({
  CLIENT_API_BASE_URL: urlSchema.optional(),
  CLIENT_SOCKET_URL: urlSchema.optional(),
  // Comma separated feature flags (e.g. "new-ui,debug-panels") – parsed client-side
  CLIENT_FEATURE_FLAGS: z.string().optional(),
});

// ===========================================
// Complete Environment Schema
// ===========================================

export const environmentSchema = z.object({
  // Core configuration (always required)
  ...nodeConfigSchema.shape,
  ...assemblyaiConfigSchema.shape,
  ...databaseConfigSchema.shape,
  ...securityConfigSchema.shape,
  ...audioConfigSchema.shape,
  ...sessionConfigSchema.shape,
  ...exportConfigSchema.shape,
  ...dataRetentionConfigSchema.shape,
  ...privacyConfigSchema.shape,
  ...loggingConfigSchema.shape,
  ...performanceConfigSchema.shape,
  ...monitoringConfigSchema.shape,

  // Optional configurations (environment-specific)
  ...ecosystemConfigSchema.shape,
  ...developmentConfigSchema.shape,
  ...testingConfigSchema.shape,
  ...productionConfigSchema.shape,
  ...clientConfigSchema.shape,
});

// ===========================================
// Environment-Specific Schemas
// ===========================================

// Development Environment Schema
export const developmentEnvironmentSchema = environmentSchema.extend({
  NODE_ENV: z.literal('development'),
  DEBUG: z.string().default('critgenius:*'),
  HOT_RELOAD: z.literal(true),
  WATCH_FILES: z.literal(true),
  // Less strict requirements for development
  JWT_SECRET: z.string().default('dev-jwt-secret-change-in-production'),
  MONGODB_URI: z
    .string()
    .default('mongodb://localhost:27017/critgenius-listener'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
});

// Staging Environment Schema
export const stagingEnvironmentSchema = environmentSchema.extend({
  NODE_ENV: z.literal('staging'),
  // Stricter security requirements for staging
  JWT_SECRET: nonEmptyStringSchema,
  SSL_ENABLED: booleanSchema.default(true),
  METRICS_ENABLED: z.literal(true),
  HEALTH_CHECK_ENABLED: z.literal(true),
});

// Production Environment Schema
export const productionEnvironmentSchema = environmentSchema.extend({
  NODE_ENV: z.literal('production'),
  // Strictest requirements for production
  JWT_SECRET: z.string().min(32), // Require strong JWT secret
  SSL_ENABLED: z.literal(true),
  SSL_CERT_PATH: nonEmptyStringSchema,
  SSL_KEY_PATH: nonEmptyStringSchema,
  HELMET_ENABLED: z.literal(true),
  CSP_ENABLED: z.literal(true),
  RATE_LIMIT_ENABLED: z.literal(true),
  METRICS_ENABLED: z.literal(true),
  HEALTH_CHECK_ENABLED: z.literal(true),
  // Require production databases
  MONGODB_URI: z
    .string()
    .refine(uri => uri.includes('mongodb+srv://') || uri.includes('ssl=true'), {
      message: 'Production MongoDB must use SSL/TLS connection',
    }),
  REDIS_URL: z.string().refine(uri => uri.startsWith('rediss://'), {
    message: 'Production Redis must use SSL/TLS connection',
  }),
});

// Test Environment Schema
export const testEnvironmentSchema = environmentSchema.extend({
  NODE_ENV: z.literal('test'),
  // Test-specific overrides
  TEST_MONGODB_URI: z
    .string()
    .default('mongodb://localhost:27017/critgenius-listener-test'),
  TEST_REDIS_URL: z.string().default('redis://localhost:6379/1'),
  MOCK_ASSEMBLYAI: booleanSchema.default(true),
  MOCK_ECOSYSTEM_SERVICES: booleanSchema.default(true),
  LOG_LEVEL: z.literal('warn'), // Reduce test noise
});

// ===========================================
// TypeScript Types
// ===========================================

export type EnvironmentConfig = z.infer<typeof environmentSchema>;
export type DevelopmentConfig = z.infer<typeof developmentEnvironmentSchema>;
export type StagingConfig = z.infer<typeof stagingEnvironmentSchema>;
export type ProductionConfig = z.infer<typeof productionEnvironmentSchema>;
export type TestConfig = z.infer<typeof testEnvironmentSchema>;

// ===========================================
// Environment Category Types
// ===========================================

export type NodeConfig = z.infer<typeof nodeConfigSchema>;
export type AssemblyAIConfig = z.infer<typeof assemblyaiConfigSchema>;
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type SecurityConfig = z.infer<typeof securityConfigSchema>;
export type AudioConfig = z.infer<typeof audioConfigSchema>;
export type SessionConfig = z.infer<typeof sessionConfigSchema>;
export type ExportConfig = z.infer<typeof exportConfigSchema>;
export type DataRetentionConfig = z.infer<typeof dataRetentionConfigSchema>;
export type PrivacyConfig = z.infer<typeof privacyConfigSchema>;
export type LoggingConfig = z.infer<typeof loggingConfigSchema>;
export type PerformanceConfig = z.infer<typeof performanceConfigSchema>;
export type MonitoringConfig = z.infer<typeof monitoringConfigSchema>;

// ===========================================
// Schema Selection Helper
// ===========================================

export function getSchemaForEnvironment(env: string) {
  switch (env) {
    case 'development':
      return developmentEnvironmentSchema;
    case 'staging':
      return stagingEnvironmentSchema;
    case 'production':
      return productionEnvironmentSchema;
    case 'test':
      return testEnvironmentSchema;
    default:
      return environmentSchema;
  }
}

// ===========================================
// Validation Categories
// ===========================================

export const schemaCategories = {
  node: nodeConfigSchema,
  assemblyai: assemblyaiConfigSchema,
  database: databaseConfigSchema,
  ecosystem: ecosystemConfigSchema,
  security: securityConfigSchema,
  audio: audioConfigSchema,
  session: sessionConfigSchema,
  export: exportConfigSchema,
  dataRetention: dataRetentionConfigSchema,
  privacy: privacyConfigSchema,
  logging: loggingConfigSchema,
  performance: performanceConfigSchema,
  monitoring: monitoringConfigSchema,
  development: developmentConfigSchema,
  testing: testingConfigSchema,
  production: productionConfigSchema,
  client: clientConfigSchema,
} as const;

export type SchemaCategory = keyof typeof schemaCategories;
