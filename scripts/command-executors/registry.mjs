/**
 * Command Executor Registry
 * Lightweight plugin-style registry for mapping service.type -> executor class.
 */
import { PnpmExecutor } from './pnpm-executor.mjs';

const registry = new Map();
registry.set('pnpm', PnpmExecutor);

export function registerExecutor(type, executorClass) {
  registry.set(type, executorClass);
}

export function getExecutor(type) {
  const Cls = registry.get(type) || PnpmExecutor;
  return Cls;
}

export function listExecutorTypes() {
  return Array.from(registry.keys());
}

export default { registerExecutor, getExecutor, listExecutorTypes };