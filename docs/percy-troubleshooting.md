# Percy Visual Regression Troubleshooting Guide

**Version:** 1.0.0  
**Last Updated:** 2025-01-05  
**Status:** Active  
**Related Documentation:**

- [Percy Workflow Guide](./percy-workflow-guide.md)
- [Visual Regression Standards](./visual-regression-standards.md)
- [Comprehensive Testing Guide](./comprehensive-testing-guide.md)

## Table of Contents

1. [Overview](#overview)
2. [Visual Diff Debugging Procedures](#visual-diff-debugging-procedures)
3. [Baseline Synchronization Problems](#baseline-synchronization-problems)
4. [CI Workflow Failures](#ci-workflow-failures)
5. [Browser Inconsistency Resolution](#browser-inconsistency-resolution)
6. [Troubleshooting Decision Matrix](#troubleshooting-decision-matrix)
7. [Common Error Messages](#common-error-messages)
8. [Debug Mode and Logging](#debug-mode-and-logging)

---

## Overview

This guide provides diagnostic procedures for common Percy visual regression testing issues. Use
this systematically when encountering problems with Percy snapshots, baselines, or CI integration.

### When to Use This Guide

- Percy builds show unexpected visual diffs
- Baselines are not synchronizing correctly
- CI workflow fails with Percy-related errors
- Browser-specific rendering issues appear
- Percy snapshots capture incorrectly

### Troubleshooting Approach

1. **Identify the symptom** from the sections below
2. **Follow the diagnostic procedure** step-by-step
3. **Apply the recommended solution**
4. **Validate the fix** by re-running Percy
5. **Document persistent issues** for team knowledge

---

## Visual Diff Debugging Procedures

When Percy reports unexpected visual diffs, use this systematic debugging workflow to identify and
resolve the root cause.

### Visual Diff Debugging Workflow

```sequenceDiagram
    participant Developer
    participant PercyDashboard as Percy Dashboard
    participant LocalBrowser as Local Browser
    participant PercyConfig as percy.config.yml
    participant SourceCode as Source Code

    Developer->>PercyDashboard: Notice unexpected diffs
    Developer->>PercyDashboard: Click "View Details" for diff

    PercyDashboard->>PercyDashboard: Highlight changed regions
    PercyDashboard-->>Developer: Display side-by-side comparison

    Developer->>Developer: Analyze diff magnitude

    alt Large diff (>5% change)
        Developer->>SourceCode: Review recent commits
        Developer->>SourceCode: Identify unintended CSS changes
        Developer->>SourceCode: Fix code
        Developer->>LocalBrowser: Run Percy locally
        alt Fixed
            Developer-->>PercyDashboard: Push fix, re-run CI
        else Still broken
            Developer->>PercyConfig: Check percy.config.yml
            Developer->>PercyConfig: Verify percyCSS settings
        end
    else Small diff (<5% change)
        Developer->>PercyDashboard: Check all responsive widths
        alt Diff only at specific width
            Developer->>SourceCode: Investigate responsive CSS
            Developer->>SourceCode: Check @media queries
        else Diff across all widths
            Developer->>LocalBrowser: Reproduce locally
            Developer->>LocalBrowser: Inspect element in DevTools
            alt Browser rendering issue
                Developer->>PercyConfig: Add percyCSS workaround
            else Legitimate change
                Developer->>PercyDashboard: Approve baseline update
            end
        end
    end
```

### Problem: Unexpected Visual Differences

**Symptoms:**

- Percy dashboard shows visual diffs you didn't expect
- Changes appear unrelated to code modifications
- Diffs occur across multiple components

**Diagnostic Steps:**

1. **Review the Percy Dashboard Details**

   ```bash
   # Open Percy dashboard and examine:
   # - Which components show diffs
   # - Which responsive widths are affected
   # - Magnitude of pixel differences
   ```

2. **Reproduce Locally**

   ```bash
   # Run Percy with the same Playwright project
   pnpm run dev  # In terminal 1
   pnpm run test:e2e -- --project=chromium-desktop  # In terminal 2

   # Check if diffs reproduce locally
   ```

3. **Inspect Element in Browser DevTools**

   ```bash
   # Open the component in browser
   # Use DevTools to inspect:
   # - Computed styles
   # - Layout dimensions
   # - Applied CSS rules
   ```

4. **Check Percy Configuration**
   ```yaml
   # Verify packages/client/percy.config.yml
   snapshot:
     widths: [375, 768, 1920] # Correct responsive widths?
     percyCSS: |
       /* Are dynamic elements hidden? */
       [data-testid="timestamp"] { visibility: hidden !important; }
   ```

**Common Solutions:**

| Cause                      | Solution                                          |
| -------------------------- | ------------------------------------------------- |
| Dynamic timestamps visible | Add `[data-testid="timestamp"]` to `percyCSS`     |
| Animations not frozen      | Verify `animation-duration: 0.01ms` in `percyCSS` |
| Font rendering differences | Adjust threshold in standards (browser-specific)  |
| CSS changes in other files | Review all CSS imports and global styles          |
| Material-UI theme drift    | Check theme provider is applied consistently      |

### Problem: Flaky Visual Diffs (Intermittent)

**Symptoms:**

- Diffs appear inconsistently between runs
- Same code produces different snapshots
- CI passes sometimes, fails other times

**Diagnostic Steps:**

1. **Check Network Timing**

   ```yaml
   # In percy.config.yml, increase network idle timeout
   discovery:
     networkIdleTimeout: 1500 # Increase from 750ms
   ```

2. **Verify Async Content is Loaded**

   ```typescript
   // In test, ensure all content loads before snapshot
   await page.goto(url);
   await page.waitForLoadState('networkidle');
   await page.waitForSelector('[data-testid="main-content"]');
   await percySnapshot(page, 'Component - Fully loaded');
   ```

3. **Check for Animations**
   ```typescript
   // Verify animations are frozen via percyCSS
   // Or explicitly wait for animations to complete
   await page.waitForTimeout(500); // Last resort
   ```

**Common Solutions:**

| Cause                        | Solution                                        |
| ---------------------------- | ----------------------------------------------- |
| Network requests not settled | Increase `networkIdleTimeout` in config         |
| Animations still running     | Add animation-specific CSS to `percyCSS`        |
| Fonts loading asynchronously | Wait for `document.fonts.ready` before snapshot |
| Dynamic content timing       | Add explicit `waitForSelector` for content      |

---

## Baseline Synchronization Problems

Baselines stored in Percy's cloud may become out of sync with your code, causing unexpected
failures.

### Problem: CI Fails After Approving Baselines Locally

**Symptoms:**

- Local Percy build passes after approval
- CI Percy build fails with same diffs
- Baseline approval doesn't propagate to CI

**Diagnostic Steps:**

1. **Verify Approval Completed**

   ```bash
   # Check Percy dashboard:
   # - Build shows "Approved" status
   # - All snapshots marked as approved
   # - Baseline timestamp updated
   ```

2. **Check Branch Consistency**

   ```bash
   # Ensure no new commits after approval
   git log --oneline -5

   # Verify CI is running same commit as local
   # Check GitHub Actions commit SHA
   ```

3. **Validate Percy Token**
   ```bash
   # In CI, verify PERCY_TOKEN secret is set
   # GitHub: Settings → Secrets → Actions
   # Check "PERCY_TOKEN" exists and is not expired
   ```

**Common Solutions:**

| Cause                      | Solution                                              |
| -------------------------- | ----------------------------------------------------- |
| New commits after approval | Re-approve baselines for latest commit                |
| Percy token mismatch       | Verify same Percy project token used locally and CI   |
| Branch baseline isolation  | Ensure CI uses correct branch for baseline comparison |
| Cache issues               | Clear Percy cache: `npx percy exec -- --clear-cache`  |

### Problem: Baselines Reverted Unexpectedly

**Symptoms:**

- Previously approved baselines show as unapproved
- Diffs reappear for already-approved changes
- Baseline history shows unexpected revert

**Diagnostic Steps:**

1. **Check Percy Dashboard History**

   ```bash
   # Navigate to Percy dashboard
   # View build history for the branch
   # Identify when baseline changed
   ```

2. **Review Git History**

   ```bash
   # Check if branch was force-pushed or rebased
   git reflog
   git log --all --oneline --graph
   ```

3. **Verify Branch Strategy**
   ```bash
   # Check if CI uses branch-aware baselines
   # Percy may reset baselines on force-push
   ```

**Common Solutions:**

| Cause                          | Solution                                               |
| ------------------------------ | ------------------------------------------------------ |
| Force-push or rebase           | Re-approve baselines after history rewrite             |
| Branch deleted and recreated   | Baselines reset; re-establish baselines                |
| Parallel builds conflict       | Serialize baseline updates; avoid concurrent approvals |
| Percy project settings changed | Verify project baseline strategy in Percy dashboard    |

---

## CI Workflow Failures

Percy CI integration failures often stem from token issues, timeout problems, or workflow
configuration errors.

### Problem: Percy CI Job Fails with "Token Missing"

**Symptoms:**

- CI workflow error: "PERCY_TOKEN not set"
- Percy job skips or fails immediately
- Status check shows "Percy token required"

**Diagnostic Steps:**

1. **Verify Secret Configuration**

   ```bash
   # GitHub repository settings:
   # Settings → Secrets and variables → Actions
   # Confirm "PERCY_TOKEN" secret exists
   ```

2. **Check Workflow Permissions**

   ```yaml
   # In .github/workflows/ci.yml
   jobs:
     visual-regression:
       secrets: inherit # Ensure secrets are inherited
   ```

3. **Test Token Locally**

   ```bash
   # Set token temporarily to test
   export PERCY_TOKEN="your_token"
   pnpm run test:e2e -- --project=chromium-desktop

   # Check for Percy build URL in output
   ```

**Common Solutions:**

| Cause                               | Solution                                       |
| ----------------------------------- | ---------------------------------------------- |
| Secret not configured               | Add `PERCY_TOKEN` to repository secrets        |
| Fork PR can't access secrets        | Expected; Percy runs in dry-run mode for forks |
| Token expired                       | Generate new token in Percy dashboard          |
| Workflow missing `secrets: inherit` | Add to reusable workflow call in `ci.yml`      |

### Problem: Percy CI Timeout or Slow Builds

**Symptoms:**

- CI Percy job times out after 30+ minutes
- Percy uploads are very slow
- Network errors during snapshot upload

**Diagnostic Steps:**

1. **Check Snapshot Count**

   ```bash
   # Count Percy snapshots in test files
   rg "percySnapshot" packages/client/tests/e2e/

   # Each snapshot × 3 widths × 3 browsers = total uploads
   # Example: 10 snapshots = 90 uploads (10 × 3 × 3)
   ```

2. **Review Network Configuration**

   ```yaml
   # In percy.config.yml
   discovery:
     networkIdleTimeout: 750 # Lower if too slow

   agent:
     assetDiscovery:
       cacheResponses: true # Ensure caching enabled
   ```

3. **Test Upload Speed Locally**

   ```bash
   # Run single test to measure upload time
   pnpm run test:e2e -- --project=chromium-desktop --grep="specific test"

   # Check terminal for upload duration
   ```

**Common Solutions:**

| Cause                    | Solution                                      |
| ------------------------ | --------------------------------------------- |
| Too many snapshots       | Reduce snapshot count; combine related states |
| Network timeout too high | Lower `networkIdleTimeout` to 500-750ms       |
| Asset caching disabled   | Enable `cacheResponses: true` in config       |
| Large DOM snapshots      | Simplify components; reduce excessive nesting |
| CI network throttling    | Contact GitHub support or retry workflow      |

### Problem: Percy CI Mode Detection Incorrect

**Symptoms:**

- CI runs in wrong mode (dry-run vs compare)
- Protected branch doesn't enforce Percy check
- Feature branch incorrectly blocks on Percy

**Diagnostic Steps:**

1. **Check Branch Detection Logic**

   ```yaml
   # In .github/workflows/visual-regression.yml
   - name: Determine Percy mode
     run: |
       if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
         echo "PERCY_MODE=compare" >> $GITHUB_ENV
         echo "PERCY_ENFORCE=true" >> $GITHUB_ENV
       fi
   ```

2. **Verify GitHub Context**

   ```yaml
   # Add debug output to workflow
   - name: Debug GitHub context
     run: |
       echo "Branch: ${{ github.ref }}"
       echo "Is protected: ${{ github.event.repository.default_branch }}"
   ```

3. **Test Mode Logic Locally**

   ```bash
   # Simulate CI environment variables
   export GITHUB_REF="refs/heads/main"
   export PERCY_TOKEN="your_token"

   # Run test and verify Percy mode in output
   pnpm run test:e2e
   ```

**Common Solutions:**

| Cause                      | Solution                                         |
| -------------------------- | ------------------------------------------------ |
| Incorrect branch ref check | Update branch detection regex in workflow        |
| Missing Percy enforce flag | Add `PERCY_ENFORCE=true` for protected branches  |
| Fork detection broken      | Check `github.event.pull_request.head.repo.fork` |
| Token available on fork    | Percy should not run in compare mode on forks    |

---

## Browser Inconsistency Resolution

Cross-browser rendering differences can cause legitimate or problematic visual diffs.

### Problem: Firefox Shows Different Rendering than Chromium

**Symptoms:**

- Firefox snapshots differ from Chromium
- Diffs appear in fonts, shadows, or borders
- Layout is slightly shifted in Firefox

**Diagnostic Steps:**

1. **Identify Browser-Specific CSS**

   ```bash
   # Check if issue is browser-specific
   pnpm run test:e2e -- --project=firefox
   pnpm run test:e2e -- --project=chromium-desktop

   # Compare results in Percy dashboard
   ```

2. **Test in Local Firefox**

   ```bash
   # Open component in local Firefox DevTools
   # Compare rendering to Chromium
   # Identify specific CSS properties causing diff
   ```

3. **Check Percy Threshold**
   ```bash
   # Verify if diff magnitude is within acceptable threshold
   # Refer to visual-regression-standards.md
   # Firefox: Minor font rendering differences acceptable
   ```

**Common Solutions:**

| Cause                          | Solution                                                 |
| ------------------------------ | -------------------------------------------------------- |
| Font anti-aliasing differences | Expected; approve if within 0.5% threshold               |
| Box-shadow rendering variance  | Use explicit `box-shadow` values (no shorthand)          |
| Flexbox layout differences     | Add explicit `flex-basis` instead of relying on defaults |
| Form control styling           | Use custom styled components instead of native controls  |

### Problem: WebKit Snapshots Fail to Capture

**Symptoms:**

- WebKit tests fail during Percy snapshot
- Error: "MediaStream not available"
- WebKit snapshots show blank screens

**Diagnostic Steps:**

1. **Check Playwright WebKit Configuration**

   ```typescript
   // In packages/client/playwright.config.ts
   {
     name: 'webkit',
     use: {
       ...devices['Desktop Safari'],
       launchOptions: {
         args: ['--use-fake-device-for-media-stream'],
       },
     },
   }
   ```

2. **Verify Synthetic MediaStream**

   ```typescript
   // In test helper
   await context.grantPermissions(['microphone']);

   // Check if fake media stream is injected
   const hasMediaStream = await page.evaluate(() => {
     return navigator.mediaDevices !== undefined;
   });
   ```

3. **Test WebKit Locally**
   ```bash
   pnpm run test:e2e -- --project=webkit --headed
   # Observe if browser opens and captures correctly
   ```

**Common Solutions:**

| Cause                         | Solution                                                       |
| ----------------------------- | -------------------------------------------------------------- |
| MediaStream API unavailable   | Add `--use-fake-device-for-media-stream` to WebKit launch args |
| Permissions not granted       | Call `context.grantPermissions(['microphone'])` in test        |
| Synthetic media not injecting | Use Playwright's built-in fake media instead of custom mocks   |
| WebKit version mismatch       | Update Playwright: `pnpm run test:e2e:install`                 |

---

## Troubleshooting Decision Matrix

Use this decision matrix to quickly identify the most likely cause and solution path.

### Symptom-Based Diagnostic Tree

```
Percy Issue Detected
│
├─ Visual Diff Unexpected
│  ├─ Diff is large (>5%)
│  │  └─ → Review recent commits for CSS changes
│  │       Check Material-UI theme consistency
│  │
│  └─ Diff is small (<5%)
│     ├─ Affects all browsers
│     │  └─ → Check for global CSS changes
│     │       Verify percy.config.yml percyCSS settings
│     │
│     └─ Affects specific browser
│        └─ → See Browser Inconsistency Resolution section
│
├─ CI Workflow Failure
│  ├─ Token error
│  │  └─ → Verify PERCY_TOKEN secret in GitHub
│  │       Check workflow secrets: inherit
│  │
│  ├─ Timeout
│  │  └─ → Reduce snapshot count
│  │       Lower networkIdleTimeout
│  │
│  └─ Mode detection wrong
│     └─ → Check branch ref logic in workflow
│          Verify PERCY_ENFORCE flag
│
├─ Baseline Synchronization
│  ├─ Baseline not updating
│  │  └─ → Verify approval completed in dashboard
│  │       Check for new commits after approval
│  │
│  └─ Baseline reverted
│     └─ → Check for force-push or rebase
│          Re-approve baselines
│
└─ Browser-Specific Issue
   ├─ Firefox rendering different
   │  └─ → Check if diff is within acceptable threshold
   │       Review font anti-aliasing differences
   │
   └─ WebKit failing
      └─ → Verify synthetic MediaStream configuration
           Update Playwright browsers
```

### Quick Diagnostic Checklist

When encountering any Percy issue, run through this checklist:

- [ ] **Configuration:** Is `percy.config.yml` correct and up-to-date?
- [ ] **Token:** Is `PERCY_TOKEN` set (locally or in CI)?
- [ ] **Network:** Are all async resources loading before snapshot?
- [ ] **Animations:** Are animations frozen via `percyCSS`?
- [ ] **Baselines:** Are baselines approved and synchronized?
- [ ] **Browser:** Is the issue specific to one browser?
- [ ] **CI:** Does the issue reproduce locally or only in CI?

---

## Common Error Messages

### Error: "Percy token not found"

**Full Error:**

```
Error: PERCY_TOKEN environment variable not set
Percy will run in dry-run mode
```

**Cause:** Percy token is missing from environment variables.

**Solution:**

```bash
# Set token for current session
export PERCY_TOKEN="your_percy_token"  # Linux/macOS
$env:PERCY_TOKEN="your_percy_token"    # Windows PowerShell

# Or add to .env.local (not committed)
echo "PERCY_TOKEN=your_token" >> .env.local
```

### Error: "Snapshot timeout"

**Full Error:**

```
Error: Percy snapshot timeout after 30000ms
Snapshot 'ComponentName' failed to capture
```

**Cause:** Network resources not loading or excessive `networkIdleTimeout`.

**Solution:**

```yaml
# In percy.config.yml, adjust timeout
discovery:
  networkIdleTimeout: 500  # Reduce from 750ms

# Or in test, ensure content loads
await page.waitForLoadState('networkidle');
await page.waitForSelector('[data-testid="content"]');
```

### Error: "Build comparison failed"

**Full Error:**

```
Error: Percy build comparison failed
No baseline found for this branch
```

**Cause:** First Percy run on new branch or baselines reset.

**Solution:**

```bash
# Create initial baselines by running Percy
pnpm run test:e2e

# Approve all snapshots in Percy dashboard
# Future runs will compare against these baselines
```

### Error: "Invalid Percy configuration"

**Full Error:**

```
Error: Invalid percy.config.yml
Missing required field: version
```

**Cause:** Malformed `percy.config.yml` file.

**Solution:**

```yaml
# Ensure percy.config.yml has required fields
version: 2
snapshot:
  widths: [375, 768, 1920]
  # ... rest of config
```

---

## Debug Mode and Logging

Enable Percy debug mode for detailed diagnostic information.

### Enable Percy Debug Logging

```bash
# Set Percy log level to debug
export PERCY_LOGLEVEL=debug

# Or in CI workflow
- name: Run Percy with debug logging
  env:
    PERCY_LOGLEVEL: debug
    PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
  run: pnpm run test:e2e
```

### Interpret Debug Output

Percy debug logs include:

- Snapshot capture timing
- Network request details
- Asset discovery progress
- Upload status and errors
- Baseline comparison results

**Example debug output:**

```
[percy] Percy has started!
[percy] Snapshot taken: ComponentName - Desktop
[percy] → Uploading 3 snapshots (375px, 768px, 1920px)
[percy] → Asset discovery: 42 assets found
[percy] → Upload complete: Build #123
[percy] → View results: https://percy.io/...
```

### Playwright Debug Mode

Combine Percy with Playwright debug mode for comprehensive troubleshooting:

```bash
# Run Playwright in debug mode with Percy
PERCY_LOGLEVEL=debug pnpm run test:e2e -- --project=chromium-desktop --debug

# Or use headed mode to watch browser
pnpm run test:e2e:headed -- --project=chromium-desktop
```

### Save Percy Logs for Support

```bash
# Redirect Percy output to file
pnpm run test:e2e 2>&1 | tee percy-debug.log

# Share percy-debug.log with team or Percy support
```

---

## Related Documentation

- **[Percy Workflow Guide](./percy-workflow-guide.md)** - Standard development workflow
- **[Visual Regression Standards](./visual-regression-standards.md)** - Quality standards and
  thresholds
- **[Playwright Testing Guide](./playwright-testing-guide.md)** - E2E testing setup and patterns
- **[Comprehensive Testing Guide](./comprehensive-testing-guide.md)** - Full testing strategy

---

## Version History

| Version | Date       | Changes                                                     |
| ------- | ---------- | ----------------------------------------------------------- |
| 1.0.0   | 2025-01-05 | Initial Percy troubleshooting guide with debugging workflow |
