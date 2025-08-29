# Pre-commit Workflow (Husky + lint-staged + Conditional Type Check)

This repository uses Husky and lint-staged to enforce fast, local quality gates while keeping
commits responsive. We now include a conditional TypeScript project reference type check ONLY when
staged changes include `.ts` / `.tsx` files. This balances feedback speed with early detection of
type regressions.

## What Runs (Sequential)

| Step | Trigger Condition                    | Tool / Script          | Scope (staged)                                | Purpose                       |
| ---- | ------------------------------------ | ---------------------- | --------------------------------------------- | ----------------------------- |
| 1    | Always                               | lint-staged → ESLint   | `*.{ts,tsx,js,jsx}`                           | Lint + auto-fix               |
| 2    | Always                               | lint-staged → Prettier | `*.{ts,tsx,js,jsx,json,md,yml,yaml,css,scss}` | Enforce formatting            |
| 3    | If any staged `*.ts` / `*.tsx` files | `pnpm -w type-check`   | Whole monorepo (incremental via TS)           | Validate types (project refs) |

If Step 3 is skipped (no TS changes), a message indicates the skip. Average overhead for small TS
diffs is typically <3s on modern hardware (project-scale dependent).

## Hook Implementation Highlights

File: `.husky/pre-commit`

- Guarded type check only when needed (uses `git diff --cached --name-only --diff-filter=ACM`).
- Uses the workspace script so each package enforces its own `tsconfig` + references.
- Timed duration output for type-check to monitor performance drift.
- Clear emoji-coded status lines for rapid visual parsing.

## Configuration Sources

- Hook scripts: `.husky/`
- Staged file rules: `lint-staged` block in `package.json`
- Type checking command: root `package.json` → `type-check` (recursive)

## Recommended Local Workflow

Before large commits touching cross-package types:

```bash
pnpm -w lint && pnpm -w type-check && pnpm -w test
```

## Skipping (Rare Cases Only)

```bash
git commit -m "chore: bulk vendor sync" --no-verify
```

Avoid skipping; file an issue if hooks become a bottleneck.

## Troubleshooting

| Symptom                        | Cause                                   | Resolution                                              |
| ------------------------------ | --------------------------------------- | ------------------------------------------------------- | --- | ----- |
| Hook not firing                | Missing `core.hooksPath` or permissions | Re-run `pnpm install` (triggers `prepare`)              |
| Slow type check                | Cold TS build cache or broad refactor   | Run `pnpm -w type-check` once pre-commit to warm cache  |
| CRLF issues                    | Windows shell differences               | Use Git Bash; ensure LF in `.husky/*`                   |
| False skip of TS check         | Grep pattern mismatch                   | Confirm file is staged and extension is `.ts`/`.tsx`    |
| Scenario simulation mismatch   | Outdated simulation script              | Re-run `pnpm precommit:simulate` after fresh install    |
| Simulation leaves staged files | Interrupted execution                   | Run `git reset HEAD . && git checkout -- .precommit-sim |     | true` |

### Validation / Simulation Utilities

- `pnpm precommit:validate` – Run full-lint + format check + type-check (no staging logic).
- `pnpm precommit:simulate` – Execute scenario suite (clean, lint-error, format-error, type-error)
  to ensure hook behavior matches expectations.

Expected outcomes:

| Scenario     | Should Pass              | Reason                                                |
| ------------ | ------------------------ | ----------------------------------------------------- |
| clean        | Yes                      | All rules satisfied                                   |
| lint-error   | No                       | ESLint violation blocks commit                        |
| format-error | No (auto-fix if fixable) | Formatting corrected or failure surfaced              |
| type-error   | No                       | Type mismatch in TS stage triggers type-check failure |

If `format-error` is auto-fixed by Prettier, the simulation may report pass; treat that as
acceptable (the real hook would amend file pre-commit). Adjust test expectation manually if
formatting rules change.

## Performance Notes

TypeScript invocation runs after lint/format to avoid wasting cycles on code that would be blocked
for style issues. If performance degrades, consider:

1. Adding incremental build outputs per package (e.g. `tsc --build --incremental`).
2. Splitting large composite tsconfigs.
3. Caching `.tsbuildinfo` in CI to compare timings.

## Philosophy

Fast, deterministic, privacy-conscious guards that surface actionable failures early without
penalizing non-TypeScript-only commits.

---

Maintained by the CritGenius Listener Infrastructure team.
