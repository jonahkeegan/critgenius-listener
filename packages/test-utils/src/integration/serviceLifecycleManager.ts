export type ServiceStatus =
  | 'idle'
  | 'starting'
  | 'running'
  | 'stopping'
  | 'stopped'
  | 'failed';

export type ServiceRegistration = {
  name: string;
  start: () => Promise<void> | void;
  stop?: () => Promise<void> | void;
  /** Optional metadata describing the service (e.g., package, port). */
  metadata?: Record<string, unknown>;
};

export type RegisteredService = {
  readonly name: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly status: ServiceStatus;
  start: () => Promise<void>;
  stop: () => Promise<void>;
};

export class IntegrationServiceError extends Error {
  constructor(
    message: string,
    public readonly serviceName: string,
    public readonly phase: 'start' | 'stop',
    cause?: unknown
  ) {
    super(message);
    this.name = 'IntegrationServiceError';
    if (cause instanceof Error && cause.stack) {
      this.stack = `${this.name}: ${message}\nCaused by: ${cause.stack}`;
    }
  }
}

class ManagedService implements RegisteredService {
  readonly name: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  private readonly starter: () => Promise<void> | void;
  private readonly stopper: (() => Promise<void> | void) | undefined;
  private _status: ServiceStatus = 'idle';

  constructor({ name, start, stop, metadata }: ServiceRegistration) {
    this.name = name;
    this.starter = start;
    this.stopper = stop ?? undefined;
    this.metadata = Object.freeze({ ...(metadata ?? {}) });
  }

  get status(): ServiceStatus {
    return this._status;
  }

  async start(): Promise<void> {
    if (this._status === 'running' || this._status === 'starting') {
      return;
    }

    this._status = 'starting';

    try {
      await this.starter();
      this._status = 'running';
    } catch (error) {
      this._status = 'failed';
      throw new IntegrationServiceError(
        `Failed to start service '${this.name}'`,
        this.name,
        'start',
        error
      );
    }
  }

  async stop(): Promise<void> {
    if (this._status === 'idle' || this._status === 'stopped') {
      return;
    }

    if (!this.stopper) {
      this._status = 'stopped';
      return;
    }

    this._status = 'stopping';

    try {
      await this.stopper();
      this._status = 'stopped';
    } catch (error) {
      this._status = 'failed';
      throw new IntegrationServiceError(
        `Failed to stop service '${this.name}'`,
        this.name,
        'stop',
        error
      );
    }
  }
}

export class ServiceLifecycleManager {
  private readonly services: ManagedService[] = [];

  register(registration: ServiceRegistration): RegisteredService {
    const existing = this.services.find(
      service => service.name === registration.name
    );
    if (existing) {
      throw new Error(
        `Service with name '${registration.name}' already registered`
      );
    }

    const managed = new ManagedService(registration);
    this.services.push(managed);
    return managed;
  }

  getService(name: string): RegisteredService | undefined {
    return this.services.find(service => service.name === name);
  }

  list(): readonly RegisteredService[] {
    return [...this.services];
  }

  async startAll(): Promise<void> {
    for (const service of this.services) {
      await service.start();
    }
  }

  async stopAll(): Promise<void> {
    for (const service of [...this.services].reverse()) {
      await service.stop();
    }
  }
}
