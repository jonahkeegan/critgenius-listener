# Copilot Repository Instructions – CritGenius Listener

> Keep responses concise, type-safe, privacy-aware, and aligned with project architecture. Trust
> these instructions first; search only when a fact is missing or clearly outdated.

## 1. Repository Purpose & Scope

CritGenius Listener is a TypeScript monorepo (pnpm workspaces) providing real-time audio capture,
transcription, and speaker → character mapping for D&D / TTRPG sessions. It supplies structured,
privacy-conscious session data to other CritGenius components (Prompter, LLM, Publisher, Optimizer).
MVP focus: low-latency microphone capture, AssemblyAI streaming integration (mock-first in tests),
normalized transcript events, environment validation, and extensible configuration.

## 2. High-Level Architecture

- Pattern: Modular monolith (future microservices path) with packages:
  - `packages/client`: React + Vite, Web Audio API, Socket.IO client.
  - `packages/server`: Express + Socket.IO, AssemblyAI connector, upload + realtime endpoints.
  - `packages/shared`: Typed utilities, environment & config schemas (Zod), constants, logging
    helpers.
- Real-time channel: Socket.IO events (transcriptionStatus, transcriptionUpdate, error, etc.).
- Environment config: Central Zod schemas with startup validation (`validateEnvironmentOnStartup`).
  Fail fast with structured error messages.
- Privacy: Never log raw API keys or full config objects; use sanitizers / summaries.

## 3. Tooling & Standards

- Package manager: pnpm (always prefer `pnpm -w` or `pnpm --filter`).
- Language: TypeScript strict mode (no implicit any, exactOptionalPropertyTypes).
- Testing: Vitest (unit + integration). Avoid external network calls in tests—use mocks.
- Lint: ESLint zero warnings gate; Prettier formatting. Husky commit-msg enforces Conventional
  Commits.
- Node version: 18+ (align with engines if present).
- Target runtime: Modern browsers (client), Node 18 LTS (server). Web Audio API progressive
  enhancement.

## 4. Core Commands (Always Run From Repo Root Unless Noted)

Bootstrap:

```
pnpm install
```

Validate (preferred fast feedback cycle):

```
pnpm -w lint && pnpm -w type-check && pnpm -w test
```

Per package (examples):

```
pnpm --filter @critgenius/server test
pnpm --filter @critgenius/client dev
```

Build all:

```
pnpm -r build
```

Dev all:

```
pnpm dev
```

If a single server change: run server tests first (`pnpm --filter @critgenius/server test`) then
shared if you touched shared code.

## 5. Quality Gate Expectations

A PR is acceptable only if:

- ESLint: 0 errors/warnings (some configs treat warnings as failures).
- TypeScript: No errors (no suppression unless narrowly justified with comment). Avoid `any`.
- Tests: All passing across shared/server/client. No network dependency.
- No leaking secrets (mask or omit apiKey, jwt secrets, etc.).

## 6. Environment & Configuration

- Use `validateEnvironmentOnStartup()` instead of reading `process.env` directly in runtime code.
- Extend configuration by updating shared Zod schemas; regenerate types implicitly (TypeScript
  consumes them directly).
- Add new env vars with: schema → loader integration → example in `.env.example` (and
  staging/production variants if present) → doc update.
- For API key validation: basic length + allowed charset (`^[A-Za-z0-9_-]+$`). Do not over-specify
  vendor format (flexibility + testability).

## 7. AssemblyAI / Realtime Patterns

- SessionManager normalizes transcription payloads before emitting transcriptionUpdate.
- Connector lifecycle bound to room participant count; last leave triggers cleanup.
- Error events use structured codes: e.g. `ASSEMBLYAI_CONFIG_MISSING`, `ASSEMBLYAI_CONFIG_INVALID`,
  `TRANSCRIPTION_ERROR`.
- Tests mock the connector; do not introduce live websocket calls.

## 8. Adding Features Safely

1. Identify target package (shared first if types/constants needed).
2. Add or extend types in `packages/shared`—keep them minimal & composable.
3. Implement server or client changes using dependency inversion where feasible (pass validated
   config instead of global env reads).
4. Write/extend tests (happy path + 1–2 edge cases) before or alongside implementation.
5. Run full validation (lint, type-check, targeted tests, then full test sweep if shared touched).
6. Keep commits small; follow Conventional Commit format (`feat(server): ...`).

## 9. Testing Guidance

- Prefer pure logic in shared; isolate side effects for testability.
- Use mocks for external APIs (AssemblyAI) & avoid timers longer than necessary.
- For real-time events: assert normalized payload shape (sessionId, text, isFinal, confidence,
  words[] subset).
- Avoid snapshot tests for realtime text; prefer explicit field assertions.

## 10. Logging & Privacy

- Never log raw API keys, JWT secrets, or full sensitive config objects.
- When adding logs: prefer structured logging (object form) and sanitize fields (e.g. show 4-char
  prefix + mask).
- Use existing sanitization utilities if present; otherwise add in shared with clear tests.

## 11. Common Pitfalls & Resolutions

| Issue                                            | Resolution                                                                     |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| CRLF ↔ LF hook warnings                         | Ensure `.husky/*` scripts use LF; Windows devs run via Git Bash.               |
| Failing upload test (missing multipart boundary) | Error middleware maps boundary error → 400 "No files uploaded". Reuse pattern. |
| API key regex too strict                         | Use length≥32 + `^[A-Za-z0-9_-]+$`.                                            |
| Zod error formatting changed                     | Use simple issue.message mapping; avoid `any`.                                 |
| SessionManager test fragility                    | Keep minimal env mock; don't reintroduce unused fields.                        |

## 12. Architectural Principles Recap

- Privacy-first: minimal retention, explicit consent surfaces (future features respect this).
- Real-time <500ms latency target: avoid synchronous blocking in hot paths.
- Modular boundaries: shared (types/util) → server (infrastructure, connectors) → client (UI +
  capture).
- Progressive enhancement: degrade gracefully if Web Audio API unsupported (surface meaningful UI
  message).

## 13. When Extending Environment Schema

Checklist:

- Add field to appropriate Zod subgroup (category among the 16 documented categories).
- Provide default or refine() with explanatory message.
- Update `.env.example` (and staging/production templates if they exist in repo).
- Add test in shared validating parsing + error messaging edge case.
- Do not log raw value in validation errors—only mention variable name and expected format.

## 14. PR Preparation Checklist (Automate Mentally)

- [ ] Lint + type-check root & changed packages.
- [ ] Package-specific tests pass.
- [ ] If shared changed → run full test matrix (server/client/shared).
- [ ] No secret leakage in new code or logs.
- [ ] Conventional Commit messages.
- [ ] Added/updated doc sections if introducing new configuration or external behavior.

## 15. Searching Guidance

Trust this document first. Perform targeted search only if:

- Adding feature that touches unexplained domain area.
- Extending schemas or real-time event names not listed here.
- Investigating failing test with unclear origin. Otherwise avoid broad grep to reduce noise and
  speed iteration.

## 16. Style & Code Practices

- Prefer functional composition and small pure helpers in shared.
- Narrow types aggressively; avoid unions of `any`/broad objects.
- Guard all external input (including WebSocket payloads) with type checks before use.
- Keep server responses consistent via `createApiResponse(success, data?, error?)`.
- Avoid over-abstracting until 2–3 concrete call sites exist.

## 17. Adding Socket.IO Events

1. Add types in `packages/server/src/types/socket-events.ts` & mirrored client typings if needed.
2. Implement server emission & handlers with validation.
3. Update SessionManager or related service logic.
4. Add integration test covering new event emission path.

## 18. Performance Considerations

- Keep audio chunk processing non-blocking; no heavy CPU in hot path (delegate future heavy tasks to
  workers/services).
- Debounce UI state updates if adding high-frequency client events.

## 19. Security & Compliance Notes

- Always validate presence + format of sensitive env vars before startup.
- Do not persist raw audio unless explicitly added with retention policy.
- Ensure new endpoints apply CORS and do not expose internal stack traces.

## 20. Future Roadmap Hooks (Do NOT Implement Prematurely)

- Speaker profile persistence (Mongo + embedding/voice print indexing).
- Ecosystem export endpoints (Prompter, LLM, Publisher) beyond current stubs.
- AI model selection / GPT-5-mini integration placeholder (await harness).

---

Use these instructions to minimize redundant exploration. If a contradiction arises between code and
this document, prefer the code and propose a doc update.
