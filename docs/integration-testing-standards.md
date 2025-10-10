# Integration Testing Standards

The CritGenius Listener integration test suite validates real-time workflows that span the client,
server, and shared packages. These standards apply to any test that exercises Socket.IO
communication, AssemblyAI streaming, or cross-package orchestration.

## Guiding Principles

- **Privacy First:** Never send live API traffic. Use `createMockAssemblyAIScenario()` for
  deterministic streaming events and avoid logging raw secrets.
- **Deterministic Runtime:** All suites MUST execute under the shared deterministic runtime exported
  from `@critgenius/test-utils`. Timeouts, clocks, and random IDs are controlled by the harness.
- **Minimal Surface:** Only initialise the services required for the scenario. Prefer the
  `ServiceLifecycleManager` to orchestrate express/socket servers and tear them down automatically.
- **Explicit Assertions:** Assert on structured payloads (`sessionId`, `text`, `isFinal`,
  `confidence`, `words`) rather than snapshots to guarantee backwards-compatible contracts.

## Required Tooling

- Use `IntegrationTestHarness` to apply environment presets and manage lifecycle.
- Register servers or background processes through `ServiceLifecycleManager`.
- Create Socket.IO pairs via `createSocketIntegrationContext` when a lightweight server suffices, or
  wrap the real server with `createIntegrationServer` for end-to-end flows.
- Generate AssemblyAI events using `createMockAssemblyAIScenario`.
- Inject failure modes with `createResilienceScenarioBuilder`.

## Environment Profiles

Integration suites MUST declare the preset they rely on:

| Preset             | Usage                  | Notes                                                                               |
| ------------------ | ---------------------- | ----------------------------------------------------------------------------------- |
| `localDevelopment` | Default for local + CI | Provides `PORT`, `ASSEMBLYAI_API_KEY`, `MONGODB_URI`, `REDIS_URL`, and `JWT_SECRET` |
| `ci`               | CI hardening           | Mirrors GitHub Actions markers and isolates Redis/Mongo DB names                    |
| Custom             | Scenario-specific      | Compose via `mergePresets()` for custom combinations                                |

Never mutate `process.env` manually—call `IntegrationTestHarness` or `applyEnvironmentPreset()`.

## Test Authoring Checklist

- [ ] Describe block name follows `<domain>-<scenario>.integration` convention.
- [ ] Harness created with `workflowName` to aid diagnostics.
- [ ] All services registered through `ServiceLifecycleManager`.
- [ ] Async cleanup handled via `harness.teardown()` and context `cleanup()`.
- [ ] Assertions cover happy path + failure cases when applicable.
- [ ] Timeouts kept under 10s; prefer `waitFor` utilities or helper promises.
- [ ] Resilience scenarios ensure metrics recorded through `ResilienceScenarioBuilder`.

## Event Synchronisation & Timeouts

- Always wrap asynchronous event listeners with a timeout-aware helper. For Socket.IO clients use
  `waitForSocketEventWithTimeout(socket, eventName, { timeoutMs })` from `@critgenius/test-utils`.
  It prevents suites from hanging indefinitely when expected events never fire.
- Prefer `createTimeoutPromise()` when awaiting bespoke asynchronous flows. It emits a
  `TimeoutError` with clear context and optional cleanup hooks.
- Set timeouts between 2–10 seconds unless a workflow fundamentally requires more. Failing fast
  keeps Vitest feedback under control and surfaces upstream regressions quickly.
- When filtering events (e.g., waiting for a final transcript), supply a `filter` predicate so the
  helper ignores interim payloads while still honouring the timeout window.

## Quality Gates

Before merging, every integration-focused PR must pass:

1. `pnpm -w lint`
2. `pnpm -w type-check`
3. `pnpm vitest run tests/infrastructure/integration-test-standards.test.ts`
4. Package-scoped suites touching integration helpers (`pnpm --filter @critgenius/test-utils test`,
   `pnpm --filter @critgenius/server test:integration`)

Document deviations (for example, skipped suites in CI) in the PR description with justification and
follow-up actions.
