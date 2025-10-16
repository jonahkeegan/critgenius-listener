# Git Safe Sync Script Guide

**Script:** `scripts/git-safe-sync.sh`  
**Alias:** `pnpm run git:safe-sync -- [flags]`  
**Purpose:** Non-destructive, privacy-aware helper that rebases your current feature branch onto
latest `main`, stages only safe changes, commits (or amends), and optionally pushes — all while
honoring `.gitignore` and avoiding knowledge-base / sensitive paths.

## Why This Script Exists

Manual ad-hoc rebases risk:

- Accidentally staging ignored memory-bank / knowledge docs or temp artifacts.
- Forgetting to fetch & rebase on latest `main` → stale PR base.
- Force-pushing when an amend was unintended.
- Platform quirks (Windows Git Bash) causing partial command mistakes.

`git-safe-sync.sh` encodes the GPT-5 Non-Destructive GitHub Sync Playbook into a deterministic flow.

## Key Guarantees

- Never force-push unless you explicitly request amend + push.
- Refuses to operate if a rebase is already in progress.
- Filters new files: only allows expected source/test/script additions.
- Automatically UNSTAGES any tracked files under: `memory-bank/**`, `task-completion-reports/**`,
  `context-inputs/**`, `workflow-docs/**`, `docs/**` (even if previously tracked) unless
  `--allow-kb` is provided.
- Safe exit if nothing staged after filtering.

### Reserved Filename Guardrails

- The CI pipeline now runs `pnpm run validate:filenames` on every push and pull request to ensure
  Windows-reserved device names (e.g., `NUL`, `CON`, `PRN`, `COM1`) never slip into the repo.
- Run the same command locally before invoking the safe sync script if you touched scripts, build
  artifacts, or diagnostic logging options:

  ```bash
  pnpm run validate:filenames
  ```

- If the validator flags an issue, rename the file or update the offending configuration (for
  example, change `DEBUG_VITEST_PATH_OUTPUT` to a safe filename like `diagnostic-output.log`) before
  committing. This keeps local workflows aligned with CI enforcement.

## Usage Overview (Dry-Run Default)

```
# Preview (dry-run is implicit)
pnpm run git:safe-sync -- -m "chore: sync preview"

# Execute real operations (add --apply)
pnpm run git:safe-sync -- -m "feat(eslint): dev infra 2-8-2 add accessibility plugin, comprehensive lint scripts, and config validatio" --apply --push

# Amend last commit (real) and push
pnpm run git:safe-sync -- --amend --apply --push

# Include safe new files and push (real)
pnpm run git:safe-sync -- -m "test: add eslint regression cases" --add-new --apply --push

# Explicit dry-run (same as implicit)
pnpm run git:safe-sync -- -m "chore: sync preview" --dry-run
```

## Flags

| Flag                   | Description                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------- |
| `-m, --message <text>` | Commit message (mandatory unless `--amend`).                                            |
| `--amend`              | Amend previous commit; message unchanged unless `-m` given.                             |
| `--add-new`            | Stage new untracked SAFE files (see allow-list).                                        |
| `--no-tests`           | Skip lint/type/test probes (faster; rely on CI).                                        |
| `--push`               | Push after commit (ignored unless `--apply`).                                           |
| `--dry-run`            | Explicit dry-run (default behavior).                                                    |
| `--apply`              | Perform real git operations (turns off dry-run).                                        |
| `--allow-kb`           | Allow staging knowledge-base / docs paths (memory-bank, task-completion-reports, etc.). |
| `--no-color`           | Disable ANSI color output (auto-disabled if non-TTY or `NO_COLOR` env set).             |
| `--help`               | Display header help from script.                                                        |

## Safe New File Allow-List

Regex applied to untracked files when `--add-new` is used:

```
^(scripts/.*\.(sh|mjs)|tests/.*|packages/[^/]+/src/.*|eslint.config.js)$
```

Blocked patterns always ignored even if matched above:

```
^memory-bank/ | ^task-completion-reports/ | ^context-inputs/ | ^workflow-docs/ | ^docs/
```

## Color Output

The script emits colorized categories to improve scan speed (auto-enabled only when stdout is a TTY
and `--no-color` and `NO_COLOR` are not set).

| Category             | Meaning                             | Example Tag                           |
| -------------------- | ----------------------------------- | ------------------------------------- |
| Info                 | Neutral progress messages           | `[info] Fetching latest refs...`      |
| Dry-Run              | Simulated command (no mutation)     | `[dry-run] git rebase main`           |
| Commit               | Recently listed commits             | `[commit] <hash> <subject>`           |
| Skip                 | File excluded (knowledge-base/docs) | `[skip] memory-bank/activeContext.md` |
| Modified / Untracked | Pre-flight diff entries             | `M path/to/file.ts`, `? newFile.ts`   |
| Warn                 | Non-fatal issues                    | `[warn] Lint encountered warnings`    |
| Error                | Fatal abort reason                  | `[error] Rebase in progress`          |

Disable coloring with `--no-color` (or by setting env `NO_COLOR=1`). In CI logs (non-TTY) colors are
automatically omitted. The semantic tags (e.g. `[info]`, `[dry-run]`) remain so output stays
machine/grep friendly.

## Sample Session (Dry-Run → Apply)

Dry-run first (implicit):

```
pnpm run git:safe-sync -- -m "feat: socket resilience layer"

[info] Branch: feat/socket-resilience
[info] Fetching latest refs...
[dry-run] git fetch origin --prune --tags
[info] Updating local main...
[dry-run] git checkout main
... (rebases & probes simulated) ...
[info] Pre-flight diff summary (before staging):
	Modified (3):
		M packages/client/src/socket.ts
		M packages/shared/src/types.ts
		M README.md
	Untracked (1):
		? scripts/git-safe-sync.sh
[info] Staging tracked modifications (excluding knowledge-base unless --allow-kb).
[dry-run] git add -u
[info] Creating new commit.
[dry-run] git commit -m "feat: socket resilience layer"
[info] Done. Summary:
[commit] 1a2b3c4 feat: previous commit subject
```

If output looks correct, apply & push:

```
pnpm run git:safe-sync -- -m "feat: socket resilience layer" --apply --push
```

Typical real run differences:

- `[dry-run]` prefixes disappear and actual git commands execute.
- A commit hash for the new commit appears (no `[dry-run]`).
- If `--push` included, you'll see `[info] Pushing branch...` and no force unless amending.

To intentionally include knowledge-base files:

```
pnpm run git:safe-sync -- -m "docs: update progress log" --allow-kb --apply
```

To disable color (e.g., piping to a file):

```
pnpm run git:safe-sync -- -m "chore: sync" --no-color
```

## Workflow Steps (Internal)

1. Validate repo + branch (no detached HEAD, no rebase in progress).
2. Fetch + prune remote refs.
3. Determine rebase base:
   - Clean tree: checkout & fast-forward local `main`, then switch back.
   - Dirty tree: skip checkout & rebase directly onto `origin/main` with `--autostash` (your
     uncommitted changes are stashed & reapplied automatically).
4. Rebase current branch onto selected base (with `--autostash` if dirty).
5. Optional lint / type / targeted test probes (non-blocking if they fail with warnings).
6. Pre-flight diff summary (modified + untracked, truncated to 50 each) for situational awareness.
7. Stage tracked modifications (`git add -u`).
8. Optionally stage filtered new files.
9. (Unless `--allow-kb`) unstage knowledge-base / docs paths if present.
10. Commit or amend.
11. Optional push (force-with-lease only if amending).
12. Summarize last 3 commits + staged file list.

## When to Use

- Before pushing a feature branch (keeps PR minimal & up-to-date).
- After resolving local changes you want to bundle cleanly.
- Prior to requesting review, to ensure rebase + filtered staging.

## When NOT to Use

- During an active merge/rebase conflict (resolve first).
- For large multi-commit history shaping (use interactive rebase manually).
- To stage memory-bank documentation updates intentionally (stage those manually to avoid blocking
  ignore policy evolution).

## Extensibility Ideas

| Enhancement                         | Rationale                                 |
| ----------------------------------- | ----------------------------------------- |
| Dry-run default with `--apply` flag | Further reduces accidental mutation.      |
| Pre-push full test suite option     | Stronger local gate for critical changes. |
| Severity gate (fail if lint errors) | Enforce zero-warning policy pre-commit.   |
| Auto PR open / refresh integration  | Developer QoL improvement.                |

## Troubleshooting

| Symptom                       | Cause                         | Resolution                                                        |
| ----------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| `In-progress rebase detected` | Previous rebase not completed | Finish (`git rebase --continue`) or abort (`git rebase --abort`). |
| No staged changes             | Filters removed everything    | Stage manually or add `--add-new` if appropriate.                 |
| Force-with-lease refused      | Remote updated unexpectedly   | Fetch again and re-run (manual inspection).                       |
| Lint/type warnings shown      | Informational (non-blocking)  | Investigate locally; CI enforces stricter gates.                  |

## Security / Privacy Notes

- Never echoes environment variable values.
- Avoids staging knowledge-base or doc directories by default.
- Relies on `--force-with-lease` (never raw `--force`) for amend safety.

## Related Docs

- `context-inputs/gpt5-github-sync-guide.md` (underlying playbook)
- `docs/pre-commit-workflow.md`
- `docs/eslint-scripts.md`

---

Maintains a predictable, low-friction Git hygiene workflow aligned with CritGenius quality gates.
