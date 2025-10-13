import { createRequire } from 'module';
import { webcrypto } from 'node:crypto';
import {
  TextDecoder as NodeTextDecoder,
  TextEncoder as NodeTextEncoder,
} from 'node:util';

type GlobalWithPolyfills = typeof globalThis & {
  TextEncoder?: typeof TextEncoder;
  TextDecoder?: typeof TextDecoder;
  crypto?: Crypto;
  MutationObserver?: typeof MutationObserver;
  window?: typeof globalThis & {
    TextEncoder?: typeof TextEncoder;
    TextDecoder?: typeof TextDecoder;
    MutationObserver?: typeof MutationObserver;
  };
};

const globalRef = globalThis as GlobalWithPolyfills;
const require = createRequire(import.meta.url);
let mutationObserverModule:
  | {
      default?: typeof MutationObserver;
      MutationObserver?: typeof MutationObserver;
    }
  | (typeof MutationObserver | undefined);

const loadMutationObserverPolyfill = ():
  | typeof MutationObserver
  | undefined => {
  if (mutationObserverModule) {
    if (typeof mutationObserverModule === 'function') {
      return mutationObserverModule;
    }
    return (
      mutationObserverModule.MutationObserver ?? mutationObserverModule.default
    );
  }

  if (typeof window === 'undefined') {
    return undefined;
  }

  mutationObserverModule = require('mutationobserver-shim') as
    | typeof MutationObserver
    | {
        default?: typeof MutationObserver;
        MutationObserver?: typeof MutationObserver;
      };

  if (typeof mutationObserverModule === 'function') {
    return mutationObserverModule;
  }

  return (
    mutationObserverModule.MutationObserver ?? mutationObserverModule.default
  );
};

const normalizeEncoder = (ctor: typeof TextEncoder): typeof TextEncoder => {
  const Base = ctor as unknown as typeof TextEncoder;
  class NormalizedTextEncoder extends Base {
    encode(input?: string): ReturnType<typeof Base.prototype.encode> {
      const payload = input ?? '';
      return super.encode(payload);
    }
  }

  return NormalizedTextEncoder as unknown as typeof TextEncoder;
};

const normalizeDecoder = (ctor: typeof TextDecoder): typeof TextDecoder => {
  try {
    const testInstance = new ctor();
    const decoded = testInstance.decode(new Uint8Array());
    if (decoded === '') {
      return ctor;
    }
  } catch {
    // fall through to normalization
  }

  const Base = ctor as unknown as typeof TextDecoder;
  class NormalizedTextDecoder extends Base {
    decode(
      input?: Parameters<TextDecoder['decode']>[0],
      options?: Parameters<TextDecoder['decode']>[1]
    ): string {
      if (
        input instanceof Uint8Array ||
        input === undefined ||
        input === null
      ) {
        return super.decode(
          input as Parameters<TextDecoder['decode']>[0],
          options
        );
      }
      const normalized =
        input instanceof ArrayBuffer
          ? new Uint8Array(input)
          : new Uint8Array(input as ArrayBufferLike);
      return super.decode(
        normalized as Parameters<TextDecoder['decode']>[0],
        options
      );
    }
  }

  return NormalizedTextDecoder as unknown as typeof TextDecoder;
};

const resolveEncoder = (): typeof TextEncoder => {
  const fromGlobal = globalRef.TextEncoder ?? globalRef.window?.TextEncoder;
  if (fromGlobal) {
    return normalizeEncoder(fromGlobal);
  }
  return normalizeEncoder(NodeTextEncoder as unknown as typeof TextEncoder);
};

const resolveDecoder = (): typeof TextDecoder => {
  const fromGlobal = globalRef.TextDecoder ?? globalRef.window?.TextDecoder;
  if (fromGlobal) {
    return normalizeDecoder(fromGlobal);
  }
  return normalizeDecoder(NodeTextDecoder as unknown as typeof TextDecoder);
};

globalRef.TextEncoder = resolveEncoder();
globalRef.TextDecoder = resolveDecoder();

if (
  !globalRef.crypto ||
  typeof globalRef.crypto.getRandomValues !== 'function'
) {
  globalRef.crypto = webcrypto as unknown as Crypto;
}

// jsdom environments may omit MutationObserver; install the shim so waitFor/findByRole can react
// to DOM mutations emitted by Material UI portals.
if (!globalRef.MutationObserver) {
  class ReactiveMutationObserver implements MutationObserver {
    private readonly callback: MutationCallback;

    constructor(callback: MutationCallback) {
      this.callback = callback;
    }

    observe(): void {
      queueMicrotask(() => this.callback([], this));
    }

    disconnect(): void {
      // no-op stub
    }

    takeRecords(): MutationRecord[] {
      return [];
    }
  }

  const polyfillExport = loadMutationObserverPolyfill();
  const polyfillCtor =
    (typeof polyfillExport === 'function' ? polyfillExport : undefined) ??
    globalRef.window?.MutationObserver ??
    (ReactiveMutationObserver as unknown as typeof MutationObserver);

  globalRef.MutationObserver = polyfillCtor as typeof MutationObserver;
  if (globalRef.window) {
    globalRef.window.MutationObserver = polyfillCtor as typeof MutationObserver;
  }
}
