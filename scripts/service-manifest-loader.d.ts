export interface ServiceDefinition {
  name: string;
  command: string;
  smokeCommand?: string;
  port: number;
  healthPath: string;
  startupTimeoutMs: number;
  smokeStartupTimeoutMs?: number;
  dependencies?: string[];
  environment?: Record<string, string>;
}
export interface ServiceManifest {
  version: string;
  metadata?: { name?: string; description?: string };
  global: {
    pollIntervalMs: number;
    monitorIntervalMs: number;
    restartBackoffMs: number;
  };
  services: Record<string, ServiceDefinition>;
}
export function loadServiceManifest(
  manifestPath?: string
): Promise<ServiceManifest>;
declare const _default: { loadServiceManifest: typeof loadServiceManifest };
export default _default;
