/**
 * Env reload Vite plugin: triggers a full browser reload when any `.env*` file
 * (or extra user-specified paths) changes. Does not log secret contents.
 *
 * Configuration sources (merged):
 * - options.extraWatchPaths (preferred)
 * - process.env[ENV_RELOAD_EXTRA] (comma-separated, backward compatible)
 */
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

const ENV_EXTRA_VAR = 'ENV_RELOAD_EXTRA';

export interface EnvReloadPluginOptions {
  /** Explicit array of additional file paths to watch for changes. */
  extraWatchPaths?: string[];
  /** Custom env var name for extra watch list (comma-separated). */
  extraVarName?: string;
  /** Root override (mainly for tests). */
  rootDir?: string;
}

export function envReloadPlugin(options: EnvReloadPluginOptions = {}): Plugin {
  const extraVar = options.extraVarName ?? ENV_EXTRA_VAR;
  let rootRef: string;
  // Canonicalize a file path for stable equality checks across platforms
  const canon = (p: string): string => {
    const n = path.normalize(p);
    return process.platform === 'win32' ? n.toLowerCase() : n;
  };
  const watched = new Map<string, string>(); // key: canonical, value: original abs
  const addWatch = (p: string) => {
    if (!p) return;
    const abs = path.isAbsolute(p) ? p : path.join(rootRef, p);
    watched.set(canon(abs), abs);
  };

  return {
    name: 'env-reload-plugin',
    apply: 'serve' as const,
    configureServer(server: ViteDevServer) {
      rootRef = options.rootDir || server.config.root || process.cwd();
  const baseFiles = ['.env', '.env.local', '.env.development'];
  baseFiles.forEach(f => addWatch(f));

      // 1) Explicit extraWatchPaths option (preferred)
      if (options.extraWatchPaths && options.extraWatchPaths.length > 0) {
        for (const p of options.extraWatchPaths) addWatch(p);
      }

      const extraRaw = process.env[extraVar];
      if (extraRaw) {
        extraRaw
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(seg => addWatch(seg));
      }

  watched.forEach(abs => server.watcher.add(abs));

      const trigger = (file: string): void => {
        server.ws.send({ type: 'full-reload' });
        server.config.logger.info(
          `[env-reload] full-reload (changed: ${path.relative(rootRef, file)})`
        );
      };

      server.watcher.on('change', (p: string) => {
        if (watched.has(canon(p))) trigger(p);
      });
    },
  };
}

export default envReloadPlugin;
