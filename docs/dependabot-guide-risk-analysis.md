# Dependabot Risk Analysis Framework

**Source**: Extracted from `docs/dependabot-guide.md` (Version 2.1)

Use this framework after completing
[Phase 1: Alert Assessment](./dependabot-guide-alert-assessment.md) to determine priority and
implementation strategy readiness.

---

## Phase 2: Risk Analysis

### Workflow Overview

```sequenceDiagram
participant AI as AI Assistant
participant RiskAnalyzer as Risk Analyzer
participant ImpactAssessor as Impact Assessor
participant DecisionEngine as Decision Engine
participant Stakeholders as Stakeholders

AI->>RiskAnalyzer: Submit vulnerability data
RiskAnalyzer->>RiskAnalyzer: Calculate CVSS impact
RiskAnalyzer->>RiskAnalyzer: Assess EPSS probability
RiskAnalyzer->>RiskAnalyzer: Evaluate attack surface
RiskAnalyzer-->>AI: Return risk metrics

AI->>ImpactAssessor: Analyze business impact
ImpactAssessor->>ImpactAssessor: Check production exposure
ImpactAssessor->>ImpactAssessor: Assess dev environment risk
ImpactAssessor->>ImpactAssessor: Calculate downtime risk
ImpactAssessor-->>AI: Return impact analysis

AI->>DecisionEngine: Submit for decision
DecisionEngine->>DecisionEngine: Apply risk matrix
DecisionEngine->>DecisionEngine: Calculate weighted score
DecisionEngine->>DecisionEngine: Determine priority
DecisionEngine-->>AI: Return priority level

alt High Priority
    AI->>Stakeholders: Notify immediate action
    Stakeholders-->>AI: Acknowledge
    AI->>AI: Proceed to implementation
else Low Priority
    AI->>AI: Schedule for batch processing
    AI->>Stakeholders: Report in summary
end
```

### Step 2.1: Calculate Risk Score

**Objective**: Quantify the risk using a weighted scoring system.

**Risk Assessment Matrix:**

```typescript
interface RiskFactors {
  cvss_severity: number; // 1-5 scale
  epss_exploitability: number; // 1-5 scale
  dependency_scope: number; // 1-5 scale (prod=5, dev=2)
  production_impact: number; // 1-5 scale
  attack_complexity: number; // 1-5 scale (low=5, high=1)
}

interface RiskWeights {
  cvss_severity: number; // weight: 0.30
  epss_exploitability: number; // weight: 0.25
  dependency_scope: number; // weight: 0.20
  production_impact: number; // weight: 0.15
  attack_complexity: number; // weight: 0.10
}

function calculateRiskScore(factors: RiskFactors, weights: RiskWeights): number {
  return (
    factors.cvss_severity * weights.cvss_severity +
    factors.epss_exploitability * weights.epss_exploitability +
    factors.dependency_scope * weights.dependency_scope +
    factors.production_impact * weights.production_impact +
    factors.attack_complexity * weights.attack_complexity
  );
}
```

**Vite Example Calculation:**

| Factor                         | Score (1-5) | Weight | Weighted |
| ------------------------------ | ----------- | ------ | -------- |
| CVSS Severity (5.3 = Moderate) | 3           | 0.30   | 0.90     |
| EPSS (0.04% = Very Low)        | 1           | 0.25   | 0.25     |
| Dependency Scope (Dev)         | 2           | 0.20   | 0.40     |
| Production Impact (None)       | 1           | 0.15   | 0.15     |
| Attack Complexity (High)       | 2           | 0.10   | 0.20     |
| **Total Risk Score**           |             |        | **1.90** |

**Risk Level Classification:**

- **4.0 - 5.0**: Critical (Immediate action)
- **3.0 - 3.9**: High (24-72 hours)
- **2.0 - 2.9**: Moderate (1 week)
- **1.0 - 1.9**: Low (2 weeks, can batch)

**AI Decision Logic:**

```typescript
function determinePriority(riskScore: number): Priority {
  if (riskScore >= 4.0) return Priority.CRITICAL;
  if (riskScore >= 3.0) return Priority.HIGH;
  if (riskScore >= 2.0) return Priority.MODERATE;
  return Priority.LOW;
}

// Vite example result: Priority.LOW
```

**Success Criteria:**

- ✅ Risk score calculated
- ✅ Priority level assigned
- ✅ SLA timeline determined

### Step 2.2: Evaluate Update Complexity

**Objective**: Assess the technical complexity and risk of implementing the fix.

```sequenceDiagram
participant AI as AI Assistant
participant CompatChecker as Compatibility Checker
participant ChangeAnalyzer as Change Analyzer
participant StrategyEngine as Strategy Engine

AI->>CompatChecker: Check version compatibility
CompatChecker->>CompatChecker: Compare semver ranges
CompatChecker->>CompatChecker: Check parent package support
CompatChecker-->>AI: Return compatibility matrix

AI->>ChangeAnalyzer: Analyze version differences
ChangeAnalyzer->>ChangeAnalyzer: Review CHANGELOG
ChangeAnalyzer->>ChangeAnalyzer: Identify breaking changes
ChangeAnalyzer->>ChangeAnalyzer: Assess API modifications
ChangeAnalyzer-->>AI: Return change impact

AI->>StrategyEngine: Determine update strategy
StrategyEngine->>StrategyEngine: Evaluate options
StrategyEngine->>StrategyEngine: Score each approach
StrategyEngine-->>AI: Return recommended strategy

alt Direct Update Available
    AI->>AI: Plan direct dependency update
else Parent Update Needed
    AI->>AI: Plan parent package update
else Override Required
    AI->>AI: Plan version override
end
```

**Version Difference Analysis:**

```bash
# Compare versions
npm view vite@5.4.20 --json > v5.4.20.json
npm view vite@5.4.21 --json > v5.4.21.json

# Check parent package compatibility
npm view vitest@3.2.4 peerDependencies > vitest-peers.json
```

**Update Strategy Decision Tree:**

```typescript
enum UpdateStrategy {
  DIRECT_UPGRADE = 'direct_upgrade', // Best: Update direct dependency
  PARENT_UPGRADE = 'parent_upgrade', // Good: Update parent package
  VERSION_OVERRIDE = 'version_override', // Acceptable: Force version
  DIRECT_ADDITION = 'direct_addition', // Last resort: Add as direct dep
}

interface StrategyAssessment {
  strategy: UpdateStrategy;
  pros: string[];
  cons: string[];
  complexity: 'low' | 'medium' | 'high';
  maintainability: 'excellent' | 'good' | 'fair' | 'poor';
  recommendationScore: number;
}

// Vite example: Transitive dependency
const strategies: StrategyAssessment[] = [
  {
    strategy: UpdateStrategy.PARENT_UPGRADE,
    pros: ['Most maintainable', 'No overrides', 'Follows semver'],
    cons: ['May not be released yet', 'Could introduce other changes'],
    complexity: 'low',
    maintainability: 'excellent',
    recommendationScore: 9,
  },
  {
    strategy: UpdateStrategy.VERSION_OVERRIDE,
    pros: ['Quick fix', 'Precise control', 'Minimal changes'],
    cons: ['Requires maintenance', 'May conflict later', 'Needs removal plan'],
    complexity: 'low',
    maintainability: 'fair',
    recommendationScore: 7,
  },
  {
    strategy: UpdateStrategy.DIRECT_ADDITION,
    pros: ['Explicit control', 'Forces hoisting'],
    cons: ['May conflict with parent', 'Cleanup required later'],
    complexity: 'low',
    maintainability: 'good',
    recommendationScore: 6,
  },
];

// Selection logic
const selectedStrategy = strategies.sort(
  (a, b) => b.recommendationScore - a.recommendationScore
)[0];
```

**Success Criteria:**

- ✅ Update strategy selected
- ✅ Compatibility verified
- ✅ Breaking changes assessed
- ✅ Complexity level determined

### Step 2.3: Plan Rollback Strategy

**Objective**: Ensure a safe reversion path exists before proceeding.

```sequenceDiagram
participant AI as AI Assistant
participant VersionControl as Git
participant PackageManager as Package Manager
participant BackupStore as Backup Store

AI->>VersionControl: Create feature branch
VersionControl-->>AI: Branch created
AI->>PackageManager: Record current state
PackageManager-->>AI: Current package.json & lock file
AI->>BackupStore: Store pre-change snapshot
BackupStore-->>AI: Snapshot ID created
AI->>AI: Document rollback commands
AI->>AI: Define success/failure criteria
AI->>AI: Set rollback triggers
```

**Rollback Preparation Checklist:**

```bash
# 1. Create feature branch
git checkout -b security/vite-5.4.21-upgrade
git push -u origin security/vite-5.4.21-upgrade

# 2. Backup current state
cp package.json package.json.backup
cp pnpm-lock.yaml pnpm-lock.yaml.backup

# 3. Document rollback commands
cat > ROLLBACK.md << 'EOF'
# Rollback Instructions

## If tests fail:
git checkout package.json package.json.backup
cp pnpm-lock.yaml.backup pnpm-lock.yaml
pnpm install
pnpm test

## If deployed and issues found:
git revert <commit-sha>
git push origin main
EOF
```

**Rollback Trigger Conditions:**

```typescript
interface RollbackTriggers {
  buildFailure: boolean; // Build fails after update
  testFailures: number; // Critical test failures
  performanceDegradation: number; // >20% performance drop
  productionErrors: boolean; // Errors in production
  userImpact: boolean; // User-facing issues
}

function shouldRollback(triggers: RollbackTriggers): boolean {
  return (
    triggers.buildFailure ||
    triggers.testFailures > 0 ||
    triggers.performanceDegradation > 20 ||
    triggers.productionErrors ||
    triggers.userImpact
  );
}
```

**Success Criteria:**

- ✅ Feature branch created
- ✅ Current state backed up
- ✅ Rollback commands documented
- ✅ Trigger conditions defined

---

## Related Documentation

- [Dependabot Alert Assessment Playbook](./dependabot-guide-alert-assessment.md)
- [Dependabot Implementation Strategy Guide](./dependabot-guide-implementation.md)
- [Dependabot Alert Validation Quick Start](./dependabot-guide-quick-start.md)
