/**
 * Structural validation for AssemblyAI client test registration.
 */

import { describe, it, expect } from 'vitest';

import { registerInitializationTests } from './initialization.suite.js';
import { registerErrorClassTests } from './error-classes.suite.js';
import { registerConnectionManagementTests } from './connection-management.suite.js';
import { registerAudioProcessingTests } from './audio-processing.suite.js';
import { registerEventSystemTests } from './event-system.suite.js';
import { registerStatisticsTests } from './statistics.suite.js';
import { registerConfigurationTests } from './configuration.suite.js';
import { registerErrorNormalizationTests } from './error-normalization.suite.js';
import { registerFactoryTests } from './factory.suite.js';
import { registerEdgeCaseTests } from './edge-cases.suite.js';

export const registerValidationTests = (): void => {
  describe('AssemblyAI Test Orchestrator Validation', () => {
    it('exposes registration hooks for all component suites', () => {
      const registry = [
        registerInitializationTests,
        registerErrorClassTests,
        registerConnectionManagementTests,
        registerAudioProcessingTests,
        registerEventSystemTests,
        registerStatisticsTests,
        registerConfigurationTests,
        registerErrorNormalizationTests,
        registerFactoryTests,
        registerEdgeCaseTests,
      ];

      registry.forEach(registerFn => {
        expect(typeof registerFn).toBe('function');
      });
    });
  });
};
