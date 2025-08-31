/**
 * Base Command Executor
 * Defines the minimal interface for all service type executors.
 * Executors encapsulate spawn & fallback logic for a specific service "type" (pnpm, docker, shell, ...).
 */
import { spawn } from 'node:child_process';
import process from 'node:process';

export class BaseExecutor {
  /**
   * @param {object} service Service definition from manifest
   * @param {object} options Additional execution context
   */
  constructor(service, options = {}) {
    this.service = service;
    this.options = options;
  }

  /** Default spawn implementation (single attempt). Subclasses override for fallbacks. */
  run(command, env) {
    const child = spawn(command, {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
      shell: true,
    });
    this.attachLogs(child, this.service.name || 'service');
    return child;
  }

  attachLogs(child, name) {
    child.stdout?.on('data', d => process.stdout.write(`[${name}] ${d}`));
    child.stderr?.on('data', d => process.stderr.write(`[${name}][err] ${d}`));
  }
}

export default BaseExecutor;