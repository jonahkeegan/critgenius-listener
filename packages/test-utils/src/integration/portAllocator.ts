import { createServer } from 'node:net';
import type { AddressInfo } from 'node:net';

/**
 * Allocates an available TCP port on the current machine. Useful for integration tests that need
 * to avoid port collisions when running in parallel.
 */
export async function allocateAvailablePort(): Promise<number> {
  return await new Promise<number>((resolve, reject) => {
    const server = createServer();

    const disposeWithError = (error: unknown) => {
      server.close();
      reject(
        error instanceof Error
          ? error
          : new Error(`Failed to allocate port: ${String(error)}`)
      );
    };

    server.once('error', disposeWithError);

    server.listen(0, () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        disposeWithError(
          new Error('Failed to resolve allocated port address.')
        );
        return;
      }

      const { port } = address as AddressInfo;

      server.close(err => {
        if (err) {
          disposeWithError(err);
          return;
        }

        resolve(port);
      });
    });
  });
}
