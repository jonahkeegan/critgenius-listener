/**
 * @fileoverview Test setup configuration for React client
 * Configures Testing Library and global test environment
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { installTestRuntime } from '@critgenius/test-utils/runtime';
import { registerMatchers } from '@critgenius/test-utils/matchers';
import {
  configureAxe,
  registerAccessibilityMatchers,
} from '@critgenius/test-utils/accessibility';

const runtime = installTestRuntime();
runtime.installGlobals();
registerMatchers();
registerAccessibilityMatchers();

configureAxe({
  runOptions: {
    rules: {
      'media-has-caption': { enabled: false },
      'color-contrast': { enabled: true },
      label: { enabled: true },
      'button-name': { enabled: true },
      'link-name': { enabled: true },
    },
  },
});

if (typeof window !== 'undefined') {
  // Setup for client-side testing
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// Mock IntersectionObserver
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

// Mock ResizeObserver
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}
