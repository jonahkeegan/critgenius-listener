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

### Accessibility Testing Harness

- Shared matcher + axe defaults live in `@critgenius/test-utils/accessibility`. Import
  `registerAccessibilityMatchers()` and `configureAxe()` in any package-level `test-setup.ts`
  immediately after the runtime + base matchers registration; see the client setup for reference.
- Validate the tooling stays wired by running
  `pnpm test:infrastructure -- --run tests/infrastructure/vitest-axe-integration.test.ts` whenever
  you touch accessibility dependencies or WCAG overrides.
- Dive deeper into recommended patterns in `docs/accessibility-testing-patterns.md` before writing
  new component audits.

### VSCode Setup (Prettier Format-on-Save)

- Install the workspace recommendations when prompted (Prettier, ESLint, TypeScript Nightly).
- Confirm VSCode picked up `.vscode/settings.json` (Format on Save enabled, Prettier pinned as the
  default formatter).
- Quick validation: create a scratch `.ts` file with uneven spacing, save, and verify the file snaps
  to `prettier.config.js` rules. Run `pnpm format:check` if you want a second opinion.
- Troubleshooting tips:
  - Prettier not triggering? Ensure no user-level formatter override is active
    (`Settings → defaultFormatter`).
  - ESLint fixes missing? Run `> Toggle Format on Save` once—our workspace keeps ESLint fixes
    explicit to avoid surprise edits.
  - Prettier config not detected? Check the output panel for “Prettier” logs; make sure
    `prettier.requireConfig` stays true in workspace settings.
- Other editors pick up the shared `.editorconfig` baseline. Layer Prettier on top (WebStorm auto
  detects it, Sublime Text works via JsPrettier, and Vim/Neovim users can wire it up through ALE or
  coc-prettier).

### Format-on-Save Validation Procedure

- Follow `docs/format-on-save-validation.md` whenever you tweak Prettier, EditorConfig, or lint
  automation. The guide walks through package × file-type coverage, ESLint auto-fix checks, and
  pre-commit alignment.
- Keep scratch files ephemeral—delete them once each matrix cell is validated to avoid noisy diffs.
- Capture outcomes in the validation matrix and drop a short note in `task-completion-reports/` if
  you run the audit as part of an infrastructure task.

### EditorConfig Support (All Editors)

The repository ships a root-level `.editorconfig` to keep fundamental whitespace rules aligned
across editors.

#### Editor Plugin Requirements

| Editor            | EditorConfig Support | Installation                               |
| ----------------- | -------------------- | ------------------------------------------ |
| VSCode (1.44+)    | ✅ Built-in          | None                                       |
| WebStorm/IntelliJ | ✅ Built-in          | None                                       |
| Sublime Text (4+) | ❌ Requires plugin   | Install `EditorConfig` via Package Control |
| Vim/Neovim        | ❌ Requires plugin   | Install `editorconfig/editorconfig-vim`    |
| Emacs             | ❌ Requires plugin   | Install `editorconfig-emacs`               |
| Atom              | ❌ Requires plugin   | Install `editorconfig` package             |

#### Quick Validation

1. Open any `.ts` or `.tsx` file.
2. Insert a tab at the start of a new line → expect two spaces.
3. Save the file → verify Git shows LF-only line endings (check with `git diff --stat`).
4. Undo or discard the scratch edits.

#### EditorConfig vs Prettier

- `EditorConfig` enforces baseline whitespace (indent style, size, line endings, trailing spaces).
- `prettier.config.js` governs full formatting (line length, quotes, wrapping, etc.).
- Let EditorConfig run inside the editor; Prettier still handles `pnpm format:*` commands and
  format-on-save.

#### Troubleshooting

| Symptom                              | Fix                                                                  |
| ------------------------------------ | -------------------------------------------------------------------- |
| Tab inserts four spaces              | Check for user-level overrides; ensure the EditorConfig plugin loads |
| Files save with CRLF                 | Run `git config core.autocrlf` → prefer `input` or `false`           |
| Editor ignores `.editorconfig` rules | Restart after installing the plugin; confirm project root is opened  |

#### Review Checklist (EditorConfig ↔ Prettier)

| Setting             | `.editorconfig` value                          | `prettier.config.js` source   | Status |
| ------------------- | ---------------------------------------------- | ----------------------------- | ------ |
| Indentation size    | `indent_size = 2`                              | `tabWidth: 2`                 | ✅     |
| Indentation style   | `indent_style = space`                         | `useTabs: false`              | ✅     |
| Line endings        | `end_of_line = lf`                             | `endOfLine: 'lf'`             | ✅     |
| Trailing whitespace | `trim_trailing_whitespace = true`              | Prettier trims on save        | ✅     |
| Final newline       | `insert_final_newline = true`                  | Prettier appends              | ✅     |
| Markdown nuance     | `trim_trailing_whitespace = false` in `[*.md]` | Preserves double-space breaks | ✅     |

Revisit this checklist during infra changes that touch either Prettier or EditorConfig so the two
configurations stay in sync.

## 3. Common Commands

| Objective                  | Command                        |
| -------------------------- | ------------------------------ |
| Dev all packages           | `pnpm dev`                     |
| Lint (all)                 | `pnpm -w lint`                 |
| Type-check                 | `pnpm -w type-check`           |
| Tests (all)                | `pnpm -w test`                 |
| Browser E2E (headless)     | `pnpm run test:e2e`            |
| Format write               | `pnpm -w format`               |
| Pre-commit validate (full) | `pnpm precommit:validate`      |
| Pre-commit scenario suite  | `pnpm precommit:simulate`      |
| Benchmark pre-commit perf  | `pnpm precommit:benchmark`     |
| Coverage (workspace)       | `pnpm test:coverage:workspace` |
| Coverage (theme-only)      | `pnpm test:coverage:<theme>`   |

Need deeper linting context? Start with `docs/eslint-guide.md` for workflows, rule rationale, and
troubleshooting.

### Browser E2E Workflow

**Initial Setup:**

- Run `pnpm run test:e2e:install` once per machine (or after Playwright updates) to download browser
  binaries with OS dependencies.
- Ensure development server is running: `pnpm dev` (required for E2E tests to connect to the app)

**Running E2E Tests:**

- Execute `pnpm run test:e2e` from the repo root to launch the client Playwright suite in headless
  mode via the workspace filter.
- Use `pnpm run test:e2e:headed` while debugging UI flows locally, or `pnpm run test:e2e:ui` for the
  interactive Playwright test runner.
- After a run, inspect results with `pnpm run test:e2e:report`; it opens the last Playwright HTML
  report without re-running tests.

**HTTPS Requirements:**

- For microphone access tests, HTTPS is required in development
- Follow `docs/https-development-setup.md` for certificate setup
- See `docs/https-troubleshooting-guide.md` for common HTTPS issues

**Learning Resources:**

- [Playwright Testing Guide](./playwright-testing-guide.md) - Comprehensive Playwright testing
  patterns
- [Comprehensive Testing Guide](./comprehensive-testing-guide.md) - Section 2.4 (E2E Browser
  Testing)
- [Playwright Parallelization Guide](./playwright-parallelization-guide.md) - Worker allocation and
  optimization

**All commands respect pnpm workspaces, so you can trigger them from any directory inside the
repo.**

### Visual Regression Testing with Percy

**Overview:**

- Percy provides automated visual regression testing to catch unintended UI changes across
  responsive breakpoints and browsers.
- Visual snapshots are captured during Playwright E2E tests and compared against approved baselines.
- Percy integration runs automatically in CI for all pull requests.

**Initial Setup:**

1. **Get Percy Token:**
   - Request `PERCY_TOKEN` from project maintainer or Percy dashboard
   - Set as environment variable for local testing:
     ```bash
     export PERCY_TOKEN=your_token_here  # Linux/macOS
     $env:PERCY_TOKEN="your_token_here"  # Windows PowerShell
     ```
   - Or add to `.env.local` (not committed): `PERCY_TOKEN=your_token_here`

2. **Understand Baselines:**
   - Baselines are approved reference snapshots stored in Percy's cloud
   - New Percy snapshots are compared against baselines to detect visual changes
   - Baselines are branch-aware and synchronized across team members

**Running Percy Locally:**

```bash
# Ensure dev server is running
pnpm dev  # Terminal 1

# Run E2E tests with Percy (captures snapshots automatically)
pnpm run test:e2e -- --project=chromium-desktop  # Terminal 2

# Check terminal output for Percy build URL
# Example: https://percy.io/critgenius/listener/builds/12345
```

**Reviewing Percy Builds:**

- Open the Percy dashboard URL from terminal output
- Review visual diffs at all three responsive widths (375px, 768px, 1920px)
- Approve or reject changes based on intentionality
- See [Percy Workflow Guide](./percy-workflow-guide.md) for detailed review process

**Percy in CI:**

- Percy runs automatically after `build-and-validate` job in `.github/workflows/ci.yml`
- Protected branches (`main`, `production`): Percy failures block merge
- Feature branches: Percy runs informational checks only
- Fork PRs: Percy runs in dry-run mode (no token access required)

**Troubleshooting:**

- **Token missing:** Verify `PERCY_TOKEN` is set correctly
- **Unexpected diffs:** See [Percy Troubleshooting Guide](./percy-troubleshooting.md)
- **CI failures:** Check Percy dashboard link in GitHub Actions output

**Learning Resources:**

- [Percy Workflow Guide](./percy-workflow-guide.md) - Daily development workflow and snapshot
  creation
- [Visual Regression Standards](./visual-regression-standards.md) - Quality standards and thresholds
- [Percy Troubleshooting Guide](./percy-troubleshooting.md) - Common issues and debugging

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
