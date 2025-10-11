import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Performance Architecture Analysis (Task 3.1.4.5.1)', () => {
  const analysisPath = resolve(
    __dirname,
    '../../docs/performance-architecture-analysis.md'
  );
  let analysisContent: string;

  it('should have performance architecture analysis document', () => {
    expect(() => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
    }).not.toThrow();
  });

  describe('Document Structure', () => {
    it('should contain executive summary', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('## Executive Summary');
      expect(analysisContent).toContain('Key Finding:');
    });

    it('should document current architecture overview', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('## 1. Current Architecture Overview');
      expect(analysisContent).toContain('### 1.1 Component Inventory');
      expect(analysisContent).toContain('### 1.2 File Dependency Map');
    });

    it('should include data flow analysis', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('## 2. Data Flow Analysis');
      expect(analysisContent).toContain('### 2.1 Test Execution Flow');
      expect(analysisContent).toContain('### 2.2 Comparison/Regression Flow');
      expect(analysisContent).toContain('### 2.3 Report Generation Flow');
    });

    it('should analyze coupling points', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('## 3. Coupling Analysis');
      expect(analysisContent).toContain('### 3.1 Identified Coupling Points');
      expect(analysisContent).toContain(
        '### 3.2 Separation of Concerns Assessment'
      );
    });

    it('should include integration test insights', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain(
        '## 4. Integration Test Insights (Task 3.1.4)'
      );
      expect(analysisContent).toContain(
        '### 4.1 Patterns Learned from Integration Testing'
      );
      expect(analysisContent).toContain('### 4.2 Comparative Analysis');
    });

    it('should analyze pain points', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('## 5. Pain Points Analysis');
      expect(analysisContent).toContain(
        '### 5.1 Documented Issues from Task 3.1.3'
      );
      expect(analysisContent).toContain('### 5.2 Potential Future Pain Points');
    });

    it('should review proposed decoupling enhancement', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain(
        '## 6. Proposed Decoupling Enhancement Review'
      );
      expect(analysisContent).toContain('### 6.1 Original Proposal');
      expect(analysisContent).toContain('### 6.2 Decoupling Analysis');
    });

    it('should provide recommendations', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('## 7. Recommendations');
      expect(analysisContent).toContain('### 7.1 Primary Recommendation:');
      expect(analysisContent).toContain('### 7.2 Documentation Enhancements');
      expect(analysisContent).toContain('### 7.3 Re-Evaluation Triggers');
    });

    it('should have conclusion section', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('## 8. Conclusion');
      expect(analysisContent).toContain('### 8.1 Summary of Findings');
      expect(analysisContent).toContain('### 8.2 Decision Recommendation');
      expect(analysisContent).toContain('### 8.3 Next Steps for Task 3.1.4.5');
    });
  });

  describe('Content Quality', () => {
    it('should reference all core performance scripts', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('run-tests.mjs');
      expect(analysisContent).toContain('compare-performance.mjs');
      expect(analysisContent).toContain('metrics-runner.mjs');
      expect(analysisContent).toContain('establish-baseline.mjs');
      expect(analysisContent).toContain('generate-report.mjs');
    });

    it('should reference shared utilities', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('@critgenius/test-utils/performance');
      expect(analysisContent).toContain('BaselineManager');
      expect(analysisContent).toContain('detectRegression');
    });

    it('should include sequence diagrams', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('```sequenceDiagram');
      // Should have at least one sequence diagram in component inventory
      expect(
        analysisContent.match(/```sequenceDiagram/g)?.length
      ).toBeGreaterThan(0);
    });

    it('should document data flow patterns', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('data flow');
      expect(analysisContent).toMatch(/CLI.*→.*run-tests/i);
    });

    it('should assess coupling severity levels', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('Severity:');
      expect(analysisContent).toMatch(
        /\*\*Severity:\*\*\s*(Low|Minimal|Medium|High)/
      );
    });

    it('should reference Task 3.1.3 completion report', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('task-completion-reports/2025-10-05');
      expect(analysisContent).toContain('Task 3.1.3');
    });

    it('should reference Task 3.1.4 completion report', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('task-completion-reports/2025-10-10');
      expect(analysisContent).toContain('Task 3.1.4');
    });

    it('should document decision recommendation', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toMatch(/(DEFER|PROCEED|INCREMENTAL)/i);
      expect(analysisContent).toContain('Reasoning:');
    });

    it('should define re-evaluation triggers', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('Re-Evaluation Triggers');
      expect(analysisContent).toContain('Consider revisiting');
    });

    it('should be substantial in length', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      // Analysis should be comprehensive (>5000 characters minimum)
      expect(analysisContent.length).toBeGreaterThan(5000);
    });
  });

  describe('Task Metadata', () => {
    it('should include task identifier', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('3.1.4.5.1');
    });

    it('should include completion date', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should include version number', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('Version:');
      expect(analysisContent).toMatch(/\*\*Version:\*\*\s*\d+\.\d+\.\d+/);
    });

    it('should mark status as complete', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('Status:');
      expect(analysisContent).toContain('Complete');
    });

    it('should reference next phase', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('3.1.4.5.2');
      expect(analysisContent).toContain('Evaluate Cost vs. Benefit');
    });
  });

  describe('Appendices', () => {
    it('should include execution examples', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain(
        '## Appendix A: Performance Script Execution Examples'
      );
      expect(analysisContent).toContain('### A.1 Current Workflow');
    });

    it('should show file structure', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('### A.2 File Structure');
      expect(analysisContent).toContain('scripts/performance/');
    });

    it('should include document metadata', () => {
      analysisContent = readFileSync(analysisPath, 'utf-8');
      expect(analysisContent).toContain('## Document Metadata');
      expect(analysisContent).toContain('Author:');
      expect(analysisContent).toContain('Task:');
    });
  });
});
