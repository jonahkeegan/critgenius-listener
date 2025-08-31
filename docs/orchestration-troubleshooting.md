## Orchestration Troubleshooting (v3)

### Quick Reference

| Symptom                                              | Likely Cause                       | Fix                                                                          |
| ---------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| Immediate exit with validation errors                | Malformed `services.yaml`          | Run loader: `node scripts/service-manifest-loader.mjs` and fix listed issues |
| Service stuck at "starting" then restarts repeatedly | Health endpoint not returning <500 | Confirm `healthPath`, server actually listening, adjust timeout              |
| Circuit opened message; no restarts                  | Exceeded `maxAttempts`             | Increase `restart.maxAttempts` or investigate root cause                     |
| ENV vars missing (SERVICE_NAME, TIMEOUT)             | Loader injection skipped           | Ensure loader version (2.0) and no name collision with empty string          |
| Wrong startup order                                  | Incorrect dependencies             | Add missing dependency entries to manifest                                   |
| High restart thrash                                  | Low baseMs / high failure rate     | Increase `restart.baseMs` or fix stability issues                            |
| Smoke mode slow                                      | Missing `smokeStartupTimeoutMs`    | Add per-service smoke timeouts / lighter `smokeCommand`                      |

### Deep Dive Steps

1. Validate manifest: `node scripts/service-manifest-loader.mjs`.
2. Run orchestrator with verbose logging:
   ```bash
   ORCHESTRATION_SMOKE=true DEBUG=orchestrator* node scripts/dev-orchestration.mjs --monitor
   ```
   (Future structured logging placeholder.)
3. Manually probe service:
   ```bash
   curl -i http://localhost:<port><healthPath>
   ```
4. Inspect restart timings: look for `Scheduling restart` lines (delay reflects exponential
   backoff).
5. Circuit breaker: verify configured `circuitCooldownMs`; orchestrator suppresses restarts until
   timestamp.

### Adjusting Restart Sensitivity

- To reduce noise: raise `maxAttempts` or raise liveness consecutive threshold (currently fixed at 3
  in code; can be made configurable in future).
- To accelerate recovery: lower `baseMs` (be careful of thrash) or lower `maxAttempts` for earlier
  circuit open.

### Common YAML Pitfall

Mis-indented env vars create phantom services (e.g., `SERVICE_NAME:` aligned with `server:`). Ensure
env keys are indented beneath `environment:`.

### When Services Should Not Restart

Add a placeholder restart block with `maxAttempts: 0` (interpreted as immediate circuit open after
first failure) to effectively disable restarts temporarily.

```yaml
restart:
  maxAttempts: 0
  circuitCooldownMs: 600000
```

### File to Inspect for Logic Changes

- `scripts/dev-orchestration.v3.mjs` – main loop, restart scheduler
- `scripts/service-launcher.mjs` – single-service spawn
- `scripts/service-manifest-loader.mjs` – env injection & validation

### Provide a Minimal Repro

Strip manifest to single failing service, verify issue persists, then share the reduced
`services.yaml`.

---

If unresolved, open an issue with: node version, manifest snippet, console output of orchestration,
and recent changes.
