import { TextDecoder, TextEncoder } from 'node:util';

/**
 * Ensures global TextEncoder/TextDecoder implementations exist when running
 * browser-targeted bundles in a Node test runtime. This prevents esbuild from
 * throwing when it references the Web Encoding API while compiling guard
 * bundles for Playwright.
 */
function install(
  key: 'TextEncoder' | 'TextDecoder',
  implementation: unknown
): void {
  Object.defineProperty(globalThis, key, {
    value: implementation,
    configurable: true,
    writable: true,
  });
}

function needsEncoderPatch(): boolean {
  try {
    if (typeof globalThis.TextEncoder === 'undefined') {
      return true;
    }
    const encoder = new globalThis.TextEncoder();
    return !(encoder.encode('') instanceof Uint8Array);
  } catch {
    return true;
  }
}

function needsDecoderPatch(): boolean {
  try {
    if (typeof globalThis.TextDecoder === 'undefined') {
      return true;
    }
    const decoder = new globalThis.TextDecoder();
    return !(decoder.decode(new Uint8Array()) === '');
  } catch {
    return true;
  }
}

export function ensureTextEncoding(): void {
  if (needsEncoderPatch()) {
    install('TextEncoder', TextEncoder);
  }

  if (needsDecoderPatch()) {
    install('TextDecoder', TextDecoder);
  }
}
