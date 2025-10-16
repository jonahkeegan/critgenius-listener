import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Memory Bank Update Guide - Documentation Validation', () => {
  const guideContent = readFileSync(
    join(__dirname, '../../docs/memory-bank-update-guide.md'),
    'utf-8'
  );

  describe('Structure Validation', () => {
    it('should contain all mandatory sections', () => {
      const requiredSections = [
        '# Memory Bank Update Guide',
        '## Overview',
        '## 1. Know the Core Files',
        '## 2. Update Triggers',
        '## 3. Standard Workflow',
        '## 4. Decision Matrices',
        '## 5. Template Library',
        '## 6. Validation Checkpoints',
        '## 7. Anti-Pattern Examples',
        '## 8. Cross-Reference System',
        '## 9. Quality Metrics',
        '## 10. Troubleshooting Guide',
        '## 11. Automation Recommendations',
        '## 12. GPT-5 Specific Instructions',
      ];

      requiredSections.forEach(section => {
        expect(guideContent).toContain(section);
      });
    });

    it('should have proper heading hierarchy', () => {
      const headingPattern = /^#{1,6}\s+.+$/gm;
      const headings = guideContent.match(headingPattern);

      expect(headings).toBeTruthy();
      expect(headings!.length).toBeGreaterThan(20);

      // Verify no skipped heading levels
      const levels = headings!.map(h => h.match(/^#+/)?.[0].length || 0);
      for (let i = 1; i < levels.length; i++) {
        const jump = levels[i] - levels[i - 1];
        expect(Math.abs(jump)).toBeLessThanOrEqual(1);
      }
    });

    it('should use valid markdown syntax', () => {
      // Check for common markdown syntax errors
      expect(guideContent).not.toMatch(/\[.*\]\(\)/); // Empty links
      expect(guideContent).not.toMatch(/!\[\]\(.*\)/); // Images without alt text in critical sections
    });
  });

  describe('Sequence Diagram Validation', () => {
    it('should contain exactly 10 workflow sequence diagrams', () => {
      const diagramPattern = /```sequenceDiagram[\s\S]*?```/g;
      const diagrams = guideContent.match(diagramPattern);

      expect(diagrams).toBeTruthy();
      expect(diagrams!.length).toBeGreaterThanOrEqual(10);
    });

    it('should have sequence diagram for Overview workflow', () => {
      expect(guideContent).toContain('```sequenceDiagram');
      expect(guideContent).toMatch(/participant.*GPT5Copilot/);
      expect(guideContent).toMatch(/participant.*MemoryBank/);
    });

    it('should have sequence diagram for Step 1: Collect Inputs', () => {
      expect(guideContent).toContain('### 3.1 Collect Inputs');
      const collectInputsSection = guideContent.substring(
        guideContent.indexOf('### 3.1 Collect Inputs')
      );
      expect(collectInputsSection).toContain('```sequenceDiagram');
    });

    it('should have sequence diagram for Step 2: Log Raw Reflections', () => {
      expect(guideContent).toContain('### 3.2 Log Raw Reflections');
      const logReflectionsSection = guideContent.substring(
        guideContent.indexOf('### 3.2 Log Raw Reflections')
      );
      expect(logReflectionsSection).toContain('```sequenceDiagram');
    });

    it('should have sequence diagram for Step 3: Distill Learnings', () => {
      expect(guideContent).toContain('### 3.3 Distill Learnings');
      const distillSection = guideContent.substring(
        guideContent.indexOf('### 3.3 Distill Learnings')
      );
      expect(distillSection).toContain('```sequenceDiagram');
    });

    it('should have sequence diagram for Step 4: Sync Indexes', () => {
      expect(guideContent).toContain('### 3.4 Sync Indexes');
      const syncSection = guideContent.substring(
        guideContent.indexOf('### 3.4 Sync Indexes')
      );
      expect(syncSection).toContain('```sequenceDiagram');
    });

    it('should have sequence diagram for Step 5: Record Progress', () => {
      expect(guideContent).toContain('### 3.5 Record Progress');
      const progressSection = guideContent.substring(
        guideContent.indexOf('### 3.5 Record Progress')
      );
      expect(progressSection).toContain('```sequenceDiagram');
    });

    it('should have sequence diagram for Step 6: Capture System Patterns', () => {
      expect(guideContent).toContain('### 3.6 Capture System Patterns');
      const patternsSection = guideContent.substring(
        guideContent.indexOf('### 3.6 Capture System Patterns')
      );
      expect(patternsSection).toContain('```sequenceDiagram');
    });

    it('should have sequence diagram for Step 7: Refresh Active Context', () => {
      expect(guideContent).toContain('### 3.7 Refresh Active Context');
      const contextSection = guideContent.substring(
        guideContent.indexOf('### 3.7 Refresh Active Context')
      );
      expect(contextSection).toContain('```sequenceDiagram');
    });

    it('should have sequence diagram for Step 8: Validate Consistency', () => {
      expect(guideContent).toContain('### 3.8 Validate Consistency');
      const validateSection = guideContent.substring(
        guideContent.indexOf('### 3.8 Validate Consistency')
      );
      expect(validateSection).toContain('```sequenceDiagram');
    });

    it('should have sequence diagram for Step 9: Prune Raw Log', () => {
      expect(guideContent).toContain('### 3.9 Prune Raw Log');
      const pruneSection = guideContent.substring(
        guideContent.indexOf('### 3.9 Prune Raw Log')
      );
      expect(pruneSection).toContain('```sequenceDiagram');
    });

    it('should have sequence diagram for Step 10: Optional Update Docs', () => {
      expect(guideContent).toContain('### 3.10 Optional: Update Docs');
      const docsSection = guideContent.substring(
        guideContent.indexOf('### 3.10 Optional: Update Docs')
      );
      expect(docsSection).toContain('```sequenceDiagram');
    });

    it('should use proper Mermaid sequence diagram syntax', () => {
      const diagrams = guideContent.match(/```sequenceDiagram[\s\S]*?```/g);

      diagrams?.forEach(diagram => {
        // Check for participant declarations
        expect(diagram).toMatch(/participant\s+\w+/);
        // Check for message flows (->>, ->>)
        expect(diagram).toMatch(/(->>|-->>)/);
      });
    });
  });

  describe('Content Completeness', () => {
    it('should have decision matrix for file type selection', () => {
      expect(guideContent).toContain('## 4. Decision Matrices');
      expect(guideContent).toMatch(/raw_reflection_log\.md/);
      expect(guideContent).toMatch(/consolidated-learnings/);
      expect(guideContent).toMatch(/progress-\d+\.md/);
      expect(guideContent).toMatch(/systemPatterns-\d+\.md/);
      expect(guideContent).toMatch(/activeContext\.md/);
    });

    it('should have validation checkpoints for each workflow step', () => {
      expect(guideContent).toContain('## 6. Validation Checkpoints');

      // Check for validation checkpoints in each step
      const checkpointKeywords = [
        'verify',
        'confirm',
        'validate',
        'check',
        'ensure',
      ];

      const validationSection = guideContent.substring(
        guideContent.indexOf('## 6. Validation Checkpoints')
      );

      checkpointKeywords.forEach(keyword => {
        expect(validationSection.toLowerCase()).toContain(keyword);
      });
    });

    it('should have template library with examples', () => {
      expect(guideContent).toContain('## 5. Template Library');
      expect(guideContent).toMatch(/```markdown/); // Templates should be in code blocks
      expect(guideContent).toContain('Date:');
      expect(guideContent).toContain('TaskRef:');
      expect(guideContent).toContain('Learnings:');
    });

    it('should have anti-pattern examples with explanations', () => {
      expect(guideContent).toContain('## 7. Anti-Pattern Examples');
      expect(guideContent).toMatch(/❌|⚠️|🚫/); // Visual indicators for anti-patterns
      expect(guideContent).toMatch(/✅|✓/); // Visual indicators for correct patterns
    });
  });

  describe('Cross-Reference Validation', () => {
    it('should reference memory bank files', () => {
      const memoryBankFiles = [
        'raw_reflection_log.md',
        'consolidated-learnings',
        'learnings-index.md',
        'progress-',
        'index-progress.md',
        'systemPatterns-',
        'systemPatterns-index.md',
        'activeContext.md',
      ];

      memoryBankFiles.forEach(file => {
        expect(guideContent).toContain(file);
      });
    });

    it('should reference Continuous Improvement Protocol', () => {
      expect(guideContent).toMatch(
        /Continuous Improvement Protocol|07-cline-continuous-improvement-protocol/
      );
    });

    it('should include command examples with actual scripts', () => {
      const commonCommands = ['pnpm', 'vitest', 'test', 'lint', 'type-check'];

      commonCommands.forEach(cmd => {
        expect(guideContent).toContain(cmd);
      });
    });
  });

  describe('Quality Metrics', () => {
    it('should define measurable criteria for updates', () => {
      expect(guideContent).toContain('## 9. Quality Metrics');

      const metricsSection = guideContent.substring(
        guideContent.indexOf('## 9. Quality Metrics')
      );

      const metricKeywords = ['completeness', 'accuracy', 'actionable'];
      metricKeywords.forEach(keyword => {
        expect(metricsSection.toLowerCase()).toContain(keyword);
      });
    });
  });

  describe('Troubleshooting Guide', () => {
    it('should cover common update challenges', () => {
      expect(guideContent).toContain('## 10. Troubleshooting Guide');

      const troubleshootingSection = guideContent.substring(
        guideContent.indexOf('## 10. Troubleshooting Guide')
      );

      const commonIssues = ['conflict', 'missing', 'version', 'merge'];

      commonIssues.forEach(issue => {
        expect(troubleshootingSection.toLowerCase()).toContain(issue);
      });
    });
  });

  describe('Automation Recommendations', () => {
    it('should provide actionable automation suggestions', () => {
      expect(guideContent).toContain('## 11. Automation Recommendations');

      const automationSection = guideContent.substring(
        guideContent.indexOf('## 11. Automation Recommendations')
      );

      expect(automationSection.length).toBeGreaterThan(100);
    });
  });

  describe('GPT-5 Specific Instructions', () => {
    it('should contain explicit directives for AI execution', () => {
      expect(guideContent).toContain('## 12. GPT-5 Specific Instructions');

      const gpt5Section = guideContent.substring(
        guideContent.indexOf('## 12. GPT-5 Specific Instructions')
      );

      const aiKeywords = ['must', 'always', 'never', 'required'];
      aiKeywords.forEach(keyword => {
        expect(gpt5Section.toLowerCase()).toContain(keyword);
      });
    });
  });
});
