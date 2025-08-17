# AssemblyAI Configuration Examples

This document provides comprehensive examples for configuring the AssemblyAI SDK in different environments.

## Environment Configuration

### Development (.env.development)

```env
# AssemblyAI Configuration
ASSEMBLY_AI_API_KEY=your_development_api_key_64_characters_hex_format_here
ASSEMBLY_AI_TIMEOUT_MS=10000
ASSEMBLY_AI_RETRY_ATTEMPTS=3
ASSEMBLY_AI_RETRY_DELAY_MS=1000
ASSEMBLY_AI_RATE_LIMIT_ENABLED=true

# Optional: Enable debug logging
NODE_ENV=development
```

### Production (.env.production)

```env
# AssemblyAI Configuration - Production
ASSEMBLY_AI_API_KEY=your_production_api_key_secure_64_character_hex_here
ASSEMBLY_AI_TIMEOUT_MS=15000
ASSEMBLY_AI_RETRY_ATTEMPTS=5
ASSEMBLY_AI_RETRY_DELAY_MS=2000
ASSEMBLY_AI_RATE_LIMIT_ENABLED=true

# Production settings
NODE_ENV=production
```

### Testing (.env.test)

```env
# AssemblyAI Test Configuration
ASSEMBLY_AI_API_KEY=test_api_key_64_char_hex_for_testing_environment_here
ASSEMBLY_AI_TIMEOUT_MS=5000
ASSEMBLY_AI_RETRY_ATTEMPTS=1
ASSEMBLY_AI_RETRY_DELAY_MS=100
ASSEMBLY_AI_RATE_LIMIT_ENABLED=false
```

## Code Usage Examples

### Basic Configuration Loading

```typescript
import { loadAssemblyAIConfig } from '@critgenius/shared/config/assemblyai';

// Load configuration with environment variables
const config = loadAssemblyAIConfig();
console.log('Timeout configured:', config.timeoutMs);
```

### Manual Configuration Override

```typescript
import { loadAssemblyAIConfig } from '@critgenius/shared/config/assemblyai';

// Override specific settings programmatically
const config = loadAssemblyAIConfig({
  apiKey: process.env.CUSTOM_ASSEMBLY_API_KEY,
  timeoutMs: 20000,
  retryAttempts: 7
});
```

### Client Initialization

```typescript
import { AssemblyAIClient } from '@critgenius/shared/services/assemblyai-client';
import { loadAssemblyAIConfig } from '@critgenius/shared/config/assemblyai';

// Initialize client with loaded configuration
const config = loadAssemblyAIConfig();
const client = new AssemblyAIClient(config);

// Start transcription session
await client.connect('session-123');
client.sendAudio(audioBuffer);
```

### Logger Integration

```typescript
import { createAssemblyAILogger } from '@critgenius/shared/services/assemblyai-logger';

// Create logger with file output for production
const logger = createAssemblyAILogger({
  fileLogging: { 
    enabled: true, 
    filePath: '/var/log/assemblyai.log' 
  },
  defaultTags: { 
    service: 'critgenius-listener',
    environment: process.env.NODE_ENV || 'development'
  }
});

// Use with client
const client = new AssemblyAIClient(config, logger);
```

## Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ASSEMBLY_AI_API_KEY` | Yes | - | Your AssemblyAI API key (64-character hex) |
| `ASSEMBLY_AI_TIMEOUT_MS` | No | 10000 | Request timeout in milliseconds (1000-30000) |
| `ASSEMBLY_AI_RETRY_ATTEMPTS` | No | 3 | Maximum retry attempts (1-10) |
| `ASSEMBLY_AI_RETRY_DELAY_MS` | No | 1000 | Initial retry delay in milliseconds |
| `ASSEMBLY_AI_RATE_LIMIT_ENABLED` | No | true | Enable rate limiting protection |

## API Key Setup

1. **Get API Key**: Sign up at [AssemblyAI](https://www.assemblyai.com/) and obtain your API key
2. **Format Validation**: Ensure your API key is exactly 64 characters in hexadecimal format
3. **Environment Security**: Never commit API keys to version control
4. **Key Rotation**: Regularly rotate API keys in production environments

## Common Configuration Patterns

### High-Throughput Production

```env
ASSEMBLY_AI_TIMEOUT_MS=30000
ASSEMBLY_AI_RETRY_ATTEMPTS=5
ASSEMBLY_AI_RETRY_DELAY_MS=2000
ASSEMBLY_AI_RATE_LIMIT_ENABLED=true
```

### Development with Fast Feedback

```env
ASSEMBLY_AI_TIMEOUT_MS=5000
ASSEMBLY_AI_RETRY_ATTEMPTS=2
ASSEMBLY_AI_RETRY_DELAY_MS=500
ASSEMBLY_AI_RATE_LIMIT_ENABLED=false
```

### Testing Environment

```env
ASSEMBLY_AI_TIMEOUT_MS=3000
ASSEMBLY_AI_RETRY_ATTEMPTS=1
ASSEMBLY_AI_RETRY_DELAY_MS=100
ASSEMBLY_AI_RATE_LIMIT_ENABLED=false
```

## Troubleshooting

### Configuration Validation Errors

- **Invalid API Key Format**: Ensure key is exactly 64 hexadecimal characters
- **Timeout Out of Range**: Use values between 1000-30000 milliseconds
- **Invalid Retry Count**: Use 1-10 retry attempts maximum

### Common Environment Issues

- **Missing .env File**: Create appropriate `.env` file in project root
- **Environment Precedence**: Explicit config overrides environment variables
- **Type Conversion**: Environment variables are strings, config validates and converts types

This configuration system provides flexibility for different deployment scenarios while maintaining security and validation standards.
