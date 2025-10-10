import { EnvironmentDetector } from '../diagnostics/environment-detector.js';
import {
  applyEnvironmentPreset,
  type AppliedEnvironmentPreset,
  type EnvironmentPreset,
  resolveEnvironmentPreset,
} from './environmentPresets.js';
import {
  ServiceLifecycleManager,
  type RegisteredService,
  type ServiceRegistration,
} from './serviceLifecycleManager.js';

export type IntegrationTestHarnessOptions = {
  /**
   * Optional environment preset to apply for the lifetime of the harness. When omitted the
   * default `localDevelopment` preset will be used.
   */
  preset?: EnvironmentPreset | string;
  /**
   * When true (default) all registered services are started during {@link setup}. When false the
   * caller is responsible for orchestrating service startup manually using the returned lifecycle
   * manager.
   */
  autoStartServices?: boolean;
  /**
   * Optional metadata describing the workflow under test. Used only for diagnostics and logging.
   */
  workflowName?: string;
};

export type IntegrationTestContext = {
  workflowName: string;
  environment: ReturnType<typeof EnvironmentDetector.getEnvironmentInfo>;
  executionEnvironment: ReturnType<typeof EnvironmentDetector.detect>;
  services: ServiceLifecycleManager;
};

/**
 * Provides a deterministic integration test context with lifecycle and environment management.
 * The harness coordinates service startup/teardown, applies environment presets, and exposes a
 * consistent diagnostic surface for tests spanning multiple packages.
 */
export class IntegrationTestHarness {
  private readonly options: IntegrationTestHarnessOptions;
  private readonly services: ServiceLifecycleManager;
  private appliedPreset: AppliedEnvironmentPreset | null = null;
  private isSetup = false;

  constructor(options: IntegrationTestHarnessOptions = {}) {
    this.options = options;
    this.services = new ServiceLifecycleManager();
  }

  /**
   * Registers a service lifecycle with the underlying manager. Services are started during
   * {@link setup} when `autoStartServices` is true.
   */
  registerService(registration: ServiceRegistration): RegisteredService {
    return this.services.register(registration);
  }

  /**
   * Returns a snapshot of the current integration context for diagnostics or assertions.
   */
  getContext(): IntegrationTestContext {
    return {
      workflowName: this.options.workflowName ?? 'unnamed-workflow',
      environment: EnvironmentDetector.getEnvironmentInfo(),
      executionEnvironment: EnvironmentDetector.detect(),
      services: this.services,
    };
  }

  /**
   * Applies environment presets and starts registered services if enabled.
   */
  async setup(): Promise<IntegrationTestContext> {
    if (this.isSetup) {
      // Idempotent: return the current context when setup has already completed.
      return this.getContext();
    }

    const preset = resolveEnvironmentPreset(this.options.preset);
    this.appliedPreset = applyEnvironmentPreset(preset);

    if (this.options.autoStartServices ?? true) {
      await this.services.startAll();
    }

    this.isSetup = true;
    return this.getContext();
  }

  /**
   * Stops registered services (if running) and restores environment variables.
   */
  async teardown(): Promise<void> {
    if (!this.isSetup) {
      return;
    }

    await this.services.stopAll();

    if (this.appliedPreset) {
      this.appliedPreset.restore();
      this.appliedPreset = null;
    }

    this.isSetup = false;
  }

  /**
   * Convenience helper that wraps a test body with automatic setup and teardown. Useful for
   * integration suites that prefer inline harness usage without manual lifecycle calls.
   */
  async run<T>(
    handler: (context: IntegrationTestContext) => Promise<T>
  ): Promise<T> {
    const context = await this.setup();

    try {
      return await handler(context);
    } finally {
      await this.teardown();
    }
  }

  /**
   * Exposes the underlying {@link ServiceLifecycleManager} for advanced orchestration scenarios.
   */
  getServiceManager(): ServiceLifecycleManager {
    return this.services;
  }
}
