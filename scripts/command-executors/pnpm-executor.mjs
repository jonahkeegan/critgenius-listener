/**
 * PNPM Executor
 * Adds fallback attempts (corepack, npx pnpm) to mitigate Windows PATH / corepack activation issues.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';
import { BaseExecutor } from './base-executor.mjs';

export class PnpmExecutor extends BaseExecutor {
  run(command, env) {
    const executionCfg = this.service.executionConfig || {};
    const fallbackCommands = executionCfg.fallbackCommands || [
      'pnpm',
      'corepack pnpm',
      'npx pnpm',
    ];
    // If full command includes pnpm already keep order; otherwise prefix fallback variants.
    const attempts = [];
    if (command) attempts.push(command);
    // Provide canonical base if service.command already includes pnpm sub command.
    const baseCmd = command.startsWith('pnpm ')
      ? command
      : `pnpm ${command}`;
    for (const fb of fallbackCommands) {
      const candidate = command.startsWith(fb)
        ? command
        : `${fb} ${command.replace(/^pnpm\s+/, '')}`;
      if (!attempts.includes(candidate)) attempts.push(candidate);
    }
    let child;
    let lastError;
    for (const attempt of attempts) {
      try {
        child = spawn(attempt, {
          stdio: ['inherit', 'pipe', 'pipe'],
          env: { ...process.env, ...env },
          shell: true,
        });
        this.attachLogs(child, this.service.name || 'pnpm');
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (!child) throw lastError || new Error('Failed to spawn pnpm command');
    return child;
  }
}

export default PnpmExecutor;