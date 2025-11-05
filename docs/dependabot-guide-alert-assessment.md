# Dependabot Alert Assessment Playbook

**Source**: Extracted from `docs/dependabot-guide.md` (Version 2.1)

This playbook covers Phase 1 of the GitHub Dependabot alert validation lifecycle. Use it after
reviewing the [Dependabot Alert Validation Quick Start](./dependabot-guide-quick-start.md).

---

## Phase 1: Alert Assessment

### Workflow Overview

```sequenceDiagram
participant AI as AI Assistant
participant Alert as Dependabot Alert
participant PackageMgr as Package Manager
participant Analyzer as Analysis Engine
participant DocStore as Documentation

AI->>Alert: Retrieve alert metadata
Alert-->>AI: Return CVE, GHSA, severity, EPSS
AI->>PackageMgr: Query current package version
PackageMgr-->>AI: Return version info
AI->>PackageMgr: Get dependency tree
PackageMgr-->>AI: Return full dependency chain
AI->>Analyzer: Analyze impact scope
Analyzer->>Analyzer: Assess dependency type
Analyzer->>Analyzer: Check production exposure
Analyzer->>Analyzer: Evaluate exploitability
Analyzer-->>AI: Return impact assessment
AI->>DocStore: Record alert analysis
DocStore-->>AI: Confirm documentation
AI->>AI: Calculate priority score
AI->>AI: Determine action timeline
```

### Step 1.1: Retrieve Alert Details

**Objective**: Gather comprehensive information about the security vulnerability.

**AI Execution Instructions:**

```bash
# Retrieve alert via GitHub CLI
gh api repos/:owner/:repo/dependabot/alerts/[alert-number] > alert-details.json

# Extract key information
jq '.security_advisory | {ghsa_id, cve_id, severity, summary, description}' alert-details.json
jq '.security_vulnerability | {package, vulnerable_version_range, first_patched_version}' alert-details.json
```

**Information to Extract:**

| Field                      | Description                 | Example Value       |
| -------------------------- | --------------------------- | ------------------- |
| `ghsa_id`                  | GitHub Security Advisory ID | GHSA-xxxx-xxxx-xxxx |
| `cve_id`                   | Common Vulnerabilities ID   | CVE-2025-xxxxx      |
| `severity`                 | Alert severity level        | moderate            |
| `cvss_score`               | CVSS base score             | 5.3                 |
| `epss_score`               | Exploit probability         | 0.04%               |
| `package.name`             | Affected package            | vite                |
| `vulnerable_version_range` | Affected versions           | >=5.2.6, <=5.4.20   |
| `first_patched_version`    | Minimum safe version        | 5.4.21              |
| `dependency_scope`         | Runtime or development      | development         |

**Success Criteria:**

- ✅ Alert details retrieved successfully
- ✅ All required fields populated
- ✅ EPSS score obtained (if available)

### Step 1.2: Verify Current Installation

**Objective**: Confirm which version is currently installed and how it's included.

```sequenceDiagram
participant AI as AI Assistant
participant PackageMgr as Package Manager
participant LockFile as Lock File
participant Validator as Validator

AI->>PackageMgr: Check installed version
PackageMgr-->>AI: Return version info
AI->>PackageMgr: Get dependency chain
PackageMgr-->>AI: Return full tree
AI->>LockFile: Verify lock file state
LockFile-->>AI: Return integrity check
AI->>Validator: Validate dependency type
Validator->>Validator: Check if direct/transitive
Validator->>Validator: Determine dependency scope
Validator-->>AI: Return classification
AI->>AI: Document current state
```

**AI Execution Instructions:**

```bash
# For pnpm
pnpm list vite --json > current-version.json
pnpm why vite > dependency-chain.txt

# For npm
npm ls vite --json > current-version.json
npm explain vite > dependency-chain.txt

# Extract version
jq -r '.dependencies.vite.version // .devDependencies.vite.version' current-version.json
```

**Classification Logic:**

```typescript
interface DependencyClassification {
  isDirect: boolean; // Listed in package.json
  isTransitive: boolean; // Inherited from parent
  scope: 'production' | 'development';
  parentPackages: string[];
}

// Example for Vite
const classification: DependencyClassification = {
  isDirect: false,
  isTransitive: true,
  scope: 'development',
  parentPackages: ['vitest', '@vitest/ui', '@vitest/coverage-v8'],
};
```

**Success Criteria:**

- ✅ Current version confirmed
- ✅ Dependency type classified
- ✅ Parent packages identified (if transitive)
- ✅ Scope determined (production vs dev)

### Step 1.3: Research Vulnerability Details

**Objective**: Understand the technical nature and real-world impact of the vulnerability.

```sequenceDiagram
participant AI as AI Assistant
participant Advisory as Security Advisory
participant NVD as NVD Database
participant ReleaseNotes as Package Release Notes
participant KnowledgeBase as Internal KB

AI->>Advisory: Fetch GitHub Advisory
Advisory-->>AI: Return technical details
AI->>NVD: Query CVE database
NVD-->>AI: Return CVSS breakdown
AI->>ReleaseNotes: Read patch release notes
ReleaseNotes-->>AI: Return fix details
AI->>AI: Synthesize attack vector
AI->>AI: Assess exploitability conditions
AI->>KnowledgeBase: Check for similar issues
KnowledgeBase-->>AI: Return historical context
AI->>AI: Generate risk profile
```

**AI Execution Instructions:**

```bash
# Fetch GitHub Advisory
gh api advisories/[GHSA-ID] > advisory-full.json

# Query NVD (if CVE available)
curl "https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=[CVE-ID]" > nvd-details.json

# Review package release notes
gh api repos/vitejs/vite/releases > vite-releases.json
jq '.[] | select(.tag_name | contains("5.4.21"))' vite-releases.json
```

**Key Details for Vite Example:**

```yaml
vulnerability_profile:
  root_cause: 'Improper backslash handling in URL paths on Windows'
  attack_vector: "curl --request-target /.env\ http://localhost:5173"
  prerequisites:
    - Windows operating system
    - Dev server exposed with --host flag
    - Target files in server.fs.deny patterns
  affected_files:
    - .env files
    - Certificate files (*.crt, *.pem)
    - Any patterns in server.fs.deny
  fix_mechanism: 'Path normalization for Windows compatibility'
  breaking_changes: 'None identified'
```

**Success Criteria:**

- ✅ Attack vector understood
- ✅ Prerequisites documented
- ✅ Fix mechanism confirmed
- ✅ Breaking changes identified

---

## Related Documentation

- [Dependabot Alert Validation Quick Start](./dependabot-guide-quick-start.md)
- [Dependabot Risk Analysis Framework](./dependabot-guide-risk-analysis.md)
- [Dependabot Implementation Strategy Guide](./dependabot-guide-implementation.md)
