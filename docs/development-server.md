# Development Server (Vite) – Developer Guide

> Authoritative guide for running, validating, and troubleshooting the CritGenius Listener client
> development server. Refactored under Task 2.9.4 (test‑centric validation approach).

---

## At a Glance

| Capability                     | Mechanism                                              | Location                                             |
| ------------------------------ | ------------------------------------------------------ | ---------------------------------------------------- | -------- | -------- | -------------------------------- |
| HMR & Build                    | Vite + React + TypeScript                              | `packages/client/vite.config.ts`                     |
| Environment Reload             | Custom `envReloadPlugin` (full page reload on `.env*`) | `packages/client/src/dev/envReloadPlugin.ts`         |
| Dev Proxy (API/Socket)         | Pure map builder + conditional Vite proxy              | `packages/client/src/config/devProxy.ts`             |
| Manual Chunk Strategy          | Deterministic grouping (`react                         | mui                                                  | realtime | vendor`) | `packages/client/vite.config.ts` |
| Client Env Projection          | Sanitized build‑time define (`__CLIENT_ENV__`)         | `packages/client/vite.config.ts` + shared env loader |
| Orchestrated Multi‑Service Dev | Manifest driven script                                 | `scripts/dev-orchestration.mjs`                      |
| Validation Tests               | Unit + focused integration (no external network)       | test paths under client + `tests/docs`               |

---

## Table of Contents

1. Overview
2. Quick Start
3. Core Concepts
4. Configuration Matrix
5. Validation & Test Harness
6. Common Workflows
7. Troubleshooting Matrix
8. Advanced Usage & Roadmap
9. Security & Privacy Posture
10. Reference File Map
11. Appendix: Sequence Diagrams

---

## 1. Overview

The development server uses Vite for fast incremental builds and leverages focused, test‑validated
utilities. Documentation intentionally defers to tests for behavioral truth to minimize drift.

Goals:

- Sub‑500ms iterative feedback (HMR or full reload)
- Deterministic chunk names for stable caching
- Zero secret logging
- Immediate failure on invalid environment

---

## 2. Quick Start

Install (root):

```bash
pnpm install
```

Run client only:

```bash
pnpm --filter @critgenius/client dev
```

Run coordinated (multi‑service):

```bash
pnpm dev:coordinated
```

Monitor mode:

```bash
pnpm dev:coordinated:watch
```

Client tests (dev server subset):

```bash
pnpm --filter @critgenius/client test
```

Full test matrix (includes doc integrity):

```bash
pnpm test
```

---

## 3. Core Concepts

### Environment Reload Plugin

Watches `.env*` and supports explicit extra watch paths via `extraWatchPaths` in Vite config.
Also honors legacy `ENV_RELOAD_EXTRA` (comma-separated) for backward compatibility. Emits
`{ type: 'full-reload' }` via Vite WS—never logs contents.

Example usage in `packages/client/vite.config.ts`:

```ts
plugins: [
	react(),
	envReloadPlugin({
		extraWatchPaths: [
			// '../server/.env',
			// '../shared/config/app.json',
		],
	}),
]
```

### Manual Chunk Grouping

Static function maps dependencies to buckets: `react`, `mui`, `realtime`, `vendor`. Adjust tests if
changing imports to prevent unintentional cache churn.

### Dev Proxy

Pure builder returns proxy map only when `DEV_PROXY_ENABLED` is true. AssemblyAI passthrough remains
disabled until hardened security path is implemented.

### Test‑Centric Validation

All critical behaviors (reload, proxy forwarding, HMR assumptions) are asserted in Vitest. No ad‑hoc
shell verification scripts maintained.

---

## 4. Configuration Matrix

| Variable | Scope | Required | Default | Purpose |
| --- | --- | --- | --- | --- |
| DEV_PROXY_ENABLED | Dev | Conditional | – | Enable HTTP proxy layer |
| DEV_PROXY_TARGET_PORT | Dev | With proxy | 3000 | Upstream API/server port |
| DEV_PROXY_ASSEMBLYAI_ENABLED | Dev | No | false | Future AssemblyAI passthrough flag |
| DEV_PROXY_ASSEMBLYAI_PATH | Dev | If passthrough | /v2/realtime | Socket path reservation |
| DEV_PROXY_TIMEOUT_MS | Dev | No | 5000 | Upstream timeout guard |
| ENV_RELOAD_EXTRA | Dev | No | – | Additional file to watch |
| (client) extraWatchPaths | Dev | No | – | Explicit additional watch paths |

Validated via shared environment schema (see `docs/environment-configuration-guide.md`).

---

## 5. Validation & Test Harness

| Test                      | Path                                                                 | Assertion                       |
| ------------------------- | -------------------------------------------------------------------- | ------------------------------- |
| Env reload plugin         | `packages/client/src/__tests__/dev-server/env-reload.plugin.test.ts` | Change ⇒ full reload WS event   |
| Env reload plugin (IT)    | `packages/client/src/__tests__/integration/env-reload-plugin.integration.test.ts` | Real Vite + browser; enable with `RUN_CLIENT_IT=true` |
| Proxy forwarding          | (integration test)                                                   | Status + header preservation    |
| Manual chunks             | (config test)                                                        | Bucket mapping invariants       |
| HMR retention (simulated) | (harness)                                                            | State preserved or soft warning |
| Documentation integrity   | `tests/docs/development-server-doc.test.ts`                          | Required sections + links valid |

Philosophy: Tests own truth; docs summarize.

---

## 6. Common Workflows

| Goal              | Command                                | Notes                   |
| ----------------- | -------------------------------------- | ----------------------- |
| UI iteration      | `pnpm --filter @critgenius/client dev` | Fast path               |
| Multi‑service run | `pnpm dev:coordinated`                 | Uses `services.yaml`    |
| Add env var       | Update schema + templates + tests      | Fail fast on invalid    |
| Validate proxy    | Run client tests                       | No live upstream needed |
| Inspect chunks    | View Vite build output                 | Deterministic grouping  |

---

## 7. Troubleshooting Matrix

| Symptom                       | Likely Cause            | Resolution                                 | Covered by Tests |
| ----------------------------- | ----------------------- | ------------------------------------------ | ---------------- |
| No reload after env edit      | File not watched        | Ensure root or set `ENV_RELOAD_EXTRA`      | Yes              |
| State lost post-HMR           | jsdom/react-refresh gap | Accept (warn); real harness later          | Yes (permissive) |
| Unexpected AssemblyAI traffic | Flag toggled            | Keep passthrough disabled                  | N/A              |
| Proxy not applying            | Flag unset              | Set `DEV_PROXY_ENABLED=true` intentionally | Yes              |
| Doc integrity failure         | Section rename          | Update headings & anchors                  | Yes              |

---

## 8. Advanced Usage & Roadmap

Deferred items (tracked for incremental hardening):

- WebSocket proxy forwarding test (Socket.IO)
- Real Vite HMR latency + strict state retention harness
- Proxy negative path tests (timeouts, 5xx propagation)
- Watcher disposal + reload latency instrumentation
- Performance metrics export (cold start, first HMR patch)

### Local HTTPS (New)

Secure context is required by some browsers for full microphone API access. Local HTTPS is now
supported via optional environment variables:

| Variable         | Default                                | Purpose                                  |
| ---------------- | -------------------------------------- | ---------------------------------------- |
| HTTPS_ENABLED    | false                                  | Toggle HTTPS dev server                  |
| HTTPS_CERT_PATH  | ./certificates/dev/dev-cert.pem        | Certificate file (PEM)                   |
| HTTPS_KEY_PATH   | ./certificates/dev/dev-key.pem         | Private key file (PEM)                   |
| HTTPS_PORT       | 5174                                   | Alternate port used when HTTPS enabled   |

Generation script:

```bash
pnpm certs:setup            # mkcert preferred, falls back to openssl
pnpm certs:setup:force      # Regenerate even if existing
pnpm certs:check            # Warn if <30 days until expiration
```

Enable in `.env`:

```bash
HTTPS_ENABLED=true
HTTPS_CERT_PATH=./certificates/dev/dev-cert.pem
HTTPS_KEY_PATH=./certificates/dev/dev-key.pem
```

If cert files are missing or unreadable, Vite silently falls back to HTTP with a console warning.
Certificates are git‑ignored (`certificates/`) and safe to regenerate at any time.

---

## 9. Security & Privacy Posture

- No raw env value logging
- AssemblyAI passthrough disabled by default
- Client env projection allow‑list enforced
- Tests guard absence of secrets in client bundle

---

## 10. Reference File Map

| File                                         | Purpose                       |
| -------------------------------------------- | ----------------------------- |
| `packages/client/vite.config.ts`             | Core config & chunking        |
| `packages/client/src/dev/envReloadPlugin.ts` | Full reload watcher           |
| `packages/client/src/config/devProxy.ts`     | Proxy map builder             |
| `scripts/dev-orchestration.mjs`              | Multi‑service launcher        |
| `services.yaml`                              | Declarative services manifest |
| `docs/development-proxy.md`                  | Proxy design & security       |
| `docs/development-workflow.md`               | Workflow & quality gates      |
| `docs/developer-onboarding.md`               | Onboarding reference          |

---

## 11. Appendix: Sequence Diagrams

### Env Reload Lifecycle

```sequenceDiagram
participant Dev as Developer
participant FS as FileSystem
participant Vite as ViteServer
participant Plugin as envReloadPlugin
Dev->>FS: Edit .env.local
FS-->>Plugin: change event
Plugin->>Vite: ws.send({ type: 'full-reload' })
Vite-->>Dev: Browser full reload
```

### Proxy Decision Flow

```sequenceDiagram
participant Req as BrowserRequest
participant Vite as ViteDev
participant Proxy as ProxyHelper
participant Up as Upstream
Req->>Vite: /api/health
Vite->>Proxy: lookup(/api)
Proxy-->>Vite: target http://localhost:3000
Vite->>Up: Forward request
Up-->>Vite: 200 OK
Vite-->>Req: 200 OK (headers preserved)
```

### Documentation Validation

```sequenceDiagram
participant Test as DocTest
participant FS as FileSystem
participant Parser as MarkdownParser
Test->>FS: Read development-server.md
FS-->>Test: Raw markdown
Test->>Parser: Parse headings + links
Parser-->>Test: Structural model
Test->>Test: Assert required sections
```

---

## Change Log (Doc Specific)

- 2025-08-31: Refactored to structured guide; added validation coverage & diagrams.

## License

MIT (project‑wide).

Need something missing? Open an issue referencing this guide.
