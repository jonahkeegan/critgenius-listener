# Microphone Access Validation – HTTPS Development Harness

_Last updated: 2025-09-28_

## Overview

Task 2.10.4 introduces a dedicated microphone access guard and audio capture controller for the
CritGenius Listener client. The feature set ensures that all Web Audio API access attempts occur in
secure contexts, expose deterministic diagnostics, and remain privacy-aware.

The implementation includes:

- `createMicrophoneAccessGuard()` – centralized capability, secure-context, and permission checks
  returning typed outcomes (supported, secure-context-required, permission-blocked, unavailable).
- `createAudioCaptureController()` – Web Audio API wrapper that coordinates guard evaluation, stream
  lifecycle, and AudioContext management.
- Playwright regression suite that boots the HTTPS Vite dev server with a self-signed certificate
  and verifies successful microphone acquisition across Chromium, Firefox, and WebKit runtimes.
- Vitest unit coverage for guard decision logic, request sanitization, and audio capture lifecycle.

## Browser Compatibility Matrix

| Browser           | Secure Context                    | Permission Handling              | Result                           | Notes                                      |
| ----------------- | --------------------------------- | -------------------------------- | -------------------------------- | ------------------------------------------ |
| Chromium (latest) | ✅                                | Automatic via Playwright fake UI | ✅ Stream granted, 1 audio track | Headless mode with fake microphone         |
| Firefox (latest)  | ✅                                | Automatic permission grant       | ✅ Stream granted, 1 audio track | Requires HTTPS or localhost secure context |
| WebKit (Safari)   | ✅                                | Automatic permission grant       | ✅ Stream granted, 1 audio track | Playwright WebKit build                    |
| Edge (Chromium)   | ➖ (Covered via Chromium project) | Same as Chromium                 | Inherits Chromium result         | Dedicated Edge automation pending          |

> Edge runs on Chromium; the Chromium project provides parity coverage. Future work can introduce a
> separate Edge profile once Microsoft Edge binaries are part of the Playwright installation matrix.

## Test Suite Summary

### Vitest (`pnpm --filter @critgenius/client test`)

- `microphoneAccessGuard.test.ts` exercises evaluation branches (unsupported, insecure context,
  permission denied) and request error mapping.
- `audioCapture.test.ts` validates microphone capture lifecycle, AudioContext reuse, graceful stop,
  and latency budget (<500ms) for guard-supplied streams.

### Playwright (`pnpm --filter @critgenius/client test:browser`)

- `tests/microphone-access.spec.ts` spins up the client Vite server in HTTPS mode using the bundled
  `localhost` self-signed certificate, grants the microphone permission, imports the guard directly
  from the dev server, and asserts that `requestAccess()` returns a granted stream with at least one
  audio track.

## Operational Notes

- The self-signed certificate lives under `packages/client/tests/fixtures/devcert/` and is intended
  solely for local and CI testing.
- `createAudioCaptureController` avoids connecting the microphone stream to the destination output
  to prevent audio feedback in development environments.
- Diagnostics produced by the guard and capture controller exclude raw permission payloads and
  restrict error logging to sanitized codes.

## Follow-Up Opportunities

1. Introduce an Edge-specific Playwright project once CI publishes Edge binaries.
2. Capture guard diagnostics via structured logging for aggregation in development builds.
3. Extend the Playwright harness to emit latency telemetry for pipeline monitoring.
