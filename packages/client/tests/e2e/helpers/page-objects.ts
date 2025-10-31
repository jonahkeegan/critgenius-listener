import type { Locator, Page } from '@playwright/test';

export class AppPage {
  constructor(private readonly page: Page) {}

  async goto(baseUrl: string): Promise<void> {
    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  }

  async waitForReady(): Promise<void> {
    await this.page.getByTestId('layout-root').waitFor({ state: 'visible' });
  }

  startRecordingButton(): Locator {
    return this.page.getByRole('button', { name: 'Start Recording' });
  }

  stopRecordingButton(): Locator {
    return this.page.getByRole('button', { name: 'Stop Recording' });
  }

  recordingIndicator(): Locator {
    return this.page.getByTestId('recording-indicator');
  }

  recordingMeter(): Locator {
    return this.page.getByTestId('recording-meter');
  }

  connectionStatusSection(): Locator {
    return this.page.getByTestId('connection-status-section');
  }

  connectionErrorMessage(): Locator {
    return this.page.getByTestId('connection-error-message');
  }

  layoutContainer(): Locator {
    return this.page.getByTestId('layout-root');
  }

  async startRecording(): Promise<void> {
    await this.startRecordingButton().click();
  }

  async stopRecording(): Promise<void> {
    await this.stopRecordingButton().click();
  }
}
