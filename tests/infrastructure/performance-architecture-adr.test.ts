import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Performance Architecture ADR-001 (Task 3.1.4.5.3)', () => {
  const adrPath = resolve(
    __dirname,
    '../../docs/architecture-decisions/adr-001-performance-testing-architecture.md'
  );
  let adrContent: string;

  it('should have ADR document', () => {
    expect(() => {
      adrContent = readFileSync(adrPath, 'utf-8');
    }).not.toThrow();
  });

  describe('ADR Structure', () => {
    it('should have proper ADR header', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('# ADR-001:');
      expect(adrContent).toContain('**Status:**');
      expect(adrContent).toContain('**Date:**');
      expect(adrContent).toContain('**Decision Makers:**');
    });

    it('should document context', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Context');
      expect(adrContent).toContain('Task 3.1.3');
      expect(adrContent).toContain('Task 3.1.4');
    });

    it('should state clear decision', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Decision');
      expect(adrContent).toMatch(/DEFER/i);
    });

    it('should document decision drivers', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Decision Drivers');
      expect(adrContent).toContain('Quantitative Analysis');
      expect(adrContent).toContain('Cost Assessment');
      expect(adrContent).toContain('Benefit Assessment');
      expect(adrContent).toContain('Risk Assessment');
    });

    it('should list alternatives considered', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Alternatives Considered');
      expect(adrContent).toMatch(/Alternative\s+\d+:/);
    });

    it('should document consequences', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Consequences');
      expect(adrContent).toContain('Positive');
      expect(adrContent).toContain('Negative');
    });

    it('should define re-evaluation triggers', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Re-evaluation Triggers');
      expect(adrContent).toMatch(/\d+\.\s*⏱️/); // Numbered trigger with emoji
    });

    it('should have implementation plan', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Implementation Plan');
      expect(adrContent).toContain('3 hours');
    });

    it('should reference evidence base', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Evidence Base');
      expect(adrContent).toContain('Task 3.1.4.5.1');
      expect(adrContent).toContain('Task 3.1.4.5.2');
    });

    it('should list related documentation', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Related Documentation');
      expect(adrContent).toContain('performance-architecture-analysis.md');
      expect(adrContent).toContain(
        'performance-architecture-cost-benefit-evaluation.md'
      );
    });

    it('should have approval section', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Approval and Sign-off');
      expect(adrContent).toContain('Decision Date:');
    });

    it('should include version history', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('## Version History');
      expect(adrContent).toContain('1.0.0');
    });
  });

  describe('Decision Content', () => {
    it('should quantify decision score', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('-0.515');
      expect(adrContent).toContain('Strongly Negative');
    });

    it('should document cost breakdown', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('18 hours');
      expect(adrContent).toMatch(/\+10-15%/);
    });

    it('should identify zero tangible benefits', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('ZERO');
      expect(adrContent).toContain('SPECULATIVE');
    });

    it('should assess HIGH risk', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('HIGH');
      expect(adrContent).toMatch(/risk/i);
    });

    it('should propose documentation enhancements', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('metrics-runner.mjs');
      expect(adrContent).toContain('inline comments');
    });
  });

  describe('Re-evaluation Triggers', () => {
    it('should define performance threshold', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toMatch(/10\s+minutes/i);
      expect(adrContent).toMatch(/\d+\s+minutes/i);
    });

    it('should define requirement changes', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('Historical trend analysis');
      expect(adrContent).toContain('requirement');
    });

    it('should define workflow changes', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('Multiple');
      expect(adrContent).toContain('benchmark runs');
    });

    it('should have at least 5 triggers', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      const triggerSection =
        adrContent.split('## Re-evaluation Triggers')[1]?.split('##')[0] || '';
      const triggers = triggerSection
        .split('\n')
        .filter(line => line.trim().match(/^\d+\.\s+/));
      expect(triggers.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Evidence References', () => {
    it('should reference pattern analysis', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('3.1.4.5.1');
      expect(adrContent).toContain('Pattern Analysis');
    });

    it('should reference cost-benefit evaluation', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('3.1.4.5.2');
      expect(adrContent).toContain('Cost-Benefit Evaluation');
    });

    it('should reference validation tests', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('248');
      expect(adrContent).toContain('passing tests');
    });
  });

  describe('Implementation Details', () => {
    it('should break down documentation tasks', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('30 minutes');
      expect(adrContent).toContain('1 hour');
    });

    it('should specify deliverables', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('performance-scenario-guide.md');
      expect(adrContent).toContain('performance-testing-guide.md');
    });

    it('should total to 3 hours', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('3 hours');
      expect(adrContent).toContain('vs. 18 hours');
    });
  });

  describe('Quality Standards', () => {
    it('should be substantial in length', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent.length).toBeGreaterThan(8000);
    });

    it('should use proper markdown formatting', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toMatch(/^# ADR/m);
      expect(adrContent).toMatch(/^## /m);
      expect(adrContent).toMatch(/^### /m);
    });

    it('should include tables', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toMatch(/\|.*\|.*\|/);
    });

    it('should mark status as accepted', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('**Status:** Accepted');
    });
  });

  describe('Task Metadata', () => {
    it('should reference all related tasks', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('3.1.4.5.1');
      expect(adrContent).toContain('3.1.4.5.2');
      expect(adrContent).toContain('3.1.4.5.3');
    });

    it('should include date', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toMatch(/2025-10-11/);
    });

    it('should identify decision makers', () => {
      adrContent = readFileSync(adrPath, 'utf-8');
      expect(adrContent).toContain('Engineering Team');
      expect(adrContent).toContain('Cline');
    });
  });
});
