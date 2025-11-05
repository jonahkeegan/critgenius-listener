# Percy Visual Regression Testing Workflow Guide

**Version:** 1.0.0  
**Last Updated:** 2025-01-05  
**Status:** Active  
**Related Documentation:**

- [Visual Regression Standards](./visual-regression-standards.md)
- [Percy Troubleshooting Guide](./percy-troubleshooting.md)
- [Comprehensive Testing Guide](./comprehensive-testing-guide.md)
- [Developer Onboarding](./developer-onboarding.md)

## Table of Contents

1. [Overview](#overview)
2. [Quick Start: First Percy Snapshot in 5 Minutes](#quick-start-first-percy-snapshot-in-5-minutes)
3. [Developer Workflow](#developer-workflow)
4. [Baseline Management](#baseline-management)
5. [CI Integration Overview](#ci-integration-overview)
6. [Percy Snapshot Creation Process](#percy-snapshot-creation-process)
7. [Visual Diff Review Process](#visual-diff-review-process)
8. [Baseline Update Workflow](#baseline-update-workflow)
9. [Percy CI Gate Integration](#percy-ci-gate-integration)

---

## Overview

Percy provides automated visual regression testing for CritGenius: Listener, ensuring UI changes are
intentional and visually correct across responsive breakpoints. This guide covers the daily
development workflow for creating, reviewing, and approving visual snapshots.

### What Percy Tests

- Component rendering across three viewport widths (375px, 768px, 1920px)
- Material-UI theme consistency and responsive design behavior
- Speaker mapping interface layouts and transcript display components
- Dynamic element stability (timestamps, animations) via CSS freezing

### When to Use Percy

- **Required:** Before merging PRs that modify UI components
- **Recommended:** When updating Material-UI theme tokens or responsive breakpoints
- **Optional:** For non-visual backend changes (Percy runs but expects no diffs)

---

## Quick Start: First Percy Snapshot in 5 Minutes

### Prerequisites

```bash
# 1. Ensure Percy CLI is installed (already in package.json)
pnpm install

# 2. Get Percy token from project maintainer or Percy dashboard
# Set as environment variable (see developer-onboarding.md for details)
export PERCY_TOKEN=your_token_here  # Linux/macOS
$env:PERCY_TOKEN="your_token_here"  # Windows PowerShell
```

### Create Your First Snapshot

```bash
# 1. Start development server
pnpm run dev

# 2. In a new terminal, run Percy with Playwright tests
pnpm run test:e2e -- --project=chromium-desktop

# Percy automatically captures snapshots when tests call:
# await percySnapshot(page, 'snapshot-name')
```

### View Results

1. Check terminal output for Percy build URL
2. Navigate to Percy dashboard: `https://percy.io/critgenius/listener`
3. Review visual diffs in the web UI
4. Approve or reject changes

---

## Developer Workflow

The Percy workflow follows a four-stage process: Create → Review → Approve → Integrate.

```sequenceDiagram
    participant Developer
    participant LocalEnv as Local Environment
    participant PlaywrightTests as Playwright Tests
    participant PercyAgent as Percy Agent
    participant PercyDashboard as Percy Dashboard
    participant CI as CI Pipeline

    Developer->>LocalEnv: Start dev server (pnpm run dev)
    Developer->>PlaywrightTests: Run E2E tests (pnpm run test:e2e)

    PlaywrightTests->>PlaywrightTests: Navigate to component
    PlaywrightTests->>PercyAgent: Call percySnapshot(page, name)

    PercyAgent->>PercyAgent: Capture DOM snapshot
    PercyAgent->>PercyAgent: Apply percy.config.yml settings
    PercyAgent->>PercyAgent: Freeze animations with percyCSS

    loop For each responsive width [375, 768, 1920]
        PercyAgent->>PercyAgent: Render at viewport width
        PercyAgent->>PercyDashboard: Upload snapshot
    end

    PercyDashboard-->>Developer: Build URL in terminal
    Developer->>PercyDashboard: Review visual diffs

    alt Changes are intentional
        Developer->>PercyDashboard: Approve snapshots
        PercyDashboard->>PercyDashboard: Update baselines
        Developer->>CI: Push commit
        CI->>PercyDashboard: Run Percy build
        PercyDashboard-->>CI: Pass (no diffs vs new baseline)
    else Changes are unintentional
        Developer->>Developer: Fix code locally
        Developer->>PlaywrightTests: Re-run tests
    end
```

### Daily Development Steps

1. **Make UI Changes**
   - Edit React components, Material-UI theme, or CSS
   - Follow standard development workflow

2. **Run Local Percy Build**

   ```bash
   # Run Percy with specific Playwright project
   pnpm run test:e2e -- --project=chromium-desktop

   # Or run all browser projects (slower but comprehensive)
   pnpm run test:e2e
   ```

3. **Review Diffs in Dashboard**
   - Check terminal output for Percy build link
   - Open dashboard to compare baseline vs new snapshots
   - Review diffs at all three responsive widths

4. **Take Action Based on Review**
   - **Approve:** If changes are intentional and correct
   - **Reject:** If unintended regressions are detected
   - **Request Changes:** If diffs reveal bugs or issues

---

## Baseline Management

Baselines are the approved reference snapshots that new builds compare against. Managing baselines
correctly is critical for accurate visual regression detection.

### When to Update Baselines

Update baselines when:

- ✅ **Intentional UI changes** are approved (e.g., new component designs)
- ✅ **Material-UI theme updates** are finalized
- ✅ **Responsive layout improvements** are validated
- ✅ **Accessibility enhancements** affect visual presentation

**Do NOT update baselines for:**

- ❌ Unintended visual regressions
- ❌ Browser-specific rendering bugs
- ❌ Flaky snapshot failures (investigate root cause first)

### Baseline Update Process

```sequenceDiagram
    participant Developer
    participant PercyDashboard as Percy Dashboard
    participant Git
    participant CI

    Developer->>PercyDashboard: Review build with diffs

    alt Diffs are intentional
        Developer->>PercyDashboard: Click "Approve" button
        PercyDashboard->>PercyDashboard: Set snapshots as new baselines
        PercyDashboard-->>Developer: Confirmation message

        Developer->>Git: Commit code changes
        Developer->>Git: Push to remote branch

        Git->>CI: Trigger CI workflow
        CI->>CI: Run Percy build
        CI->>PercyDashboard: Compare vs updated baselines
        PercyDashboard-->>CI: Pass (no diffs)
        CI-->>Developer: Green check on PR
    else Diffs are unintentional
        Developer->>Developer: Fix code locally
        Developer->>Developer: Re-run Percy locally
    end
```

### Baseline Synchronization

Percy baselines are stored in Percy's cloud infrastructure, not in Git. This means:

- **No merge conflicts** from baseline updates
- **Automatic synchronization** across team members
- **Branch-aware baselines** (configurable per branch strategy)

**Important:** After approving baselines on the dashboard, ensure your PR passes CI before merging.
CI validates that approved baselines match the committed code.

---

## CI Integration Overview

Percy runs automatically in CI for all pull requests and protected branches. The CI integration uses
a reusable workflow that adapts behavior based on branch context.

### CI Behavior Modes

| Branch Type          | Percy Mode | Token Required | Behavior                             |
| -------------------- | ---------- | -------------- | ------------------------------------ |
| `main`, `production` | Compare    | ✅ Yes         | Compare vs baselines, block on diffs |
| Feature branches     | Compare    | ✅ Yes         | Compare vs baselines, informational  |
| Forked PRs           | Dry Run    | ❌ No          | Validate config, no uploads          |

### CI Workflow Stages

```sequenceDiagram
    participant PR as Pull Request
    participant CI as CI Workflow
    participant Builder as Build Stage
    participant PercyJob as Percy Job
    participant PercyDashboard as Percy Dashboard
    participant StatusCheck as Status Check

    PR->>CI: Push commit
    CI->>Builder: Run build-and-validate
    Builder->>Builder: Install dependencies
    Builder->>Builder: Type check
    Builder->>Builder: Lint
    Builder-->>CI: Build success

    CI->>PercyJob: Start Percy regression test

    alt PERCY_TOKEN available
        PercyJob->>PercyJob: Determine branch mode
        alt Protected branch (main/production)
            PercyJob->>PercyJob: Set mode=compare, enforce=true
        else Feature branch
            PercyJob->>PercyJob: Set mode=compare, enforce=false
        end

        PercyJob->>PercyJob: Run pnpm run test:e2e
        PercyJob->>PercyDashboard: Upload snapshots
        PercyDashboard->>PercyDashboard: Compute diffs
        PercyDashboard-->>PercyJob: Diff results

        alt Diffs found and enforce=true
            PercyJob-->>StatusCheck: Failed (Block merge)
        else No diffs or enforce=false
            PercyJob-->>StatusCheck: Passed
        end
    else PERCY_TOKEN missing
        PercyJob->>PercyJob: Run dry-run mode
        PercyJob-->>StatusCheck: Skipped (Informational)
    end

    StatusCheck-->>PR: Update status badge
```

### Viewing CI Percy Builds

1. **Check PR Status:**
   - Look for "Percy Visual Regression" status check on GitHub PR
   - Click "Details" to open Percy dashboard

2. **Review CI Build Summary:**
   - GitHub Actions provides Markdown summary with:
     - Percy build URL
     - Snapshot count
     - Diff count (if any)
     - Artifacts (screenshots, traces)

3. **Download CI Artifacts (Optional):**
   - Navigate to GitHub Actions run
   - Download `percy-artifacts` zip for offline review

---

## Percy Snapshot Creation Process

This section details how Percy captures visual snapshots during Playwright test execution.

```sequenceDiagram
    participant PlaywrightTest as Playwright Test
    participant Page as Browser Page
    participant PercyAgent as Percy Agent
    participant PercyConfig as percy.config.yml
    participant PercyAPI as Percy API

    PlaywrightTest->>Page: await page.goto(url)
    PlaywrightTest->>Page: await page.waitForLoadState('networkidle')
    PlaywrightTest->>PercyAgent: await percySnapshot(page, 'snapshot-name')

    PercyAgent->>PercyConfig: Load configuration
    PercyConfig-->>PercyAgent: widths: [375, 768, 1920]
    PercyConfig-->>PercyAgent: percyCSS: [animation freezing]
    PercyConfig-->>PercyAgent: networkIdleTimeout: 750ms

    PercyAgent->>Page: Inject percyCSS styles
    PercyAgent->>Page: Wait for network idle (750ms)

    loop For each width in [375, 768, 1920]
        PercyAgent->>Page: Set viewport to width x 1024
        PercyAgent->>Page: Wait for re-layout
        PercyAgent->>Page: Capture DOM snapshot
        PercyAgent->>PercyAgent: Serialize DOM + CSS
        PercyAgent->>PercyAPI: Upload snapshot data
    end

    PercyAPI-->>PercyAgent: Snapshot ID
    PercyAgent-->>PlaywrightTest: Continue test execution
```

### Snapshot Naming Conventions

Follow these conventions for consistent snapshot organization:

```typescript
// ✅ Good: Descriptive, component-scoped names
await percySnapshot(page, 'SpeakerMapping - Initial empty state');
await percySnapshot(page, 'SpeakerMapping - With 3 mapped speakers');
await percySnapshot(page, 'TranscriptDisplay - Real-time updates');

// ❌ Bad: Vague or overly generic names
await percySnapshot(page, 'test1');
await percySnapshot(page, 'homepage');
await percySnapshot(page, 'ui');
```

**Best Practices:**

- Use component name prefix: `ComponentName - State description`
- Describe visual state clearly: "Empty state", "Loading", "Error state"
- Include variant context: "Mobile view", "Dark theme", "RTL layout"

### Percy Configuration Overview

Percy behavior is controlled by `packages/client/percy.config.yml`:

```yaml
# Responsive widths (aligned with Playwright)
widths: [375, 768, 1920] # Mobile, Tablet, Desktop

# CSS to freeze animations and hide dynamic elements
percyCSS: |
  /* Hide timestamps, live indicators */
  [data-testid="timestamp"] { visibility: hidden !important; }

  /* Freeze all animations */
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

# Network stability settings
networkIdleTimeout: 750 # Wait 750ms after last network activity
```

**When to modify config:**

- Adding new responsive breakpoints (update `widths`)
- Hiding additional dynamic elements (update `percyCSS`)
- Adjusting network timeout for slow components

---

## Visual Diff Review Process

After Percy generates snapshots, review diffs in the Percy dashboard to validate visual changes.

```sequenceDiagram
    participant Reviewer as Reviewer
    participant PercyDashboard as Percy Dashboard
    participant DiffEngine as Diff Engine
    participant Baseline as Baseline Images
    participant NewSnapshot as New Snapshots

    Reviewer->>PercyDashboard: Open Percy build URL
    PercyDashboard->>DiffEngine: Request diff computation

    DiffEngine->>Baseline: Fetch baseline snapshots
    DiffEngine->>NewSnapshot: Fetch new snapshots

    loop For each snapshot pair
        DiffEngine->>DiffEngine: Compute pixel differences
        DiffEngine->>DiffEngine: Highlight changed regions
        DiffEngine->>DiffEngine: Calculate diff percentage
    end

    DiffEngine-->>PercyDashboard: Diff results with highlights

    PercyDashboard->>Reviewer: Display side-by-side comparison
    Reviewer->>Reviewer: Review highlighted differences

    alt Differences are acceptable
        Reviewer->>PercyDashboard: Click "Approve" for snapshot
        PercyDashboard->>PercyDashboard: Mark as approved

        alt All snapshots approved
            Reviewer->>PercyDashboard: Click "Approve build"
            PercyDashboard->>Baseline: Update baselines
            PercyDashboard-->>Reviewer: Build approved
        end
    else Differences indicate issues
        Reviewer->>PercyDashboard: Click "Request changes"
        PercyDashboard-->>Reviewer: Send feedback to developer
    end
```

### Review Checklist

When reviewing Percy diffs, verify:

1. **Intentionality**
   - [ ] Changes match the PR description
   - [ ] Diffs are expected given the code changes
   - [ ] No unexpected side effects in unrelated components

2. **Visual Correctness**
   - [ ] Layout is correct at all three widths (375, 768, 1920)
   - [ ] Text is readable and properly aligned
   - [ ] Colors match Material-UI theme tokens
   - [ ] Spacing follows design system grid

3. **Consistency**
   - [ ] Changes are consistent across viewports
   - [ ] Browser-specific edge cases are handled
   - [ ] Responsive breakpoints work as expected

4. **Acceptance Criteria**
   - [ ] Meets visual standards (see
         [visual-regression-standards.md](./visual-regression-standards.md))
   - [ ] No unintended visual regressions
   - [ ] Passes accessibility contrast requirements

### Common Review Scenarios

#### Scenario 1: Approved Change

- **Diff:** Material-UI theme color updated from blue to green
- **Action:** Approve if change is intentional and specified in PR
- **Result:** Baselines updated, CI passes on next run

#### Scenario 2: Unintended Regression

- **Diff:** Text alignment broken on mobile viewport
- **Action:** Request changes with specific feedback
- **Result:** Developer fixes code, Percy runs again

#### Scenario 3: Browser Rendering Difference

- **Diff:** Minor font rendering variation between browsers
- **Action:** Approve if within acceptable threshold (see standards)
- **Result:** Baseline accommodates browser differences

---

## Baseline Update Workflow

When visual changes are approved, Percy automatically updates baselines for future comparisons.

```sequenceDiagram
    participant Developer
    participant PercyDashboard as Percy Dashboard
    participant PercyAPI as Percy API
    participant BaselineStorage as Baseline Storage
    participant Git
    participant CI

    Developer->>PercyDashboard: Review build with diffs
    Developer->>PercyDashboard: Click "Approve all snapshots"

    PercyDashboard->>PercyAPI: POST /approve-build
    PercyAPI->>BaselineStorage: Store approved snapshots as new baselines
    BaselineStorage-->>PercyAPI: Baselines updated
    PercyAPI-->>PercyDashboard: Confirmation
    PercyDashboard-->>Developer: "Build approved" message

    Note over Developer,BaselineStorage: Baselines now stored in Percy cloud

    Developer->>Git: Push code changes (if not pushed already)
    Git->>CI: Trigger CI workflow

    CI->>CI: Run Percy build
    CI->>PercyAPI: Compare new snapshots vs updated baselines

    alt Snapshots match approved baselines
        PercyAPI-->>CI: No diffs found
        CI-->>Git: Status check: Passed ✅
    else Snapshots differ from baselines
        PercyAPI-->>CI: Diffs detected
        CI-->>Git: Status check: Failed ❌
        Note over CI,Git: This indicates code drift between approval and CI run
    end
```

### Baseline Update Best Practices

1. **Timing:**
   - Approve baselines **after** final code review
   - Ensure no additional commits will be pushed to the PR
   - Validate locally before approving in dashboard

2. **Validation:**
   - Re-run Percy locally after approval to confirm consistency
   - Check that CI Percy build passes after baseline update
   - Review all viewports (375, 768, 1920) before approving

3. **Communication:**
   - Comment on PR when baselines are updated
   - Document reason for visual changes in PR description
   - Tag relevant stakeholders for design review if needed

---

## Percy CI Gate Integration

Percy integrates with GitHub branch protection to enforce visual regression checks before merging.

```sequenceDiagram
    participant Developer
    participant PR as Pull Request
    participant BranchProtection as Branch Protection
    participant CI as CI Workflow
    participant PercyJob as Percy Job
    participant PercyDashboard as Percy Dashboard

    Developer->>PR: Create PR to main branch
    PR->>BranchProtection: Check protection rules
    BranchProtection-->>PR: "Percy Visual Regression" required

    Developer->>PR: Push commit
    PR->>CI: Trigger workflow
    CI->>PercyJob: Run visual regression tests

    PercyJob->>PercyJob: Determine branch type

    alt Protected branch (main/production)
        PercyJob->>PercyJob: Set enforce=true
        PercyJob->>PercyDashboard: Upload snapshots
        PercyDashboard->>PercyDashboard: Compute diffs

        alt Diffs found
            PercyDashboard-->>PercyJob: Diffs detected
            PercyJob-->>PR: Status check: Failed ❌
            BranchProtection->>BranchProtection: Block merge
            BranchProtection-->>Developer: "Cannot merge - Percy check failed"

            Developer->>PercyDashboard: Review diffs
            Developer->>PercyDashboard: Approve baselines
            Developer->>CI: Re-run Percy job
            CI->>PercyDashboard: Compare vs updated baselines
            PercyDashboard-->>CI: No diffs
            CI-->>PR: Status check: Passed ✅
            BranchProtection-->>Developer: "Ready to merge"
        else No diffs
            PercyDashboard-->>PercyJob: No diffs
            PercyJob-->>PR: Status check: Passed ✅
            BranchProtection-->>Developer: "Ready to merge"
        end
    else Feature branch
        PercyJob->>PercyJob: Set enforce=false
        PercyJob-->>PR: Status check: Passed (informational)
    end
```

### Branch Protection Configuration

To enable Percy as a required check:

1. Navigate to GitHub repository settings
2. Go to Branches → Branch protection rules → `main`
3. Under "Status checks", add: `CI / Percy Visual Regression`
4. Save changes

**Enforcement behavior:**

- **Protected branches** (`main`, `production`): Percy failures block merge
- **Feature branches**: Percy runs but does not block merge (informational)
- **Fork PRs**: Percy skips (dry-run mode, no token access)

---

## Related Documentation

- **[Visual Regression Standards](./visual-regression-standards.md)** - Quality standards,
  thresholds, and best practices
- **[Percy Troubleshooting Guide](./percy-troubleshooting.md)** - Common issues and debugging
  procedures
- **[Comprehensive Testing Guide](./comprehensive-testing-guide.md)** - Full testing strategy
  including Percy's role
- **[Developer Onboarding](./developer-onboarding.md)** - Percy setup instructions for new
  contributors

---

## Version History

| Version | Date       | Changes                                               |
| ------- | ---------- | ----------------------------------------------------- |
| 1.0.0   | 2025-01-05 | Initial Percy workflow guide with 4 sequence diagrams |
