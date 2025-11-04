// Percy helper utilities for visual regression testing
import { Page, type ConsoleMessage } from '@playwright/test';
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
const PAGE_ANIMATION_SETTLE_TIMEOUT_MS = 3000;
const PAGE_ANIMATION_FALLBACK_DELAY_MS = 150;
const EVENT_LOOP_SETTLE_FRAMES = 2;
const PERCY_ORIGIN = 'http://percy.local';
const percyOriginPages = new WeakSet<Page>();

async function waitForAnimationsToComplete(page: Page): Promise<void> {
  try {
    await page.waitForFunction(
      () => {
        const animations =
          typeof document.getAnimations === 'function'
            ? Array.from(document.getAnimations())
            : [];
        const hasActiveAnimations = animations.some(
          animation => animation.playState === 'running'
        );
        const root = document.documentElement;
        const hasTransitionState =
          root?.hasAttribute('data-transitioning') ||
          root?.hasAttribute('data-animating');
        return !hasActiveAnimations && !hasTransitionState;
      },
      { timeout: PAGE_ANIMATION_SETTLE_TIMEOUT_MS }
    );
  } catch {
    await page.waitForTimeout(PAGE_ANIMATION_FALLBACK_DELAY_MS);
  }
}

async function waitForEventLoopToSettle(page: Page): Promise<void> {
  try {
    await page.evaluate(frames => {
      return new Promise<void>(resolve => {
        if (typeof requestAnimationFrame !== 'function') {
          setTimeout(resolve, 0);
          return;
        }

        let remaining = frames;
        const advance = () => {
          remaining -= 1;
          if (remaining <= 0) {
            resolve();
            return;
          }

          requestAnimationFrame(advance);
        };

        requestAnimationFrame(advance);
      });
    }, EVENT_LOOP_SETTLE_FRAMES);
  } catch {
    // Fallback to a macrotask delay if evaluate fails (detached frame, etc.)
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  }
}

/**
 * Wait for page to be fully loaded and stable for visual testing
 */
export async function waitForPageStability(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await waitForAnimationsToComplete(page);
  await page
    .waitForSelector('[data-testid="content-loaded"]', {
      timeout: 5000,
    })
    .catch(() => {
      /* no-op: element optional */
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
  await waitForPageStability(page);

  const snapshotName = options.name ?? name;
  const snapshotOptions = {
    widths: options.widths ?? PERCY_CONFIG.widths,
    minHeight: options.minHeight ?? PERCY_CONFIG.minHeight,
    enableJavaScript: options.enableJavaScript ?? PERCY_CONFIG.enableJavaScript,
    ...(options.percyCSS ? { percyCSS: options.percyCSS } : {}),
  };

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
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(500);
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
    documentPath?: string;
  } = {}
): Promise<void> {
  const {
    hideDynamicElements: shouldHideDynamicElements = true,
    waitForSelector,
    additionalSetup,
    mockExternalResources: shouldMockExternalResources = true,
    documentPath,
  } = options;

  if (shouldMockExternalResources) {
    await PercyTestUtils.mockExternalResources(page);
  }

  let targetUrl = url;
  if (!url || url === 'about:blank') {
    const pathSlug = sanitizeDocumentPath(documentPath);
    await PercyTestUtils.ensurePercyOrigin(page);
    targetUrl = `${PERCY_ORIGIN}/${pathSlug}`;
  }

  await page.goto(targetUrl);
  await PercyTestUtils.setupResponsiveBreakpoints(page);

  if (shouldHideDynamicElements) {
    await hideDynamicElements(page);
  }

  if (waitForSelector) {
    await page.waitForSelector(waitForSelector);
  }

  if (additionalSetup) {
    await additionalSetup();
  }

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

  await setupPageForVisualTesting(page, url, {
    hideDynamicElements: shouldHideDynamicElements,
    mockExternalResources: shouldMockExternalResources,
    documentPath: componentName,
    additionalSetup: setupFn,
  });

  await takeResponsiveSnapshot(page, componentName, snapshotOptions);
}

/**
 * Validate that Percy snapshots were taken successfully
 */
export async function validateSnapshotSuccess(page: Page): Promise<void> {
  const errors: string[] = [];

  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  };

  const onPageError = (error: Error) => {
    errors.push(error.message);
  };

  page.on('console', onConsole);
  page.on('pageerror', onPageError);

  await waitForEventLoopToSettle(page);

  page.off('console', onConsole);
  page.off('pageerror', onPageError);

  if (errors.length > 0) {
    console.warn('JavaScript errors detected during visual testing:', errors);
  }
}

/**
 * Percy-specific test utilities for consistent visual testing
 */
export class PercyTestUtils {
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

  static async waitForMUIComponents(page: Page): Promise<void> {
    try {
      await page.waitForSelector(MUI_READY_SELECTOR, {
        timeout: MUI_WAIT_TIMEOUT_MS,
      });
      await page.waitForTimeout(MUI_TRANSITION_SETTLE_MS);
    } catch {
      await page.waitForTimeout(MUI_FALLBACK_SETTLE_MS);
    }
  }

  static async ensurePercyOrigin(page: Page): Promise<void> {
    if (percyOriginPages.has(page)) {
      return;
    }

    await page.route(`${PERCY_ORIGIN}/**`, route => {
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body data-percy-root></body></html>',
      });
    });

    percyOriginPages.add(page);
  }

  static async setupResponsiveBreakpoints(page: Page): Promise<void> {
    await page.addStyleTag({
      content: `
        @viewport {
          width: device-width;
          zoom: 1.0;
        }
      `,
    });
  }

  static async mockExternalResources(page: Page): Promise<void> {
    await page.route('**/fonts.googleapis.com/**', route => {
      route.abort();
    });

    await page.route('**/images.unsplash.com/**', route => {
      route.abort();
    });
  }
}

export const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
} as const;

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
        joinTime: new Date(),
        lastActivity: new Date(),
      },
    ],
    typical: 'speakerScenarios.default',
    maximal: 'speakerScenarios.manySpeakers',
  },
};

function sanitizeDocumentPath(path?: string): string {
  if (!path) {
    return 'visual-test';
  }

  const slug = path
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug.length > 0 ? slug : 'visual-test';
}
