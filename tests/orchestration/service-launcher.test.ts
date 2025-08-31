import { describe, it, expect } from 'vitest';
import { registerExecutor } from '../../scripts/command-executors/registry.mjs';
import { launchService } from '../../scripts/service-launcher.mjs';
import { EventEmitter } from 'node:events';

// Register a mock executor to avoid spawning real processes
class MockChild extends EventEmitter {
  command = '';
  env = {};
  exited = false;
  kill() {
    if (!this.exited) {
      this.exited = true;
      this.emit('exit', 0);
    }
  }
}
class MockExecutor {
  service: any;
  constructor(service: any) {
    this.service = service;
  }
  run(command: string, env: Record<string, string | undefined>) {
    const child = new MockChild();
    setTimeout(() => child.emit('exit', 0), 10);
    child.command = command;
    child.env = env;
    return child;
  }
}
registerExecutor('mock', MockExecutor);

describe('service launcher', () => {
  it('launches a mock service and returns process handle', () => {
    const manifest = {
      global: { pollIntervalMs: 10 },
      services: {
        demo: {
          name: 'demo',
          type: 'mock',
          command: 'echo demo',
          port: 1234,
          healthPath: '/health',
          startupTimeoutMs: 1000,
          environment: { PORT: '${port}' },
        },
      },
    };
    const { process: child, executorType } = launchService('demo', manifest);
    expect(executorType).toBe('mock');
    expect(child).toBeDefined();
    expect(child.command).toBe('echo demo');
    // env interpolation delegated to resolver -> should set PORT
    expect(child.env.PORT).toBe('1234');
  });
});
