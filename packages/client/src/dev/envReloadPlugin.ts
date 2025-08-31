/**
 * Env reload Vite plugin: triggers a full browser reload when any `.env*` file
 * (or extra user-specified paths) changes. Does not log secret contents.
 */
import path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

const ENV_EXTRA_VAR = 'ENV_RELOAD_EXTRA';

export interface EnvReloadPluginOptions {
  /** Custom env var name for extra watch list (comma-separated). */
  extraVarName?: string;
  /** Root override (mainly for tests). */
  rootDir?: string;
}

export function envReloadPlugin(options: EnvReloadPluginOptions = {}): Plugin {
  const extraVar = options.extraVarName ?? ENV_EXTRA_VAR;
  let rootRef: string;
  const watched: string[] = [];

  return {
    name: 'env-reload-plugin',
    apply: 'serve' as const,
    configureServer(server: ViteDevServer) {
      rootRef = options.rootDir || server.config.root || process.cwd();
      const baseFiles = ['.env', '.env.local', '.env.development'];
      baseFiles.forEach(f => watched.push(path.join(rootRef, f)));

      const extraRaw = process.env[extraVar];
      if (extraRaw) {
        extraRaw
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
          .forEach(seg => {
            watched.push(path.isAbsolute(seg) ? seg : path.join(rootRef, seg));
          });
      }

      watched.forEach(f => server.watcher.add(f));

      const trigger = (file: string): void => {
        server.ws.send({ type: 'full-reload' });
        server.config.logger.info(
          `[env-reload] full-reload (changed: ${path.relative(rootRef, file)})`
        );
      };

      server.watcher.on('change', (p: string) => {
        if (watched.includes(p)) trigger(p);
      });
    },
  };
}

export default envReloadPlugin;
