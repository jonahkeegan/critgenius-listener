# Dependabot Implementation Strategy Guide

**Source**: Extracted from `docs/dependabot-guide.md` (Version 2.1)

Use this guide after completing [Phase 2: Risk Analysis](./dependabot-guide-risk-analysis.md) to
execute and validate the selected remediation path.

---

## Phase 3: Implementation Strategy

### Workflow Overview

```sequenceDiagram
participant AI as AI Assistant
participant PackageManager as Package Manager
participant LockFile as Lock File
participant Validator as Validator
participant Git as Version Control

AI->>PackageManager: Select update method
alt Method 1: Parent Package Update
    PackageManager->>PackageManager: Update parent packages
    PackageManager-->>AI: Parent packages updated
else Method 2: Version Override
    AI->>PackageManager: Configure override
    PackageManager->>PackageManager: Apply override
    PackageManager-->>AI: Override configured
else Method 3: Direct Addition
    AI->>PackageManager: Add as direct dependency
    PackageManager->>PackageManager: Install package
    PackageManager-->>AI: Package added
end

AI->>PackageManager: Run install
PackageManager->>LockFile: Update lock file
LockFile-->>PackageManager: Lock file updated
PackageManager-->>AI: Installation complete

AI->>Validator: Verify installation
Validator->>Validator: Check version resolution
Validator->>Validator: Verify no duplicates
Validator-->>AI: Validation complete

AI->>Git: Stage changes
Git-->>AI: Changes staged
AI->>Git: Create commit
Git-->>AI: Commit created
```

### Method 1: Update Parent Dependencies (Preferred)

**When to Use:**

- Parent packages have versions supporting the patched dependency
- No major version changes required
- Minimal side effects expected

**Implementation Sequence:**

```sequenceDiagram
participant AI as AI Assistant
participant Registry as Package Registry
participant PackageManager as Package Manager
participant TestRunner as Test Runner

AI->>Registry: Check parent package versions
Registry-->>AI: Return available versions
AI->>AI: Analyze compatibility
AI->>PackageManager: Update parent packages
Note over PackageManager: pnpm update vitest @vitest/ui @vitest/coverage-v8 --latest
PackageManager->>PackageManager: Resolve dependencies
PackageManager->>PackageManager: Update lock file
PackageManager-->>AI: Update complete
AI->>PackageManager: Verify vite version
PackageManager-->>AI: Confirm vite@5.4.21+
AI->>TestRunner: Run smoke tests
TestRunner-->>AI: Tests pass
```

**AI Execution Commands:**

```bash
# Step 1: Check for updates
pnpm outdated vitest @vitest/ui @vitest/coverage-v8

# Step 2: Update packages
pnpm update vitest @vitest/ui @vitest/coverage-v8 --latest

# Step 3: Verify vite version
pnpm list vite

# Expected output:
# vite 5.4.21 (or higher)

# Step 4: Run smoke tests
pnpm build
pnpm test --run
```

**Validation Logic:**

```typescript
async function validateParentUpdate(): Promise<boolean> {
  // Check vite version
  const viteVersion = await getInstalledVersion('vite');
  if (!satisfies(viteVersion, '>=5.4.21')) {
    return false;
  }

  // Verify no duplicate resolutions
  const viteResolutions = await getDependencyResolutions('vite');
  if (viteResolutions.length > 1) {
    return false;
  }

  // Run build
  const buildSuccess = await runCommand('pnpm build');
  if (!buildSuccess) {
    return false;
  }

  return true;
}
```

**Success Criteria:**

- ✅ Parent packages updated successfully
- ✅ Vite resolves to 5.4.21+
- ✅ No duplicate versions
- ✅ Build succeeds
- ✅ Smoke tests pass

### Method 2: Version Override (Quick Fix)

**When to Use:**

- Parent packages don't yet support patched version
- Need immediate security fix
- Temporary solution until parent packages update

**Implementation Sequence:**

```sequenceDiagram
participant AI as AI Assistant
participant PackageJSON as package.json
participant PackageManager as Package Manager
participant LockFile as Lock File
participant Validator as Validator

AI->>PackageJSON: Add pnpm.overrides
Note over PackageJSON: "vite@>=5.2.6 <=5.4.20": "5.4.21"
PackageJSON-->>AI: Configuration updated
AI->>PackageManager: Run install
PackageManager->>PackageManager: Apply overrides
PackageManager->>LockFile: Update resolutions
LockFile-->>PackageManager: Resolutions updated
PackageManager-->>AI: Install complete
AI->>Validator: Verify override applied
Validator->>Validator: Check vite version
Validator->>Validator: Confirm single resolution
Validator-->>AI: Override successful
AI->>AI: Document removal plan
```

**AI Execution Commands:**

```bash
# Step 1: Edit package.json (use jq for programmatic edit)
jq '.pnpm.overrides += {"vite@>=5.2.6 <=5.4.20": "5.4.21"}' package.json > package.json.tmp
mv package.json.tmp package.json

# Or manual edit:
# Add to package.json:
{
  "pnpm": {
    "overrides": {
      "vite@>=5.2.6 <=5.4.20": "5.4.21"
    }
  }
}

# Step 2: Install with override
pnpm install

# Step 3: Verify
pnpm list vite --depth=Infinity | grep vite | sort -u

# Should show only:
# vite@5.4.21
```

**Override Documentation Template:**

```json
{
  "pnpm": {
    "overrides": {
      // CVE-2025-XXXXX: Vite server.fs.deny bypass on Windows
      // GitHub Issue: https://github.com/jonahkeegan/critgenius-listener/security/dependabot/8
      // Temporary until vitest >= 3.3.0 is released (hypothetical)
      // Removal criteria:
      //   - vitest explicitly requires vite >=5.4.21
      //   - All transitive dependencies updated
      // Review date: 2026-01-20
      "vite@>=5.2.6 <=5.4.20": "5.4.21"
    }
  }
}
```

**Removal Plan Tracking:**

```typescript
interface OverrideRemovalPlan {
  package: string;
  overrideVersion: string;
  reason: string;
  criteria: string[];
  reviewDate: Date;
  issueUrl: string;
}

const removalPlan: OverrideRemovalPlan = {
  package: 'vite',
  overrideVersion: '5.4.21',
  reason: 'CVE-2025-XXXXX security fix',
  criteria: [
    'vitest >=3.3.0 released',
    'vitest requires vite >=5.4.21',
    'All transitive deps updated',
  ],
  reviewDate: new Date('2026-01-20'),
  issueUrl: 'https://github.com/.../security/dependabot/8',
};
```

**Success Criteria:**

- ✅ Override configured in package.json
- ✅ Single vite resolution to 5.4.21+
- ✅ Build succeeds
- ✅ Removal plan documented
- ✅ Review date set

### Method 3: Direct Dependency Addition

**When to Use:**

- Want explicit control over version
- Parent packages are compatible with new version
- Prefer hoisting over overrides
- Team policy allows direct specification

**Implementation Sequence:**

```sequenceDiagram
participant AI as AI Assistant
participant PackageManager as Package Manager
participant Hoisting as Hoisting Engine
participant Validator as Validator

AI->>PackageManager: Add vite as dev dependency
Note over PackageManager: pnpm add -D vite@^5.4.21
PackageManager->>PackageManager: Install package
PackageManager->>Hoisting: Resolve dependencies
Hoisting->>Hoisting: Hoist to workspace root
Hoisting-->>PackageManager: Hoisted successfully
PackageManager-->>AI: Installation complete
AI->>Validator: Verify hoisting
Validator->>Validator: Check vite resolution
Validator->>Validator: Confirm single version
Validator-->>AI: Hoisting confirmed
AI->>AI: Document cleanup procedure
```

**AI Execution Commands:**

```bash
# Step 1: Add as direct dev dependency
pnpm add -D vite@^5.4.21

# Step 2: Verify hoisting
pnpm why vite

# Expected output showing single resolution:
# vite 5.4.21
# └─┬ vitest 3.2.4
#   └── vite 5.4.21 (satisfied by direct dependency)

# Step 3: Check for duplicates
pnpm list vite --depth=Infinity
```

**Cleanup Procedure:**

```bash
# When parent packages eventually update:

# Step 1: Check if still needed
pnpm outdated vitest @vitest/ui @vitest/coverage-v8

# Step 2: Update parents
pnpm update vitest @vitest/ui @vitest/coverage-v8 --latest

# Step 3: Remove direct dependency
pnpm remove vite

# Step 4: Verify transitive resolution
pnpm list vite
# Should still show 5.4.21+ from parent packages
```

**Success Criteria:**

- ✅ Vite added as direct dev dependency
- ✅ Single version resolution
- ✅ Hoisting confirmed
- ✅ Cleanup procedure documented

### Step 3.4: Verify Changes and Create Commit

**Objective**: Validate the implementation and document changes with a comprehensive commit message.

```sequenceDiagram
participant AI as AI Assistant
participant BuildSystem as Build System
participant TestRunner as Test Runner
participant Git as Git
participant CommitValidator as Commit Validator

AI->>BuildSystem: Run build
BuildSystem->>BuildSystem: Compile and bundle
BuildSystem-->>AI: Build result

alt Build successful
    AI->>TestRunner: Run test suite
    TestRunner->>TestRunner: Execute tests
    TestRunner-->>AI: Test results

    alt Tests pass
        AI->>AI: Generate commit message
        AI->>Git: Stage changes
        Git-->>AI: Files staged
        AI->>CommitValidator: Validate commit message
        CommitValidator->>CommitValidator: Check conventional format
        CommitValidator->>CommitValidator: Verify completeness
        CommitValidator-->>AI: Validation passed
        AI->>Git: Create commit
        Git-->>AI: Commit created
        AI->>Git: Push to feature branch
        Git-->>AI: Push successful
    else Tests fail
        AI->>AI: Initiate rollback procedure
    end
else Build fails
    AI->>AI: Initiate rollback procedure
end
```

**AI Execution Commands:**

```bash
# Step 1: Run build
pnpm build

# Step 2: Run test suite
pnpm test --run

# Step 3: If successful, stage and commit
git add package.json pnpm-lock.yaml

# Step 4: Create commit with detailed message
git commit -m "fix(security): upgrade vite to 5.4.21 to address CVE-2025-XXXXX

Addresses server.fs.deny bypass vulnerability on Windows.

Impact:
- Scope: Development environment only
- Risk: Low (Windows-specific, requires --host flag)
- Method: [pnpm override|parent update|direct addition]
- Breaking Changes: None

Changes:
- vite: 5.4.20 → 5.4.21
- [Other affected packages if any]

Validation:
- ✅ Build succeeds
- ✅ Tests pass
- ✅ Version verified
- ✅ No duplicates

Closes: #8
Refs: GHSA-XXXX-XXXX-XXXX, CVE-2025-XXXXX"

# Step 5: Push to remote
git push origin security/vite-5.4.21-upgrade
```

**Commit Message Template:**

```
fix(security): upgrade <package> to <version> to address <CVE/GHSA>

<Brief description of vulnerability>

Impact:
- Scope: <production|development|both>
- Risk: <Critical|High|Moderate|Low>
- Method: <update strategy used>
- Breaking Changes: <None|List changes>

Changes:
- <package>: <old-version> → <new-version>
- <additional changes>

Validation:
- ✅ Build succeeds
- ✅ Tests pass
- ✅ Version verified
- ✅ No duplicates

Closes: #<issue-number>
Refs: <GHSA-ID>, <CVE-ID>
```

**Success Criteria:**

- ✅ Build completes successfully
- ✅ All tests pass
- ✅ Changes staged correctly
- ✅ Commit message follows conventional format
- ✅ Commit created successfully
- ✅ Pushed to remote branch

---

## Related Documentation

- [Dependabot Risk Analysis Framework](./dependabot-guide-risk-analysis.md)
- [Dependabot Alert Assessment Playbook](./dependabot-guide-alert-assessment.md)
- [Dependabot Alert Validation Quick Start](./dependabot-guide-quick-start.md)
