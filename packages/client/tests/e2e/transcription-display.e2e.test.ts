/* c8 ignore file */
import { test } from '@playwright/test';

import { validatePlaywrightConfig } from './helpers/config-validator';
import {
  startClientAppServer,
  stopClientAppServer,
} from './helpers/test-fixtures';
import { AppPage } from './helpers/page-objects';
import { mockTranscriptEvent } from './fixtures/mock-audio-data';
import { expectVisible } from './helpers/assertions';

let baseUrl: string;

test.beforeAll(async ({ browser }, workerInfo) => {
  void browser;
  validatePlaywrightConfig(workerInfo.config);
  baseUrl = await startClientAppServer();
});

test.afterAll(async () => {
  await stopClientAppServer();
});

test('transcription updates propagate via SocketService without runtime errors', async ({
  page,
}) => {
  test.slow();
  const app = new AppPage(page);
  await app.goto(baseUrl);
  await app.waitForReady();

  await expectVisible(app.connectionStatusSection());

  await page.waitForFunction(() => {
    const globalWindow = window as typeof window & {
      __critgeniusSocketService?: {
        emitTestEvent: (event: string, ...args: ReadonlyArray<unknown>) => void;
      } & {
        listeners?: Record<string, Array<unknown>>;
      };
    };
    const service = globalWindow.__critgeniusSocketService;
    if (!service) return false;
    const listeners = service.listeners;
    return Boolean(listeners?.transcriptionUpdate?.length);
  });

  await page.evaluate(() => {
    const globalWindow = window as typeof window & {
      __critgeniusSocketEvents?: Array<{
        event: string;
        payload: ReadonlyArray<unknown>;
      }>;
    };

    if (Array.isArray(globalWindow.__critgeniusSocketEvents)) {
      globalWindow.__critgeniusSocketEvents.length = 0;
    } else {
      globalWindow.__critgeniusSocketEvents = [];
    }
  });

  await page.evaluate(payload => {
    const globalWindow = window as typeof window & {
      __critgeniusSocketService?: {
        emitTestEvent: (event: string, ...args: ReadonlyArray<unknown>) => void;
      };
    };

    const service = globalWindow.__critgeniusSocketService;
    if (!service) {
      throw new Error('Socket service test handle not available');
    }

    service.emitTestEvent('transcriptionUpdate', payload);
  }, mockTranscriptEvent);

  await page.waitForFunction(expectedText => {
    const globalWindow = window as typeof window & {
      __critgeniusSocketEvents?: Array<{
        event: string;
        payload: ReadonlyArray<unknown>;
      }>;
    };

    const events = globalWindow.__critgeniusSocketEvents;
    if (!Array.isArray(events)) {
      return false;
    }

    return events.some(entry => {
      if (entry.event !== 'transcriptionUpdate') {
        return false;
      }

      const payload = entry.payload?.[0];
      if (!payload || typeof payload !== 'object') {
        return false;
      }

      if (!('text' in payload)) {
        return false;
      }

      return (payload as { text?: unknown }).text === expectedText;
    });
  }, mockTranscriptEvent.text);
});
