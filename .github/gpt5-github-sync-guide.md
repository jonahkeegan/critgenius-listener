# GPT-5 Non-Destructive GitHub Sync Playbook

> Purpose: Provide a deterministic, low‑risk, CLI workflow GPT-5 should follow after finishing a
> task to sync changes to an open Pull Request (PR) without corrupting history, leaking ignored
> files, or force-pushing unexpectedly.
>
> Golden Rules:
>
> 1. Never overwrite remote history (`--force` / `--force-with-lease`) unless explicitly instructed
>    by user AND after a dry-run explanation.
> 2. Never add files blocked by `.gitignore` or containing secrets (e.g. real `.env`, build
>    artifacts, lockfiles you did not intentionally modify).
> 3. Always fetch + rebase on latest `main` before pushing.
> 4. Surface ambiguities; do not guess when destructive.
> 5. If any unexpected state is encountered, pause and ask the user with a concise recommended
>    action.

---

## Updated Operational Criteria (Aug 28, 2025)

These augment (do not replace) the Golden Rules and MUST be enforced every sync cycle:

1. Feature Branch & PR Naming: Ensure the active feature branch name reflects the MOST RECENTLY
   COMPLETED TASK (e.g. `feat/dev-infra/2-8-5-workflow-benchmarking`). If task scope advances,
   create / switch to a newly named branch before committing further related work. Do not continue
   piling unrelated tasks onto an outdated branch name.
2. Non-Deletion Policy for Markdown: NEVER delete local `*.md` files as part of automated sync. If a
   Markdown file appears removed in `git diff --name-status`, halt and request confirmation (likely
   accidental). Renames must use `git mv` so history persists.
3. Strict `.gitignore` Respect: Before staging, list ignored candidates with
   `git ls-files -o -i --exclude-standard`. If any appear, do not add them—report instead. Never
   override ignore rules during automated sync.
4. Commit Message Hook Non-Blocking Guarantee: The `commit-msg` hook MUST remain soft (exit 0).
   Expand pass-through conditions for CI/non-interactive environments (e.g., `CI`, `GITHUB_ACTIONS`,
   build IDs, explicit disable vars). Hard failures are converted to advisory warnings only.
5. Advisory-Only Conventional Commit Enforcement: Allow broad automation / maintenance prefixes
   (`Apply patch`, `Merge`, `Revert`, `Update`, `Add`, `Remove`) without warning. For other messages
   not matching Conventional Commit pattern, emit an advisory warning and proceed (never block local
   or automated commits).

Quick Branch Name Update Recipe (when latest completed task changes):

```bash
LATEST_TASK="2-8-5"          # Example
SLUG="workflow-benchmarking" # Kebab summary
NEW_BRANCH="feat/dev-infra/${LATEST_TASK}-${SLUG}"
git checkout -b "$NEW_BRANCH"  # or: git switch "$NEW_BRANCH" if already exists
```

Then push normally (see Steps 9–10). Close or supersede prior PR / rename PR via UI to align with
new branch name.

Markdown Deletion Guard (run before commit):

```bash
if git diff --name-status | grep -E '^D' | grep -iE '\\.md$'; then
  echo "⚠ Attempted Markdown deletion detected. Aborting per non-deletion policy." >&2
  exit 1  # abort automation; require explicit human confirmation
fi
```

Hook Soft Policy Reminder: Do NOT rely on the hook to enforce semantic rigor in automation contexts;
CI pipelines or code review remain the enforcement layer for message quality.

---

## High-Level Flow (Steps 1–13 Mapped)

1. Create task branch
2. Ensure local sync baseline (.gitignore honored)
3. Fetch latest refs
4. Rebase task branch onto updated `main`
5. Resolve conflicts safely
6. Stage modified tracked files
7. Stage intentional new files
8. (Optional) Stage all remaining changes ONLY if all are in-scope & safe
9. Commit (or amend last commit if fixup scope)
10. Push (regular fast‑forward; amend push if amended)
11. Verify PR state (commits, files, checks, conflicts)
12. Apply reviewer change requests → rebase & repeat
13. Escalate any other issue with proposed next step until merged

---

## Preconditions & Environment Safety Checks

Run these BEFORE touching history:

```bash
# Fail fast on errors / unset vars
set -euo pipefail

# Display git version (diagnostic)
git --version

# Ensure we are in repo root
git rev-parse --show-toplevel

# Show current branch + cleanliness
git status --short --branch
```

If detached HEAD or uncommitted unrelated changes exist, STOP and request user guidance.

---

## Step 1. Create a Branch for the Task

Naming: `feat/<ticket>` | `fix/<ticket>` | `chore/<topic>` (Conventional style).

```bash
BASE=main
TICKET="2-7-4"        # Example; replace
SLUG="realtime-refine" # Kebab summary
BRANCH="feat/${TICKET}-${SLUG}"

git checkout "$BASE"
git fetch origin --prune
git pull --rebase origin "$BASE"

git checkout -b "$BRANCH"
```

Idempotency: If branch exists locally, switch to it; if exists only remote, `git fetch` then
`git switch BRANCH`.

---

## Step 2. Sync with Remote & Honor `.gitignore`

Do NOT stage ignored files. List potential accidental inclusions:

```bash
echo "--- Ignored candidates (should be empty) ---"
git ls-files -o -i --exclude-standard || true
```

If output contains sensitive / large files → alert user.

---

## Step 3. Fetch Latest Refs

```bash
git fetch origin --prune --tags
```

Verify remote main freshness:

```bash
git log --oneline -1 origin/main
git log --oneline -1 main
```

If `main` lags `origin/main`, sync it (already done earlier if starting fresh).

---

## Step 4. Rebase Task Branch onto Main

```bash
git checkout "$BRANCH"
git fetch origin --prune
# Update local main baseline
git checkout main && git pull --rebase origin main
# Rebase feature branch
git checkout "$BRANCH"
git rebase main
```

If interactive cleanup required (squash/fixup) ONLY do so when preparing final PR polish—otherwise
keep atomic commits.

---

## Step 5. Resolve Conflicts (If Any)

Detection:

```bash
if ! git rebase main; then
  echo "Rebase paused due to conflicts.";
fi

git status --short
```

For each conflicted file:

1. Open & resolve markers (`<<<<<<<`, `=======`, `>>>>>>>`).
2. Prefer preserving BOTH sides logically (non-destructive). Only drop code with clear redundancy.
3. After edit:

```bash
git add <file>
```

Continue once all resolved:

```bash
git rebase --continue
```

Abort only if user instructs:

```bash
git rebase --abort
```

Integrity check after conflicts:

```bash
npm run -w lint || pnpm -w lint || true # tolerant
npm -w test || pnpm -w test || true     # gather feedback
```

Report failures, do not ignore.

---

## Step 6. Stage Modified (Previously Tracked) Files

Dry-run list:

```bash
git diff --name-only
```

Stage selectively:

```bash
git add path/to/modified1.ts path/to/modified2.test.ts
```

OR if all modified tracked files are in-scope:

```bash
git add -u   # ONLY updates tracked files
```

---

## Step 7. Stage New Intentional Files

List untracked:

```bash
git ls-files -o --exclude-standard
```

Add only purposeful additions:

```bash
git add docs/new-guide.md .github/workflows/ci.yml
```

Never add: build output (`dist/`, `build/`), secrets, large binaries >5MB unless approved.

---

## Step 8. (Conditional) Stage All Remaining Changes

ONLY if every remaining change is within task scope and safe:

```bash
git add .
```

Otherwise enumerate and request user decision.

---

## Step 9. Commit (or Amend) with Clear Message

If no prior commit yet:

```bash
git commit -m "feat(server): implement session timeout enforcement\n\n- Add SessionTimeoutManager\n- Update environment schema (SESSION_TIMEOUT_MS)\n- Extend tests for expiry edge cases"
```

If you are making a minor fix to the immediately previous commit (typo, lint):

```bash
git commit --amend --no-edit   # or amend message with -m
```

If multiple logical changes piled up erroneously, pause & ask if interactive rebase is desired.

---

## Step 10. Push to Update PR

First push (creates remote branch):

```bash
git push -u origin "$BRANCH"
```

Normal update (new commits):

```bash
git push origin "$BRANCH"
```

If you amended the last commit (fast-forward prevented):

```bash
git push --force-with-lease origin "$BRANCH"
```

Safety: Explain to user before executing `--force-with-lease`; NEVER plain `--force`.

---

## Step 11. Verify PR Status

Automated (CLI introspection + optional API if available). Manual CLI approximations:

```bash
# Latest remote branch tip
git log --oneline -3 origin/"$BRANCH"

# Diff vs main for sanity
git diff --name-status origin/main...origin/"$BRANCH"
```

Checklist (report to user):

- [ ] New commits visible (count since last report)
- [ ] Expected files appear in diff (no surprise files)
- [ ] CI checks started (if accessible) / prior local lint+tests pass
- [ ] No merge conflicts reported by GitHub UI If conflicts now appear despite local rebase → fetch
      & rebase again; remote changed in the interim.

---

## Step 12. Apply Reviewer (Copilot / Human) Recommendations

Process:

1. Pull latest comments; summarize requested changes.
2. Implement edits locally.
3. Repeat Steps 6–10.
4. If many micro-fix commits accumulate, offer squash (interactive rebase) prior to final approval.
   Only proceed after user confirmation.

Reviewer fix pattern (small tweak):

```bash
git add affected/file.ts
git commit -m "fix(shared): address reviewer note on env schema validation"
git push origin "$BRANCH"
```

For commit hygiene at end (optional squashing):

```bash
git rebase -i main   # mark fix commits as 'f' or 's'
```

Warn user before executing.

---

## Step 13. Handle Other Issues / Escalation

If any unexpected condition arises: Produce a short diagnostic block:

```text
Issue: <concise description>
State Evidence:
- Branch: <branch>
- Ahead/Behind: <git status -sb>
- Pending Conflicts: <yes/no>
Proposed Action: <single recommended step>
Alternatives: [Option A], [Option B]
Confidence: <high/med/low>
```

Wait for user approval unless the action is trivially safe (e.g., re-run `git fetch`).

---

## Conflict Resolution Deep Dive (Safe Strategy)

1. Inspect diff context:

```bash
git diff --merge <file>
```

2. Decide merge strategy (keep both / prefer ours / prefer theirs). Avoid wholesale deletion.
3. Re-run minimal tests for touched scope (e.g., server package only):

```bash
pnpm -w --filter @critgenius/server test
```

4. After final resolution:

```bash
git add <file>
git rebase --continue
```

---

## Verification & Sanity Suite Before Final Push

Run fast gates (do not skip silently):

```bash
pnpm -w lint || true
pnpm -w type-check || true
pnpm -w test || true
```

If failures occur, report + halt push unless trivial to auto-fix (prettier format, etc.).

---

## Final Merge (Human Maintainer or Approved Automation)

After PR approved & checks green: Preferred: Fast-forward merge / rebase merge preserving linear
history (no merge commit). If repository policy requires rebase:

1. `git fetch origin && git checkout "$BRANCH" && git rebase origin/main`
2. Resolve conflicts if any.
3. Final push (force-with-lease if rebased):

```bash
git push --force-with-lease origin "$BRANCH"
```

4. Trigger merge via GitHub UI or API (not handled automatically unless authorized).

Post-merge cleanup (only after confirming branch on remote has merged):

```bash
git checkout main
git pull --rebase origin main
git branch -d "$BRANCH"
git push origin --delete "$BRANCH"  # optional; confirm PR closed
```

---

## Quick Decision Tree (When Unsure)

| Situation                     | Action                | Destructive?      | Requires User OK   |
| ----------------------------- | --------------------- | ----------------- | ------------------ |
| Local branch behind main      | Rebase                | No                | No                 |
| Amended last commit           | force-with-lease push | Low risk          | Yes                |
| Multiple messy commits at end | Interactive rebase    | Potential reorder | Yes                |
| Untracked large file found    | Exclude & notify      | No                | Yes (if keep)      |
| Merge conflict complexity     | Pause & summarize     | No                | Yes                |
| CI failing tests              | Report failures       | No                | Yes (before fixes) |

---

## Minimal Script Skeleton (Pseudo-Automation)

```bash
set -euo pipefail
BRANCH="$1"  # assumed existing

git fetch origin --prune
git checkout main && git pull --rebase origin main
git checkout "$BRANCH"
git rebase main || {
  echo "Conflicts; resolve manually"; exit 1; }

pnpm -w lint || true
pnpm -w type-check || true
pnpm -w test || true

git add -u
# Add intentional new files individually here
if git diff --cached --quiet; then
  echo "No staged changes"; exit 0;
fi

git commit -m "chore: sync branch with main after task completion"
git push origin "$BRANCH"
```

Augment with safety prompts before any forced action.

---

## Reporting Format After Each Sync Cycle

```text
SYNC REPORT
Branch: feat/2-7-4-realtime-refine
Ahead/Behind main: +2 / 0
Commits Pushed This Cycle: 1
Changed Files: 5 (list: a,b,c,d,e)
CI Status: Pending (lint passed locally; tests passed: 42/42)
Conflicts: None
Next Suggested Step: Await reviewer feedback.
```

---

## Common Pitfalls & Safeguards

| Pitfall                               | Prevention                                                               |
| ------------------------------------- | ------------------------------------------------------------------------ |
| Accidental inclusion of secret `.env` | Verify with `git ls-files -o -i --exclude-standard` & explicit allowlist |
| Force push wiping teammate work       | Use `--force-with-lease` + user confirmation                             |
| Staging build artifacts               | Rely on `.gitignore`; manually review `git status` before `git add .`    |
| Losing conflict context               | Use `git diff --merge` before editing; do not overwrite blindly          |
| Divergent main after long rebase      | Re-run `git fetch` + `git rebase --rebase-merges main` if needed         |
| Large binary accidentally added       | `git rm --cached <file>` then recommit; inform user                      |

---

## When to Ask the User

Ask whenever: (a) a destructive rewrite is proposed, (b) ambiguity in conflict resolution semantics,
(c) secrets / ignored files appear staged, (d) CI newly failing in untouched area (possible flaky
test), (e) branch divergence requires non-trivial history surgery.

---

## Completion Criteria

A task’s sync lifecycle is COMPLETE only when:

- Branch rebased cleanly onto latest `main`
- PR shows intended diff only (no extraneous files)
- All required checks green
- Review feedback addressed or explicitly deferred with reason
- Final merge performed (rebase / fast-forward) and branch removed (optional)
- User receives final SYNC REPORT summary

---

## Final Reminder

This guide optimizes for safety + clarity over minimal keystrokes. Always prefer an extra
verification step to a silent destructive action.

> If ANY step differs from repository policy discovered later, update this guide in a follow-up PR
> (`docs: refine GPT-5 sync playbook`).
