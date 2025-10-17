# Developer Onboarding Guide

Welcome to CritGenius Listener. This guide gets you productive quickly while respecting project
quality gates and privacy principles.

## 1. Prerequisites

| Tool    | Required Version | Notes                              |
| ------- | ---------------- | ---------------------------------- |
| Node.js | 18+ LTS          | Align with `.nvmrc` if added later |
| pnpm    | 8+               | Monorepo package manager           |
| Git     | Latest stable    | Hooks enabled (Husky)              |

## 2. Initial Setup

```bash
pnpm install
pnpm -w lint && pnpm -w type-check && pnpm -w test   # Sanity baseline
# Optional: pnpm certs:setup                          # Prepare HTTPS dev certs (see docs/https-development-setup.md)
```

This installs all workspace deps and activates Husky via the `prepare` script.

For secure-context features (microphone access, Socket.IO WSS), complete the
`docs/https-development-setup.md` walkthrough after cloning. Troubleshooting resources live in
`docs/https-troubleshooting-guide.md`.

## 3. Common Commands

| Objective                  | Command                        |
| -------------------------- | ------------------------------ |
| Dev all packages           | `pnpm dev`                     |
| Lint (all)                 | `pnpm -w lint`                 |
| Type-check                 | `pnpm -w type-check`           |
| Tests (all)                | `pnpm -w test`                 |
| Format write               | `pnpm -w format`               |
| Pre-commit validate (full) | `pnpm precommit:validate`      |
| Pre-commit scenario suite  | `pnpm precommit:simulate`      |
| Benchmark pre-commit perf  | `pnpm precommit:benchmark`     |
| Coverage (workspace)       | `pnpm test:coverage:workspace` |
| Coverage (theme-only)      | `pnpm test:coverage:<theme>`   |

### Coverage Workflow Integration

- Meet tiered thresholds enforced by `config/coverage.config.mjs` (shared ≥75%, client/server ≥50%,
  workspace/test-utils ≥30%).
- Prefer `pnpm test:coverage:<theme>` during iteration; regenerate the summary with
  `pnpm test:coverage:summary` before opening a PR.
- See `docs/coverage-workflow-guide.md` for the five-minute walkthrough and
  `docs/coverage-troubleshooting.md` when coverage fails locally or in CI.

## 4. Branching & Commits

Use Conventional Commits:

```
feat(server): add session health probe
fix(shared): correct AssemblyAI config validation
```

Commit message hook is advisory (warn-only) to avoid blocking automation.

## 5. Editing Shared Types Safely

1. Modify `packages/shared` types.
2. Run `pnpm -w type-check` (ensures all references resolve).
3. Run targeted tests: `pnpm --filter @critgenius/{shared,server,client} test`.
4. Commit once green.

## 6. Pre-Commit Behavior (Summary)

On commit: staged lint + format, then conditional TS project type-check if any `.ts`/`.tsx` staged.
Fast path for non-TS commits.

## 7. Performance Tips

- Warm caches: run `pnpm -w type-check` after large refactors before first commit.
- Investigate slowdowns: `pnpm precommit:benchmark 2`.
- Avoid staging large generated artifacts.

## 8. Troubleshooting Quick Table

| Issue                 | Action                                                                           |
| --------------------- | -------------------------------------------------------------------------------- |
| Hook skipped          | Ensure `.husky/` exists; re-run `pnpm install`                                   |
| ESLint failure        | `pnpm -w lint:fix` then restage                                                  |
| Type errors           | Open first error; fix root cause (often shared type)                             |
| Format drift persists | Confirm pattern in `package.json` lint-staged block                              |
| Benchmark regression  | Capture numbers; open infra ticket                                               |
| Coverage failure      | Run `pnpm test:coverage:<theme>` then consult `docs/coverage-troubleshooting.md` |

## 9. Adding Dependencies

Prefer adding to the specific package (`pnpm --filter @critgenius/server add <dep>`). Avoid
root-only dependencies except tooling.

## 10. Privacy & Logging

Never log raw API keys or secrets. Use masking utilities (see shared logging helpers) if adding new
logs.

## 11. Ready Checklist

- [ ] Installed dependencies
- [ ] Ran lint/type-check/tests successfully
- [ ] Ran coverage for relevant theme/workspace and reviewed summary
- [ ] Understood commit gating
- [ ] Verified you can run simulation script
- [ ] Benchmarked (optional) baseline

## 12. Support

Open a GitHub issue with label `onboarding` for gaps or friction. PRs updating this doc welcome.

---

Keep this lean & current; update when workflow changes.
