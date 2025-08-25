/**
 * Ambient global type declarations for the client bundle.
 * Provides the GlobalWithClientEnv interface used to access the Vite injected
 * __CLIENT_ENV__ object containing the sanitized runtime configuration.
 */
import type { ClientRuntimeConfig } from './config/environment';

declare global {
  interface GlobalWithClientEnv {
    __CLIENT_ENV__?: Partial<ClientRuntimeConfig>;
  }
}

export {};
