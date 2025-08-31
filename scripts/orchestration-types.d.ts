// Ambient type declarations for orchestration v2 JS modules.
// Keeps strict TypeScript tests happy without converting runtime files to TS yet.

export interface ServiceDefinition {
  name: string;
  type?: string;
  command: string;
  smokeCommand?: string;
  port: number;
  healthPath: string;
  startupTimeoutMs: number;
  smokeStartupTimeoutMs?: number;
  dependencies?: string[];
  executionConfig?: Record<string, unknown>;
  environment?: Record<string, string>;
  restart?: Record<string, unknown>;
}

export interface ServiceManifest {
  version: string;
  global: Record<string, any>;
  services: Record<string, ServiceDefinition>;
}

// base-executor.mjs
declare module './command-executors/base-executor.mjs' {
  import type { ChildProcess } from 'node:child_process';
  export class BaseExecutor {
    service: ServiceDefinition;
    options: any;
    constructor(service: ServiceDefinition, options?: any);
    run(command: string, env: Record<string, string | undefined>): ChildProcess;
    attachLogs(child: ChildProcess, name: string): void;
  }
  export default BaseExecutor;
}

// pnpm-executor.mjs
declare module './command-executors/pnpm-executor.mjs' {
  import type { ChildProcess } from 'node:child_process';
  import { BaseExecutor } from './command-executors/base-executor.mjs';
  export class PnpmExecutor extends BaseExecutor {
    run(command: string, env: Record<string, string | undefined>): ChildProcess;
  }
  export default PnpmExecutor;
}

// registry.mjs
declare module './command-executors/registry.mjs' {
  export function registerExecutor(type: string, executorClass: any): void;
  export function getExecutor(type: string): any;
  export function listExecutorTypes(): string[];
}

// environment/resolver.mjs
declare module './environment/resolver.mjs' {
  import type {
    ServiceManifest,
    ServiceDefinition,
  } from '../orchestration-types.d.ts';
  export function interpolate(value: string, ctx: any): string;
  export function resolveEnvironment(
    service: ServiceDefinition,
    manifest: ServiceManifest,
    options?: { processEnv?: Record<string, string | undefined> }
  ): Record<string, string | undefined>;
}

// service-launcher.mjs
declare module './service-launcher.mjs' {
  import type { ServiceManifest } from './orchestration-types.d.ts';
  import type { ChildProcess } from 'node:child_process';
  export function validateServiceDefinition(
    name: string,
    service: any
  ): string[];
  export function launchService(
    name: string,
    manifest: ServiceManifest,
    options?: { overrideCommand?: string }
  ): {
    process: ChildProcess;
    env: Record<string, string | undefined>;
    executorType: string;
  };
}

// service-manifest-loader.mjs
declare module './service-manifest-loader.mjs' {
  import type { ServiceManifest } from './orchestration-types.d.ts';
  export function loadServiceManifest(path?: string): Promise<ServiceManifest>;
  const _default: { loadServiceManifest: typeof loadServiceManifest };
  export default _default;
}

declare module './dev-orchestration.v3.mjs' {
  export function topologicalOrder(
    services: Record<string, { dependencies?: string[] }>
  ): string[];
  export function orchestrate(): Promise<void>;
  const _default: {
    topologicalOrder: typeof topologicalOrder;
    orchestrate: typeof orchestrate;
  };
  export default _default;
}
declare module '../../scripts/service-manifest-loader.mjs' {
  import type { ServiceManifest } from '../../scripts/orchestration-types.d.ts';
  export function loadServiceManifest(path?: string): Promise<ServiceManifest>;
  const _default: { loadServiceManifest: typeof loadServiceManifest };
  export default _default;
}
declare module '../../scripts/service-manifest-loader-shim.js' {
  import type { ServiceManifest } from '../../scripts/orchestration-types.d.ts';
  export function loadServiceManifest(path?: string): Promise<ServiceManifest>;
}
