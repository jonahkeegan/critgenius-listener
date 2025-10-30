import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export async function expectVisible(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
}

export async function expectHidden(locator: Locator): Promise<void> {
  await expect(locator).toBeHidden();
}

export async function expectAbsent(locator: Locator): Promise<void> {
  await expect(locator).toHaveCount(0);
}

export async function expectFlexDirection(
  locator: Locator,
  direction: 'row' | 'column'
): Promise<void> {
  await expect(locator).toHaveCSS('flex-direction', direction);
}

export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const hasScroll = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth > el.clientWidth;
  });
  expect(hasScroll).toBe(false);
}

export async function expectMinimumTouchTarget(
  locator: Locator,
  minSize = 44
): Promise<void> {
  const box = await locator.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(minSize);
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(minSize);
}
