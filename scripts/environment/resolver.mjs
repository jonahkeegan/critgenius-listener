/**
 * Environment Resolver
 * Supports interpolation patterns within service.environment values:
 *  - ${port}                -> service.port
 *  - ${env.VAR_NAME}        -> process.env.VAR_NAME
 *  - ${service.name}        -> service.name
 *  - ${global.someKey}      -> manifest.global.someKey
 * Unresolvable tokens are left intact (to aid debugging).
 */
import process from 'node:process';

export function interpolate(value, ctx) {
  if (typeof value !== 'string') return value;
  return value.replace(/\$\{([^}]+)\}/g, (_, expr) => {
    if (expr === 'port') return String(ctx.service.port);
    if (expr.startsWith('env.')) {
      const key = expr.slice(4);
      return ctx.processEnv[key] !== undefined ? String(ctx.processEnv[key]) : '';
    }
    if (expr.startsWith('service.')) {
      const key = expr.slice(8);
      return ctx.service[key] !== undefined ? String(ctx.service[key]) : '';
    }
    if (expr.startsWith('global.')) {
      const key = expr.slice(7);
      return ctx.global[key] !== undefined ? String(ctx.global[key]) : '';
    }
    return `\${${expr}}`; // leave original pattern for visibility
  });
}

export function resolveEnvironment(service, manifest, options = {}) {
  const processEnv = options.processEnv || process.env;
  const base = { ...processEnv }; // start from current env (do not remove existing)
  const ctx = { service, global: manifest.global || {}, processEnv };
  if (service.environment && typeof service.environment === 'object') {
    for (const [k, v] of Object.entries(service.environment)) {
      if (base[k] === undefined) base[k] = interpolate(v, ctx);
    }
  }
  return base;
}

export default { resolveEnvironment };