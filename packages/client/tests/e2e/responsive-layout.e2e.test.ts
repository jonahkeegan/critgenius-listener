/* c8 ignore file */
import { test } from '@playwright/test';

import { validatePlaywrightConfig } from './helpers/config-validator';
import {
  startClientAppServer,
  stopClientAppServer,
} from './helpers/test-fixtures';
import { AppPage } from './helpers/page-objects';
import {
  expectFlexDirection,
  expectNoHorizontalScroll,
  expectVisible,
} from './helpers/assertions';

let baseUrl: string;

test.beforeAll(async ({ browser }, workerInfo) => {
  void browser;
  validatePlaywrightConfig(workerInfo.config);
  baseUrl = await startClientAppServer();
});

test.afterAll(async () => {
  await stopClientAppServer();
});

test('responsive layout adapts across desktop, tablet, and mobile breakpoints', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-desktop',
    'Responsive layout smoke runs once using the chromium desktop project.'
  );

  test.slow();
  const app = new AppPage(page);

  await page.setViewportSize({ width: 1920, height: 1080 });
  await app.goto(baseUrl);
  await app.waitForReady();

  await expectVisible(app.layoutContainer());
  await expectFlexDirection(app.layoutContainer(), 'row');
  await expectNoHorizontalScroll(page);

  await page.setViewportSize({ width: 767, height: 1024 });
  await page.reload();
  await app.waitForReady();

  await expectFlexDirection(app.layoutContainer(), 'column');
  await expectNoHorizontalScroll(page);

  await page.setViewportSize({ width: 375, height: 667 });
  await page.reload();
  await app.waitForReady();

  await expectFlexDirection(app.layoutContainer(), 'column');
  await expectNoHorizontalScroll(page);
});
