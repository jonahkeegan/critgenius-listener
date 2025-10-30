/* c8 ignore file */
import { test } from '@playwright/test';

import { validatePlaywrightConfig } from './helpers/config-validator';
import {
  startClientAppServer,
  stopClientAppServer,
} from './helpers/test-fixtures';
import { AppPage } from './helpers/page-objects';
import {
  expectVisible,
  expectAbsent,
  expectMinimumTouchTarget,
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

test('audio capture workflow toggles recording state with visual feedback', async ({
  page,
}) => {
  test.slow();
  const app = new AppPage(page);
  await app.goto(baseUrl);
  await app.waitForReady();

  const startButton = app.startRecordingButton();
  await expectVisible(startButton);
  await expectMinimumTouchTarget(startButton);

  await app.startRecording();

  await expectVisible(app.stopRecordingButton());
  await expectVisible(app.recordingIndicator());
  await expectVisible(app.recordingMeter());

  await app.stopRecording();

  await expectVisible(app.startRecordingButton());
  await expectAbsent(app.recordingIndicator());
  await expectAbsent(app.recordingMeter());

  // Ensure status card remains visible after the recording cycle
  await expectVisible(app.connectionStatusSection());
});
