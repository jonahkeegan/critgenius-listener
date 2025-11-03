// Percy helper utilities for visual regression testing
import { Page } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * Percy snapshot options interface
 */
export interface PercySnapshotOptions {
  name?: string;
  widths?: number[];
  minHeight?: number;
  enableJavaScript?: boolean;
  percyCSS?: string;
}

/**
 * Default Percy configuration aligned with percy.config.yml
 */
export const PERCY_CONFIG = {
  widths: [375, 768, 1920], // Mobile, Tablet, Desktop
  minHeight: 1024,
  enableJavaScript: true,
};

const MUI_READY_SELECTOR = '.MuiTypography-root';
const MUI_WAIT_TIMEOUT_MS = 3000;
const MUI_TRANSITION_SETTLE_MS = 500;
const MUI_FALLBACK_SETTLE_MS = 250;

/**
 * Wait for page to be fully loaded and stable for visual testing
 */
export async function waitForPageStability(page: Page): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');

  // Wait for any animations to complete
  await page.waitForTimeout(1000);

  // Wait for any lazy-loaded content
  await page
    .waitForSelector('[data-testid="content-loaded"]', {
      timeout: 5000,
    })
    .catch(() => {
      // Content loaded indicator might not exist, continue anyway
    });
}

/**
 * Take a responsive Percy snapshot with default configuration
 */
export async function takeResponsiveSnapshot(
  page: Page,
  name: string,
  options: PercySnapshotOptions = {}
): Promise<void> {
  // Wait for page stability
  await waitForPageStability(page);

  const snapshotName = options.name ?? name;

  // Merge default config with provided options
  const snapshotOptions = {
    widths: options.widths ?? PERCY_CONFIG.widths,
    minHeight: options.minHeight ?? PERCY_CONFIG.minHeight,
    enableJavaScript: options.enableJavaScript ?? PERCY_CONFIG.enableJavaScript,
    ...(options.percyCSS ? { percyCSS: options.percyCSS } : {}),
  };

  // Take the Percy snapshot
  await percySnapshot(page, snapshotName, snapshotOptions);
}

/**
 * Take a Percy snapshot for a specific viewport width
 */
export async function takeViewportSnapshot(
  page: Page,
  name: string,
  width: number,
  height: number = 1080
): Promise<void> {
  // Set viewport
  await page.setViewportSize({ width, height });

  // Wait for responsive layout to settle
  await page.waitForTimeout(500);

  // Take snapshot with single width
  await takeResponsiveSnapshot(page, `${name}-${width}px`, {
    widths: [width],
  });
}

/**
 * Hide dynamic elements that might cause visual drift
 */
export async function hideDynamicElements(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      /* Hide timestamps and live indicators */
      [data-testid="timestamp"],
      [data-testid="live-indicator"],
      .MuiTimer-root,
      .live-pulse,
      .timestamp,
      .live-indicator {
        visibility: hidden !important;
      }

      /* Disable animations for consistent snapshots */
      *,
      *::before,
      *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }

      /* Mock loading states */
      .loading-placeholder {
        background-color: #f0f0f0 !important;
      }

      /* Hide scrollbars for cleaner snapshots */
      ::-webkit-scrollbar {
        display: none;
      }

      /* Ensure consistent font rendering */
      body {
        font-smoothing: antialiased;
        -webkit-font-smoothing: antialiased;
      }
    `,
  });
}

/**
 * Setup page for visual testing with Percy best practices
 */
export async function setupPageForVisualTesting(
  page: Page,
  url: string = 'about:blank',
  options: {
    hideDynamicElements?: boolean;
    waitForSelector?: string;
    additionalSetup?: () => Promise<void>;
    mockExternalResources?: boolean;
  } = {}
): Promise<void> {
  const {
    hideDynamicElements: shouldHideDynamicElements = true,
    waitForSelector,
    additionalSetup,
    mockExternalResources: shouldMockExternalResources = true,
  } = options;

  if (shouldMockExternalResources) {
    await PercyTestUtils.mockExternalResources(page);
  }

  // Navigate to the page
  await page.goto(url);

  // Apply responsive breakpoints for consistent layout
  await PercyTestUtils.setupResponsiveBreakpoints(page);

  // Hide dynamic elements if requested
  if (shouldHideDynamicElements) {
    await hideDynamicElements(page);
  }

  // Wait for specific selector if provided
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector);
  }

  // Run additional setup if provided
  if (additionalSetup) {
    await additionalSetup();
  }

  // Wait for initial stability
  await waitForPageStability(page);
}

/**
 * Take a component snapshot with proper setup and teardown
 */
export async function snapshotComponent(
  page: Page,
  componentName: string,
  setupFn: () => Promise<void>,
  options: PercySnapshotOptions & {
    url?: string;
    hideDynamicElements?: boolean;
    mockExternalResources?: boolean;
  } = {}
): Promise<void> {
  const {
    url = 'about:blank',
    hideDynamicElements: shouldHideDynamicElements = true,
    mockExternalResources: shouldMockExternalResources = true,
    ...snapshotOptions
  } = options;

  // Setup page
  await setupPageForVisualTesting(page, url, {
    hideDynamicElements: shouldHideDynamicElements,
    mockExternalResources: shouldMockExternalResources,
    additionalSetup: setupFn,
  });

  // Take snapshot
  await takeResponsiveSnapshot(page, componentName, snapshotOptions);
}

/**
 * Validate that Percy snapshots were taken successfully
 */
export async function validateSnapshotSuccess(page: Page): Promise<void> {
  // Check for any JavaScript errors that might affect snapshots
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  // Wait a moment for any async errors
  await page.waitForTimeout(1000);

  // Report any errors found
  if (errors.length > 0) {
    console.warn('JavaScript errors detected during visual testing:', errors);
  }
}

/**
 * Percy-specific test utilities for consistent visual testing
 */
export class PercyTestUtils {
  /**
   * Create a standardized test name for Percy snapshots
   */
  static createSnapshotName(
    component: string,
    state: string,
    viewport?: string
  ): string {
    const parts = [component, state];
    if (viewport) {
      parts.push(viewport);
    }
    return parts.join('-').toLowerCase();
  }

  /**
   * Wait for Material-UI components to be fully rendered
   */
  static async waitForMUIComponents(page: Page): Promise<void> {
    try {
      // Wait for Material-UI theme to be applied when present
      await page.waitForSelector(MUI_READY_SELECTOR, {
        timeout: MUI_WAIT_TIMEOUT_MS,
      });

      // Wait for any MUI transitions to complete
      await page.waitForTimeout(MUI_TRANSITION_SETTLE_MS);
    } catch {
      // No MUI elements detected; allow a short settle delay instead
      await page.waitForTimeout(MUI_FALLBACK_SETTLE_MS);
    }
  }

  /**
   * Setup responsive breakpoints for testing
   */
  static async setupResponsiveBreakpoints(page: Page): Promise<void> {
    // Add viewport meta tag if not present (for mobile testing)
    await page.addStyleTag({
      content: `
        @viewport {
          width: device-width;
          zoom: 1.0;
        }
      `,
    });
  }

  /**
   * Mock external resources that might affect visual consistency
   */
  static async mockExternalResources(page: Page): Promise<void> {
    // Mock external fonts for consistent typography
    await page.route('**/fonts.googleapis.com/**', route => {
      route.abort();
    });

    // Mock external images that might not load consistently
    await page.route('**/images.unsplash.com/**', route => {
      route.abort();
    });
  }
}

/**
 * Viewport configurations matching Playwright and Percy settings
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
} as const;

/**
 * Test data configurations for consistent visual states
 */
export const TEST_DATA = {
  characters: {
    minimal: [{ id: '1', name: 'Test', class: 'Warrior', isAlive: true }],
    typical: 'characterScenarios.default',
    maximal: 'characterScenarios.manyCharacters',
  },
  speakers: {
    minimal: [
      {
        id: '1',
        name: 'Test',
        isActive: true,
        speakingState: 'silent' as const,
      },
    ],
    typical: 'speakerScenarios.default',
    maximal: 'speakerScenarios.manySpeakers',
  },
  transcripts: {
    minimal: [
      {
        id: '1',
        speakerId: '1',
        speakerName: 'Test',
        text: 'Test',
        timestamp: new Date(),
      },
    ],
    typical: 'transcriptScenarios.default',
    maximal: 'transcriptScenarios.longSession',
  },
} as const;
