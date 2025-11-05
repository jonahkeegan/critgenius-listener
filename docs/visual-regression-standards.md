# Visual Regression Testing Standards

**Version:** 1.0.0  
**Last Updated:** 2025-01-05  
**Status:** Active  
**Related Documentation:**

- [Percy Workflow Guide](./percy-workflow-guide.md)
- [Percy Troubleshooting Guide](./percy-troubleshooting.md)
- [Comprehensive Testing Guide](./comprehensive-testing-guide.md)

## Table of Contents

1. [Overview](#overview)
2. [Visual Diff Threshold Standards](#visual-diff-threshold-standards)
3. [Browser Coverage Requirements](#browser-coverage-requirements)
4. [Component Testing Strategies](#component-testing-strategies)
5. [Acceptance Criteria for Visual Changes](#acceptance-criteria-for-visual-changes)
6. [When to Use Percy vs Other Testing](#when-to-use-percy-vs-other-testing)
7. [Review and Approval Process Standards](#review-and-approval-process-standards)
8. [Quality Gate Checklist](#quality-gate-checklist)

---

## Overview

This document establishes quality standards and best practices for visual regression testing in
CritGenius: Listener. These standards ensure consistent, reliable visual testing while balancing
precision with maintainability.

### Purpose

- Define acceptable visual difference thresholds for different component types
- Establish browser coverage requirements aligned with project goals
- Provide clear acceptance criteria for visual changes
- Guide decisions on when Percy is appropriate vs other testing methods

### Scope

These standards apply to:

- All UI components in the `@critgenius/client` package
- Material-UI theme implementations
- Responsive design across three breakpoints (375px, 768px, 1920px)
- Visual regression checks in CI/CD pipeline

---

## Visual Diff Threshold Standards

Visual diff thresholds determine how sensitive Percy is to pixel differences. Different component
types require different sensitivity levels based on their volatility and visual importance.

### Threshold Modes

| Mode         | Threshold | Use Cases                      | Example Components              |
| ------------ | --------- | ------------------------------ | ------------------------------- |
| **Strict**   | 0.1%      | Static, critical UI elements   | Navigation bars, buttons, logos |
| **Standard** | 0.5%      | General interactive components | Forms, modals, cards            |
| **Relaxed**  | 1.0%      | Dynamic content areas          | Real-time transcripts, timers   |

### Strict Mode (0.1%)

**When to Use:**

- Static components with no dynamic content
- Critical UI elements (navigation, branding, primary actions)
- Components with pixel-perfect design requirements

**Examples:**

```typescript
// Static navigation component - Strict threshold
await percySnapshot(page, 'Navigation - Desktop layout', {
  percyCSS: `...`, // Default config applies strict settings
});

// Logo and branding elements - Strict threshold
await percySnapshot(page, 'App header - Brand elements');
```

**Characteristics:**

- ✅ No dynamic data rendering
- ✅ Fixed layout and dimensions
- ✅ No animations or transitions
- ✅ Critical to user experience

### Standard Mode (0.5%)

**When to Use:**

- Interactive components with stable layouts
- Form fields, buttons, and controls
- Modal dialogs and tooltips
- General UI components

**Examples:**

```typescript
// Form components - Standard threshold
await percySnapshot(page, 'SpeakerMapping - Empty state');

// Interactive controls - Standard threshold
await percySnapshot(page, 'Audio controls - Recording state');
```

**Characteristics:**

- ✅ Interactive but stable
- ✅ Minimal dynamic content
- ✅ Consistent across interactions
- ⚠️ May have minor browser rendering differences

### Relaxed Mode (1.0%)

**When to Use:**

- Components with dynamic content updates
- Real-time data displays
- Animated or transitioning elements
- Components with browser-specific rendering

**Examples:**

```typescript
// Real-time transcript - Relaxed threshold
await percySnapshot(page, 'TranscriptDisplay - Active session', {
  percyCSS: `
    /* Hide timestamps and dynamic elements */
    [data-testid="timestamp"] { visibility: hidden !important; }
    [data-testid="live-indicator"] { visibility: hidden !important; }
  `,
});
```

**Characteristics:**

- ⚠️ Contains real-time updates
- ⚠️ May have animations or transitions
- ⚠️ Browser-specific rendering variations
- ⚠️ Acceptable minor visual drift

### Threshold Decision Matrix

```
Component Type          | Static | Interactive | Dynamic | Recommended Threshold
------------------------|--------|-------------|---------|---------------------
Navigation Bars         | ✅     | ❌          | ❌      | Strict (0.1%)
Buttons & Controls      | ✅     | ✅          | ❌      | Standard (0.5%)
Form Fields             | ✅     | ✅          | ❌      | Standard (0.5%)
Modals & Dialogs        | ✅     | ✅          | ❌      | Standard (0.5%)
Real-time Transcripts   | ❌     | ✅          | ✅      | Relaxed (1.0%)
Audio Visualizers       | ❌     | ✅          | ✅      | Relaxed (1.0%)
Loading States          | ✅     | ❌          | ✅      | Relaxed (1.0%)
```

---

## Browser Coverage Requirements

Percy tests components across multiple browsers to ensure cross-browser compatibility. Coverage
requirements balance thoroughness with CI execution time.

### Required Browser Coverage

| Browser      | Version Strategy | Viewport Widths | Purpose                    |
| ------------ | ---------------- | --------------- | -------------------------- |
| **Chromium** | Latest stable    | 375, 768, 1920  | Baseline reference browser |
| **Firefox**  | Latest stable    | 375, 768, 1920  | Cross-browser validation   |
| **WebKit**   | Latest stable    | 375, 768, 1920  | Safari compatibility check |

### Browser-Specific Considerations

#### Chromium (Baseline)

- **Role:** Primary reference browser for all baselines
- **Configuration:** Standard Percy settings in `percy.config.yml`
- **Why:** Most widely used, consistent rendering, best DevTools support

#### Firefox

- **Role:** Cross-browser validation for layout and CSS compatibility
- **Configuration:** Same Percy settings as Chromium
- **Expected Differences:**
  - Minor font rendering variations (acceptable)
  - Subtle box-shadow differences (acceptable)
  - Form control styling differences (acceptable)

#### WebKit

- **Role:** Safari equivalence testing for macOS/iOS users
- **Configuration:** Synthetic MediaStream for WebRTC API limitations
- **Expected Differences:**
  - Flex layout minor variations (acceptable within threshold)
  - Border-radius rendering differences (acceptable)
  - Transform and animation differences (use CSS freezing)

### Responsive Breakpoint Coverage

All browsers test at three Material-UI breakpoints aligned with design system:

```typescript
// From packages/client/percy.config.yml
widths: [375, 768, 1920];

// Corresponds to:
// 375px:  Mobile (xs, sm)
// 768px:  Tablet (md)
// 1920px: Desktop (lg, xl, xxl)
```

**Coverage Expectations:**

- ✅ Components adapt correctly at each breakpoint
- ✅ No layout overflow or broken responsive behavior
- ✅ Touch targets meet size requirements at mobile widths
- ✅ Content remains readable at all breakpoints

---

## Component Testing Strategies

Different component types require tailored testing approaches to balance coverage with
maintainability.

### Static Components

**Definition:** Components with fixed content and no user interaction.

**Testing Strategy:**

- Capture single snapshot per responsive breakpoint
- Use strict threshold (0.1%)
- Validate pixel-perfect design adherence

**Examples:**

```typescript
// Navigation bar - Static component
await percySnapshot(page, 'Navigation - Desktop');
await percySnapshot(page, 'Navigation - Tablet');
await percySnapshot(page, 'Navigation - Mobile');
```

### Interactive Components

**Definition:** Components that respond to user actions but have stable visual states.

**Testing Strategy:**

- Capture snapshots of key interaction states
- Use standard threshold (0.5%)
- Test state transitions (idle, hover, active, disabled)

**Examples:**

```typescript
// Button states - Interactive component
await percySnapshot(page, 'Button - Idle state');
await page.hover('[data-testid="submit-button"]');
await percySnapshot(page, 'Button - Hover state');
```

### Dynamic Components

**Definition:** Components that display real-time or frequently changing data.

**Testing Strategy:**

- Hide dynamic elements via `percyCSS`
- Use relaxed threshold (1.0%)
- Focus on layout stability over content accuracy

**Examples:**

```typescript
// Transcript display - Dynamic component
await percySnapshot(page, 'TranscriptDisplay - With content', {
  percyCSS: `
    /* Hide timestamps */
    [data-testid="timestamp"] { visibility: hidden !important; }
    
    /* Mock loading states */
    .loading-placeholder { background-color: #f0f0f0 !important; }
  `,
});
```

### Component Testing Decision Tree

```
Is component static?
├─ Yes → Use strict threshold
│         Capture 1 snapshot per breakpoint
│         Expect 0 visual drift
│
└─ No → Is component interactive?
    ├─ Yes → Does it display dynamic data?
    │   ├─ Yes → Use relaxed threshold
    │   │         Hide timestamps/dynamic elements
    │   │         Focus on layout stability
    │   │
    │   └─ No → Use standard threshold
    │            Capture key interaction states
    │            Test hover/active/disabled
    │
    └─ No → Re-evaluate component classification
```

---

## Acceptance Criteria for Visual Changes

All visual changes must meet these criteria before approval in Percy dashboard.

### 1. Intentionality

- [ ] **PR Context:** Visual changes are explicitly mentioned in PR description
- [ ] **Change Justification:** Reason for visual change is documented
- [ ] **Design Alignment:** Changes align with Material-UI design system
- [ ] **Stakeholder Approval:** Relevant stakeholders have reviewed (if needed)

### 2. Visual Correctness

- [ ] **Layout Integrity:** No broken layouts at any responsive breakpoint
- [ ] **Color Accuracy:** Colors match Material-UI theme palette
- [ ] **Typography:** Font sizes and line heights follow type scale
- [ ] **Spacing:** Margins and padding use Material-UI spacing units (8px grid)
- [ ] **Alignment:** Elements align to grid and maintain visual hierarchy

### 3. Responsive Behavior

- [ ] **Mobile (375px):** Layout adapts correctly, touch targets ≥44px
- [ ] **Tablet (768px):** Intermediate breakpoint transitions smoothly
- [ ] **Desktop (1920px):** Full-width layout utilizes space effectively
- [ ] **Consistency:** Changes work across all three breakpoints

### 4. Accessibility

- [ ] **Contrast:** Text contrast ratio ≥4.5:1 (WCAG AA)
- [ ] **Focus States:** Interactive elements have visible focus indicators
- [ ] **Touch Targets:** Minimum 44x44px for mobile interactions
- [ ] **Semantic HTML:** No visual-only changes that break semantics

### 5. Browser Compatibility

- [ ] **Chromium:** Renders correctly (baseline reference)
- [ ] **Firefox:** Minor differences within acceptable threshold
- [ ] **WebKit:** Safari-specific quirks handled appropriately

### 6. Performance Impact

- [ ] **Asset Size:** New visual assets optimized (images, fonts)
- [ ] **Render Performance:** No visual changes cause layout thrashing
- [ ] **Animation Performance:** Animations use GPU-accelerated properties

---

## When to Use Percy vs Other Testing

Visual regression testing complements but doesn't replace other testing methods. Use this guide to
determine the appropriate testing approach.

### Percy is Ideal For:

✅ **Visual Layout Validation**

- Responsive design across breakpoints
- Component rendering consistency
- Material-UI theme application

✅ **Cross-Browser Visual Compatibility**

- Font rendering differences
- CSS property support variations
- Layout engine differences (Blink, Gecko, WebKit)

✅ **Design System Adherence**

- Color palette consistency
- Typography scale conformance
- Spacing system compliance

✅ **Regression Prevention**

- Catching unintended UI changes
- Validating refactoring doesn't alter visuals
- Ensuring theme updates propagate correctly

### Percy is NOT Ideal For:

❌ **Functional Logic Testing**

- Use: **Vitest unit tests** for business logic
- Example: Speaker mapping algorithm, audio processing logic

❌ **User Interaction Flows**

- Use: **Playwright E2E tests** for workflows
- Example: Recording session start-to-finish, form submissions

❌ **API Contract Testing**

- Use: **Integration tests** with mock servers
- Example: AssemblyAI API responses, WebSocket message handling

❌ **Performance Validation**

- Use: **Performance tests** with Vitest benchmarking
- Example: Audio buffer processing speed, real-time latency

❌ **Accessibility Testing**

- Use: **axe-core** with Playwright for comprehensive checks
- Example: Screen reader compatibility, keyboard navigation

### Testing Strategy Matrix

| Testing Goal    | Primary Tool     | Percy Role  | Alternative Tools           |
| --------------- | ---------------- | ----------- | --------------------------- |
| Visual Layout   | **Percy**        | Primary     | Browser DevTools, Storybook |
| Component Logic | Vitest           | None        | Jest, Testing Library       |
| User Workflows  | Playwright       | Secondary   | Cypress, TestCafe           |
| API Integration | Vitest + MSW     | None        | Supertest, Nock             |
| Accessibility   | Playwright + axe | Visual only | Pa11y, Lighthouse           |
| Performance     | Vitest Bench     | None        | Lighthouse, WebPageTest     |

---

## Review and Approval Process Standards

Consistent review and approval processes ensure quality visual regression testing outcomes.

### Review Responsibilities

| Role                | Responsibilities                                  | Required for Approval |
| ------------------- | ------------------------------------------------- | --------------------- |
| **Developer**       | Create snapshots, initial review, fix regressions | ✅ Yes                |
| **Code Reviewer**   | Verify intentionality, check all breakpoints      | ✅ Yes                |
| **Design Lead**     | Approve significant UI changes, theme updates     | ⚠️ Conditional        |
| **Percy Dashboard** | Compute diffs, block merge on protected branches  | ✅ Yes (automated)    |

### Review Workflow Standards

1. **Initial Developer Review (Required)**
   - Developer runs Percy locally before pushing
   - Reviews all diffs at all responsive widths
   - Documents expected visual changes in PR description

2. **PR Code Review (Required)**
   - Code reviewer checks Percy dashboard link
   - Validates diffs match PR description
   - Verifies acceptance criteria checklist

3. **Design Stakeholder Review (Conditional)**
   - **Required for:**
     - Material-UI theme updates
     - New component designs
     - Major layout refactoring
   - **Optional for:**
     - Minor styling tweaks
     - Bug fixes with no visual impact

4. **Percy Baseline Approval (Required)**
   - Developer or reviewer clicks "Approve" in Percy dashboard
   - Baselines updated atomically
   - CI re-runs with new baselines

### Approval Decision Matrix

```
Visual Change Magnitude → | Minor (<0.5%) | Medium (0.5-1%) | Major (>1%)
----------------------------|---------------|----------------|---------------
No PR mention              | ❌ Reject     | ❌ Reject      | ❌ Reject
PR mentions, no design OK  | ✅ Approve*   | ⚠️ Request Review | ❌ Need Design
PR + Design approval       | ✅ Approve    | ✅ Approve     | ✅ Approve

* = Approve if change matches PR description and acceptance criteria
```

### Rejection Scenarios

**Immediate Rejection:**

- ❌ Visual diffs not mentioned in PR description
- ❌ Broken layouts at any breakpoint
- ❌ Accessibility contrast violations
- ❌ Component completely fails to render

**Request Changes:**

- ⚠️ Medium-magnitude changes without design review
- ⚠️ Inconsistent responsive behavior
- ⚠️ Minor accessibility issues
- ⚠️ Browser-specific rendering bugs

---

## Quality Gate Checklist

Use this checklist before approving Percy builds to ensure quality standards are met.

### Pre-Approval Checklist

#### Visual Correctness

- [ ] All snapshots render completely (no loading states or blank screens)
- [ ] Layout is intact at all three responsive widths (375, 768, 1920)
- [ ] Colors match Material-UI theme palette
- [ ] Typography follows design system type scale
- [ ] Spacing adheres to 8px grid system

#### Intentionality

- [ ] All visual diffs are mentioned in PR description
- [ ] Changes are documented with rationale
- [ ] Acceptance criteria are met (see above)
- [ ] Design stakeholder approval obtained (if required)

#### Browser Compatibility

- [ ] Chromium snapshots are correct (baseline reference)
- [ ] Firefox differences are within acceptable threshold
- [ ] WebKit differences are within acceptable threshold
- [ ] No browser-specific layout breakage

#### Accessibility

- [ ] Text contrast ratio ≥4.5:1 (WCAG AA)
- [ ] Focus indicators are visible and clear
- [ ] Touch targets are ≥44x44px on mobile
- [ ] Semantic HTML structure is maintained

#### CI Integration

- [ ] Percy build URL is accessible in PR
- [ ] CI status check reflects Percy results
- [ ] Artifacts are retained for review (if needed)
- [ ] No token gating issues for protected branches

### Post-Approval Validation

After approving baselines in Percy dashboard:

- [ ] CI Percy build passes with new baselines
- [ ] No additional commits pushed after approval
- [ ] PR is ready to merge (all checks green)
- [ ] Baselines are synchronized across team

### Troubleshooting Checklist

If approval is blocked or quality issues arise:

- [ ] Review [Percy Troubleshooting Guide](./percy-troubleshooting.md)
- [ ] Check Percy dashboard for specific diff details
- [ ] Run Percy locally to reproduce issues
- [ ] Validate `percy.config.yml` settings
- [ ] Confirm `PERCY_TOKEN` is set correctly
- [ ] Check browser versions match CI configuration

---

## Related Documentation

- **[Percy Workflow Guide](./percy-workflow-guide.md)** - Daily development workflow for Percy
- **[Percy Troubleshooting Guide](./percy-troubleshooting.md)** - Common issues and debugging
- **[Comprehensive Testing Guide](./comprehensive-testing-guide.md)** - Full testing strategy
- **[Developer Onboarding](./developer-onboarding.md)** - Percy setup for new contributors

---

## Version History

| Version | Date       | Changes                                                                  |
| ------- | ---------- | ------------------------------------------------------------------------ |
| 1.0.0   | 2025-01-05 | Initial visual regression standards with thresholds and browser coverage |
