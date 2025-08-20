/**
 * AssemblyAI Configuration Management System
 * Provides environment-based configuration with validation and error handling
 * for the CritGenius Listener AssemblyAI SDK integration.
 */

export interface AssemblyAIConfig {
  /** AssemblyAI API key for authentication */
  apiKey: string;
  /** Base API URL for AssemblyAI services */
  baseUrl: string;
  /** Real-time transcription WebSocket URL */
  realtimeUrl: string;
  /** Connection timeout in milliseconds */
  connectionTimeout: number;
  /** Maximum retry attempts for failed requests */
  maxRetries: number;
  /** Initial retry delay in milliseconds */
  retryDelay: number;
  /** Maximum retry delay in milliseconds (for exponential backoff) */
  maxRetryDelay: number;
  /** Enable debug logging for AssemblyAI operations */
  debug: boolean;
  /** Audio configuration for real-time transcription */
  audioConfig: {
    /** Sample rate for audio processing (Hz) */
    sampleRate: number;
    /** Audio encoding format */
    encoding: 'pcm_s16le' | 'pcm_mulaw' | 'pcm_alaw';
    /** Number of audio channels */
    channels: number;
    /** Enable automatic gain control */
    autoGainControl: boolean;
    /** Enable noise suppression */
    noiseSuppression: boolean;
    /** Enable echo cancellation */
    echoCancellation: boolean;
  };
  /** Transcription configuration options */
  transcriptionConfig: {
    /** Language code for transcription */
    language: string;
    /** Enable punctuation in transcripts */
    punctuate: boolean;
    /** Enable capitalization in transcripts */
    formatText: boolean;
    /** Enable speaker diarization (speaker identification) */
    speakerLabels: boolean;
    /** Minimum confidence threshold for transcription results */
    confidenceThreshold: number;
    /** Enable profanity filtering */
    filterProfanity: boolean;
    /** Enable custom vocabulary for D&D terms */
    customVocabulary: string[];
  };
  /** Performance and optimization settings */
  performance: {
    /** Buffer size for audio chunks (bytes) */
    bufferSize: number;
    /** Maximum queue size for pending requests */
    maxQueueSize: number;
    /** Enable request batching */
    enableBatching: boolean;
    /** Batch size for grouped requests */
    batchSize: number;
    /** Maximum time to wait before sending a batch (ms) */
    batchTimeout: number;
  };
}

/**
 * Environment variable names for AssemblyAI configuration
 */
export const ASSEMBLYAI_ENV_VARS = {
  API_KEY: 'ASSEMBLYAI_API_KEY',
  BASE_URL: 'ASSEMBLYAI_BASE_URL',
  REALTIME_URL: 'ASSEMBLYAI_REALTIME_URL',
  CONNECTION_TIMEOUT: 'ASSEMBLYAI_CONNECTION_TIMEOUT',
  MAX_RETRIES: 'ASSEMBLYAI_MAX_RETRIES',
  RETRY_DELAY: 'ASSEMBLYAI_RETRY_DELAY',
  MAX_RETRY_DELAY: 'ASSEMBLYAI_MAX_RETRY_DELAY',
  DEBUG: 'ASSEMBLYAI_DEBUG',
  SAMPLE_RATE: 'ASSEMBLYAI_SAMPLE_RATE',
  ENCODING: 'ASSEMBLYAI_ENCODING',
  CHANNELS: 'ASSEMBLYAI_CHANNELS',
  LANGUAGE: 'ASSEMBLYAI_LANGUAGE',
  PUNCTUATE: 'ASSEMBLYAI_PUNCTUATE',
  FORMAT_TEXT: 'ASSEMBLYAI_FORMAT_TEXT',
  SPEAKER_LABELS: 'ASSEMBLYAI_SPEAKER_LABELS',
  CONFIDENCE_THRESHOLD: 'ASSEMBLYAI_CONFIDENCE_THRESHOLD',
  FILTER_PROFANITY: 'ASSEMBLYAI_FILTER_PROFANITY',
  BUFFER_SIZE: 'ASSEMBLYAI_BUFFER_SIZE',
  MAX_QUEUE_SIZE: 'ASSEMBLYAI_MAX_QUEUE_SIZE',
  ENABLE_BATCHING: 'ASSEMBLYAI_ENABLE_BATCHING',
  BATCH_SIZE: 'ASSEMBLYAI_BATCH_SIZE',
  BATCH_TIMEOUT: 'ASSEMBLYAI_BATCH_TIMEOUT',
} as const;

/**
 * Default configuration values for AssemblyAI integration
 */
export const DEFAULT_ASSEMBLYAI_CONFIG: Omit<AssemblyAIConfig, 'apiKey'> = {
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
    customVocabulary: [
      // D&D specific terms for improved accuracy
      'dungeon master',
      'DM',
      'GM',
      'game master',
      'initiative',
      'perception check',
      'saving throw',
      'armor class',
      'AC',
      'hit points',
      'HP',
      'spell slot',
      'cantrip',
      'advantage',
      'disadvantage',
      'critical hit',
      'nat 20',
      'natural 20',
      'nat 1',
      'natural 1',
      'barbarian',
      'bard',
      'cleric',
      'druid',
      'fighter',
      'monk',
      'paladin',
      'ranger',
      'rogue',
      'sorcerer',
      'warlock',
      'wizard',
      'artificer',
    ],
  },
  performance: {
    bufferSize: 4096,
    maxQueueSize: 100,
    enableBatching: false,
    batchSize: 10,
    batchTimeout: 100,
  },
};

/**
 * Configuration validation error types
 */
export class AssemblyAIConfigError extends Error {
  constructor(
    message: string,
    public field?: string
  ) {
    super(message);
    this.name = 'AssemblyAIConfigError';
  }
}

/**
 * Validates AssemblyAI API key format
 */
function validateApiKey(apiKey: string): void {
  if (!apiKey) {
    throw new AssemblyAIConfigError('API key is required', 'apiKey');
  }

  if (typeof apiKey !== 'string') {
    throw new AssemblyAIConfigError('API key must be a string', 'apiKey');
  }

  if (apiKey.length < 32) {
    throw new AssemblyAIConfigError(
      'API key appears to be invalid (too short)',
      'apiKey'
    );
  }

  // AssemblyAI API keys typically start with a specific pattern
  if (!/^[a-f0-9]{32,}$/i.test(apiKey)) {
    throw new AssemblyAIConfigError(
      'API key format appears to be invalid',
      'apiKey'
    );
  }
}

/**
 * Validates configuration values and throws descriptive errors
 */
function validateConfig(config: AssemblyAIConfig): void {
  validateApiKey(config.apiKey);

  // Check for NaN values from invalid parsing
  if (isNaN(config.connectionTimeout)) {
    throw new AssemblyAIConfigError(
      'Connection timeout must be a valid number',
      'connectionTimeout'
    );
  }
  if (isNaN(config.maxRetries)) {
    throw new AssemblyAIConfigError(
      'Max retries must be a valid number',
      'maxRetries'
    );
  }
  if (isNaN(config.retryDelay)) {
    throw new AssemblyAIConfigError(
      'Retry delay must be a valid number',
      'retryDelay'
    );
  }
  if (isNaN(config.maxRetryDelay)) {
    throw new AssemblyAIConfigError(
      'Max retry delay must be a valid number',
      'maxRetryDelay'
    );
  }
  if (isNaN(config.audioConfig.sampleRate)) {
    throw new AssemblyAIConfigError(
      'Sample rate must be a valid number',
      'audioConfig.sampleRate'
    );
  }
  if (isNaN(config.audioConfig.channels)) {
    throw new AssemblyAIConfigError(
      'Audio channels must be a valid number',
      'audioConfig.channels'
    );
  }
  if (isNaN(config.transcriptionConfig.confidenceThreshold)) {
    throw new AssemblyAIConfigError(
      'Confidence threshold must be a valid number',
      'transcriptionConfig.confidenceThreshold'
    );
  }
  if (isNaN(config.performance.bufferSize)) {
    throw new AssemblyAIConfigError(
      'Buffer size must be a valid number',
      'performance.bufferSize'
    );
  }
  if (isNaN(config.performance.maxQueueSize)) {
    throw new AssemblyAIConfigError(
      'Max queue size must be a valid number',
      'performance.maxQueueSize'
    );
  }
  if (isNaN(config.performance.batchSize)) {
    throw new AssemblyAIConfigError(
      'Batch size must be a valid number',
      'performance.batchSize'
    );
  }
  if (isNaN(config.performance.batchTimeout)) {
    throw new AssemblyAIConfigError(
      'Batch timeout must be a valid number',
      'performance.batchTimeout'
    );
  }

  // Range validations
  if (config.connectionTimeout < 1000 || config.connectionTimeout > 300000) {
    throw new AssemblyAIConfigError(
      'Connection timeout must be between 1000ms and 300000ms',
      'connectionTimeout'
    );
  }

  if (config.maxRetries < 0 || config.maxRetries > 10) {
    throw new AssemblyAIConfigError(
      'Max retries must be between 0 and 10',
      'maxRetries'
    );
  }

  if (config.retryDelay < 100 || config.retryDelay > 30000) {
    throw new AssemblyAIConfigError(
      'Retry delay must be between 100ms and 30000ms',
      'retryDelay'
    );
  }

  if (
    config.audioConfig.sampleRate < 8000 ||
    config.audioConfig.sampleRate > 48000
  ) {
    throw new AssemblyAIConfigError(
      'Sample rate must be between 8000Hz and 48000Hz',
      'audioConfig.sampleRate'
    );
  }

  if (config.audioConfig.channels < 1 || config.audioConfig.channels > 2) {
    throw new AssemblyAIConfigError(
      'Audio channels must be 1 (mono) or 2 (stereo)',
      'audioConfig.channels'
    );
  }

  if (
    config.transcriptionConfig.confidenceThreshold < 0 ||
    config.transcriptionConfig.confidenceThreshold > 1
  ) {
    throw new AssemblyAIConfigError(
      'Confidence threshold must be between 0.0 and 1.0',
      'transcriptionConfig.confidenceThreshold'
    );
  }

  if (
    config.performance.bufferSize < 1024 ||
    config.performance.bufferSize > 32768
  ) {
    throw new AssemblyAIConfigError(
      'Buffer size must be between 1024 and 32768 bytes',
      'performance.bufferSize'
    );
  }

  if (
    config.performance.maxQueueSize < 1 ||
    config.performance.maxQueueSize > 1000
  ) {
    throw new AssemblyAIConfigError(
      'Max queue size must be between 1 and 1000',
      'performance.maxQueueSize'
    );
  }
}

/**
 * Loads and validates AssemblyAI configuration from environment variables
 */
export function loadAssemblyAIConfig(
  env: Record<string, string | undefined> = process.env
): AssemblyAIConfig {
  const apiKey = env[ASSEMBLYAI_ENV_VARS.API_KEY];

  if (!apiKey) {
    throw new AssemblyAIConfigError(
      `Missing required environment variable: ${ASSEMBLYAI_ENV_VARS.API_KEY}`
    );
  }

  const config: AssemblyAIConfig = {
    apiKey,
    baseUrl:
      env[ASSEMBLYAI_ENV_VARS.BASE_URL] || DEFAULT_ASSEMBLYAI_CONFIG.baseUrl,
    realtimeUrl:
      env[ASSEMBLYAI_ENV_VARS.REALTIME_URL] ||
      DEFAULT_ASSEMBLYAI_CONFIG.realtimeUrl,
    connectionTimeout: parseInt(
      env[ASSEMBLYAI_ENV_VARS.CONNECTION_TIMEOUT] || '30000'
    ),
    maxRetries: parseInt(env[ASSEMBLYAI_ENV_VARS.MAX_RETRIES] || '3'),
    retryDelay: parseInt(env[ASSEMBLYAI_ENV_VARS.RETRY_DELAY] || '1000'),
    maxRetryDelay: parseInt(
      env[ASSEMBLYAI_ENV_VARS.MAX_RETRY_DELAY] || '10000'
    ),
    debug: env[ASSEMBLYAI_ENV_VARS.DEBUG] === 'true',
    audioConfig: {
      sampleRate: parseInt(env[ASSEMBLYAI_ENV_VARS.SAMPLE_RATE] || '16000'),
      encoding:
        (env[
          ASSEMBLYAI_ENV_VARS.ENCODING
        ] as AssemblyAIConfig['audioConfig']['encoding']) || 'pcm_s16le',
      channels: parseInt(env[ASSEMBLYAI_ENV_VARS.CHANNELS] || '1'),
      autoGainControl: env.ASSEMBLYAI_AUTO_GAIN_CONTROL !== 'false',
      noiseSuppression: env.ASSEMBLYAI_NOISE_SUPPRESSION !== 'false',
      echoCancellation: env.ASSEMBLYAI_ECHO_CANCELLATION !== 'false',
    },
    transcriptionConfig: {
      language: env[ASSEMBLYAI_ENV_VARS.LANGUAGE] || 'en_us',
      punctuate: env[ASSEMBLYAI_ENV_VARS.PUNCTUATE] !== 'false',
      formatText: env[ASSEMBLYAI_ENV_VARS.FORMAT_TEXT] !== 'false',
      speakerLabels: env[ASSEMBLYAI_ENV_VARS.SPEAKER_LABELS] !== 'false',
      confidenceThreshold: parseFloat(
        env[ASSEMBLYAI_ENV_VARS.CONFIDENCE_THRESHOLD] || '0.8'
      ),
      filterProfanity: env[ASSEMBLYAI_ENV_VARS.FILTER_PROFANITY] === 'true',
      customVocabulary:
        DEFAULT_ASSEMBLYAI_CONFIG.transcriptionConfig.customVocabulary,
    },
    performance: {
      bufferSize: parseInt(env[ASSEMBLYAI_ENV_VARS.BUFFER_SIZE] || '4096'),
      maxQueueSize: parseInt(env[ASSEMBLYAI_ENV_VARS.MAX_QUEUE_SIZE] || '100'),
      enableBatching: env[ASSEMBLYAI_ENV_VARS.ENABLE_BATCHING] === 'true',
      batchSize: parseInt(env[ASSEMBLYAI_ENV_VARS.BATCH_SIZE] || '10'),
      batchTimeout: parseInt(env[ASSEMBLYAI_ENV_VARS.BATCH_TIMEOUT] || '100'),
    },
  };

  validateConfig(config);
  return config;
}

/**
 * Creates a configuration summary for debugging and logging
 */
export function getConfigSummary(
  config: AssemblyAIConfig
): Record<string, unknown> {
  return {
    hasApiKey: !!config.apiKey,
    apiKeyLength: config.apiKey.length,
    baseUrl: config.baseUrl,
    realtimeUrl: config.realtimeUrl,
    connectionTimeout: config.connectionTimeout,
    maxRetries: config.maxRetries,
    retryDelay: config.retryDelay,
    maxRetryDelay: config.maxRetryDelay,
    debug: config.debug,
    audioConfig: {
      sampleRate: config.audioConfig.sampleRate,
      encoding: config.audioConfig.encoding,
      channels: config.audioConfig.channels,
      autoGainControl: config.audioConfig.autoGainControl,
      noiseSuppression: config.audioConfig.noiseSuppression,
      echoCancellation: config.audioConfig.echoCancellation,
    },
    transcriptionConfig: {
      language: config.transcriptionConfig.language,
      punctuate: config.transcriptionConfig.punctuate,
      formatText: config.transcriptionConfig.formatText,
      speakerLabels: config.transcriptionConfig.speakerLabels,
      confidenceThreshold: config.transcriptionConfig.confidenceThreshold,
      filterProfanity: config.transcriptionConfig.filterProfanity,
      customVocabularyCount: config.transcriptionConfig.customVocabulary.length,
    },
    performance: config.performance,
  };
}

/**
 * Sanitizes configuration for logging by removing sensitive information
 */
export function sanitizeConfig(
  config: AssemblyAIConfig
): Partial<AssemblyAIConfig> {
  // Omit apiKey entirely to avoid any leakage in logs
  const rest: Partial<AssemblyAIConfig> = { ...config };
  delete (rest as { apiKey?: string }).apiKey;
  return rest;
}
