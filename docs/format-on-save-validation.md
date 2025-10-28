# Format-on-Save Validation Procedure

This guide documents the manual validation workflow for CritGenius Listener's format-on-save
experience. Use it when onboarding new contributors, auditing editor configuration changes, or
investigating formatting regressions.

## Objectives

- Confirm format-on-save runs Prettier consistently across the monorepo.
- Ensure ESLint auto-fix rules do not fight with Prettier output.
- Verify pre-commit hooks accept formatted files without further changes.
- Capture findings so future infrastructure updates can spot regressions quickly.

## Scope

| Package    | Path                       | Primary Formats |
| ---------- | -------------------------- | --------------- |
| client     | `packages/client`          | `.tsx`, `.ts`   |
| server     | `packages/server`          | `.ts`, `.js`    |
| shared     | `packages/shared`          | `.ts`, `.json`  |
| test-utils | `tests` + `packages/**/`\* | `.ts`, `.md`    |

`*` `test-utils` touches helpers that live under `tests/` and package-local fixtures. Include any
utility workspace you change during validation.

## Prerequisites

- VS Code with workspace recommendations installed (Prettier, ESLint).
- `pnpm install` completed so Husky hooks are active.
- No staged changes. If you already have work in progress, stash it first.

## Configuration Cross-Check

Before touching files, skim these sources to ensure expectations align:

| Source                  | Key Settings                                               |
| ----------------------- | ---------------------------------------------------------- |
| `.vscode/settings.json` | `editor.formatOnSave`: `true`; Prettier default            |
| `.editorconfig`         | `indent_size = 2`, `end_of_line = lf`                      |
| `prettier.config.js`    | `tabWidth: 2`, `singleQuote: true`, `trailingComma: "all"` |
| `package.json`          | `lint-staged` runs `pnpm format:write` + ESLint            |

If any setting deviates, resolve that first—the validation below assumes baseline configuration is
in sync.

## Validation Matrix

Track progress with the following matrix. Mark outcomes as ✅ (pass), ⚠️ (issue noted), or ❌
(fail). Include notes if you discover problems.

| Package × File Type | `.ts` | `.tsx` | `.js` | `.jsx` | `.json` | `.md` | `.yml` | `.css` |
| ------------------- | ----- | ------ | ----- | ------ | ------- | ----- | ------ | ------ |
| client              |       |        |       |        |         |       |        |        |
| server              |       |        |       |        |         |       |        |        |
| shared              |       |        |       |        |         |       |        |        |
| test-utils          |       |        |       |        |         |       |        |        |

Copy this table into your working notes or a throwaway scratch file while validating.

## Step 1: Basic Format-on-Save

1. Pick the target package/folder and create a scratch file (for example, `__format-check.ts`).
2. Introduce formatting issues:
   - Uneven indentation
   - Mixed single/double quotes
   - Missing trailing comma in objects/arrays
3. Save the file.
4. Expect VS Code to trigger Prettier and normalize the file immediately.
5. Record the outcome in the matrix. Delete the scratch file once the cell is filled in.

> Tip: When validating multiple extensions at once, keep the files open side-by-side and work
> through them rapidly—format-on-save should apply on every save.

## Step 2: ESLint Auto-Fix Compatibility

1. In an existing source file (or your scratch file), add an obvious ESLint violation, such as an
   unused `const` or `console.log` in a strict file.
2. Save the file.
3. Confirm Prettier applies formatting and ESLint runs its auto-fix without reverting Prettier
   output.
4. Remove the temporary code.

If ESLint keeps undoing Prettier changes, check the relevant rule in `eslint.config.js` and make
sure `prettier` is last in the extends chain.

## Step 3: Pre-Commit Hook Alignment

1. Stage one file per extension that already passed Steps 1–2.
2. Run `pnpm precommit:validate` or `git commit --no-verify --dry-run` to exercise lint-staged.
3. Expect the hooks to complete without further modifications or errors.
4. If hooks reformat files, capture the `git diff` and confirm the update matches Prettier output.

## Optional: Non-VS Code Editors

If you use an alternative editor, spot-check that EditorConfig rules apply:

- WebStorm/IntelliJ: `Code → Reformat Code` should match Prettier output when configured with the
  Prettier plugin.
- Vim/Neovim: ensure `:w` triggers your Prettier integration (ALE, null-ls, etc.).
- Sublime Text: run `JsPrettier: Format Code` to confirm configuration pickup.

Document any editor-specific setup so the onboarding guide stays accurate.

## Recording Results

Log findings in the task tracker or infrastructure journal. Include:

- Date of validation
- Editor version(s) used
- Any deviations discovered
- Follow-up actions (PRs, docs updates, configuration tweaks)

For recurring infra audits, keep completed matrices in the `task-completion-reports/` folder with a
clear file name, for example `task-3-4-3-format-on-save-<YYYYMMDD>.md`.

## Troubleshooting

| Symptom                          | Checks                                                                                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Format-on-save does nothing      | Verify VS Code reports "Prettier" as the default formatter (`⌘,` → search `default formatter`). Ensure `editor.formatOnSave` is enabled for the workspace. |
| ESLint rewrites Prettier output  | Confirm the ESLint config includes `plugin:prettier/recommended`. Ensure your ESLint extension runs on save (`eslint.run` setting).                        |
| Hook reintroduces diffs          | Inspect the `lint-staged` block in `package.json`. It should invoke `pnpm format:write` before ESLint.                                                     |
| Markdown trailing spaces removed | `.editorconfig` overrides this—make sure the file lives under the repo root so the `[*.md]` section applies.                                               |

## Completion Criteria Checklist

- [ ] Every package × file type cell marked in the matrix
- [ ] Format-on-save confirmed for each tested file
- [ ] ESLint auto-fix verified to coexist with Prettier formatting
- [ ] Pre-commit hooks accept the formatted files
- [ ] Results documented with any remediation steps

Once all boxes are checked, share the outcome with the infra channel or include it in the associated
pull request notes.
