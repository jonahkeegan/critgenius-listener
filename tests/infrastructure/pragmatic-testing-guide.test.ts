import { describe, expect, it, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const GUIDE_PATH = resolve(
  __dirname,
  '../../docs/pragmatic-infrastructure-testing-guide.md'
);
const MATRIX_PATH = resolve(
  __dirname,
  '../../docs/validation-test-decision-matrix.md'
);
const HELPERS_PATH = resolve(
  __dirname,
  '../../scripts/runtime-validation-helpers.mjs'
);

describe('pragmatic infrastructure testing guide validation', () => {
  let guideContent: string;
  let matrixContent: string;

  beforeAll(() => {
    expect(existsSync(GUIDE_PATH)).toBe(true);
    expect(existsSync(MATRIX_PATH)).toBe(true);
    expect(existsSync(HELPERS_PATH)).toBe(true);

    guideContent = readFileSync(GUIDE_PATH, 'utf8');
    matrixContent = readFileSync(MATRIX_PATH, 'utf8');

    expect(guideContent.length).toBeGreaterThan(0);
    expect(matrixContent.length).toBeGreaterThan(0);
  });

  describe('document structure', () => {
    it('contains all required sections', () => {
      const requiredSections = [
        '## 1. Executive Summary',
        "## 2. The Problem We're Solving",
        '## 3. Decision Framework',
        '## 4. Alternative Validation Strategies',
        '## 5. Consolidation Patterns',
        '## 6. Implementation Guidelines',
        '## 7. Real-World Examples from CritGenius',
        '## 8. Integration with Task Planning',
        '## 9. Quick Reference Decision Matrix',
        '## 10. Migration Path for Existing Tests',
      ];

      for (const section of requiredSections) {
        expect(guideContent, `Missing section: ${section}`).toContain(section);
      }
    });

    it('has table of contents with all sections', () => {
      expect(guideContent).toContain('## Table of Contents');
      expect(guideContent).toContain(
        '[1. Executive Summary](#1-executive-summary)'
      );
      expect(guideContent).toContain(
        "[2. The Problem We're Solving](#2-the-problem-were-solving)"
      );
      expect(guideContent).toContain(
        '[3. Decision Framework](#3-decision-framework)'
      );
    });

    it('includes version and metadata', () => {
      expect(guideContent).toContain('**Version:**');
      expect(guideContent).toContain('**Last Updated:**');
      expect(guideContent).toContain('**Status:**');
      expect(guideContent).toContain('**Target Audience:**');
    });
  });

  describe('decision framework', () => {
    it('contains mermaid flowchart', () => {
      expect(guideContent).toContain('```mermaid');
      expect(guideContent).toContain('flowchart TD');
      expect(guideContent).toMatch(/ValidationTest\[.*Validation Test.*\]/);
      expect(guideContent).toMatch(/RuntimeCheck\[.*Runtime Check.*\]/);
      expect(guideContent).toMatch(/CIScript\[.*CI Script.*\]/);
      expect(guideContent).toMatch(/DocumentOnly\[.*Document Only.*\]/);
    });

    it('defines all four validation strategies', () => {
      expect(guideContent).toContain('🟢 Validation Test');
      expect(guideContent).toContain('🔵 Runtime Check');
      expect(guideContent).toContain('🟡 CI Script');
      expect(guideContent).toContain('🟣 Document Only');
    });

    it('includes combined assessment matrix', () => {
      expect(guideContent).toContain(
        '| Drift History | Production Impact | Detection Difficulty | Recommendation |'
      );
      expect(guideContent).toContain(
        '| Yes | Critical | Any | **Validation Test** |'
      );
      expect(guideContent).toContain(
        '| No | Critical | Easy | **Runtime Check** |'
      );
    });
  });

  describe('code examples', () => {
    it('includes runtime validation helper examples', () => {
      expect(guideContent).toContain('validateConfigAtRuntime');
      expect(guideContent).toContain('assertRequiredEnvVars');
      expect(guideContent).toContain('detectConfigDrift');
    });

    it('shows proper TypeScript/JavaScript code blocks', () => {
      const tsCodeBlockCount = (guideContent.match(/```typescript/g) ?? [])
        .length;
      const jsCodeBlockCount = (guideContent.match(/```javascript/g) ?? [])
        .length;
      const bashCodeBlockCount = (guideContent.match(/```bash/g) ?? []).length;

      expect(tsCodeBlockCount).toBeGreaterThan(5);
      expect(jsCodeBlockCount).toBeGreaterThan(0);
      expect(bashCodeBlockCount).toBeGreaterThan(1);
    });

    it('includes shell script examples', () => {
      expect(guideContent).toContain('#!/usr/bin/env bash');
      expect(guideContent).toContain('set -euo pipefail');
      expect(guideContent).toContain('scripts/validate-package-structure.sh');
    });

    it('references actual project test files', () => {
      const referencedTests = [
        'test-naming-standards.test.ts',
        'coverage-orchestration.test.ts',
        'eslint-audit-validation.test.ts',
        'eslint-package-configs.validation.test.ts',
        'version-validation.test.mjs',
        'comprehensive-testing-guide.test.ts',
      ];

      for (const testFile of referencedTests) {
        expect(guideContent, `Missing reference to ${testFile}`).toContain(
          testFile
        );
      }
    });
  });

  describe('real-world examples', () => {
    it('analyzes actual test complexity', () => {
      expect(guideContent).toContain('486 lines');
      expect(guideContent).toContain('372 lines');
      expect(guideContent).toContain('22 lines');
    });

    it('provides specific line counts for tests', () => {
      expect(guideContent).toContain('27 infrastructure validation tests');
      expect(guideContent).toContain('5,194 lines of code');
    });

    it('includes consolidation examples', () => {
      expect(guideContent).toContain('Theme-Based Consolidation');
      expect(guideContent).toContain('Technology-Stack Consolidation');
      expect(guideContent).toContain('Thin Wrapper Pattern');
      expect(guideContent).toContain('Fixture-Free Validation');
    });
  });

  describe('referenced files', () => {
    it('references existing documentation', () => {
      const referencedDocs = [
        'comprehensive-testing-guide.md',
        'testing-standards.md',
        'integration-testing-standards.md',
        'validation-test-decision-matrix.md',
      ];

      for (const doc of referencedDocs) {
        expect(guideContent, `Missing reference to ${doc}`).toContain(doc);

        // Verify file exists
        const docPath = resolve(__dirname, '../../docs', doc);
        expect(
          existsSync(docPath),
          `Referenced file does not exist: ${doc}`
        ).toBe(true);
      }
    });

    it('references runtime validation helpers script', () => {
      expect(guideContent).toContain('scripts/runtime-validation-helpers.mjs');
      expect(existsSync(HELPERS_PATH)).toBe(true);
    });
  });

  describe('implementation guidelines', () => {
    it('provides clear guidelines', () => {
      expect(guideContent).toContain(
        'Guideline 1: Start with the Lightest Approach'
      );
      expect(guideContent).toContain(
        'Guideline 2: Prefer Runtime Checks for Critical Configs'
      );
      expect(guideContent).toContain('Guideline 3: Consolidate Before Adding');
      expect(guideContent).toContain('Guideline 4: Document Your Decision');
      expect(guideContent).toContain('Guideline 5: Review and Refactor');
      expect(guideContent).toContain('Guideline 6: Measure Value vs. Cost');
    });

    it('includes task planning integration', () => {
      expect(guideContent).toContain('During Task Implementation Planning');
      expect(guideContent).toContain('During Code Review');
      expect(guideContent).toContain('In Task Completion Reports');
    });
  });

  describe('appendices', () => {
    it('includes test assessment worksheet', () => {
      expect(guideContent).toContain(
        '## Appendix A: Test Assessment Worksheet'
      );
      expect(guideContent).toContain('### Drift History');
      expect(guideContent).toContain('### Production Impact');
      expect(guideContent).toContain('### Detection Difficulty');
    });

    it('includes code review checklist', () => {
      expect(guideContent).toContain('## Appendix B: Code Review Checklist');
      expect(guideContent).toContain('**Validation Strategy:**');
      expect(guideContent).toContain('**If Validation Test Created:**');
      expect(guideContent).toContain('**If Runtime Check Created:**');
    });

    it('includes antipatterns', () => {
      expect(guideContent).toContain(
        '## Appendix C: Common Antipatterns to Avoid'
      );
      expect(guideContent).toContain('Antipattern 1: Automatic Test Creation');
      expect(guideContent).toContain(
        'Antipattern 2: Testing Implementation Details'
      );
    });
  });

  describe('decision matrix document', () => {
    it('exists and is complete', () => {
      expect(existsSync(MATRIX_PATH)).toBe(true);
      expect(matrixContent.length).toBeGreaterThan(1000);
    });

    it('contains flowchart', () => {
      expect(matrixContent).toContain('```mermaid');
      expect(matrixContent).toContain('flowchart TD');
    });

    it('includes quick decision table', () => {
      expect(matrixContent).toContain('## Quick Decision Table');
      expect(matrixContent).toContain(
        '| Drift History | Production Impact | Detection Difficulty | Recommendation |'
      );
    });

    it('provides common scenarios', () => {
      expect(matrixContent).toContain('### Scenario 1: New ESLint Rule');
      expect(matrixContent).toContain(
        '### Scenario 2: Monorepo Version Consistency'
      );
      expect(matrixContent).toContain('### Scenario 3: Environment Variables');
    });

    it('links back to main guide', () => {
      expect(matrixContent).toContain(
        'pragmatic-infrastructure-testing-guide.md'
      );
    });
  });

  describe('runtime validation helpers', () => {
    it('exports expected functions', async () => {
      const helpers = await import(
        '../../scripts/runtime-validation-helpers.mjs'
      );

      expect(helpers.validateConfigAtRuntime).toBeDefined();
      expect(helpers.assertRequiredEnvVars).toBeDefined();
      expect(helpers.detectConfigDrift).toBeDefined();
      expect(helpers.assertRequiredFiles).toBeDefined();
      expect(helpers.assertFilesNotExist).toBeDefined();
      expect(helpers.createValidator).toBeDefined();
    });

    it('has corresponding test file', () => {
      const testPath = resolve(
        __dirname,
        './runtime-validation-helpers.test.ts'
      );
      expect(existsSync(testPath)).toBe(true);
    });
  });

  describe('content quality', () => {
    it('addresses user concerns', () => {
      expect(guideContent).toContain(
        'spending time maintaining tests that rarely catch real issues'
      );
      expect(guideContent).toContain('proven history of configuration drift');
    });

    it('provides actionable recommendations', () => {
      expect(guideContent).toContain('Create validation tests only when');
      expect(guideContent).toContain('Start with the lightest approach');
      expect(guideContent).toContain('Document your decision');
    });

    it('includes migration path', () => {
      expect(guideContent).toContain(
        '## 10. Migration Path for Existing Tests'
      );
      expect(guideContent).toContain('Phase 1: Assessment');
      expect(guideContent).toContain('Phase 2: Quick Wins');
      expect(guideContent).toContain('Phase 3: Consolidation');
      expect(guideContent).toContain('Phase 4: Evaluation');
    });

    it('balances concerns appropriately', () => {
      expect(guideContent).toContain('Primary: Prevent production issues');
      expect(guideContent).toContain(
        'Secondary: Minimize test maintenance burden'
      );
      expect(guideContent).toContain('Tertiary: Catch infrastructure drift');
    });
  });

  describe('cross-references', () => {
    it('links to related documentation', () => {
      expect(guideContent).toContain('## Related Documentation');
      expect(guideContent).toContain('[Comprehensive Testing Guide]');
      expect(guideContent).toContain('[Testing Standards]');
      expect(guideContent).toContain('[Integration Testing Standards]');
    });

    it('maintains consistent terminology', () => {
      // Core terms should appear multiple times
      const coreTerms = [
        'drift',
        'validation test',
        'runtime check',
        'CI script',
        'maintenance burden',
      ];

      for (const term of coreTerms) {
        const regex = new RegExp(term, 'gi');
        const matches = guideContent.match(regex);
        expect(
          matches?.length,
          `Term "${term}" should appear multiple times`
        ).toBeGreaterThan(3);
      }
    });
  });

  describe('version history', () => {
    it('includes version history section', () => {
      expect(guideContent).toContain('## Version History');
      expect(guideContent).toContain('| Version | Date | Changes |');
      expect(guideContent).toContain('| 1.0.0 | 2025-10-21 |');
    });
  });

  describe('summary and key principles', () => {
    it('includes summary section', () => {
      expect(guideContent).toContain('## Summary');
      expect(guideContent).toContain('**Key Principles:**');
    });

    it('emphasizes pragmatic approach', () => {
      expect(guideContent).toContain(
        'production reliability with minimal test maintenance burden'
      );
      expect(guideContent).toContain(
        'chosen deliberately based on evidence, not habit'
      );
    });
  });
});
