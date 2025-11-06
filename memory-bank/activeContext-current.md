# Active Context - CritGenius: Listener

- **Last Updated:** 2025-11-05 09:52 PST
- **Version:** 2.52.0
- **Dependencies:** projectbrief.md, productContext.md, systemPatterns-index.md,
  index-techContext.md

## Current Project State Synthesis

Based on comprehensive analysis of all Memory Bank files, the current project state is:

### Project Status: INFRASTRUCTURE RESILIENCE LAYER ESTABLISHED (MANIFEST + HEALTH BACKOFF)

- **Memory Bank Status:** ✅ Fully Operational - Refactored into segmented hybrid structure
- **Strategic Foundation:** ✅ Complete - Product Context & Project Scope Established
- **Technical Architecture:** ✅ Complete - Context7 Validated Architecture Strategy
- **Infrastructure Setup:** ✅ Latest Milestone - Comprehensive Environment Variable Schema &
  Templates (Task 2.7.1)
- **Development Phase:** Environment management foundation complete; continue remaining
  infrastructure tasks

### Immediate Context

- **Project:** CritGenius: Listener - D&D Audio Capture & Transcription System
- **Core Mission:** Real-time speaker-to-character mapping for tabletop RPG sessions
- **Working Directory:** `c:/Users/jonah/Documents/Cline/crit-genius/listener`
- **Environment:** VSCode on Windows
- **Current Focus:** Component ecosystem complete, ready for integration and remaining
  infrastructure

### Knowledge State Summary

1. **Project Identity:** ✅ Fully Defined - Revolutionary D&D audio tool
2. **Product Context:** ✅ Comprehensive - Market analysis, user segments, use cases complete
3. **System Patterns:** ✅ Segmented - 5 thematic files (`systemPatterns-001/002/003/004/005.md`) +
   index
4. **Technical Context:** ✅ Complete - Context7-validated technology stack with implementation
   details
5. **Progress Tracking:** ✅ Active and current
6. **Active Context:** ✅ Segmented - Hybrid structure (current state + history archive)

### Strategic Context Established

- **Product Vision:** AI-powered D&D session augmentation foundation
- **Target Users:** D&D Players, Dungeon Masters, Content Creators
- **Core Value Proposition:** Real-time audio capture with speaker-to-character mapping
- **Market Position:** First-mover advantage in D&D-specific audio tools
- **Technical Strategy:** Node.js backend, Web Audio API, AssemblyAI integration

### Current Capabilities

- ✅ Comprehensive product strategy documented
- ✅ Clear project scope and objectives defined
- ✅ Target user needs and use cases mapped
- ✅ Competitive landscape and market opportunity analyzed
- ✅ Success metrics and validation criteria established
- ✅ Technology stack direction identified
- ✅ Risk assessment framework in place
- ✅ Tiered coverage policy enforced with automation and CI gating (Task 3.2.1)
- ✅ CI coverage pipeline integrated into GitHub Actions with Codecov v5 reporting (Task 3.2.3)
- ✅ ESLint flat config centralized with validation harness and zero-warning CI gate (Task 3.3.1)
- ✅ Audio UI accessibility policy published to document media caption stance (Task 3.3.1)
- ✅ ESLint validation infrastructure uses disposable fixture harness with documentation alignment
  (Task 3.3.2)
- ✅ CI lint workflow guard enforces dependency bootstrap, zero-warning exits, and accessibility
  coverage via infrastructure tests and docs (Task 3.3.4)
- ✅ ESLint developer guide consolidates workflows, rule rationale, accessibility posture, and
  troubleshooting diagrams for rapid onboarding (Task 3.3.5)
- ✅ VS Code workspace settings enforce Prettier format-on-save with documented onboarding checks
  and extension prompts (Task 3.4.1)
- ✅ EditorConfig baseline mirrors Prettier defaults so non-VS Code editors share indentation,
  newline, and trailing whitespace rules with documented validation checklist (Task 3.4.2)
- ✅ Root-level Playwright orchestration commands provide unified headless/headed/UI E2E execution
  with documentation alignment (Task 3.5.1)
- ✅ Playwright responsive browser matrix plus runtime config validator delivers six-project
  coverage with retained artifacts and fast-fail safeguards ahead of HTTPS harness startup (Task
  3.5.2)
- ✅ Playwright socket event buffer instrumentation captures deterministic transcript payloads for
  cross-browser E2E validation while keeping production runtime untouched (Task 3.5.3)
- ✅ **COMPREHENSIVE PLAYWRIGHT TESTING DOCUMENTATION:** Complete E2E browser testing documentation
  system with authoritative 1,800+ line guide, three-tier documentation architecture, browser
  compatibility matrix, debugging workflows, and troubleshooting procedures (Task 3.5.6)
- ✅ Percy visual regression workflow integrated into CI via reusable GitHub Actions pipeline with
  token gating, Node version normalization, infrastructure guard tests, and contributor guidance
  (Task 3.6.4)
- ✅ Deterministic axe accessibility harness ships with mutex-guarded `runAxeAudit`, global binding
  helpers, WCAG 2.1 AA defaults, and infrastructure validation coverage (Task 3.7.1)
- ✅ **MAJOR MILESTONE:** Complete Material-UI Integration & Validation System
  - Material-UI v7.3.1 fully integrated with CritGenius custom theme
  - Enhanced responsive design system with xxl breakpoint and fluid typography
  - Complete speaker mapping & transcript display component ecosystem
  - TypeScript compilation validated across all packages
  - Development server functional with theme integration (localhost:5173)
  - Vitest testing framework compatibility confirmed
- ✅ Audio capture controller with configuration-driven dependency injection
- ✅ Audio diagnostics pipeline with structured error codes (Task 2.10.4.2)
- ✅ Comprehensive testing guide self-validating via infrastructure suite (Task 3.1.5)
- ✅ Centralized coverage module supplying thresholds and metadata (Task 3.2.1.1)

### Ready for Technical Planning & Remaining Infra

**System Architecture Requirements:**

- Real-time audio processing architecture
- Speaker diarization and voice mapping systems
- Privacy-first data handling patterns
- Modular design for AI integration extensibility
- Cross-platform web application architecture

**Key Technical Decisions Pending:**

- Detailed component architecture design
- Audio processing pipeline specification
- Data flow and state management patterns
- API design and integration strategies
- Deployment and infrastructure patterns

## Latest Updates

### 2025-11-05 – Vitest Axe Accessibility Integration (Task 3.7.1)

- Introduced `@critgenius/test-utils/accessibility` with mutex-guarded `runAxeAudit`, global binding
  helpers, CritGenius WCAG 2.1 AA defaults, and optional `DEBUG_AXE_GLOBAL_BINDINGS` logging to keep
  axe audits deterministic under Vitest + JSDOM.
- Updated workspace dependencies, exports, and client test setup to auto-register matchers while
  documenting the pnpm hoisting suppression in `packages/client/vitest.config.ts`.
- Rebuilt `tests/infrastructure/vitest-axe-integration.test.ts` around isolated DOM harnesses,
  explicit JSDOM canvas skips, and the Vitest 4 timeout signature; published accessibility testing
  patterns, onboarding updates, and a JSDOM canvas limitation report outlining Playwright migration
  guidance.
- Validation: `pnpm -w lint`, `pnpm -w type-check`,
  `pnpm test:infrastructure -- --run tests/infrastructure/vitest-axe-integration.test.ts`.

### 2025-11-04 – Percy Visual Test CI/CD Pipeline (Task 3.6.4)

- Refactored `.github/workflows/visual-regression.yml` into a reusable `workflow_call` template that
  auto-selects baseline, compare, or dry-run modes via branch metadata while enforcing Percy token
  presence on protected branches and forcing dry runs on forks.
- Added a `visual-regression` job to `.github/workflows/ci.yml` so Percy executes after
  `build-and-validate`, inherits repository secrets, and publishes Markdown summaries plus retained
  artifact bundles for reviewer review.
- Introduced `.node-version` (20.19.5) and wired both the Percy workflow and diagnostics workflows
  to consume it, eliminating duplicated Node version strings.
- Authored `tests/infrastructure/percy-ci-integration.test.ts` and expanded documentation
  (`docs/percy-ci-setup-guide.md`, onboarding/testing guides, client visual README) to encode mode
  logic, token gating expectations, and contributor setup.
- Validation: `pnpm run test:infrastructure -- --reporter=dot` (guarding
  `tests/infrastructure/percy-ci-integration.test.ts`) plus manual GitHub Actions workflow review to
  confirm mode routing and summary output.

### 2025-11-01 – Playwright Testing Documentation Implementation (Task 3.5.6)

- Successfully implemented comprehensive Playwright testing documentation system for CritGenius
  Listener's E2E browser testing requirements, addressing critical gaps in browser-based validation
  of real-time audio processing workflows.
- Created authoritative `docs/playwright-testing-guide.md` (1,800+ lines) with 5 major sections and
  7 sequence diagrams covering quick start setup, core testing patterns, browser compatibility,
  debugging workflows, and troubleshooting procedures.
- Established three-tier documentation architecture: Overview (comprehensive testing guide) →
  Detailed reference (Playwright guide) → Getting started (developer onboarding) for graduated
  learning progression.
- Achieved complete browser compatibility matrix covering Chromium, Firefox, and WebKit with
  specific configuration patterns and synthetic MediaStream fallbacks for WebKit limitations.
- Implemented comprehensive debugging workflows with complete VSCode configurations enabling
  step-through debugging, trace analysis, and visual browser control.
- Reduced E2E test setup complexity from undefined/impossible to structured 10-minute process with
  systematic troubleshooting procedures and platform-specific solutions.
- Validation: All 6 E2E commands verified in `package.json`, 25+ code examples compiled with project
  conventions, 15+ internal links tested functional, zero broken file path references.

### 2025-10-29 – Cross-Browser E2E Smoke Tests (Task 3.5.3)

- Hardened the transcription smoke test by shifting from console parsing to a structured
  `window.__critgeniusSocketEvents` buffer populated in `SocketService.emitTestEvent`, keeping the
  instrumentation behind `VITE_E2E` so production behaviour remains unchanged while Playwright gets
  deterministic payload access.
- Cleared the event queue before each emission, reused listener readiness checks to avoid timing
  races, and reran the full six-project matrix to confirm Firefox now passes with Chromium, Edge,
  and WebKit.

### 2025-10-28 – Playwright Browser Matrix & Runtime Config Guard (Task 3.5.2)

- Expanded `packages/client/playwright.config.ts` to cover six browser/viewport combinations with
  deterministic `test-results`/`playwright-report` directories, shared fake media flags, and
  retained screenshots/videos/traces on failure, ensuring responsive coverage remains reproducible.
- Introduced `packages/client/tests/e2e/helpers/config-validator.ts` and wired it through the
  microphone access smoke test via Playwright worker fixtures so `workerInfo.config` reporters,
  directories, and project metadata are validated before the HTTPS harness boots, resolving the
  earlier TypeScript config import failure.
- Updated the root `test:e2e:report` script to delegate `playwright show-report` from the client
  package and refreshed `docs/developer-onboarding.md` plus `docs/comprehensive-testing-guide.md`
  with viewport matrix tables, watchexec loops, and report inspection guidance.

### 2025-10-27 – Playwright Workspace Orchestration (Task 3.5.1)

- Centralized Playwright dependencies in the root workspace and added `test:e2e`, `test:e2e:headed`,
  `test:e2e:install`, and `test:e2e:report` scripts, delegating `test:e2e:ui` to the client’s new
  `test:browser:ui` command to keep interactive runs in the correct package context.
- Updated `docs/developer-onboarding.md` and `docs/comprehensive-testing-guide.md` with install,
  headless/headed execution, UI runner usage, and report review instructions so contributors can
  rely on root scripts without rediscovering workflow details.
- Validation coverage confirmed via `pnpm run test:e2e:install`, `pnpm run test:e2e`,
  `pnpm run test:e2e:headed`, `pnpm --filter @critgenius/client exec -- playwright test --list`, and
  `pnpm run test:e2e:ui` (manual exit after verifying suite visibility).

### 2025-10-27 – EditorConfig Alignment with Prettier (Task 3.4.2)

- Added a root-level `.editorconfig` matching `prettier.config.js` defaults for indentation, line
  endings, trailing whitespace trimming, Markdown double-space preservation, and lockfile newline
  handling so contributors using WebStorm, Sublime, Vim, or other editors stay aligned with repo
  formatting.
- Expanded `docs/developer-onboarding.md` with EditorConfig plugin requirements, quick validation
  steps, alignment checklist, and troubleshooting tips to reduce onboarding friction for non-VS-Code
  users.
- Documented reviewer guidance to rerun the alignment checklist whenever Prettier defaults change,
  keeping EditorConfig and Prettier synchronized over time.

### 2025-10-26 – VSCode Prettier Format-on-Save Configuration (Task 3.4.1)

- Created `.vscode/settings.json` to default Prettier across
  TypeScript/JavaScript/JSON/Markdown/YAML, enable format-on-save, keep ESLint fixes explicit, and
  standardize LF newlines with trailing whitespace trimming.
- Added `.vscode/extensions.json` recommending Prettier, ESLint, and TypeScript Nightly extensions
  so VS Code prompts developers to install required tooling whenever the repo opens.
- Updated `.gitignore` to track workspace configs and expanded `docs/developer-onboarding.md` with a
  VS Code setup checklist, manual format-on-save validation steps, troubleshooting, and alternative
  editor notes.

### 2025-10-25 – CI ESLint Documentation (Task 3.3.5)

- Authored `docs/eslint-guide.md` to centralize lint workflows, configuration rationale, six Mermaid
  diagrams, and troubleshooting matrices so developers can resolve lint issues quickly.
- Linked the guide from `docs/developer-onboarding.md`, ensuring new contributors encounter lint
  expectations early during onboarding.
- Captured future follow-ups around documentation validation automation and onboarding escalation
  guidance in the Memory Bank reflection entry.

### 2025-10-23 – CI ESLint Workflow Guard (Task 3.3.4)

- Authored `tests/infrastructure/ci-eslint-integration.test.ts` to guarantee the CI workflow boots
  dependencies before lint execution, enforces zero-warning exits, and preserves accessibility rule
  coverage.
- Updated `.github/workflows/ci.yml` and `scripts/lint-ci.mjs` to align with those guardrails so
  lint gating stays post-bootstrap and regressions surface immediately through infrastructure
  suites.
- Documented the guard expectations and troubleshooting playbook in `docs/ci-eslint-integration.md`
  while marking task completion inside `tasks/infrastructure-setup-task-list.md`.

### 2025-10-19 – ESLint Validation Infrastructure Expansion (Task 3.3.2)

- Curated targeted lint fixtures and staged them into disposable `__eslint-fixtures__` directories
  per package during `tests/infrastructure/eslint-audit-validation.test.ts` executions, broadening
  severity and override coverage without polluting tracked paths.
- Hardened the validation suite with fixture inventory checks, severity matrix assertions,
  React/server/test glob override verification, and a clean baseline guard before tearing down
  staged directories.
- Updated `docs/eslint-scripts.md` to explain the harness workflow and accessibility posture,
  keeping onboarding guidance aligned with the automation.

### 2025-10-17 – ESLint Configuration Audit & Accessibility Policy (Task 3.3.1)

- Consolidated the ESLint flat config as the single source of truth by deleting `eslint.config.cjs`,
  tightening ignores to generated output, and adding Node globals so scripts lint cleanly.
- Authored `tests/infrastructure/eslint-audit-validation.test.ts` covering plugin coverage,
  per-package lint scripts, JSX a11y posture, and lint CI enforcement, then reran `pnpm run lint:ci`
  plus workspace type checks to confirm zero warnings.
- Published `docs/audio-ui-accessibility-policy.md` to document the audio-first WCAG 2.1 AA stance,
  keyboard requirements, and rationale for keeping `jsx-a11y/media-has-caption` disabled until video
  capture ships.

## Decision Log

- **2025-11-05:** Ratified deterministic axe accessibility harness with mutex serialization and
  global binding restoration as the standard for Vitest accessibility audits, backed by
  infrastructure validation and documentation alignment.
- **2025-11-04:** Ratified Percy visual regression reusable workflow as a required CI gate with
  token enforcement, retry logic, and artifact retention backed by infrastructure tests and shared
  documentation.
- **2025-10-29:** Ratified Playwright socket event buffer instrumentation as the standard for
  transcript assertions, eliminating cross-browser console parsing and ensuring deterministic data
  capture behind the `VITE_E2E` gate.
- **2025-10-28:** Ratified Playwright responsive browser matrix and runtime config validator as the
  baseline for E2E coverage, ensuring six-project regression coverage with deterministic artifacts
  and fast-fail safeguards ahead of harness initialization.
- **2025-10-27:** Adopted root-level Playwright orchestration pattern with delegated UI runner to
  the client package to keep workspace scripts consistent while preserving package-scoped
  configuration. consistent across contributors and onboarding includes validation guidance.
- **2025-10-23:** Ratified CI lint workflow guard as mandatory (infrastructure test + aligned
  scripts + contributor documentation) to ensure zero-warning enforcement and accessibility
  coverage.
- **2025-10-17:** Ratified flat ESLint config as single authoritative source and adopted the audio
  UI accessibility policy to document `media-has-caption` stance until video support ships.
- **2025-10-16:** Adopted hybrid segmentation for activeContext.md (current + history archive)
- **2025-08-25:** ADR-006 accepted (Lightweight pre-commit automation strategy)

## Active Issues

_None - strategic foundation complete, ready for technical planning_

## Immediate Next Steps

1. **Remaining Infra Clean-up:** Complete Task 2.1.3 (TypeScript foundation packages) & Task 1.7
   (PR/Issue templates)
2. **Protect Mainline with Percy Gate:** Add the `CI / Percy Visual Regression` status check to
   `main` and `production` branch protection rules once the workflow lands on default branches.
3. **Audit Vitest Timeout Signatures:** Sweep remaining suites to adopt the
   `it(name, { timeout }, fn)` options signature and keep infrastructure guards aligned with Vitest
   4 expectations.
4. **System Architecture Design:** Define component architecture and data flow patterns
5. **Technical Requirements Analysis:** Validate real-time performance & audio pipeline latency
   assumptions
6. **Benchmark Evolution (Deferred):** Add JSON output + ESLint cache instrumentation (after infra
   tasks complete)
7. **IDE Automation Follow-Up:** Evaluate lightweight checks to detect missing Prettier extension
   during onboarding or dev container startup.

## Reference Links

- **Strategic Foundation:** projectbrief.md, productContext.md
- **Architecture Patterns:** systemPatterns-index.md
- **Technical Stack:** index-techContext.md
- **Task Chronology:** index-progress.md
- **Consolidated Insights:** learnings-index.md
- **Historical Context:** index-activeContext.md (history archive registry)
- **Legacy Reference:** activeContext-legacy-2025-10-16.md (original monolith)

## Infrastructure Update

- Environment variable management system completed (schema + templates)
- Client integration layer finalized (sanitized projection, build/test/runtime alignment)
- Socket layer now environment-driven, enabling environment-based endpoint/feature adjustments
- `.env.*.example` templates + new client integration patterns documented
- Validation errors continue to surface early; client build fails fast if projection missing

## Current Focus

- Continue integration testing across client/server/shared
- Refine environment management patterns as needed
- Complete remaining infrastructure tasks before feature development
