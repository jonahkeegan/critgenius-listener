# Filename Compatibility Troubleshooting

## Purpose

This guide helps identify and resolve filename issues that can break Windows, OneDrive, or Git
operations. Use it when pre-commit hooks or diagnostic tools warn about invalid filenames, or when
you see fresh `coverage/nul` style artifacts on Windows machines.

## Common Symptoms

- Husky pre-commit hook fails with "problematic filenames detected".
- OneDrive refuses to sync local changes even after retries.
- Git reports "unable to stat" or "invalid argument" errors for specific files.
- Vitest diagnostic logging prints a warning about Windows reserved names and skips writing output.

## Quick Fix Checklist

1. Run `pnpm validate:filenames` from the repository root.
2. Rename each flagged file to a safe alternative (see tables below).
3. Re-run the validator until it reports zero issues.
4. Commit the rename and push normally.

## Windows Reserved Device Names

Windows reserves the following names (case-insensitive), even when you append extensions:

- `CON`, `PRN`, `AUX`, `NUL`
- `COM1`–`COM9`
- `LPT1`–`LPT9`

Any attempt to create files or directories with these basenames will fail on Windows. The filename
validator and Vitest shared config now guard against these values. When detected, they log a warning
and prevent the file operation to avoid filesystem errors.

### Safe Alternatives

| Reserved Name | Suggested Replacement                      |
| ------------- | ------------------------------------------ |
| `NUL`         | `null-output.log`, `diagnostic-output.log` |
| `CON`         | `console-report.txt`, `config-output.json` |
| `PRN`         | `printer-status.txt`, `report-summary.md`  |
| `AUX`         | `auxiliary-info.log`, `backup-notes.md`    |
| `COM1`        | `serial-port-1.log`, `serial-debug-1.txt`  |
| `LPT1`        | `parallel-port-1.txt`, `printer-1.log`     |

## Environment Variable Guardrails

When using Vitest path diagnostics, avoid setting `DEBUG_VITEST_PATH_OUTPUT` to a reserved name such
as `nul`. The shared configuration calls `sanitizeOutputFile()` before writing and will log:

```
[vitest config] WARNING: Diagnostic output file path "nul" uses a Windows reserved device name... File output will be disabled.
```

This behavior prevents coverage tooling from creating illegal files like `coverage/nul` while still
printing diagnostics to the console. Choose an explicit filename (`diagnostic-output.log`) or omit
the variable to disable file output entirely.

## Automation Support

- **Validation Script:** `pnpm validate:filenames`
- **Auto-fix Mode:** `pnpm validate:filenames:fix` (renames reserved names with safe suffixes)
- **Pre-commit Hook:** Runs validation automatically and blocks problematic filenames.

## Additional Resources

- `docs/filename-compatibility-guide.md` — In-depth overview of the validation system.
- `scripts/utils/windows-reserved-names.mjs` — Source of truth for reserved device names.
- `docs/comprehensive-testing-guide.md` — Path diagnostics instructions and safety notes.
