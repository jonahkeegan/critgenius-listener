# GitHub Repository Configuration Guide

**Repository:** critgenius-listener **Task Reference:** Infrastructure Setup Task 1.2 **Created:**
2025-01-08 21:20 PST

## Repository Settings Configuration

### 1. Change Repository Visibility to Private

**Location:** Repository Settings → General → Danger Zone **Steps:**

1. Navigate to https://github.com/jonahkeegan/critgenius-listener/settings
2. Scroll to "Danger Zone" section at bottom
3. Click "Change repository visibility"
4. Select "Make private"
5. Confirm by typing repository name: `critgenius-listener`
6. Click "I understand, change repository visibility"

**Verification:** Repository should show "Private" badge next to name

### 2. Configure Branch Protection Rules

**Location:** Repository Settings → Branches **Steps:**

1. Navigate to https://github.com/jonahkeegan/critgenius-listener/settings/branches
2. Click "Add rule" next to "Branch protection rules"
3. Configure the following settings:

**Branch name pattern:** `main`

**Protection Settings:**

- ✅ Require a pull request before merging
  - ✅ Require approvals: 1
  - ✅ Dismiss stale reviews when new commits are pushed
  - ✅ Require review from code owners (when CODEOWNERS file exists)
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Status checks to require:** (will be added as CI/CD is implemented)
    - `ci/build`
    - `ci/test`
    - `ci/lint`
    - `security/scan`
- ✅ Require conversation resolution before merging
- ✅ Require signed commits (recommended for security)
- ✅ Include administrators (apply rules to admins)
- ✅ Restrict pushes that create matching branches
- ✅ Allow force pushes: Never
- ✅ Allow deletions: Never

4. Click "Create" to save the branch protection rule

### 3. Repository Security Settings

**Location:** Repository Settings → Security & analysis **Steps:**

1. Navigate to https://github.com/jonahkeegan/critgenius-listener/settings/security_analysis
2. Enable the following features:

**Vulnerability alerts:**

- ✅ Dependency graph (should be enabled by default)
- ✅ Dependabot alerts
- ✅ Dependabot security updates

**Code scanning alerts:**

- ✅ CodeQL analysis (setup will be configured in CI/CD tasks)

**Secret scanning alerts:**

- ✅ Secret scanning (for API keys, tokens, etc.)

### 4. Additional Repository Settings

**General Settings:**

- ✅ Wikis: Disabled (using docs/ folder instead)
- ✅ Issues: Enabled
- ✅ Discussions: Enabled (for community engagement)
- ✅ Projects: Enabled

**Pull Requests:**

- ✅ Allow merge commits: Disabled
- ✅ Allow squash merging: Enabled (default)
- ✅ Allow rebase merging: Enabled
- ✅ Always suggest updating pull request branches: Enabled
- ✅ Automatically delete head branches: Enabled

## Verification Checklist

After completing the manual configuration:

- [ ] Repository visibility changed to Private
- [x] Branch protection rule active on `main` branch
- [x] Pull request requirements configured (1 approval minimum)
- [x] Status checks requirement enabled (ready for CI/CD)
- [x] Vulnerability alerts enabled
- [x] Dependabot security updates enabled
- [x] Secret scanning enabled
- [x] Repository settings optimized for security and workflow

## Notes

- **Status Checks:** The required status checks will be populated automatically as CI/CD workflows
  are implemented in tasks 4.1-4.4
- **CODEOWNERS:** Will be created as part of repository structure setup
- **Admin Override:** Branch protection rules apply to administrators for maximum security
- **Security First:** All security features enabled to protect sensitive audio processing code and
  API keys

## Next Steps

Once manual configuration is complete:

1. Verify all settings are applied correctly
2. Test branch protection by attempting direct push to main (should fail)
3. Proceed to task 1.3: Create development, staging, and production branch structure

## Reference

- **Task:** Infrastructure Setup 1.2
- **Repository:** https://github.com/jonahkeegan/critgenius-listener
- **Documentation:** This guide serves as task completion evidence
