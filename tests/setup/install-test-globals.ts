import { webcrypto } from 'node:crypto';
import {
  TextDecoder as NodeTextDecoder,
  TextEncoder as NodeTextEncoder,
} from 'node:util';

type GlobalWithPolyfills = typeof globalThis & {
  TextEncoder?: typeof TextEncoder;
  TextDecoder?: typeof TextDecoder;
  crypto?: Crypto;
  window?: typeof globalThis & {
    TextEncoder?: typeof TextEncoder;
    TextDecoder?: typeof TextDecoder;
  };
};

const globalRef = globalThis as GlobalWithPolyfills;

const normalizeEncoder = (ctor: typeof TextEncoder): typeof TextEncoder => {
  const Base = ctor as unknown as typeof TextEncoder;
  class NormalizedTextEncoder extends Base {
    encode(input?: string): Uint8Array {
      const payload = input ?? '';
      const raw = super.encode(payload);
      return new Uint8Array(raw.buffer);
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
