## Orchestration Migration Guide (v2 -> v3)

v3 introduces a restart/backoff engine, liveness monitoring, and injected env vars while keeping the
`services.yaml` schema (version "2.0") stable. Most users only need to update scripts.

### At a Glance

| Aspect          | v2                                      | v3                                            |
| --------------- | --------------------------------------- | --------------------------------------------- |
| Entry script    | dev-orchestration.v2.mjs (experimental) | dev-orchestration.mjs (wrapper → v3)          |
| Restart policy  | Basic manual backoff                    | Exponential backoff + circuit breaker         |
| Liveness probes | Optional interval restart               | Readiness + consecutive failure threshold (3) |
| Env injections  | None                                    | SERVICE_NAME, TIMEOUT, DEV_PROXY_TIMEOUT_MS   |
| Topology sort   | Sequential order (simple)               | Explicit dependency topo + cycle detection    |

### Required Actions

1. Pull latest changes (contains v3 and wrapper promotion).
2. Stop invoking `dev-orchestration.v2.mjs`; use `node scripts/dev-orchestration.mjs`.
3. Remove any local overrides referencing the old script path.
4. (Done) Legacy wrapper removed; rollback requires git checkout of a pre-v3 commit.

### Optional Manifest Adjustments

No mandatory schema changes. You can tune per-service `restart` values:

```yaml
restart:
  baseMs: 1000 # initial backoff
  maxMs: 15000 # cap per attempt
  maxAttempts: 5 # before circuit opens
  circuitCooldownMs: 60000
```

### Environment Variable Changes

Injected (if absent) by loader/orchestrator at runtime:

- SERVICE_NAME → service.name
- TIMEOUT → global.defaultTimeout
- DEV_PROXY_TIMEOUT_MS → global.defaultTimeout

### Smoke Mode

No change: set `ORCHESTRATION_SMOKE=true` to substitute `smokeCommand` & `smokeStartupTimeoutMs`.

### Rollback

Checkout a pre-v3 commit (prior to Phase 4) to restore legacy behavior.

### Verification Checklist

- `pnpm dev:coordinated` launches all services.
- Kill a child process manually → orchestrator schedules restart with backoff.
- Introduce failing health endpoint → observe 3 probe failures → restart.
- After exceeding `maxAttempts`, circuit breaker message appears and restarts pause.

---

Questions? See troubleshooting doc or open an issue.
