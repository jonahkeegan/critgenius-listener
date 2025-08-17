/**
 * Unit tests for AssemblyAI Configuration Management System
 * Tests environment-based configuration with validation and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  AssemblyAIConfig,
  ASSEMBLYAI_ENV_VARS,
  DEFAULT_ASSEMBLYAI_CONFIG,
  AssemblyAIConfigError,
  loadAssemblyAIConfig,
  getConfigSummary,
  sanitizeConfig,
} from './assemblyai.js';

describe('AssemblyAI Configuration Management', () => {
  const validApiKey = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6';
  const invalidApiKeys = [
    '', // empty
    'short', // too short
    'invalid-key-format-123', // invalid format
    '12345', // too short with numbers
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456', // wrong format
  ];

  const validEnv = {
    [ASSEMBLYAI_ENV_VARS.API_KEY]: validApiKey,
    [ASSEMBLYAI_ENV_VARS.BASE_URL]: 'https://api.assemblyai.com',
    [ASSEMBLYAI_ENV_VARS.REALTIME_URL]: 'wss://api.assemblyai.com/v2/realtime/ws',
    [ASSEMBLYAI_ENV_VARS.CONNECTION_TIMEOUT]: '30000',
    [ASSEMBLYAI_ENV_VARS.MAX_RETRIES]: '3',
    [ASSEMBLYAI_ENV_VARS.RETRY_DELAY]: '1000',
    [ASSEMBLYAI_ENV_VARS.MAX_RETRY_DELAY]: '10000',
    [ASSEMBLYAI_ENV_VARS.DEBUG]: 'false',
    [ASSEMBLYAI_ENV_VARS.SAMPLE_RATE]: '16000',
    [ASSEMBLYAI_ENV_VARS.ENCODING]: 'pcm_s16le',
    [ASSEMBLYAI_ENV_VARS.CHANNELS]: '1',
    [ASSEMBLYAI_ENV_VARS.LANGUAGE]: 'en_us',
    [ASSEMBLYAI_ENV_VARS.PUNCTUATE]: 'true',
    [ASSEMBLYAI_ENV_VARS.FORMAT_TEXT]: 'true',
    [ASSEMBLYAI_ENV_VARS.SPEAKER_LABELS]: 'true',
    [ASSEMBLYAI_ENV_VARS.CONFIDENCE_THRESHOLD]: '0.8',
    [ASSEMBLYAI_ENV_VARS.FILTER_PROFANITY]: 'false',
    [ASSEMBLYAI_ENV_VARS.BUFFER_SIZE]: '4096',
    [ASSEMBLYAI_ENV_VARS.MAX_QUEUE_SIZE]: '100',
    [ASSEMBLYAI_ENV_VARS.ENABLE_BATCHING]: 'false',
    [ASSEMBLYAI_ENV_VARS.BATCH_SIZE]: '10',
    [ASSEMBLYAI_ENV_VARS.BATCH_TIMEOUT]: '100',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Default Configuration', () => {
    it('should have all required default values', () => {
      expect(DEFAULT_ASSEMBLYAI_CONFIG).toEqual({
        baseUrl: 'https://api.assemblyai.com',
        realtimeUrl: 'wss://api.assemblyai.com/v2/realtime/ws',
        connectionTimeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        maxRetryDelay: 10000,
        debug: false,
        audioConfig: {
          sampleRate: 16000,
          encoding: 'pcm_s16le',
          channels: 1,
          autoGainControl: true,
          noiseSuppression: true,
          echoCancellation: true,
        },
        transcriptionConfig: {
          language: 'en_us',
          punctuate: true,
          formatText: true,
          speakerLabels: true,
          confidenceThreshold: 0.8,
          filterProfanity: false,
          customVocabulary: expect.arrayContaining([
            'dungeon master', 'DM', 'GM', 'game master',
            'initiative', 'perception check', 'saving throw',
            'armor class', 'AC', 'hit points', 'HP',
          ]),
        },
        performance: {
          bufferSize: 4096,
          maxQueueSize: 100,
          enableBatching: false,
          batchSize: 10,
          batchTimeout: 100,
        },
      });
    });

    it('should include D&D-specific custom vocabulary', () => {
      const vocabulary = DEFAULT_ASSEMBLYAI_CONFIG.transcriptionConfig.customVocabulary;
      
      // Test for essential D&D terms
      expect(vocabulary).toContain('dungeon master');
      expect(vocabulary).toContain('DM');
      expect(vocabulary).toContain('initiative');
      expect(vocabulary).toContain('critical hit');
      expect(vocabulary).toContain('nat 20');
      
      // Test for character classes
      expect(vocabulary).toContain('barbarian');
      expect(vocabulary).toContain('wizard');
      expect(vocabulary).toContain('paladin');
      
      // Should have reasonable vocabulary size
      expect(vocabulary.length).toBeGreaterThan(20);
    });
  });

  describe('Environment Variable Names', () => {
    it('should define all required environment variable names', () => {
      const requiredEnvVars = [
        'API_KEY', 'BASE_URL', 'REALTIME_URL', 'CONNECTION_TIMEOUT',
        'MAX_RETRIES', 'RETRY_DELAY', 'MAX_RETRY_DELAY', 'DEBUG',
        'SAMPLE_RATE', 'ENCODING', 'CHANNELS', 'LANGUAGE',
        'PUNCTUATE', 'FORMAT_TEXT', 'SPEAKER_LABELS',
        'CONFIDENCE_THRESHOLD', 'FILTER_PROFANITY',
        'BUFFER_SIZE', 'MAX_QUEUE_SIZE', 'ENABLE_BATCHING',
        'BATCH_SIZE', 'BATCH_TIMEOUT',
      ];

      requiredEnvVars.forEach(envVar => {
        expect(ASSEMBLYAI_ENV_VARS).toHaveProperty(envVar);
        expect(ASSEMBLYAI_ENV_VARS[envVar as keyof typeof ASSEMBLYAI_ENV_VARS])
          .toBe(`ASSEMBLYAI_${envVar}`);
      });
    });
  });

  describe('Configuration Loading', () => {
    it('should load configuration from environment variables', () => {
      const config = loadAssemblyAIConfig(validEnv);

      expect(config).toMatchObject({
        apiKey: validApiKey,
        baseUrl: 'https://api.assemblyai.com',
        realtimeUrl: 'wss://api.assemblyai.com/v2/realtime/ws',
        connectionTimeout: 30000,
        maxRetries: 3,
        retryDelay: 1000,
        maxRetryDelay: 10000,
        debug: false,
        audioConfig: {
          sampleRate: 16000,
          encoding: 'pcm_s16le',
          channels: 1,
        },
        transcriptionConfig: {
          language: 'en_us',
          punctuate: true,
          formatText: true,
          speakerLabels: true,
          confidenceThreshold: 0.8,
          filterProfanity: false,
        },
        performance: {
          bufferSize: 4096,
          maxQueueSize: 100,
          enableBatching: false,
          batchSize: 10,
          batchTimeout: 100,
        },
      });
    });

    it('should use default values when environment variables are missing', () => {
      const minimalEnv = {
        [ASSEMBLYAI_ENV_VARS.API_KEY]: validApiKey,
      };

      const config = loadAssemblyAIConfig(minimalEnv);

      expect(config.baseUrl).toBe(DEFAULT_ASSEMBLYAI_CONFIG.baseUrl);
      expect(config.connectionTimeout).toBe(DEFAULT_ASSEMBLYAI_CONFIG.connectionTimeout);
      expect(config.audioConfig.sampleRate).toBe(DEFAULT_ASSEMBLYAI_CONFIG.audioConfig.sampleRate);
    });

    it('should parse boolean environment variables correctly', () => {
      const booleanEnv = {
        [ASSEMBLYAI_ENV_VARS.API_KEY]: validApiKey,
        [ASSEMBLYAI_ENV_VARS.DEBUG]: 'true',
        [ASSEMBLYAI_ENV_VARS.PUNCTUATE]: 'false',
        [ASSEMBLYAI_ENV_VARS.ENABLE_BATCHING]: 'true',
      };

      const config = loadAssemblyAIConfig(booleanEnv);

      expect(config.debug).toBe(true);
      expect(config.transcriptionConfig.punctuate).toBe(false);
      expect(config.performance.enableBatching).toBe(true);
    });

    it('should parse numeric environment variables correctly', () => {
      const numericEnv = {
        [ASSEMBLYAI_ENV_VARS.API_KEY]: validApiKey,
        [ASSEMBLYAI_ENV_VARS.CONNECTION_TIMEOUT]: '45000',
        [ASSEMBLYAI_ENV_VARS.MAX_RETRIES]: '5',
        [ASSEMBLYAI_ENV_VARS.SAMPLE_RATE]: '44100',
        [ASSEMBLYAI_ENV_VARS.CONFIDENCE_THRESHOLD]: '0.9',
      };

      const config = loadAssemblyAIConfig(numericEnv);

      expect(config.connectionTimeout).toBe(45000);
      expect(config.maxRetries).toBe(5);
      expect(config.audioConfig.sampleRate).toBe(44100);
      expect(config.transcriptionConfig.confidenceThreshold).toBe(0.9);
    });
  });

  describe('Configuration Validation', () => {
    it('should throw error when API key is missing', () => {
      const envWithoutApiKey: Record<string, string | undefined> = { ...validEnv };
      delete envWithoutApiKey[ASSEMBLYAI_ENV_VARS.API_KEY];

      expect(() => loadAssemblyAIConfig(envWithoutApiKey))
        .toThrow(AssemblyAIConfigError);
    });

    it('should validate API key format', () => {
      invalidApiKeys.forEach(apiKey => {
        const env = {
          ...validEnv,
          [ASSEMBLYAI_ENV_VARS.API_KEY]: apiKey,
        };

        expect(() => loadAssemblyAIConfig(env))
          .toThrow(AssemblyAIConfigError);
      });
    });

    it('should validate connection timeout range', () => {
      const invalidTimeouts = ['500', '400000']; // too small, too large

      invalidTimeouts.forEach(timeout => {
        const env = {
          ...validEnv,
          [ASSEMBLYAI_ENV_VARS.CONNECTION_TIMEOUT]: timeout,
        };

        expect(() => loadAssemblyAIConfig(env))
          .toThrow(AssemblyAIConfigError);
      });
    });

    it('should validate max retries range', () => {
      const invalidRetries = ['-1', '15']; // negative, too large

      invalidRetries.forEach(retries => {
        const env = {
          ...validEnv,
          [ASSEMBLYAI_ENV_VARS.MAX_RETRIES]: retries,
        };

        expect(() => loadAssemblyAIConfig(env))
          .toThrow(AssemblyAIConfigError);
      });
    });

    it('should validate sample rate range', () => {
      const invalidSampleRates = ['7000', '50000']; // too low, too high

      invalidSampleRates.forEach(sampleRate => {
        const env = {
          ...validEnv,
          [ASSEMBLYAI_ENV_VARS.SAMPLE_RATE]: sampleRate,
        };

        expect(() => loadAssemblyAIConfig(env))
          .toThrow(AssemblyAIConfigError);
      });
    });

    it('should validate audio channels range', () => {
      const invalidChannels = ['0', '3']; // too few, too many

      invalidChannels.forEach(channels => {
        const env = {
          ...validEnv,
          [ASSEMBLYAI_ENV_VARS.CHANNELS]: channels,
        };

        expect(() => loadAssemblyAIConfig(env))
          .toThrow(AssemblyAIConfigError);
      });
    });

    it('should validate confidence threshold range', () => {
      const invalidThresholds = ['-0.1', '1.5']; // too low, too high

      invalidThresholds.forEach(threshold => {
        const env = {
          ...validEnv,
          [ASSEMBLYAI_ENV_VARS.CONFIDENCE_THRESHOLD]: threshold,
        };

        expect(() => loadAssemblyAIConfig(env))
          .toThrow(AssemblyAIConfigError);
      });
    });

    it('should validate buffer size range', () => {
      const invalidBufferSizes = ['512', '65536']; // too small, too large

      invalidBufferSizes.forEach(bufferSize => {
        const env = {
          ...validEnv,
          [ASSEMBLYAI_ENV_VARS.BUFFER_SIZE]: bufferSize,
        };

        expect(() => loadAssemblyAIConfig(env))
          .toThrow(AssemblyAIConfigError);
      });
    });

    it('should validate queue size range', () => {
      const invalidQueueSizes = ['0', '1500']; // too small, too large

      invalidQueueSizes.forEach(queueSize => {
        const env = {
          ...validEnv,
          [ASSEMBLYAI_ENV_VARS.MAX_QUEUE_SIZE]: queueSize,
        };

        expect(() => loadAssemblyAIConfig(env))
          .toThrow(AssemblyAIConfigError);
      });
    });
  });

  describe('AssemblyAIConfigError', () => {
    it('should create error with message and field', () => {
      const error = new AssemblyAIConfigError('Test error message', 'apiKey');

      expect(error.message).toBe('Test error message');
      expect(error.field).toBe('apiKey');
      expect(error.name).toBe('AssemblyAIConfigError');
      expect(error instanceof Error).toBe(true);
    });

    it('should create error without field', () => {
      const error = new AssemblyAIConfigError('Test error message');

      expect(error.message).toBe('Test error message');
      expect(error.field).toBeUndefined();
      expect(error.name).toBe('AssemblyAIConfigError');
    });
  });

  describe('Configuration Summary', () => {
    it('should generate configuration summary without exposing API key', () => {
      const config = loadAssemblyAIConfig(validEnv);
      const summary = getConfigSummary(config);

      expect(summary).toHaveProperty('hasApiKey', true);
      expect(summary).toHaveProperty('apiKeyLength', validApiKey.length);
      expect(summary).not.toHaveProperty('apiKey');
      expect(summary).toHaveProperty('baseUrl');
      expect(summary).toHaveProperty('audioConfig');
      expect(summary).toHaveProperty('transcriptionConfig');
      expect(summary).toHaveProperty('performance');
    });

    it('should indicate when API key is missing', () => {
      const configWithoutKey: AssemblyAIConfig = {
        ...DEFAULT_ASSEMBLYAI_CONFIG,
        apiKey: '',
      };

      const summary = getConfigSummary(configWithoutKey);

      expect(summary.hasApiKey).toBe(false);
      expect(summary.apiKeyLength).toBe(0);
    });

    it('should include custom vocabulary count', () => {
      const config = loadAssemblyAIConfig(validEnv);
      const summary = getConfigSummary(config);

      expect(summary.transcriptionConfig).toHaveProperty('customVocabularyCount');
      expect((summary.transcriptionConfig as any).customVocabularyCount)
        .toBeGreaterThan(0);
    });
  });

  describe('Configuration Sanitization', () => {
    it('should sanitize API key in configuration', () => {
      const config = loadAssemblyAIConfig(validEnv);
      const sanitized = sanitizeConfig(config);

      expect(sanitized.apiKey).toMatch(/^[a-f0-9]{4}\*{4}[a-f0-9]{4}$/);
      expect(sanitized.apiKey).not.toBe(config.apiKey);
      expect(sanitized.baseUrl).toBe(config.baseUrl);
    });

    it('should handle short API keys in sanitization', () => {
      const shortKeyConfig: AssemblyAIConfig = {
        ...DEFAULT_ASSEMBLYAI_CONFIG,
        apiKey: 'short',
      };

      const sanitized = sanitizeConfig(shortKeyConfig);

      expect(sanitized.apiKey).toContain('*');
      expect(sanitized.apiKey).not.toBe('short');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environment object', () => {
      expect(() => loadAssemblyAIConfig({}))
        .toThrow(AssemblyAIConfigError);
    });

    it('should handle undefined environment values', () => {
      const envWithUndefined = {
        [ASSEMBLYAI_ENV_VARS.API_KEY]: validApiKey,
        [ASSEMBLYAI_ENV_VARS.CONNECTION_TIMEOUT]: undefined,
        [ASSEMBLYAI_ENV_VARS.DEBUG]: undefined,
      };

      const config = loadAssemblyAIConfig(envWithUndefined);

      expect(config.connectionTimeout).toBe(DEFAULT_ASSEMBLYAI_CONFIG.connectionTimeout);
      expect(config.debug).toBe(DEFAULT_ASSEMBLYAI_CONFIG.debug);
    });

    it('should handle non-numeric string values for numeric fields', () => {
      const env = {
        ...validEnv,
        [ASSEMBLYAI_ENV_VARS.CONNECTION_TIMEOUT]: 'not-a-number',
        [ASSEMBLYAI_ENV_VARS.CONFIDENCE_THRESHOLD]: 'invalid-float',
      };

      // Configuration validation should catch these invalid values
      expect(() => loadAssemblyAIConfig(env))
        .toThrow(AssemblyAIConfigError);
    });

    it('should validate audio encoding values', () => {
      const validEncodings = ['pcm_s16le', 'pcm_mulaw', 'pcm_alaw'];
      const invalidEncoding = 'invalid-encoding';

      validEncodings.forEach(encoding => {
        const env = {
          ...validEnv,
          [ASSEMBLYAI_ENV_VARS.ENCODING]: encoding,
        };

        const config = loadAssemblyAIConfig(env);
        expect(config.audioConfig.encoding).toBe(encoding);
      });
    });
  });

  describe('Performance Configuration', () => {
    it('should load performance settings correctly', () => {
      const performanceEnv = {
        ...validEnv,
        [ASSEMBLYAI_ENV_VARS.BUFFER_SIZE]: '8192',
        [ASSEMBLYAI_ENV_VARS.MAX_QUEUE_SIZE]: '200',
        [ASSEMBLYAI_ENV_VARS.ENABLE_BATCHING]: 'true',
        [ASSEMBLYAI_ENV_VARS.BATCH_SIZE]: '20',
        [ASSEMBLYAI_ENV_VARS.BATCH_TIMEOUT]: '200',
      };

      const config = loadAssemblyAIConfig(performanceEnv);

      expect(config.performance).toEqual({
        bufferSize: 8192,
        maxQueueSize: 200,
        enableBatching: true,
        batchSize: 20,
        batchTimeout: 200,
      });
    });
  });
});
