/**
 * Aggregated AssemblyAI client test orchestrator.
 *
 * The actual test suites live under `__tests__/assemblyai-client`.
 */

import { useAssemblyAiClientTestLifecycle } from './__tests__/assemblyai-client/shared/setup.js';
import { registerInitializationTests } from './__tests__/assemblyai-client/initialization.suite.js';
import { registerErrorClassTests } from './__tests__/assemblyai-client/error-classes.suite.js';
import { registerConnectionManagementTests } from './__tests__/assemblyai-client/connection-management.suite.js';
import { registerAudioProcessingTests } from './__tests__/assemblyai-client/audio-processing.suite.js';
import { registerEventSystemTests } from './__tests__/assemblyai-client/event-system.suite.js';
import { registerStatisticsTests } from './__tests__/assemblyai-client/statistics.suite.js';
import { registerConfigurationTests } from './__tests__/assemblyai-client/configuration.suite.js';
import { registerErrorNormalizationTests } from './__tests__/assemblyai-client/error-normalization.suite.js';
import { registerFactoryTests } from './__tests__/assemblyai-client/factory.suite.js';
import { registerEdgeCaseTests } from './__tests__/assemblyai-client/edge-cases.suite.js';
import { registerValidationTests } from './__tests__/assemblyai-client/validation.suite.js';

useAssemblyAiClientTestLifecycle();

registerInitializationTests();
registerErrorClassTests();
registerConnectionManagementTests();
registerAudioProcessingTests();
registerEventSystemTests();
registerStatisticsTests();
registerConfigurationTests();
registerErrorNormalizationTests();
registerFactoryTests();
registerEdgeCaseTests();
registerValidationTests();
