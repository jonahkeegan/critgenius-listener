# Development Proxy

## Dynamic Port Discovery

The dev server can auto-discover the backend server port at startup to reduce manual configuration. It probes localhost ports (defaults: 3100, 3000, 8080) for a healthy response from `/api/health` and uses the first successful port.

- Enable/disable: `DEV_PROXY_AUTO_DISCOVER` (default `true`)
- Candidate ports: `DEV_PROXY_DISCOVERY_PORTS` (comma-separated)
- Overall timeout: `DEV_PROXY_DISCOVERY_TIMEOUT_MS` (default `10000`)
- Per-port timeout: `DEV_PROXY_PROBE_TIMEOUT_MS` (default `2000`)

If discovery fails or is disabled, the proxy falls back to `DEV_PROXY_TARGET_PORT` (or HTTPS variant when enabled).

Privacy & Safety:
- Only ports are logged; no response bodies or headers.
- Discovery is limited to localhost.

Manual override:
- Set `DEV_PROXY_AUTO_DISCOVER=false` and specify `DEV_PROXY_TARGET_PORT` (or `DEV_PROXY_TARGET_HTTPS_PORT` with `DEV_PROXY_HTTPS_ENABLED=true`).

# Development Proxy Guide

Comprehensive reference for the Vite development proxy configuration introduced in Task 2.9.2.

## Purpose

Provide a seamless local development experience by routing browser requests through the Vite dev
server to:

- Backend API (`/api/*`) – avoid manual CORS header tweaking during iteration
- Socket.IO real-time endpoint (`/socket.io`) – support WebSocket upgrade through same origin
- External AssemblyAI API (optional) via a development-only path (default: `/proxy/assemblyai`) for
  experimentation without direct CORS preflight complexity

Production builds do not include or depend on this proxy. All logic is gated behind environment
variables prefixed with `DEV_PROXY_`.

## Key Components

| Component        | Location                                                 | Responsibility                                  |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------- |
| Schema additions | `packages/shared/src/config/environment.ts`              | Validated dev proxy env vars (defaults, safety) |
| Proxy builder    | `packages/client/src/config/devProxy.ts`                 | Pure helper building Vite `server.proxy` map    |
| Vite integration | `packages/client/vite.config.ts`                         | Conditionally injects proxy based on env        |
| Tests            | `packages/client/src/__tests__/viteProxy.config.test.ts` | Ensures helper logic & docs alignment           |
| Example vars     | `.env.example`                                           | Documents defaults & customization knobs        |

## Environment Variables

| Variable                       | Default             | Description                                                |
| ------------------------------ | ------------------- | ---------------------------------------------------------- |
| `DEV_PROXY_ENABLED`            | `true`              | Master switch for all proxy behavior                       |
| `DEV_PROXY_TARGET_PORT`        | `3100`              | Backend server port to which `/api` & `/socket.io` forward |
| `DEV_PROXY_ASSEMBLYAI_ENABLED` | `true`              | Enables AssemblyAI external proxy entry                    |
| `DEV_PROXY_ASSEMBLYAI_PATH`    | `/proxy/assemblyai` | Local path clients request; stripped before forwarding     |
| `DEV_PROXY_TIMEOUT_MS`         | `30000`             | Timeout applied to proxied requests                        |
| `DEV_PROXY_HTTPS_ENABLED`      | `false`             | When true, proxy targets `https://localhost:<port>`        |
| `DEV_PROXY_TARGET_HTTPS_PORT`  | `3101`              | Backend HTTPS port used when HTTPS is enabled              |
| `DEV_PROXY_REJECT_UNAUTHORIZED`| `false`             | When true, rejects self-signed/local certs                 |
| `DEV_PROXY_ALLOWED_HOSTS`      | `localhost,127.0.0.1` | Comma list of allowed proxy target hosts                 |

All defaults are safe for typical local setup (server on 3100, client on 5173). Set any variable to
override.

## How It Works

1. Vite starts (development only).
2. `buildDevProxy(process.env)` is invoked inside `vite.config.ts`.
3. If `DEV_PROXY_ENABLED !== 'false'`, a proxy table is created:
  - `/api` ➜ `http(s)://localhost:<DEV_PROXY_TARGET(_HTTPS)_PORT>`
  - `/socket.io` ➜ same target with `ws: true` and `X-Forwarded-Proto`
   - `<DEV_PROXY_ASSEMBLYAI_PATH>` ➜ `https://api.assemblyai.com` (rewritten path)
4. Requests from the browser to these paths are transparently forwarded; responses flow back
   unchanged.
5. Disabling any piece simply removes that mapping (no dead code in client bundle).

## AssemblyAI Notes

- The current proxy mapping does NOT inject `ASSEMBLYAI_API_KEY` in headers (intentional—prevents
  accidental key exposure through client tooling or logs).
- For secure use, add a server-side route (future task) that attaches the key and performs any
  request shaping before calling AssemblyAI.
- The path-based proxy is for low-friction exploratory testing only.

## Customization Examples

Disable AssemblyAI path:

```
DEV_PROXY_ASSEMBLYAI_ENABLED=false
```

Change backend target port (if server runs on a different port):

```
DEV_PROXY_TARGET_PORT=4000
```

Relocate AssemblyAI path:

```
DEV_PROXY_ASSEMBLYAI_PATH=/aai
```

Disable all proxying (browser will call real origins directly):

```
DEV_PROXY_ENABLED=false
```

## Testing Strategy

The tests avoid importing the entire Vite config (which would trigger esbuild) and instead exercise
the pure helper:

- Verifies base routes (`/api`, `/socket.io`).
- Ensures conditional AssemblyAI inclusion & custom path override.
- Confirms documentation alignment with `.env.example` default pattern.

## Security & Privacy Considerations

| Aspect                    | Mitigation                                                             |
| ------------------------- | ---------------------------------------------------------------------- |
| Secret leakage            | No API key forwarded from client; no header mutation with secrets      |
| Accidental prod carryover | Variables prefixed `DEV_PROXY_`; not referenced in runtime server code |
| Surface minimization      | Proxy table built only when enabled; tree-shake safe for production    |

## Failure Modes & Recovery

| Symptom                      | Likely Cause                         | Resolution                                            |
| 404 on `/api/...`            | Backend port mismatch                | Set `DEV_PROXY_TARGET_PORT` to match server port      |
| WebSocket not connecting     | Proxy disabled or wrong port         | Ensure `DEV_PROXY_ENABLED=true` & port correct        |
| AssemblyAI CORS errors       | Path disabled / key handling missing | Enable path or implement secure server-side forwarder |
| Test failure (doc alignment) | `.env.example` drift                 | Update example file or adjust test to new default     |
| Browser says "Not Secure"   | Missing HTTPS or untrusted cert      | Enable `HTTPS_ENABLED` and trust local certs          |
| Proxy TLS handshake fails    | Cert rejected by proxy               | Set `DEV_PROXY_REJECT_UNAUTHORIZED=false` locally     |

## Preflight Troubleshooting

Run a quick preflight to check API and WSS reachability through the Vite dev server:

```
pnpm node scripts/dev-https-preflight.mjs
```

This prints a sanitized summary and probes `/api/health` and `/socket.io`.

## Extension Roadmap (Deferred)

1. Secure server endpoint to sign / enrich AssemblyAI requests.
2. Metrics/log hook in `configure` callback (without sensitive data).
3. Optional HTTPS local proxy (self-signed cert) for early TLS parity testing.
4. Automatic port detection (probe server before deciding to enable mapping).

## Quick Reference

| Action                     | Command                                                                   |
| -------------------------- | ------------------------------------------------------------------------- |
| Toggle proxy off           | `DEV_PROXY_ENABLED=false pnpm --filter @critgenius/client dev`            |
| Use alternate backend port | `DEV_PROXY_TARGET_PORT=4000 pnpm --filter @critgenius/client dev`         |
| Disable AssemblyAI proxy   | `DEV_PROXY_ASSEMBLYAI_ENABLED=false pnpm --filter @critgenius/client dev` |

---

Maintain this file when adding new `DEV_PROXY_*` variables or changing default behaviors.
