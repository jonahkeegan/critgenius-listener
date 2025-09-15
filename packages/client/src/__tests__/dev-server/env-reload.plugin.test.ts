import { describe, it, expect, vi, beforeEach } from 'vitest';
import { envReloadPlugin } from '../../dev/envReloadPlugin';
import path from 'path';

interface MockServer {
  config: {
    root: string;
    logger: { info: ReturnType<typeof vi.fn>; warn: ReturnType<typeof vi.fn> };
  };
  watcher: {
    add: (p: string) => void;
    on: (evt: string, cb: (file: string) => void) => void;
  };
  ws: { send: ReturnType<typeof vi.fn> };
  emitChange: (file: string) => void;
  added: string[];
}

function createMockServer(): MockServer {
  const listeners: Record<string, Array<(file: string) => void>> = {};
  const added: string[] = [];
  return {
    config: { root: process.cwd(), logger: { info: vi.fn(), warn: vi.fn() } },
    watcher: {
      add: (p: string) => {
        added.push(p);
      },
      on: (evt: string, cb: (file: string) => void) => {
        (listeners[evt] ||= []).push(cb);
      },
    },
    ws: { send: vi.fn() },
    emitChange: (file: string) => {
      (listeners['change'] || []).forEach(l => l(file));
    },
    added,
  };
}

describe('envReloadPlugin', () => {
  let server: ReturnType<typeof createMockServer>;
  beforeEach(() => {
    server = createMockServer();
  });

  it('watches base env files and triggers full reload', () => {
    const plugin = envReloadPlugin();
    if (typeof plugin.configureServer === 'function') {
      plugin.configureServer(server as any);
    } else if (
      plugin.configureServer &&
      typeof (plugin.configureServer as any).handler === 'function'
    ) {
      (plugin.configureServer as any).handler(server as any);
    }
    const envFile = server.added.find(p => p.endsWith(`${path.sep}.env`));
    expect(envFile).toBeTruthy();
    server.emitChange(envFile!);
    expect(server.ws.send).toHaveBeenCalledWith({ type: 'full-reload' });
  });

  it('includes extra files via ENV_RELOAD_EXTRA', () => {
    process.env.ENV_RELOAD_EXTRA = 'extra.env';
    const plugin = envReloadPlugin();
    if (typeof plugin.configureServer === 'function') {
      plugin.configureServer(server as any);
    } else if (
      plugin.configureServer &&
      typeof (plugin.configureServer as any).handler === 'function'
    ) {
      (plugin.configureServer as any).handler(server as any);
    }
    expect(server.added.some(p => p.endsWith('extra.env'))).toBe(true);
    delete process.env.ENV_RELOAD_EXTRA;
  });

  it('processes extraWatchPaths option (relative + absolute)', () => {
    const abs = path.join(process.cwd(), 'abs.file');
    const plugin = envReloadPlugin({
      rootDir: server.config.root,
      extraWatchPaths: ['relative.file', abs, '', undefined as unknown as string],
    });
    if (typeof plugin.configureServer === 'function') {
      plugin.configureServer(server as any);
    } else if (
      plugin.configureServer &&
      typeof (plugin.configureServer as any).handler === 'function'
    ) {
      (plugin.configureServer as any).handler(server as any);
    }
    expect(server.added).toContain(path.join(server.config.root, 'relative.file'));
    expect(server.added).toContain(abs);
  });

  it('merges extraWatchPaths with ENV_RELOAD_EXTRA (backward compatible)', () => {
    process.env.ENV_RELOAD_EXTRA = 'legacy.file';
    const plugin = envReloadPlugin({
      rootDir: server.config.root,
      extraWatchPaths: ['explicit.file'],
    });
    if (typeof plugin.configureServer === 'function') {
      plugin.configureServer(server as any);
    } else if (
      plugin.configureServer &&
      typeof (plugin.configureServer as any).handler === 'function'
    ) {
      (plugin.configureServer as any).handler(server as any);
    }
    expect(server.added).toContain(path.join(server.config.root, 'explicit.file'));
    expect(server.added).toContain(path.join(server.config.root, 'legacy.file'));
    delete process.env.ENV_RELOAD_EXTRA;
  });
});
