import { beforeAll, describe, it, expect } from 'vitest';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type ServiceGraph = Record<string, { dependencies?: string[] }>;

let topologicalOrder: (services: ServiceGraph) => string[];
let loadServiceManifest: (manifestPath?: string) => Promise<{
  services: ServiceGraph;
}>;

beforeAll(async () => {
  const orchestratorModule = await import(
    pathToFileURL(
      path.resolve(process.cwd(), 'scripts/dev-orchestration.v3.mjs')
    ).href
  );
  const manifestModule = await import(
    pathToFileURL(
      path.resolve(process.cwd(), 'scripts/service-manifest-loader.mjs')
    ).href
  );

  topologicalOrder = orchestratorModule.topologicalOrder;
  loadServiceManifest = manifestModule.loadServiceManifest;
});

describe('dev-orchestration.v3 topology', () => {
  it('orders simple dependency chain', () => {
    const services = {
      a: { dependencies: [] },
      b: { dependencies: ['a'] },
      c: { dependencies: ['b'] },
    };
    const order = topologicalOrder(services);
    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('throws on cycle', () => {
    const services = {
      a: { dependencies: ['c'] },
      b: { dependencies: ['a'] },
      c: { dependencies: ['b'] },
    };
    expect(() => topologicalOrder(services)).toThrow(
      /Cycle detected in service dependency graph: a -> c -> b -> a/
    );
  });

  it('ensures repository service manifest is acyclic', async () => {
    const manifest = await loadServiceManifest(
      path.resolve(process.cwd(), 'services.yaml')
    );

    expect(() => topologicalOrder(manifest.services)).not.toThrow();
  });
});
