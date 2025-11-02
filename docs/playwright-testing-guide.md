# Playwright Testing Guide

**Version:** 1.0.1 **Last Updated:** 2025-11-01 **Status:** Complete Reference Guide **Recent
Changes:** Added CI browser installation optimization documentation

## Executive Summary

This guide provides comprehensive Playwright testing documentation for the CritGenius: Listener
project, focusing on E2E browser testing patterns across Chromium, Firefox, and WebKit. It covers
the complete testing lifecycle from installation through debugging and troubleshooting for D&D audio
capture and transcription workflows.

**Related Documentation:**

- [Comprehensive Testing Guide](./comprehensive-testing-guide.md) - Parent testing reference
- [Developer Onboarding](./developer-onboarding.md) - Initial setup workflows
- [HTTPS Development Setup](./https-development-setup.md) - Certificate requirements

---

## Table of Contents

1. [Quick Start & Environment Setup](#1-quick-start--environment-setup)
2. [Core Testing Patterns](#2-core-testing-patterns)
3. [Browser Compatibility Matrix](#3-browser-compatibility-matrix)
4. [Debugging Workflows with VSCode](#4-debugging-workflows-with-vscode)
5. [Troubleshooting Procedures](#5-troubleshooting-procedures)

---

## 1. Quick Start & Environment Setup

**Purpose**: Get developers from zero to first E2E test in under 10 minutes.

### 1.1 Prerequisites & Installation

Before beginning E2E testing, ensure your environment meets these requirements:

- **Node.js**: Version 16+ (verified in project)
- **pnpm**: Workspace package manager (configured in project)
- **HTTPS Certificate**: Local development certificates (see
  [HTTPS Development Setup](./https-development-setup.md))
- **VSCode**: Recommended IDE with debug configurations

**🚀 PRODUCTIVITY ENHANCEMENT**: Use `fd` instead of `find` for finding test files and
configuration:

```bash
# Old way: find . -name "*.e2e.test.ts"
# New way: fd ".e2e.test.ts"

# Find Playwright config: fd playwright.config
# Find test directories: fd -t d "e2e"
```

**Benefit**: 3-10x faster file discovery, ignores .gitignore, colored output by default.

### Browser Installation Workflow

```sequenceDiagram
participant Dev as Developer
participant CLI as pnpm CLI
participant Playwright as Playwright Installer
participant System as Operating System

Dev->>CLI: pnpm run test:e2e:install
CLI->>Playwright: Execute playwright install
Playwright->>System: Download Chromium binaries
System-->>Playwright: Binaries installed
Playwright->>System: Download Firefox binaries
System-->>Playwright: Binaries installed
Playwright->>System: Download WebKit binaries
System-->>Playwright: Binaries installed
Playwright->>System: Install OS dependencies
System-->>Playwright: Dependencies installed
Playwright-->>CLI: Installation complete
CLI-->>Dev: Ready for E2E testing
```

### Installation Commands

```bash
# One-time browser setup (required before first test run)
pnpm run test:e2e:install

# Verify installation
pnpm run test:e2e --version

# List available browsers
pnpm exec playwright show-trace --help
```

### 1.4 CI/CD Browser Installation Optimization

**Performance Enhancement**: Starting November 2025, the CI workflow has been optimized to install
only the specific browser required for each matrix job, reducing CI time by ~10-15 minutes per
workflow run.

**Before (Inefficient)**:

```yaml
# Each job installed all browsers regardless of need
if [[ "${{ matrix.browser }}" == "edge-desktop" ]]; then pnpm --filter @critgenius/client exec --
playwright install --with-deps chromium firefox webkit msedge else pnpm --filter @critgenius/client
exec -- playwright install --with-deps chromium firefox webkit fi
```

**After (Optimized)**:

```yaml
# Each job installs only the specific browser it needs
case "${{ matrix.browser }}" in
  chromium*) BROWSER="chromium" ;;
  firefox*) BROWSER="firefox" ;;
  webkit*) BROWSER="webkit" ;;
  edge-desktop) BROWSER="msedge" ;;
  *)
    echo "Unknown browser: ${{ matrix.browser }}"
    exit 1
    ;;
esac
pnpm --filter @critgenius/client exec -- playwright install --with-deps "$BROWSER"
```

**Benefits**:

- **~75% reduction** in browser downloads per job
- **~60-75% faster** browser installation per job
- **~10-15 minutes saved** per complete CI workflow run
- **~70% reduction** in bandwidth usage per job

**Browser Mapping Table**: | CI Job | Installed Browser | Download Size | Expected Time |
|--------|------------------|---------------|---------------| | chromium-desktop/tablet/mobile |
chromium | ~50MB | ~30s | | firefox-desktop | firefox | ~80MB | ~45s | | webkit-desktop | webkit |
~60MB | ~35s | | edge-desktop | msedge | ~100MB | ~60s |

**Development vs CI Differences**:

- **Local Development**: Still install all browsers for comprehensive testing
- **CI/CD**: Optimized to install only required browser per matrix job
- **Maintenance**: Case statement automatically validates new browser matrix entries
- **Error Handling**: Fast failure with clear error messages for unknown browser entries

### 1.2 First Test Creation

#### Step-by-Step Test Creation

1. **Navigate to test directory**:

   ```bash
   cd packages/client
   ```

2. **Create test file** with naming convention: `*.e2e.test.ts`

   ```bash
   # Use fd to find existing test structure
   fd ".e2e.test.ts" packages/client/tests/
   ```

3. **Basic test template**:

   ```typescript
   // packages/client/tests/e2e/basic-navigation.e2e.test.ts
   import { test, expect } from '@playwright/test';

   test('application loads successfully', async ({ page }) => {
     // Navigate to application
     await page.goto('https://localhost:5173');

     // Wait for application to be ready
     await page.waitForLoadState('networkidle');

     // Verify page title
     await expect(page).toHaveTitle(/CritGenius/);

     // Verify main UI element is visible
     await expect(page.locator('[data-testid="main-container"]')).toBeVisible();
   });
   ```

#### Test Execution Workflow

```sequenceDiagram
participant Dev as Developer
participant TestFile as Test File
participant Playwright as Playwright Runner
participant Browser as Browser Process
participant App as CritGenius App
participant Assertions as Test Assertions

Dev->>TestFile: Create *.e2e.test.ts
Dev->>TestFile: Define test case
TestFile->>Playwright: Run test command
Playwright->>Browser: Launch browser instance
Browser->>Browser: Apply fake media configuration
Playwright->>Browser: Navigate to baseURL
Browser->>App: Load application
App-->>Browser: DOM ready
Playwright->>Browser: Execute test actions
Browser->>App: Interact with UI
App-->>Browser: UI state changes
Playwright->>Assertions: Evaluate expectations
Assertions->>Assertions: Assert conditions
alt All assertions pass
    Assertions-->>Playwright: Test passes
    Playwright->>Browser: Close browser
    Playwright-->>Dev: ✓ Test successful
else Assertion fails
    Assertions-->>Playwright: Test fails
    Playwright->>Browser: Capture failure artifacts
    Playwright->>Browser: Close browser
    Playwright-->>Dev: ✗ Test failed with artifacts
end
```

### 1.3 Quick Reference Commands

| Command                     | Purpose                        | When to Use                    |
| --------------------------- | ------------------------------ | ------------------------------ |
| `pnpm run test:e2e`         | Run all E2E tests headless     | CI/CD, quick validation        |
| `pnpm run test:e2e:headed`  | Run tests with visible browser | Debugging, visual verification |
| `pnpm run test:e2e:ui`      | Open interactive test UI       | Test development, exploration  |
| `pnpm run test:e2e:debug`   | Run tests in debug mode        | Step-through debugging         |
| `pnpm run test:e2e:install` | Install browser binaries       | Initial setup                  |

**🚀 PRODUCTIVITY ENHANCEMENT**: Use `ripgrep (rg)` instead of `grep` for searching through
documentation and code:

```bash
# Old way: grep -r "E2E testing" docs/
# New way: rg "E2E testing" docs/

# Search specific file types: rg -tpy "test.*playwright"
# Case-insensitive search: rg -i "microphone" --type ts
# Show context lines: rg -A 3 -B 3 "test.describe"
```

**Benefit**: 2-5x faster, respects .gitignore, better output formatting with colors and line
numbers.

---

## 2. Core Testing Patterns

**Purpose**: Document proven patterns specific to CritGenius audio processing and real-time
transcription.

### 2.1 Page Object Model Pattern

For complex audio capture interfaces, use the Page Object Model to organize interactions:

```typescript
// packages/client/tests/e2e/pages/AudioCapturePage.ts
import { Page } from '@playwright/test';

export class AudioCapturePage {
  constructor(private page: Page) {}

  private selectors = {
    startButton: '[data-testid="start-recording"]',
    stopButton: '[data-testid="stop-recording"]',
    status: '[data-testid="recording-status"]',
    visualizer: '[data-testid="audio-visualizer"]',
    permissionButton: '[data-testid="grant-microphone-permission"]',
  };

  async grantMicrophonePermission() {
    await this.page.click(this.selectors.permissionButton);
    await this.page.waitForTimeout(1000);
  }

  async startRecording() {
    await this.page.click(this.selectors.startButton);
    await this.page.waitForSelector(this.selectors.visualizer);
  }

  async stopRecording() {
    await this.page.click(this.selectors.stopButton);
  }

  async getRecordingStatus(): Promise<string> {
    return await this.page.textContent(this.selectors.status);
  }

  async isVisualizerActive(): Promise<boolean> {
    return await this.page.locator(this.selectors.visualizer).isVisible();
  }
}
```

**Usage Example**:

```typescript
import { test, expect } from '@playwright/test';
import { AudioCapturePage } from '../pages/AudioCapturePage';

test('complete audio recording workflow', async ({ page }) => {
  const audioPage = new AudioCapturePage(page);

  await page.goto('https://localhost:5173');
  await audioPage.grantMicrophonePermission();
  await audioPage.startRecording();

  expect(await audioPage.isVisualizerActive()).toBe(true);
  expect(await audioPage.getRecordingStatus()).toContain('Recording');

  await audioPage.stopRecording();
  expect(await audioPage.getRecordingStatus()).toContain('Stopped');
});
```

### 2.2 Microphone Access Testing Pattern

**Pattern Overview**: Testing microphone access requires HTTPS context, permission grants, and
synthetic media streams.

**Microphone Permission Flow**:

```sequenceDiagram
participant Test as E2E Test
participant Context as Browser Context
participant Page as Browser Page
participant Guard as Microphone Guard
participant MediaAPI as Web Audio API

Test->>Context: Create browser context
Test->>Context: grantPermissions(['microphone'])
Context-->>Test: Permissions granted

Test->>Page: Navigate to HTTPS URL
Page->>Page: Load application
Test->>Page: addInitScript(guardBootstrap)
Page-->>Test: Script injected

Test->>Page: evaluate(createGuard)
Page->>Guard: Initialize guard
Guard->>Guard: Check HTTPS context
Guard->>Guard: Evaluate() → SUPPORTED

Test->>Guard: requestAccess()
Guard->>MediaAPI: getUserMedia()
MediaAPI->>MediaAPI: Apply fake media stream
MediaAPI-->>Guard: Return MediaStream

Guard->>Guard: Count audio tracks
Guard-->>Test: { status: 'granted', trackCount: 1 }

Test->>Test: Assert granted status
Test->>Test: Assert track count ≥ 1
Test->>MediaAPI: Stop all tracks
Test-->>Test: ✓ Test complete
```

**Complete Implementation**:

```typescript
// packages/client/tests/e2e/microphone-access.e2e.test.ts
import { test, expect } from '@playwright/test';

// Microphone guard bootstrap script
const guardBootstrap = `
  window.__createMicrophoneAccessGuard = () => {
    return {
      evaluate: async () => {
        if (!window.isSecureContext) {
          return { status: 'NOT_SECURE', error: 'HTTPS required' };
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return { status: 'UNSUPPORTED', error: 'getUserMedia not available' };
        }

        return { status: 'SUPPORTED' };
      },

      requestAccess: async () => {
        try {
          const mediaStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          });

          return {
            status: 'granted',
            mediaStream,
            trackCount: mediaStream.getAudioTracks().length
          };
        } catch (error) {
          return { status: 'denied', error: error.message };
        }
      }
    };
  };
`;

test('microphone guard grants access over HTTPS', async ({ page, context }) => {
  // GIVEN: Browser context with microphone permission
  await context.grantPermissions(['microphone'], {
    origin: 'https://localhost:5173',
  });

  await page.addInitScript({ content: guardBootstrap });
  await page.goto('https://localhost:5173');

  // WHEN: Initialize guard and request access
  const result = await page.evaluate(async () => {
    const guard = window.__createMicrophoneAccessGuard();
    const evaluation = await guard.evaluate();

    if (evaluation.status !== 'SUPPORTED') {
      return { status: 'unsupported', error: evaluation.error };
    }

    const access = await guard.requestAccess();
    return { status: access.status, trackCount: access.trackCount, error: access.error };
    };
  });

  // THEN: Access should be granted with valid track
  expect(result.status).toBe('granted');
  expect(result.trackCount).toBeGreaterThanOrEqual(1);
});
```

**Browser-Specific Considerations**:

| Browser  | Permission Method       | Fake Media Support | Notes                           |
| -------- | ----------------------- | ------------------ | ------------------------------- |
| Chromium | `grantPermissions()`    | ✅ Built-in        | Use launch args for fake stream |
| Firefox  | `firefoxUserPrefs`      | ✅ Built-in        | Configure in playwright.config  |
| WebKit   | Synthetic stream needed | ⚠️ Manual          | Requires custom implementation  |

### 2.3 Socket.IO Event Testing Pattern

**Pattern Overview**: Testing real-time Socket.IO events requires event buffer instrumentation and
deterministic payload capture.

**Socket Event Testing Sequence Diagram**:

```sequenceDiagram
participant Test as Test
participant Page as Page
participant Client as Socket Client
participant Server as Socket Server
participant Buffer as Event Buffer

Test->>Page: Navigate to app
Page->>Client: Initialize socket connection
Client->>Server: Connect
Server-->>Client: Connection established

Test->>Page: Inject event buffer script
Page->>Buffer: Initialize __critgeniusSocketEvents

Test->>Page: Trigger transcript request
Page->>Client: Emit transcript:start
Client->>Server: Forward event

Server->>Server: Process request
Server->>Client: Emit transcript:partial
Client->>Buffer: Push event to buffer

Server->>Client: Emit transcript:final
Client->>Buffer: Push event to buffer

Test->>Page: Evaluate buffer contents
Buffer-->>Test: Return captured events

Test->>Test: Assert event count
Test->>Test: Assert event order
Test->>Test: Assert payload structure
```

**Implementation Example**:

```typescript
// packages/client/tests/e2e/socket-events.e2e.test.ts
import { test, expect } from '@playwright/test';

const socketEventBuffer = `
  window.__critgeniusSocketEvents = [];

  // Instrument Socket.IO client to capture events
  if (window.io) {
    const originalEmit = window.io.prototype.emit;
    window.io.prototype.emit = function(event, ...args) {
      window.__critgeniusSocketEvents.push({
        type: event,
        timestamp: Date.now(),
        args: args
      });
      return originalEmit.call(this, event, ...args);
    };
  }
`;

test('captures transcript events in correct order', async ({ page }) => {
  // GIVEN: Application loaded with event buffer
  await page.goto('https://localhost:5173');
  await page.addInitScript({ content: socketEventBuffer });

  // WHEN: Transcript flow is triggered
  await page.click('[data-testid="start-transcript"]');
  await page.waitForTimeout(2000); // Allow events to accumulate

  // THEN: Events should be captured in correct order
  const events = await page.evaluate(() => window.__critgeniusSocketEvents);

  expect(events).toHaveLength(3);
  expect(events[0].type).toBe('transcript:start');
  expect(events[1].type).toBe('transcript:partial');
  expect(events[2].type).toBe('transcript:final');
});
```

### 2.4 Test Isolation and Cleanup

**Best Practices**:

- Use `test.beforeEach()` for consistent state setup
- Clean up resources in `test.afterEach()`
- Stop media streams to prevent leaks
- Clear IndexedDB between tests if applicable
- Ensure socket connections are closed

**Example Cleanup Pattern**:

```typescript
test.afterEach(async ({ page }) => {
  // Stop all media streams
  await page.evaluate(() => {
    const streams = window.__activeMediaStreams || [];
    streams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
  });

  // Close socket connections
  await page.evaluate(() => {
    if (window.__socketClient) {
      window.__socketClient.disconnect();
    }
  });
});
```

---

## 3. Browser Compatibility Matrix

**Purpose**: Provide comprehensive reference for multi-browser support variations.

### 3.1 Supported Browsers Table

| Browser  | Version         | Microphone API | WebSocket | HTTPS Requirement | CI Support | Notes                           |
| -------- | --------------- | -------------- | --------- | ----------------- | ---------- | ------------------------------- |
| Chromium | Latest (stable) | ✅ Full        | ✅ Full   | ✅ Required       | ✅ Yes     | Primary development browser     |
| Firefox  | Latest (stable) | ✅ Full        | ✅ Full   | ✅ Required       | ✅ Yes     | Requires firefoxUserPrefs       |
| WebKit   | Latest (stable) | ⚠️ Synthetic   | ✅ Full   | ✅ Required       | ⚠️ macOS   | Synthetic media stream fallback |

### 3.2 Browser-Specific Configuration

**Chromium Configuration**:

```typescript
// packages/client/playwright.config.ts
{
  name: 'chromium',
  use: {
    ...devices['Desktop Chrome'],
    launchOptions: {
      args: [
        '--use-fake-device-for-media-stream',
        '--use-fake-ui-for-media-stream',
      ],
    },
  },
}
```

**Firefox Configuration**:

```typescript
// packages/client/playwright.config.ts
{
  name: 'firefox',
  use: {
    ...devices['Desktop Firefox'],
    launchOptions: {
      firefoxUserPrefs: {
        'media.navigator.streams.fake': true,
        'media.navigator.permission.disabled': true,
      },
    },
  },
}
```

**WebKit Configuration**:

```typescript
// packages/client/playwright.config.ts
{
  name: 'webkit',
  use: {
    ...devices['Desktop Safari'],
    // Note: WebKit requires synthetic MediaStream fallback
    // See microphone access pattern section for implementation
  },
}
```

### 3.3 Known Browser Quirks

| Issue                     | Affected Browsers | Workaround                     | Reference                               |
| ------------------------- | ----------------- | ------------------------------ | --------------------------------------- |
| Fake media streams        | WebKit            | Implement synthetic stream     | `microphone-access.e2e.test.ts` line 85 |
| Permission API diff       | Firefox           | Use firefoxUserPrefs           | `playwright.config.ts` line 112         |
| Video track requirement   | All               | Request audio-only constraints | MediaStream API docs                    |
| Socket reconnection delay | Firefox           | Increase timeout threshold     | `socket-connection.e2e.test.ts` line 45 |
| HTTPS certificate trust   | WebKit            | Add to system trust store      | `docs/https-development-setup.md`       |

---

## 4. Debugging Workflows with VSCode

**Purpose**: Enable efficient debugging of E2E tests within VSCode environment.

### 4.1 VSCode Debug Configuration

**Complete `.vscode/launch.json` Configuration**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Playwright Tests",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/packages/client",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["exec", "playwright", "test", "--debug"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Current Playwright Test",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/packages/client",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["exec", "playwright", "test", "${file}", "--debug"],
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Playwright Test (Headed)",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/packages/client",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["exec", "playwright", "test", "--headed", "--debug"],
      "console": "integratedTerminal"
    }
  ]
}
```

### 4.2 Headed Mode Debugging

**Headed Debugging Sequence Diagram**:

```sequenceDiagram
participant Dev as Developer
participant VSCode as VSCode Debugger
participant Playwright as Playwright
participant Browser as Browser (Visible)
participant Inspector as Playwright Inspector

Dev->>VSCode: Start debug session
VSCode->>Playwright: Launch with --headed --debug
Playwright->>Browser: Open visible browser
Playwright->>Inspector: Open Playwright Inspector

Inspector->>Dev: Display test steps
Dev->>Inspector: Set breakpoints
Dev->>Inspector: Step through test

loop Test execution
    Inspector->>Browser: Execute action
    Browser->>Browser: Perform UI interaction
    Inspector->>Inspector: Pause at breakpoint
    Dev->>Inspector: Inspect state
    Dev->>Inspector: Continue/Step
end

Dev->>Inspector: Review results
Inspector->>Playwright: Test complete
Playwright->>Browser: Close browser
```

**Commands for Headed Debugging**:

```bash
# Run specific test in headed mode
pnpm run test:e2e:headed -- microphone-access.e2e.test.ts

# Run with Playwright Inspector UI
pnpm run test:e2e:debug -- microphone-access.e2e.test.ts

# Run in UI mode (interactive test runner)
pnpm run test:e2e:ui
```

**🚀 PRODUCTIVITY ENHANCEMENT:** Use `watchexec` for automatic test execution during development:

```bash
# Old way: Manual test re-running after each code change
# New way: Automatic test execution on file changes

# Watch TypeScript and JavaScript files and run tests automatically
watchexec -e ts,js -- npm run test:e2e

# Watch specific test files and run headed mode for debugging
watchexec -e ts -- pnpm run test:e2e:headed

# Clear screen before each run and restart on changes
watchexec -e ts,js -c -r -- pnpm run test:e2e

# Watch only specific directories
watchexec -w packages/client/tests -e ts -- pnpm run test:e2e
```

**Benefit**: 50%+ time savings in development workflow, automatic test execution on file changes,
cross-platform compatibility (no WSL needed on Windows).

### 4.3 Trace Viewer Analysis

**Trace Analysis Sequence Diagram**:

```sequenceDiagram
participant Dev as Developer
participant Test as Failed Test
participant TraceFile as Trace File
participant Viewer as Trace Viewer
participant Timeline as Timeline View

Test->>TraceFile: Generate trace on failure
TraceFile->>TraceFile: Save to test-results/

Dev->>Viewer: Open trace viewer
Dev->>Viewer: Load trace file
Viewer->>Timeline: Display test timeline
Timeline->>Dev: Show all actions

loop Analysis
    Dev->>Timeline: Select action
    Timeline->>Viewer: Show screenshot
    Timeline->>Viewer: Show console logs
    Timeline->>Viewer: Show network activity
    Dev->>Viewer: Inspect DOM snapshot
    Dev->>Viewer: Review action details
end

Dev->>Dev: Identify failure cause
```

**Trace Viewer Commands**:

```bash
# Enable tracing in playwright.config.ts (already configured)
trace: 'on-first-retry'

# View traces after test failure
pnpm exec playwright show-trace test-results/path-to-trace.zip

# Open UI mode with built-in trace viewer
pnpm run test:e2e:ui
```

### 4.4 Console and Network Inspection

**Best Practices**:

- Monitor browser console logs for runtime errors
- Inspect network requests to validate API calls
- Check WebSocket messages for Socket.IO events
- Verify resource loading timing

**Example: Capturing Console Logs**:

```typescript
test('capture console errors', async ({ page }) => {
  const consoleMessages: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(msg.text());
    }
  });

  await page.goto('https://localhost:5173');
  // Test actions...

  // Assert no console errors occurred
  expect(consoleMessages).toHaveLength(0);
});
```

---

## 5. Troubleshooting Procedures

**Purpose**: Provide systematic approach to diagnosing and resolving common E2E test issues.

### 5.1 Troubleshooting Decision Tree

**Troubleshooting Workflow Sequence Diagram**:

```sequenceDiagram
participant Dev as Developer
participant Diagnostic as Diagnostic Tools
participant Issue as Issue Category
participant Solution as Solution Steps

Dev->>Diagnostic: Test failure observed
Diagnostic->>Issue: Categorize failure type

alt Browser launch failure
    Issue->>Solution: Check browser binaries
    Solution->>Solution: Run reinstall command
    Solution-->>Dev: Browser launch fixed

else Permission/HTTPS error
    Issue->>Solution: Verify HTTPS certificates
    Solution->>Solution: Check permission grants
    Solution->>Solution: Validate origin config
    Solution-->>Dev: Permission issue resolved

else Timeout error
    Issue->>Solution: Increase timeout values
    Solution->>Solution: Check selector specificity
    Solution->>Solution: Wait for proper load state
    Solution-->>Dev: Timeout issue resolved

else Flaky test
    Issue->>Solution: Add explicit waits
    Solution->>Solution: Improve test isolation
    Solution->>Solution: Review race conditions
    Solution-->>Dev: Test stability improved

else VSCode debugger not attaching
    Issue->>Solution: Check port availability
    Solution->>Solution: Verify launch.json config
    Solution->>Solution: Restart VSCode
    Solution-->>Dev: Debugger attached
end
```

### 5.2 Common Errors and Solutions

| Error Category         | Symptoms                            | Root Cause                | Solution                                    |
| ---------------------- | ----------------------------------- | ------------------------- | ------------------------------------------- |
| Browser Launch Failure | "Browser not found" or timeout      | Missing browser binaries  | Run `pnpm run test:e2e:install`             |
| Permission Denied      | `NotAllowedError` for microphone    | Missing permission grant  | Add `context.grantPermissions()`            |
| HTTPS Required         | "getUserMedia requires HTTPS"       | Non-HTTPS context         | Use `https://localhost:5173`                |
| Certificate Error      | "NET::ERR_CERT_AUTHORITY_INVALID"   | Untrusted dev certificate | Follow `docs/https-development-setup.md`    |
| Selector Timeout       | "Timeout 30000ms exceeded"          | Element not found/visible | Review selector, add `waitForLoadState()`   |
| Socket Connection      | "WebSocket connection failed"       | Server not running        | Start dev server before tests               |
| Port Conflict          | "Address already in use"            | Port 5173 occupied        | Kill existing process or use different port |
| Flaky Test             | Intermittent pass/fail              | Race condition            | Add explicit waits, improve isolation       |
| VSCode Debug Port      | "Cannot connect to runtime process" | Debugger port conflict    | Check `launch.json` port configuration      |
| Trace File Not Found   | "Failed to read trace file"         | Trace not generated       | Enable `trace: 'on-first-retry'` in config  |

### 5.3 Platform-Specific Issues

**Windows**:

- WebSocket connection issues with Windows Firewall
- Path length limitations for node_modules
- Certificate trust store differences

**macOS**:

- Keychain access for HTTPS certificates
- Gatekeeper blocking unsigned browser binaries
- WebKit binary permissions requiring Xcode Command Line Tools

**Linux**:

- Missing system dependencies for browsers
- Display server configuration for headed mode
- Font rendering differences across distributions

### 5.4 Debugging Checklist

When encountering test failures, follow this systematic checklist:

1. **Verify Environment**:
   - [ ] HTTPS development server is running
   - [ ] Certificates are valid and trusted
   - [ ] Playwright browsers are installed
   - [ ] Correct Node.js and pnpm versions

2. **Check Test Configuration**:
   - [ ] `playwright.config.ts` has correct baseURL
   - [ ] Browser-specific launch options are configured
   - [ ] Timeout values are appropriate
   - [ ] Trace generation is enabled

3. **Review Test Code**:
   - [ ] Selectors are specific and stable
   - [ ] Permissions are granted before use
   - [ ] Proper wait conditions are used
   - [ ] Cleanup is implemented in afterEach

4. **Analyze Failure Artifacts**:
   - [ ] Review screenshot from failure
   - [ ] Check browser console logs
   - [ ] Inspect trace file timeline
   - [ ] Examine network requests

---

## Related Documentation

- [Comprehensive Testing Guide](./comprehensive-testing-guide.md) - Parent testing reference with
  unit, integration, and E2E testing overview
- [Developer Onboarding](./developer-onboarding.md) - Initial setup and development workflows
- [HTTPS Development Setup](./https-development-setup.md) - Certificate configuration for local
  testing
- [Testing Standards](./testing-standards.md) - Project testing conventions and best practices
- [Integration Testing Patterns](./integration-test-patterns.md) - Backend integration testing
  approaches

**🚀 PRODUCTIVITY ENHANCEMENT:** Use `bat` instead of `cat` for viewing file contents and
documentation:

```bash
# Old way: cat docs/playwright-testing-guide.md
# New way: bat docs/playwright-testing-guide.md

# View with syntax highlighting and line numbers
bat --style=numbers,grid docs/playwright-testing-guide.md

# Show only specific line range
bat --line-range 1:50 docs/playwright-testing-guide.md

# Preview multiple files with fzf integration
fd ".md" docs/ | fzf --preview "bat --color=always {}"

# Set bat as default pager for documentation
export MANPAGER="sh -c 'col -bx | bat -l man -p'"
```

**Benefit**: Automatic syntax highlighting for 200+ languages, git integration, line numbers, and
paging built-in.

```

```
