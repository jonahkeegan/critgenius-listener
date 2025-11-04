# Visual Regression Testing with Percy

This directory contains visual regression tests for CritGenius Listener components using Percy and
Playwright.

## Overview

Visual regression tests capture screenshots of UI components and compare them against baselines to
detect visual changes. Percy provides cloud-based visual testing with responsive viewport support.

## Test Structure

```
tests/visual/
├── README.md                    # This documentation
├── __tests__/
│   └── visual-regression.test.ts    # Main Percy test suite
├── fixtures/                    # Deterministic component data
│   ├── character-data.ts        # Character assignment data
│   ├── speaker-data.ts          # Speaker profile data
│   └── transcript-data.ts       # Transcript entry data
└── helpers/
  ├── component-setup.ts       # Minimal DOM renderers for components
  └── percy-helpers.ts         # Percy preparation & snapshot utilities
```

## Running Tests

### Install Dependencies

```bash
# Install Percy CLI globally (if not already installed)
npm install -g @percy/cli

# Or use the workspace-installed version
npx percy --version
```

### Set up Environment

1. Copy the Percy environment template:

```bash
cp .env.percy.example .env.percy
```

2. Add your Percy project token to `.env.percy`:

```
PERCY_TOKEN=your_percy_project_token_here
```

3. Export the token:

```bash
export PERCY_TOKEN=$(cat .env.percy | grep PERCY_TOKEN | cut -d '=' -f2)
```

### Run Visual Tests

```bash
# Run all visual tests
pnpm test:visual

# Run visual tests with Percy upload (baseline)
pnpm test:visual:baseline

# Run specific test file
npx playwright test tests/visual/__tests__/visual-regression.test.ts

# Run with Percy upload
npx percy exec -- npx playwright test tests/visual/__tests__/visual-regression.test.ts
```

### CI/CD Integration

- The `CI / Percy Visual Regression` job runs after the `build-and-validate` stage inside the main
  workflow. No additional triggers are required.
- Pushes to `main` or `production` run in baseline mode and fail immediately if `PERCY_TOKEN` is
  absent. Approved merges capture the new baseline automatically.
- Pull requests run in comparison mode. If `PERCY_TOKEN` is available, Percy uploads diffs and the
  GitHub check stays pending until you approve them in the Percy UI. Without a token (fork PRs), the
  job switches to a dry run and still uploads Playwright artifacts for manual inspection.
- Logs and reports live in the `percy-artifacts-<mode>` artifact bundle (7-day retention, extended
  to 30 days on failure). Use the GitHub Actions sidebar to download the bundle when debugging.
- Reference `docs/percy-ci-setup-guide.md` for secret management, branch protection, and
  troubleshooting tips.

## Test Components

### 1. CharacterAssignmentGrid Component

Tests character display with various states:

- Default character data
- Many characters (grid layout)
- Injured characters (different visual states)

### 2. SpeakerIdentificationPanel Component

Tests speaker display with different states:

- Default speaker profiles
- Mixed speaking states (speaking, silent, muted)

### 3. TranscriptWindow Component

Tests transcript display with various data:

- Default transcript entries
- Highlighted entries
- Different timestamps and confidence levels

### 4. SpeakerTranscriptLine Component

Tests individual transcript line states:

- Normal speaking state
- Highlighted state
- Different speaker indicators

## Percy Configuration

Percy is configured in `percy.config.yml` with:

- **Widths**: [375, 768, 1920] (Mobile, Tablet, Desktop)
- **Min Height**: 1024px
- **JavaScript**: Enabled
- **Ignore Elements**: Timestamps, live indicators, animations

## Visual Test Best Practices

### 1. Consistent Test Data

Use fixtures from `fixtures/` directory for consistent test data:

```typescript
import { characterScenarios } from './fixtures/character-data';

// Use predefined scenarios
const characters = characterScenarios.default;
```

### 2. Mock External Resources

Helper utilities handle:

- Hiding dynamic elements (timestamps, live indicators)
- Disabling animations for consistent screenshots
- Mocking external fonts and images

### 3. Responsive Testing

`percy-helpers.ts` captures each snapshot at the configured breakpoints (375, 768, 1920).

### 4. Component Isolation

`component-setup.ts` renders lightweight DOM facsimiles of each component, allowing Percy to focus
on layout regressions without requiring the full React application bundle.

### 5. Quick Iteration

During component work, rerun snapshots automatically:

```bash
watchexec -c -w packages/client/src/components -w packages/client/tests/visual -- pnpm --filter @critgenius/client run test:visual
```

## Environment Variables

| Variable              | Description                     | Required |
| --------------------- | ------------------------------- | -------- |
| `PERCY_TOKEN`         | Percy project token             | Yes      |
| `PERCY_TARGET_WIDTHS` | Comma-separated viewport widths | No       |
| `PERCY_DRY_RUN`       | Skip upload for testing         | No       |

## Percy Dashboard

Visual regression results are available in the Percy dashboard:

- Compare snapshots between builds
- Approve/reject visual changes
- Set up branch-based workflows
- Configure auto-approval rules

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify `PERCY_TOKEN` is set correctly
   - Check token permissions in Percy dashboard

2. **Snapshots Not Uploading**
   - Ensure network connectivity
   - Check Percy CLI version compatibility

3. **Visual Flakiness**
   - Use `hideDynamicElements()` helper
   - Disable animations with CSS
   - Wait for page stability

### Debug Commands

```bash
# Check Percy configuration
npx percy config

# Validate token
npx percy whoami

# Dry run (validate without uploading)
npx percy exec -- --dry-run playwright test tests/visual

# Verbose logging
npx percy exec --verbose -- playwright test tests/visual
```

## Adding New Visual Tests

1. **Create test file** in `tests/visual/`
2. **Import fixtures** from `fixtures/` directory
3. **Use helper functions** from `helpers/percy-helpers.ts`
4. **Add component scenario** to appropriate test describe block
5. **Run baseline** to capture initial snapshots
6. **Configure Percy** if new viewport widths needed

### Test Template

```typescript
import { test } from '@playwright/test';
import {
  setupPageForVisualTesting,
  takeResponsiveSnapshot,
  PercyTestUtils,
} from './helpers/percy-helpers';

test.describe('ComponentName Component', () => {
  test('should capture component in various states', async ({ page }) => {
    await setupPageForVisualTesting(page, 'http://localhost:5173', {
      hideDynamicElements: true,
      additionalSetup: async () => {
        // Setup component with test data
        await page.evaluate(testData => {
          // Create component DOM or mount component
        }, testData);

        await PercyTestUtils.waitForMUIComponents(page);
      },
    });

    await takeResponsiveSnapshot(page, 'component-name-state');
  });
});
```

## Resources

- [Percy Documentation](https://docs.percy.io/)
- [Playwright Testing Guide](https://playwright.dev/docs/test-configuration)
- [Visual Regression Testing Best Practices](https://docs.percy.io/docs/visual-testing-basics)
- [Percy CLI Reference](https://github.com/percy/cli)
