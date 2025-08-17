# AssemblyAI Configuration Examples

This document provides comprehensive examples for configuring the AssemblyAI SDK in different
environments.

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
  retryAttempts: 7,
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
    filePath: '/var/log/assemblyai.log',
  },
  defaultTags: {
    service: 'critgenius-listener',
    environment: process.env.NODE_ENV || 'development',
  },
});

// Use with client
const client = new AssemblyAIClient(config, logger);
```

## Environment Variable Reference

| Variable                         | Required | Default | Description                                  |
| -------------------------------- | -------- | ------- | -------------------------------------------- |
| `ASSEMBLY_AI_API_KEY`            | Yes      | -       | Your AssemblyAI API key (64-character hex)   |
| `ASSEMBLY_AI_TIMEOUT_MS`         | No       | 10000   | Request timeout in milliseconds (1000-30000) |
| `ASSEMBLY_AI_RETRY_ATTEMPTS`     | No       | 3       | Maximum retry attempts (1-10)                |
| `ASSEMBLY_AI_RETRY_DELAY_MS`     | No       | 1000    | Initial retry delay in milliseconds          |
| `ASSEMBLY_AI_RATE_LIMIT_ENABLED` | No       | true    | Enable rate limiting protection              |

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

## Monorepo Development Setup

### Cross-Package Configuration Import

When working in the CritGenius monorepo, import shared configuration from client or server packages:

```typescript
// In packages/client/src/services/audio-processor.ts
import { loadAssemblyAIConfig } from '@critgenius/shared/config/assemblyai';
import { AssemblyAIClient } from '@critgenius/shared/services/assemblyai-client';

// Initialize with shared configuration
const config = loadAssemblyAIConfig();
const client = new AssemblyAIClient(config);
```

```typescript
// In packages/server/src/routes/transcription.ts
import { loadAssemblyAIConfig } from '@critgenius/shared/config/assemblyai';
import { createAssemblyAILogger } from '@critgenius/shared/services/assemblyai-logger';

// Server-side integration with logging
const config = loadAssemblyAIConfig();
const logger = createAssemblyAILogger({
  fileLogging: { enabled: true, filePath: './logs/transcription.log' },
});
```

### TypeScript Project References

Ensure proper TypeScript compilation across packages:

```json
// packages/client/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "references": [{ "path": "../shared" }],
  "compilerOptions": {
    "composite": true,
    "jsx": "react-jsx"
  }
}
```

### Development Scripts

Use these package.json scripts for monorepo development:

```json
{
  "scripts": {
    "dev:shared": "cd packages/shared && npm run dev",
    "dev:client": "cd packages/client && npm run dev",
    "dev:server": "cd packages/server && npm run dev",
    "build:all": "pnpm -r run build",
    "test:shared": "cd packages/shared && pnpm test"
  }
}
```

## D&D Gaming Configuration

### Custom Vocabulary for Gaming Sessions

Configure D&D-specific terms for improved transcription accuracy:

```env
# Gaming vocabulary configuration
ASSEMBLY_AI_CUSTOM_VOCABULARY=true
ASSEMBLY_AI_GAMING_CONTEXT=dnd
ASSEMBLY_AI_BOOST_PARAM=0.5
```

```typescript
import { loadAssemblyAIConfig } from '@critgenius/shared/config/assemblyai';

// D&D optimized configuration
const gamingConfig = loadAssemblyAIConfig({
  customVocabulary: [
    // Character classes and races
    'paladin',
    'barbarian',
    'druid',
    'warlock',
    'tiefling',
    'halfling',
    'dwarf',
    // Combat terms
    'initiative',
    'armor class',
    'saving throw',
    'spell slot',
    'cantrip',
    // Game mechanics
    'advantage',
    'disadvantage',
    'proficiency',
    'modifier',
    'critical hit',
    // Common spells
    'fireball',
    'healing word',
    'eldritch blast',
    'counterspell',
    'shield',
    // Equipment
    'longsword',
    'crossbow',
    'studded leather',
    'plate armor',
    'magical item',
  ],
  boostParam: 0.5, // Boost gaming vocabulary recognition
  filterProfanity: false, // Allow colorful gaming language
});
```

### Session-Specific Settings

Optimize configuration for different D&D session types:

```typescript
// Combat-heavy sessions (fast-paced dialogue)
const combatConfig = loadAssemblyAIConfig({
  timeoutMs: 5000, // Faster timeout for rapid exchanges
  retryAttempts: 2, // Fewer retries for real-time feel
  retryDelayMs: 500, // Quick retry for combat flow
  punctuate: true, // Clear dialogue separation
  formatText: true, // Proper sentence formatting
});

// Roleplay-heavy sessions (detailed conversation)
const roleplayConfig = loadAssemblyAIConfig({
  timeoutMs: 15000, // Longer timeout for dramatic pauses
  retryAttempts: 5, // More retries for important dialogue
  retryDelayMs: 2000, // Allow for dramatic timing
  speakerLabels: true, // Identify different characters
  punctuate: true, // Preserve dramatic emphasis
  formatText: true, // Clean up for character voices
});
```

### Gaming Vocabulary Integration

```typescript
// Create gaming-optimized client
const createGamingTranscriptionClient = () => {
  const config = loadAssemblyAIConfig({
    customVocabulary: getDnDVocabulary(), // Load from gaming dictionary
    boostParam: 0.7, // High boost for gaming terms
    filterProfanity: false, // Gaming sessions can be colorful
    speakerLabels: true, // Identify players and DM
    punctuate: true, // Clear dialogue formatting
    formatText: true, // Clean transcript output
  });

  return new AssemblyAIClient(config);
};
```

## Local Development Testing

### Mock Testing Configuration

Set up development environment without hitting live AssemblyAI API:

```env
# .env.development.local
NODE_ENV=development
ASSEMBLY_AI_API_KEY=mock_dev_key_for_testing_64_char_hex_format_mock_test
ASSEMBLY_AI_TIMEOUT_MS=1000
ASSEMBLY_AI_RETRY_ATTEMPTS=1
ASSEMBLY_AI_RETRY_DELAY_MS=100
ASSEMBLY_AI_RATE_LIMIT_ENABLED=false
ASSEMBLY_AI_MOCK_MODE=true
```

### Development Mock Implementation

```typescript
// Development mock for testing without API calls
import { loadAssemblyAIConfig } from '@critgenius/shared/config/assemblyai';

const createMockClient = () => {
  const config = loadAssemblyAIConfig();

  if (process.env.NODE_ENV === 'development') {
    return {
      connect: async (sessionId: string) => {
        console.log(`[MOCK] Connected to session: ${sessionId}`);
        return Promise.resolve();
      },
      sendAudio: (buffer: Buffer) => {
        console.log(`[MOCK] Processed ${buffer.length} bytes of audio`);
        // Simulate transcription result
        setTimeout(() => {
          mockTranscriptCallback('This is mock transcription text');
        }, 500);
      },
      disconnect: () => {
        console.log('[MOCK] Disconnected from session');
      },
    };
  }

  return new AssemblyAIClient(config);
};
```

### Test Data Generation

```typescript
// Generate realistic test scenarios
const createTestScenarios = () => ({
  combatScenario: {
    audio: 'mock-combat-audio.wav',
    expectedText: 'I roll for initiative. Natural twenty!',
    speakers: ['player1', 'dm'],
    duration: 3000,
  },
  roleplayScenario: {
    audio: 'mock-roleplay-audio.wav',
    expectedText: 'The mysterious hooded figure approaches the tavern',
    speakers: ['dm'],
    duration: 8000,
  },
  spellcastingScenario: {
    audio: 'mock-spellcasting-audio.wav',
    expectedText: 'I cast fireball at the goblin horde',
    speakers: ['player2'],
    customVocabulary: ['fireball', 'goblin'],
    duration: 2500,
  },
});
```

### Development Validation Script

```typescript
// Validate development setup
const validateDevSetup = async () => {
  try {
    // Test configuration loading
    const config = loadAssemblyAIConfig();
    console.log('✅ Configuration loaded successfully');

    // Test mock client creation
    const client = createMockClient();
    console.log('✅ Mock client created successfully');

    // Test vocabulary loading
    const vocabulary = getDnDVocabulary();
    console.log(`✅ Gaming vocabulary loaded: ${vocabulary.length} terms`);

    // Test environment detection
    const isMockMode = process.env.ASSEMBLY_AI_MOCK_MODE === 'true';
    console.log(`✅ Mock mode: ${isMockMode ? 'enabled' : 'disabled'}`);

    return true;
  } catch (error) {
    console.error('❌ Development setup validation failed:', error);
    return false;
  }
};
```

This configuration system provides flexibility for different deployment scenarios while maintaining
security and validation standards, with specialized support for D&D gaming sessions and
comprehensive development workflows.
