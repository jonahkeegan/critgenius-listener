/**
 * Service Launcher (v2 experimental)
 * Orchestrates launching a single service using the executor registry & environment resolver.
 */
import { getExecutor } from './command-executors/registry.mjs';
import { resolveEnvironment } from './environment/resolver.mjs';

export function validateServiceDefinition(name, service) {
  const errors = [];
  if (!service) errors.push('service missing');
  else {
    if (!service.command) errors.push('command missing');
    if (typeof service.port !== 'number') errors.push('port must be number');
    if (!service.healthPath) errors.push('healthPath missing');
    if (typeof service.startupTimeoutMs !== 'number') errors.push('startupTimeoutMs missing');
  }
  return errors;
}

export function launchService(name, manifest, options = {}) {
  const service = manifest.services[name];
  const errors = validateServiceDefinition(name, service);
  if (errors.length) {
    const err = new Error(`Invalid service ${name}:\n` + errors.map(e => ' - ' + e).join('\n'));
    err.validationErrors = errors;
    throw err;
  }
  const type = service.type || 'pnpm';
  const Env = resolveEnvironment(service, manifest, options);
  const ExecutorCls = getExecutor(type);
  const executor = new ExecutorCls(service, { manifest, options });
  const command = options.overrideCommand || service.command;
  const child = executor.run(command, Env);
  return { process: child, env: Env, executorType: type };
}

export default { launchService };