# Environment Configuration Guide

## Overview

The CritGenius Listener environment configuration system provides robust, type-safe management of
environment variables with validation, error handling, and environment-specific templates. This
system uses Zod for schema validation and supports development, staging, production, and test
environments.

## Features

- **Type-Safe Configuration**: Full TypeScript support with generated types
- **Runtime Validation**: Comprehensive validation with descriptive error messages
- **Environment-Specific Schemas**: Different requirements for each environment
- **Categorized Variables**: Organized into logical groups (database, security, etc.)
- **Template System**: Ready-to-use configuration templates
- **Error Handling**: Detailed validation errors with suggested fixes
- **Startup Validation**: Automatic validation during application initialization

## Quick Start

### 1. Choose Your Environment Template

Copy the appropriate template to `.env` in your project root:

```bash
# For development
cp .env.development.example .env

# For staging
cp .env.staging.example .env.staging

# For production
cp .env.production.example .env.production
```

### 2. Fill in Required Variables

Edit your `.env` file and set the required values:

```bash
# Essential variables
NODE_ENV=development
ASSEMBLYAI_API_KEY=your_actual_api_key_here
MONGODB_URI=mongodb://localhost:27017/critgenius-listener
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secure-jwt-secret-here
```

### 3. Use in Your Application

```typescript
import { loadEnvironment, validateEnvironmentOnStartup } from '@critgenius/shared';

// Validate and load configuration on startup
const config = validateEnvironmentOnStartup();

// Access configuration with full type safety
console.log(`Server starting on ${config.HOST}:${config.PORT}`);
console.log(`Database: ${config.MONGODB_URI}`);
console.log(`Environment: ${config.NODE_ENV}`);
```

## Environment Templates

### Development (.env.development.example)

Optimized for local development with:

- Relaxed security settings
- Verbose logging
- Local service URLs
- Extended timeouts
- Debug features enabled

**Usage**: Copy to `.env` for local development

### Staging (.env.staging.example)

Production-like configuration with:

- Enhanced security
- SSL/TLS required
- Structured logging
- Performance monitoring
- Privacy compliance enabled

**Usage**: Copy to `.env.staging` for staging deployment

### Production (.env.production.example)

Maximum security configuration with:

- All security features enabled
- SSL/TLS mandatory
- Minimal debug output
- Strict validation
- Compliance features required

**Usage**: Copy to `.env.production` for production deployment

## Configuration Categories

### Node.js Environment

- `NODE_ENV`: Environment name (development/staging/production/test)
- `PORT`: Server port (default: 3100)
- `CLIENT_PORT`: Client port (default: 3101)
- `HOST`: Server host (default: localhost)

### AssemblyAI Configuration

- `ASSEMBLYAI_API_KEY`: API key for AssemblyAI service (required)
- `ASSEMBLYAI_WEBHOOK_URL`: Webhook URL for callbacks

### Database Configuration

- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB_NAME`: Database name
- `REDIS_URL`: Redis connection string
- `REDIS_PASSWORD`: Redis password (optional)
- `REDIS_DB`: Redis database number (0-15)

### Security Configuration

- `JWT_SECRET`: JWT signing secret (minimum 32 characters for production)
- `JWT_EXPIRES_IN`: JWT expiration time (default: 7d)
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `CSP_ENABLED`: Enable Content Security Policy
- `HELMET_ENABLED`: Enable Helmet security headers
- `RATE_LIMIT_ENABLED`: Enable rate limiting

### Audio Processing

- `MAX_AUDIO_FILE_SIZE`: Maximum file size in bytes
- `MAX_AUDIO_DURATION`: Maximum duration in seconds
- `SUPPORTED_AUDIO_FORMATS`: Comma-separated list of formats

### Privacy & Compliance

- `GDPR_ENABLED`: Enable GDPR compliance features
- `DATA_ANONYMIZATION_ENABLED`: Enable data anonymization
- `CONSENT_REQUIRED`: Require user consent

## API Reference

### Loading Configuration

```typescript
import {
  loadEnvironment,
  loadDevelopmentEnvironment,
  loadStagingEnvironment,
  loadProductionEnvironment,
  loadTestEnvironment,
} from '@critgenius/shared';

// Auto-detect environment from NODE_ENV
const config = loadEnvironment();

// Load specific environment configuration
const devConfig = loadDevelopmentEnvironment();
const prodConfig = loadProductionEnvironment();
```

### Environment Checking

```typescript
import {
  isDevelopment,
  isStaging,
  isProduction,
  isTest,
  getCurrentEnvironment,
} from '@critgenius/shared';

if (isDevelopment()) {
  console.log('Running in development mode');
}

const env = getCurrentEnvironment(); // 'development' | 'staging' | 'production' | 'test'
```

### Validation

```typescript
import { validateEnvironmentVariables, validateEnvironmentOnStartup } from '@critgenius/shared';

// Validate without loading (useful for CI/CD)
const result = validateEnvironmentVariables();
if (!result.valid) {
  console.error(result.message);
  process.exit(1);
}

// Validate and load on startup (with helpful logging)
try {
  const config = validateEnvironmentOnStartup();
  console.log('✅ Configuration loaded successfully');
} catch (error) {
  console.error('❌ Configuration validation failed');
  process.exit(1);
}
```

### Utility Functions

```typescript
import {
  hasEnvironmentVariable,
  getEnvironmentVariable,
  requireEnvironmentVariable,
} from '@critgenius/shared';

// Check if variable exists
if (hasEnvironmentVariable('OPTIONAL_FEATURE_FLAG')) {
  // Enable optional feature
}

// Get variable with fallback
const logLevel = getEnvironmentVariable('LOG_LEVEL', 'info');

// Require variable (throws if missing)
const apiKey = requireEnvironmentVariable('ASSEMBLYAI_API_KEY');
```

## Error Handling

### Validation Errors

When validation fails, you'll receive detailed error messages:

```
Environment validation failed for development environment:
  ASSEMBLYAI_API_KEY: Required
  JWT_SECRET: Must be at least 32 characters
  MONGODB_URI: Must be a valid URL

Please check your .env file and ensure all required variables are properly set.
Refer to .env.example for the correct format and required variables.
```

### Common Issues & Solutions

#### Missing Required Variables

```bash
# Error: ASSEMBLYAI_API_KEY is required
# Solution: Add to your .env file
ASSEMBLYAI_API_KEY=your_actual_api_key_here
```

#### Invalid URL Format

```bash
# Error: MONGODB_URI must be a valid URL
# Solution: Use proper MongoDB connection string format
MONGODB_URI=mongodb://localhost:27017/critgenius-listener
```

#### Production Security Requirements

```bash
# Error: JWT secret must be at least 32 characters
# Solution: Generate a strong secret for production
JWT_SECRET=your-very-secure-32-plus-character-secret-key
```

## Environment-Specific Requirements

### Development

- Minimal security requirements
- Local database connections
- Debug features enabled
- Relaxed validation

#### Local HTTPS (Optional)

For browsers that require a secure context for full microphone access, you can enable local HTTPS:

Variables (development only):

| Variable        | Default                              | Description                                  |
| --------------- | ------------------------------------ | -------------------------------------------- |
| HTTPS_ENABLED   | false                                | Toggle HTTPS dev server                      |
| HTTPS_CERT_PATH | ./certificates/dev/dev-cert.pem (doc)| Certificate path (PEM). Ignored if disabled. |
| HTTPS_KEY_PATH  | ./certificates/dev/dev-key.pem (doc) | Private key path (PEM).                      |
| HTTPS_PORT      | 5174                                 | Port used when HTTPS is enabled              |

Setup:

```bash
pnpm certs:setup          # Generate (mkcert preferred, openssl fallback)
pnpm certs:check          # Warn if cert near expiration
```

Enable in `.env`:

```bash
HTTPS_ENABLED=true
HTTPS_CERT_PATH=./certificates/dev/dev-cert.pem
HTTPS_KEY_PATH=./certificates/dev/dev-key.pem
```

If files are missing or unreadable the dev server falls back to HTTP with a warning.

### Staging

- Production-like security
- SSL/TLS preferred
- Enhanced monitoring
- Privacy compliance testing

### Production

- Maximum security enforcement
- SSL/TLS mandatory
- All compliance features required
- Strong secrets required (32+ characters)
- Encrypted database connections required

## Best Practices

### Security

1. **Never commit secrets**: Use `.env` files that are ignored by git
2. **Rotate secrets regularly**: Especially in production environments
3. **Use strong secrets**: Minimum 32 characters for production JWT secrets
4. **Enable security features**: Use Helmet, CSP, and rate limiting in production
5. **Secure connections**: Use SSL/TLS for all production database connections

### Development

1. **Use templates**: Start with the appropriate `.env.example` template
2. **Validate early**: Call `validateEnvironmentOnStartup()` during app initialization
3. **Handle errors gracefully**: Provide clear error messages and suggested fixes
4. **Environment-specific configs**: Use different templates for different environments
5. **Type safety**: Import types from the shared package for consistency

### Deployment

1. **Environment separation**: Use different `.env` files for each environment
2. **CI/CD validation**: Validate environment variables in your deployment pipeline
3. **Monitoring**: Enable health checks and metrics in staging/production
4. **Backup configurations**: Document all required variables for disaster recovery

## Integration with Existing Code

### Server Integration

```typescript
// packages/server/src/index.ts
import { validateEnvironmentOnStartup } from '@critgenius/shared';

async function startServer() {
  // Validate environment on startup
  const config = validateEnvironmentOnStartup();

  // Use configuration throughout your application
  const app = express();

  // Configure database
  await connectToDatabase(config.MONGODB_URI);

  // Start server
  app.listen(config.PORT, config.HOST, () => {
    console.log(`🚀 Server running on ${config.HOST}:${config.PORT}`);
  });
}
```

### Client Integration (Node.js environments only)

```typescript
// For Node.js-based client builds only
import { isDevelopment, getCurrentEnvironment } from '@critgenius/shared';

if (isDevelopment()) {
  // Enable development-only features
  console.log('Development mode enabled');
}
```

## Troubleshooting

### Build Errors

If you encounter TypeScript errors, ensure all packages are built:

```bash
npm run build:shared
npm run build:server
npm run build:client
```

### Missing Variables

Check the console output for detailed validation errors with suggested fixes.

### Type Errors

Ensure you're importing types from the shared package:

```typescript
import type { EnvironmentConfig } from '@critgenius/shared';
```

## Migration from Old System

If you're migrating from a previous environment system:

1. **Audit existing variables**: Compare with new schema categories
2. **Update import statements**: Import from `@critgenius/shared`
3. **Add validation**: Replace manual checks with `validateEnvironmentOnStartup()`
4. **Use type-safe access**: Replace `process.env.VAR` with validated config objects
5. **Test thoroughly**: Validate in all environments before deployment

## Support

For questions about environment configuration:

1. Check this documentation first
2. Review the template files for examples
3. Check the TypeScript types for available options
4. Look at validation error messages for specific guidance

---

**Next Steps**: After setting up your environment configuration, proceed to configure your
development scripts and hot-reload development server (tasks 2.8 and 2.9).
