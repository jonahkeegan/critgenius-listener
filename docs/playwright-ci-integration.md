# Playwright CI Integration Guide

## Overview

Playwright end-to-end tests run inside GitHub Actions across six browser configurations to protect
critical listener workflows:

- Chromium Desktop (1920x1080)
- Chromium Tablet (768x1024)
- Chromium Mobile (375x667)
- Firefox Desktop (1920x1080)
- Edge Desktop (1920x1080)
- WebKit Desktop (1920x1080)

## CI Workflow

### Execution Flow

1. **Dependency Setup**: Install PNPM, Node.js, and workspace dependencies.
2. **Build Phase**: Compile shared, test-utils, and client packages.
3. **Browser Installation**: Install Playwright dependencies for Chromium, Firefox, WebKit, and
   Microsoft Edge.
4. **Server Start**: Launch the Vite development server on `http://localhost:5173` with
   `VITE_E2E=true`.
5. **Health Check**: Validate the server is ready using curl with retries.
6. **Test Execution**: Run Playwright tests for the targeted browser matrix entry.
7. **Artifact Upload**: Persist test results, HTML reports, videos, screenshots, and traces.

### Browser Matrix

The `e2e-tests` job runs with `fail-fast: false` so each browser executes independently. The matrix
covers all six configurations, and results are aggregated once every browser completes.

### Failure Handling

When a browser run fails:

- Screenshots capture the final state of failing tests.
- Videos record the full run for visual debugging.
- Trace archives provide network, console, and DOM timelines.
- HTML reports summarize the suite outcome.
- All artifacts upload to GitHub Actions storage for seven days.

## Viewing Test Results

### Via GitHub Actions UI

1. Open the Actions tab in the repository.
2. Select the relevant workflow run.
3. Choose the failed `e2e-tests` job instance.
4. Download artifacts from the job summary panel.

### Locally Viewing Playwright Report

After downloading the `playwright-report` artifact to `packages/client/playwright-report/`, run:

```bash
pnpm test:e2e:report
```

This command opens the saved HTML report for inspection.

## Troubleshooting

### Dev Server Not Starting

**Symptom**: Health check fails and tests never launch.

**Actions**:

- Review build logs for compilation errors.
- Ensure nothing else is bound to port 5173.
- Increase the initial sleep or retry delay if start-up is slow.

### Browser Installation Fails

**Symptom**: Playwright cannot locate the requested browser channel.

**Actions**:

- Confirm `playwright install --with-deps` ran with the expected browser names.
- Verify the GitHub Actions runner version matches Playwright requirements.
- Re-run the job to exclude transient network issues.

### Tests Timeout

**Symptom**: Playwright reports navigation or action timeouts.

**Actions**:

- Check the dev server logs for runtime errors.
- Confirm the application responds at the base URL without authentication prompts.
- Adjust Playwright timeouts only after investigating application latency.

### Flaky Tests

**Symptom**: Suites pass locally but fail intermittently in CI.

**Actions**:

- Replace arbitrary `waitForTimeout` calls with Playwright auto-waiting.
- Validate socket event instrumentation remains deterministic.
- Inspect traces to pinpoint delayed selectors or network calls.

## Local Testing

Validate changes locally before opening a pull request:

```bash
# Install browsers with all dependencies (including Edge)
pnpm test:e2e:install

# Run the full matrix in headless mode
pnpm test:e2e

# Target a single browser
pnpm --filter @critgenius/client test:browser:chromium

# Headed debug mode
pnpm test:e2e:headed

# Interactive mode with Playwright UI runner
pnpm test:e2e:ui
```

## Performance Considerations

- Each browser job typically runs for 5–10 minutes.
- Total suite wall-clock time stays near the longest individual job because the matrix runs in
  parallel.
- Artifact bundles range between 50–200 MB depending on video and trace content.
- Artifacts expire after seven days to balance retention with storage usage.

## Related Documentation

- [Playwright Configuration](../packages/client/playwright.config.ts)
- [E2E Test Patterns](./comprehensive-testing-guide.md#e2e-testing)
- [CI/CD Pipeline](../.github/workflows/ci.yml)

## Validation Strategy Summary

Per `validation-test-decision-matrix.md`:

- **Drift History**: None (first CI integration)
- **Production Impact**: High
- **Detection Difficulty**: Medium
- **Decision**: CI script with lightweight smoke test

The infrastructure smoke test in `tests/infrastructure/playwright-ci-integration.test.ts` validates
that required CI hooks remain in place. Full end-to-end behaviour continues to be enforced by the CI
workflow itself.

## Implementation Checklist

- [x] Add `e2e-tests` job to `.github/workflows/ci.yml` with browser matrix.
- [x] Configure artifact uploads for reports, videos, screenshots, and traces.
- [x] Create smoke test `tests/infrastructure/playwright-ci-integration.test.ts`.
- [x] Document the workflow in `docs/playwright-ci-integration.md`.
- [x] Ensure package scripts expose browser-specific Playwright commands.
