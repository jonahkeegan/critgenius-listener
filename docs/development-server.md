# Development Server Guide

...existing code...# Development Server Usage & Validation (Task 2.9.4)

> Source of truth for running, validating, and troubleshooting the CritGenius Listener development
> server.

## Overview

The development environment is built on Vite (React + TypeScript) with:

- Hot Module Replacement (HMR) for rapid UI iteration
- Env reload plugin (`env-reload`) triggering a full page refresh when `.env*` files change
- Deterministic manual chunking (react | mui | realtime | vendor) for stable caching
- Conditional development proxy mapping API + Socket.IO (and optional AssemblyAI passthrough)
- Coordinated multi-service orchestration script (`scripts/dev-orchestration.v3.mjs`) for future
  multi-component startup

## Quick Start

1. Install dependencies:

```
pnpm install
```

2. Launch client only (fast path):

```
# Development Server Guide (Task 2.9.4)

Test-centric validation for Vite dev server behavior (env reload, proxy forwarding, simulated HMR) replaced a proposed standalone validation script to reduce drift and complexity.

## Core Elements
| Element | File | Purpose |
|---------|------|---------|
| Vite config | `packages/client/vite.config.ts` | Manual chunks, proxy activation, env injection |
| Env reload plugin | `packages/client/src/dev/envReloadPlugin.ts` | Full reload on `.env*` changes |
| Proxy helper | `packages/client/src/config/devProxy.ts` | Pure proxy map builder (unit tested) |
| Plugin test | `env-reload.plugin.test.ts` | Asserts `full-reload` emission |
| Proxy integration test | `proxy-forwarding.integration.test.ts` | HTTP forwarding correctness |
| HMR harness | `refresh-state-retention.test.ts` | Simulated react-refresh state retention |

## Environment Reload
`envReloadPlugin` watches `.env*` plus optional `ENV_RELOAD_EXTRA`. On change it emits `{ type: 'full-reload' }` over Vite WS. Never logs variable contents (privacy preserved).

## Proxy Forwarding (HTTP Baseline)
Minimal integration test validates status + header preservation. WebSocket forwarding test deferred (future socket harness).

## HMR State Retention (Simulated)
Direct react-refresh runtime invocation in jsdom; permissive assertion allows either preserved (`1-v2`) or reset (`0-v2`) state—warning logged only if reset.

## Running Targeted Tests
```

|-------|---------|------------|

```

## Structural Coverage
- Manual chunk grouping (unit tests)
- Proxy permutations (helper tests + HTTP integration)
- Env reload (plugin unit test)
- HMR semantics (simulated harness)

## Troubleshooting
| Issue | Cause | Action |
|-------|-------|-------|
| No reload on env edit | Plugin missing or file outside root | Ensure plugin in config; verify file path |
| HMR state reset | jsdom/react-refresh limitation | Ignore (warn only); add real Vite suite later |
| Proxy test fail | Backend not needed (mock used) | Use included HTTP harness |
| Unexpected AssemblyAI traffic | Flag accidently enabled | Keep `DEV_PROXY_ASSEMBLYAI_ENABLED=false` |

## Deferred
- WebSocket proxy forwarding test (socket.io)
- Real Vite-driven strict HMR suite + latency metrics
- Proxy negative-path (timeouts/5xx) tests
- Watcher disposal assertion + reload latency instrumentation

## Security
- No secret logging
- AssemblyAI passthrough disabled by default
- Sanitized client env projection enforced

## Summary
All validation consolidated into maintainable tests; future hardening tasks enumerated for incremental adoption.
- Timing metrics (cold start, first HMR patch) exported to console summary
```
