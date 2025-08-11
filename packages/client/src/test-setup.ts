/**
 * @fileoverview Test setup configuration for React client
 * Configures Testing Library and global test environment
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to ignore specific console methods in tests
  // log: vi.fn(),
  // debug: vi.fn(),
  // info: vi.fn(),
  // warn: vi.fn(),
  // error: vi.fn(),
};

// Mock window.matchMedia for components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

// Mock MediaRecorder for audio recording tests
class MockMediaRecorder {
  static isTypeSupported = vi.fn(() => true);
  
  state = 'inactive';
  ondataavailable = null;
  onstop = null;
  onerror = null;
  onstart = null;
  
  constructor() {
    // Mock implementation
  }
  
  start = vi.fn(() => {
    this.state = 'recording';
    if (this.onstart) this.onstart(new Event('start'));
  });
  
  stop = vi.fn(() => {
    this.state = 'inactive';
    if (this.onstop) this.onstop(new Event('stop'));
  });
  
  pause = vi.fn();
  resume = vi.fn();
}

global.MediaRecorder = MockMediaRecorder as any;

console.log('🧪 Client test environment configured successfully!');