# HTTPS Troubleshooting Guide

Last Updated: 2025-09-29 | Maintainer: Infrastructure Guild | Status: Active

> Diagnostic companion to the HTTPS setup guide. Provides structured workflows, sequence diagrams,
> and resolution playbooks for common TLS issues in CritGenius Listener development.

---

## Table of Contents

1. Troubleshooting Framework
2. Certificate Issues
3. Configuration & Environment Issues
4. Browser Security Warnings
5. Runtime & Integration Failures
6. Performance Considerations
7. Cross-Reference Matrix
8. Change Log

---

## 1. Troubleshooting Framework

Adopt a consistent methodology before diving into individual scenarios.

### 1.1 Intake Workflow

1. Capture the symptom (error message, screenshot, console output).
2. Identify whether the failure occurs at startup, browser load, or runtime event.
3. Check recent changes (file diffs, certificate regeneration, environment edits).
4. Choose the relevant scenario section below.

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant Logs as Logs/Console
  participant Git as Git Diff
  participant Guide as This Guide
  Dev->>Logs: Collect error details
  Dev->>Git: Inspect recent changes
  Dev->>Guide: Map symptom to scenario
  Guide-->>Dev: Navigate to relevant section
```

### 1.2 Diagnostic Tools

| Tool/Command                                            | Purpose                                         |
| ------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| `pnpm certs:check`                                      | Validate certificate freshness and SAN coverage |
| `openssl verify -CAfile <root> dev-cert.pem`            | Confirm trust chain                             |
| `pnpm --filter @critgenius/shared test -- https-config` | Run environment schema validation               |
| Browser DevTools → Security tab                         | Inspect TLS handshake and certificate details   |
| `lsof -i :5174` / `netstat -ano                         | findstr 5174` (Windows)                         | Detect port conflicts                          |
| `mkcert -uninstall` / reinstall                         | Reset corrupted local CA                        |
| `pnpm certs:setup:force -- --provider=<mkcert           | openssl>`                                       | Regenerate certificates with explicit provider |

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant Shell as Terminal
  participant Tool as Diagnostic Tool
  Dev->>Shell: Execute diagnostic command
  Shell->>Tool: Run analysis
  Tool-->>Shell: Structured output
  Shell-->>Dev: Interpret results
```

---

## 2. Certificate Issues

### 2.1 "Certificate Not Found" on Startup

**Symptom:** Vite logs `HTTPS certificate file not found` and falls back to HTTP.

1. Confirm paths in `.env` match actual file locations.
2. Run `pnpm certs:setup` to regenerate missing files.
3. Restart dev server and verify HTTPS is active.

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant Vite as Vite Server
  participant FS as File System
  Dev->>Vite: Start dev server
  Vite->>FS: Read HTTPS_CERT_PATH/HTTPS_KEY_PATH
  FS-->>Vite: ENOENT (file missing)
  Vite-->>Dev: Warning: fallback to HTTP
  Dev->>FS: pnpm certs:setup (regenerate)
  FS-->>Dev: Files restored
  Dev->>Vite: Restart server → HTTPS enabled
```

### 2.2 Certificate Expired Warning

**Symptom:** `pnpm certs:check` or browser reports certificate expiration.

1. Run `pnpm certs:setup:force` to generate fresh certs (mkcert preferred).
2. Restart dev server.
3. Clear browser cache for `localhost` to avoid stale chain.

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant Check as pnpm certs:check
  participant Script as pnpm certs:setup:force
  participant Browser as Browser
  Dev->>Check: Run expiration check
  Check-->>Dev: Warning <30 days
  Dev->>Script: Regenerate certificates
  Script-->>Dev: New PEM files
  Dev->>Browser: Clear site data & reload
  Browser-->>Dev: Secure lock restored
```

### 2.3 Certificate Invalid Hostname

**Symptom:** Browser shows `NET::ERR_CERT_COMMON_NAME_INVALID`.

1. Verify SAN entries include accessed host (`localhost`, `127.0.0.1`).
2. Regenerate certificates ensuring SAN list contains all needed hosts.
3. Access site via matching hostname.

```mermaid
sequenceDiagram
  autonumber
  participant Browser as Browser
  participant TLS as TLS Verifier
  participant Dev as Developer
  Browser->>TLS: Validate SAN for requested host
  alt Host missing from SAN
    TLS-->>Browser: ERR_CERT_COMMON_NAME_INVALID
    Browser-->>Dev: Display warning page
    Dev->>Browser: Regenerate certificate with correct SANs
  else SAN matches
    TLS-->>Browser: Valid
    Browser-->>Dev: Page loads securely
  end
```

### 2.4 Mkcert Root Corruption

**Symptom:** mkcert-generated cert suddenly untrusted on all browsers.

1. Run `mkcert -uninstall` to remove corrupted root.
2. Execute `mkcert -install` to reinstall clean root.
3. Regenerate certificates (`pnpm certs:setup`).

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant Mkcert as mkcert CLI
  participant Store as OS Trust Store
  Dev->>Mkcert: mkcert -uninstall
  Mkcert->>Store: Remove root CA
  Store-->>Dev: Root removed
  Dev->>Mkcert: mkcert -install
  Mkcert->>Store: Import new root CA
  Store-->>Dev: Root trusted
  Dev->>Mkcert: Generate certificates (pnpm certs:setup)
```

---

## 3. Configuration & Environment Issues

### 3.1 Environment Variables Not Loaded

**Symptom:** HTTPS remains disabled despite `.env` entries.

1. Ensure `.env` file resides at repo root and is not named `.env.example`.
2. Confirm variable names are uppercase and free of extra whitespace.
3. Restart dev server; Vite only reads `.env` on startup.

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant Env as .env File
  participant Vite as Vite Server
  Dev->>Env: Add HTTPS_ENABLED=true
  Env-->>Dev: Saved
  Dev->>Vite: Start dev server
  alt HTTPS_ENABLED missing
    Vite-->>Dev: HTTP mode active
    Dev->>Env: Fix variable name/value
    Dev->>Vite: Restart
  else Variable present
    Vite-->>Dev: HTTPS mode enabled
  end
```

### 3.2 Port Conflict (EADDRINUSE)

**Symptom:** Startup fails with `Error: listen EADDRINUSE: 5174`.

1. Identify conflicting process (`lsof -i :5174` | Windows `netstat -ano | findstr 5174`).
2. Terminate or change port of conflicting service.
3. Update `HTTPS_PORT` if persistent conflict.

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant CLI as pnpm dev
  participant OS as Operating System
  participant Proc as Conflicting Process
  Dev->>CLI: Start dev server
  CLI->>OS: Bind port 5174
  OS-->>CLI: EADDRINUSE (Proc running)
  CLI-->>Dev: Startup failed
  Dev->>OS: lsof/netstat check
  OS-->>Dev: PID of Proc
  Dev->>Proc: Terminate or change port
  Dev->>CLI: Restart dev server → success
```

### 3.3 Path Resolution Errors on Windows

**Symptom:** Backslashes in `.env` paths cause file read failures.

1. Use forward slashes or escape backslashes (`C:/path/to/dev-cert.pem`).
2. Alternatively use relative paths (`./certificates/dev/dev-cert.pem`).
3. Restart dev server.

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant Env as .env File
  participant Vite as Vite Config Loader
  Dev->>Env: Set HTTPS_CERT_PATH=C:\certs\dev-cert.pem
  Env-->>Vite: Provide value
  Vite-->>Dev: Failed to read (invalid escape)
  Dev->>Env: Update to C:/certs/dev-cert.pem
  Env-->>Vite: Resolved path
  Vite-->>Dev: Certificates loaded
```

---

## 4. Browser Security Warnings

### 4.1 Chrome "Your Connection Is Not Private"

1. Click **Advanced** → **Proceed** only if certificate is your known dev cert.
2. Import certificate into system trust store (Section 6.1 of setup guide).
3. Reload page; warning should disappear once trust established.

```mermaid
sequenceDiagram
  autonumber
  participant Browser as Chrome
  participant User as Developer
  participant OS as Trust Store
  Browser-->>User: NET::ERR_CERT_AUTHORITY_INVALID
  User->>Browser: View certificate details
  User->>OS: Import dev certificate → Always trust
  OS-->>User: Trust updated
  User->>Browser: Reload page
  Browser-->>User: Connection secure
```

### 4.2 Firefox "Warning: Potential Security Risk Ahead"

1. Click **Advanced** → **View Certificate** to confirm fingerprint.
2. Add exception temporarily, then import certificate into Firefox certificate manager.
3. Remove temporary exception after trust established.

```mermaid
sequenceDiagram
  autonumber
  participant Firefox as Firefox
  participant User as Developer
  participant Manager as Cert Manager
  Firefox-->>User: Potential Security Risk
  User->>Firefox: View Certificate
  User->>Manager: Import dev-cert.pem into Authorities
  Manager-->>Firefox: Certificate trusted
  Firefox-->>User: Secure connection restored
```

### 4.3 Edge/Safari Equivalent Warnings

Refer to OS-level trust instructions (same as Section 6.1). Safari requires keychain trust plus quit

- relaunch to pick up changes.

```mermaid
sequenceDiagram
  autonumber
  participant Browser as Edge/Safari
  participant OS as Trust Store
  participant Dev as Developer
  Browser-->>Dev: TLS warning page
  Dev->>OS: Import & trust certificate
  OS-->>Dev: Trust updated
  Dev->>Browser: Relaunch browser
  Browser-->>Dev: Secure connection
```

---

## 5. Runtime & Integration Failures

### 5.1 Socket.IO Connection Failure (`wss` handshake)

**Symptom:** Console shows `WebSocket connection to 'wss://localhost:5174/socket.io/?...' failed`.

1. Confirm HTTPS server is running and reachable.
2. Verify Socket.IO client not forced to HTTP (no `CLIENT_SOCKET_DISABLE_TLS_BYPASS=false`).
3. Inspect Network tab for TLS errors; regenerate certificates if handshake fails.

```mermaid
sequenceDiagram
  autonumber
  participant Client as Socket.IO Client
  participant Browser as Browser
  participant Server as HTTPS Socket.IO Server
  Client->>Server: WSS handshake request
  alt HTTPS server offline
    Server-->>Client: Connection refused
    Client-->>Browser: Emit error event
    Browser-->>Developer: Log failure
  else TLS handshake error
    Server-->>Client: TLS failure
    Client-->>Developer: TLS error details
    Developer->>Server: Verify certificates & restart
  else Success
    Server-->>Client: 101 Switching Protocols
    Client-->>Developer: Connected
  end
```

### 5.2 Mixed Content Warnings

**Symptom:** Browser console logs `Mixed Content` when fetching HTTP resources over HTTPS page.

1. Update resource URLs to use HTTPS or relative protocol (`//`).
2. Ensure dev proxy forwards HTTPS requests appropriately.
3. Rebuild bundle if assets are emitted with absolute HTTP URLs.

```mermaid
sequenceDiagram
  autonumber
  participant Browser as Browser
  participant Page as HTTPS Page
  participant Resource as HTTP Resource
  Browser->>Page: Load https://localhost:5174
  Page->>Resource: Fetch http://localhost:3000/api
  Browser-->>Page: Mixed Content warning
  Page-->>Developer: Adjust request to https:// or proxy
  Developer->>Page: Deploy fix (use HTTPS/proxy)
  Page->>Resource: Secure fetch
  Browser-->>Developer: Warning resolved
```

### 5.3 Microphone Permission Denied in HTTPS

**Symptom:** Even with HTTPS, `getUserMedia` rejects with `NotAllowedError`.

1. Check browser site permissions; ensure microphone allowed.
2. Confirm user gesture triggered request (some browsers require click event).
3. Clear site permissions and retry.

```mermaid
sequenceDiagram
  autonumber
  participant Client as Web App
  participant Browser as Browser Permissions
  participant User as Developer
  Client->>Browser: Request microphone access
  Browser->>User: Prompt previously denied
  User-->>Browser: Update permission to Allow
  Browser-->>Client: MediaStream granted
```

### 5.4 TLS Handshake Timeout

**Symptom:** Network tab shows `ERR_SSL_PROTOCOL_ERROR` with handshake timeout.

1. Ensure antivirus or corporate proxy not intercepting TLS; disable temporarily if safe.
2. Retry with mkcert (trusted root) to minimize MITM inspection friction.
3. Check system clock; large skew breaks TLS negotiations.

```mermaid
sequenceDiagram
  autonumber
  participant Browser as Browser
  participant OS as Operating System
  participant Network as Network Stack
  participant Dev as Developer
  Browser->>Network: Initiate TLS handshake
  Network->>OS: Validate certificates & time
  alt Clock skew or inspection
    OS-->>Browser: Handshake timeout
    Browser-->>Dev: ERR_SSL_PROTOCOL_ERROR
    Dev->>OS: Correct clock / adjust antivirus
  else Normal operation
    Network-->>Browser: Handshake success
    Browser-->>Dev: Secure connection established
  end
```

---

## 6. Performance Considerations

HTTPS introduces handshake overhead; keep an eye on performance symptoms.

### 6.1 Slow First Load (Cold TLS Cache)

1. Measure load time in DevTools Performance panel.
2. Enable HTTP/2 in future tasks (not yet configured) if repeated handshake overhead persists.
3. Keep certificate files on SSD for faster disk access.

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant Browser as Browser
  participant TLS as TLS Cache
  Dev->>Browser: Load dev server after restart
  Browser->>TLS: Populate session cache
  alt First request
    TLS-->>Browser: No cached session → full handshake
    Browser-->>Dev: Slightly slower initial load
  else Subsequent request
    TLS-->>Browser: Reuse cached session
    Browser-->>Dev: Faster load
  end
```

### 6.2 Excessive CPU from TLS Logging

1. Disable verbose logging in antivirus / proxy tooling while testing.
2. Keep console logging minimal to avoid compounding overhead.

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant Tool as Security Tooling
  participant Browser as Browser
  Dev->>Tool: Observe high CPU usage
  Tool-->>Dev: TLS inspection logs heavy
  Dev->>Tool: Disable verbose mode temporarily
  Tool-->>Dev: CPU usage normalizes
```

---

## 7. Cross-Reference Matrix

| Symptom/Goal                        | Resolution Section | Additional Resources                            |
| ----------------------------------- | ------------------ | ----------------------------------------------- |
| Certificate missing                 | §2.1               | `docs/https-development-setup.md` §3            |
| Certificate expired                 | §2.2               | `docs/https-development-setup.md` §8            |
| Browser trust prompt                | §4                 | `docs/https-development-setup.md` §6.1          |
| Socket.IO WSS failure               | §5.1               | `docs/development-server.md` §8                 |
| Mixed content warnings              | §5.2               | `docs/development-proxy.md`                     |
| Microphone permission errors        | §5.3               | `docs/microphone-access-validation.md`          |
| Port conflict (5174 already in use) | §3.2               | `scripts/dev-orchestration.mjs` inline help     |
| TLS handshake timeout               | §5.4               | Organization security docs (VPN/Proxy handling) |

---

## 8. Change Log

- 2025-09-29: Initial publication (Task 2.10.6).
