## Declarative Service Manifest Orchestration

This document describes the new manifest-driven coordinated dev workflow introduced in
`services.yaml` and implemented in `scripts/dev-orchestration.mjs` +
`scripts/service-manifest-loader.mjs`.

### Goals

1. Decouple orchestration logic from hardcoded topology
2. Enable easy addition / modification of services without script edits
3. Provide smoke-mode overrides for fast CI validation
4. Preserve existing health check + monitoring functionality

### Manifest Overview (`services.yaml`)

Key sections:

- `version` / `metadata`: descriptive
- `global`: polling + monitoring intervals and restart backoff
- `services`: service map with commands, ports, health paths, timeouts, dependencies, environment

Environment values support `${port}` interpolation.

### Core Startup Sequence

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Orchestrator as dev-orchestration.mjs
    participant Loader as service-manifest-loader
    participant Manifest as services.yaml
    participant Proc as Child Processes

    Dev->>Orchestrator: node scripts/dev-orchestration.mjs [--monitor]
    Orchestrator->>Loader: loadServiceManifest()
    Loader->>Manifest: read & parse YAML
    Manifest-->>Loader: service manifest object
    Loader-->>Orchestrator: validated manifest
    Orchestrator->>Orchestrator: Topological sort by dependencies
    loop For each ordered service
        Orchestrator->>Proc: spawn(service.command or smokeCommand)
        Orchestrator->>Orchestrator: waitForService (poll /health)
        alt Ready before timeout
            Orchestrator->>Dev: log ✅ ready
        else Timeout
            Orchestrator->>Proc: kill spawned + prior
            Orchestrator->>Dev: log failure & exit 1
        end
    end
    Orchestrator->>Dev: Summary of endpoints
    alt Monitoring enabled
        Orchestrator->>Orchestrator: setInterval monitor cycle
    end
```

### Monitoring & Restart Cycle

```mermaid
sequenceDiagram
    participant Monitor as Monitor Interval
    participant Orchestrator
    participant Service as Service Proc
    participant Health as HTTP Probe

    loop Every global.monitorIntervalMs
        Orchestrator->>Health: GET /healthPath
        alt Status < 500
            Health-->>Orchestrator: healthy
            Orchestrator->>Monitor: no-op
        else Unhealthy
            Health-->>Orchestrator: unhealthy
            Orchestrator->>Service: kill()
            Orchestrator->>Orchestrator: delay(global.restartBackoffMs)
            Orchestrator->>Service: spawn(command)
        end
    end
```

### Smoke Mode Flow Differences

```mermaid
sequenceDiagram
    participant Orchestrator
    participant Manifest
    Note over Orchestrator,Manifest: ORCHESTRATION_SMOKE=true
    Orchestrator->>Manifest: Load services
    Orchestrator->>Manifest: Replace command with smokeCommand if present
    Orchestrator->>Manifest: Override startupTimeoutMs with smokeStartupTimeoutMs
    Orchestrator->>Orchestrator: Inject placeholder env vars (already in manifest)
```

### Restart Logic (Unhealthy -> Restart)

```mermaid
flowchart TD
    A[Monitor detects unhealthy] --> B[KILL process]
    B --> C[Wait restartBackoffMs]
    C --> D[Spawn new process]
    D --> E[Passive: continue]
```

### Error Handling

- Manifest validation failures: process exits with aggregated error list
- Cyclic dependencies: explicit cycle detection error before spawning
- Health timeout: abort + cleanup previously spawned services

### Extending the Topology

1. Add new block under `services:` with unique key
2. Define `command`, `port`, `healthPath`, `startupTimeoutMs`
3. Optionally set `dependencies` (array of existing service keys)
4. (Optional) `smokeCommand` & `smokeStartupTimeoutMs` for CI quick path
5. Run `node scripts/service-manifest-loader.mjs` to verify load

### Future Enhancements (Deferred)

- YAML schema validation via Zod + intermediate JSON transform
- Per-service custom monitor strategy (websocket ping, etc.)
- Parallel startup of independent branches (requires concurrency controls)
- Structured JSON log mode for machine parsing

### Quick Verification Commands (Optional)

```
node scripts/service-manifest-loader.mjs
ORCHESTRATION_SMOKE=true node scripts/dev-orchestration.mjs --monitor
```

### Security / Privacy Notes

Manifest should not store real secrets—only development placeholders. Production secrets remain in
environment (.env) validated via existing environment loader.

---

Generated as part of task 2-9-3: Enhance Declarative Service Manifest.
