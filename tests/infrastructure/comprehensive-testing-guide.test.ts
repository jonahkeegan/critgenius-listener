import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const GUIDE_PATH = resolve(
  __dirname,
  '../../docs/comprehensive-testing-guide.md'
);

describe('comprehensive testing guide validation', () => {
  let guideContent: string;

  beforeAll(() => {
    guideContent = readFileSync(GUIDE_PATH, 'utf8');
  });

  describe('document structure validation', () => {
    it('contains all required sections', () => {
      const requiredSections = [
        '## 1. Overview & Philosophy',
        '## 2. Quick Start Workflows',
        '## 3. Test Infrastructure Deep Dive',
        '## 4. Test Utilities Library',
        '## 5. Integration Testing Handbook',
        '## 6. Performance Testing Guide',
        '## 7. Testing Best Practices',
        '## 8. Troubleshooting & Common Issues',
        '## 9. Validation & Quality Gates',
      ];

      for (const section of requiredSections) {
        expect(guideContent).toContain(section);
      }
    });

    it('has table of contents with all sections', () => {
      expect(guideContent).toContain('## Table of Contents');
      expect(guideContent).toContain(
        '[Overview & Philosophy](#1-overview--philosophy)'
      );
      expect(guideContent).toContain(
        '[Quick Start Workflows](#2-quick-start-workflows)'
      );
      expect(guideContent).toContain(
        '[Test Infrastructure Deep Dive](#3-test-infrastructure-deep-dive)'
      );
      expect(guideContent).toContain(
        '[Test Utilities Library](#4-test-utilities-library)'
      );
      expect(guideContent).toContain(
        '[Integration Testing Handbook](#5-integration-testing-handbook)'
      );
      expect(guideContent).toContain(
        '[Performance Testing Guide](#6-performance-testing-guide)'
      );
      expect(guideContent).toContain(
        '[Testing Best Practices](#7-testing-best-practices)'
      );
      expect(guideContent).toContain(
        '[Troubleshooting & Common Issues](#8-troubleshooting--common-issues)'
      );
      expect(guideContent).toContain(
        '[Validation & Quality Gates](#9-validation--quality-gates)'
      );
    });

    it('includes version and metadata', () => {
      expect(guideContent).toContain('**Version:**');
      expect(guideContent).toContain('**Last Updated:**');
      expect(guideContent).toContain('**Target Audience:**');
      expect(guideContent).toContain('**Status:**');
    });
  });

  describe('sequence diagram validation', () => {
    it('contains required workflow sequence diagrams', () => {
      const expectedDiagrams = [
        'participant Dev as Developer',
        'participant Runtime as Test Runtime',
        'participant Harness as IntegrationTestHarness',
        'participant Server as Integration Server',
        'participant Vitest as Vitest Runner',
      ];

      for (const participant of expectedDiagrams) {
        expect(guideContent).toContain(participant);
      }
    });

    it('has properly formatted sequence diagram blocks', () => {
      const sequenceDiagramMatches = guideContent.match(/```sequenceDiagram/g);
      expect(sequenceDiagramMatches).toBeTruthy();
      expect(sequenceDiagramMatches!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('code example validation', () => {
    it('contains TypeScript code examples', () => {
      const codeBlockMatches = guideContent.match(/```typescript/g);
      expect(codeBlockMatches).toBeTruthy();
      expect(codeBlockMatches!.length).toBeGreaterThan(20);
    });

    it('includes realistic D&D examples', () => {
      expect(guideContent).toContain('Elara the Ranger');
      expect(guideContent).toContain('Thorin');
      expect(guideContent).toContain('SPEAKER_0');
      expect(guideContent).toContain('session');
    });

    it('shows proper test structure with describe/it blocks', () => {
      expect(guideContent).toContain("describe('");
      expect(guideContent).toContain("it('");
      expect(guideContent).toContain('expect(');
    });
  });

  describe('referenced file validation', () => {
    it('references existing documentation files', () => {
      const referencedDocs = [
        'docs/testing-standards.md',
        'docs/integration-testing-standards.md',
        'docs/integration-test-patterns.md',
        'docs/performance-testing-guide.md',
        'packages/test-utils/README.md',
      ];

      for (const doc of referencedDocs) {
        const fullPath = resolve(__dirname, '../..', doc);
        expect(existsSync(fullPath)).toBe(true);
      }
    });

    it('references vitest.shared.config.ts', () => {
      expect(guideContent).toContain('vitest.shared.config.ts');
      const configPath = resolve(__dirname, '../../vitest.shared.config.ts');
      expect(existsSync(configPath)).toBe(true);
    });
  });

  describe('npm script validation', () => {
    it('references valid npm scripts', () => {
      const packageJsonPath = resolve(__dirname, '../../package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      const referencedScripts = ['test', 'precommit:validate'];

      for (const script of referencedScripts) {
        if (guideContent.includes(`pnpm ${script}`)) {
          // Script should exist in package.json
          expect(packageJson.scripts).toHaveProperty(script);
        }
      }
    });
  });

  describe('content quality validation', () => {
    it('includes Given-When-Then test patterns', () => {
      expect(guideContent).toContain('// GIVEN:');
      expect(guideContent).toContain('// WHEN:');
      expect(guideContent).toContain('// THEN:');
    });

    it('documents test utilities with imports', () => {
      expect(guideContent).toContain(
        "import { installTestRuntime } from '@critgenius/test-utils/runtime'"
      );
      expect(guideContent).toContain(
        "import { createTestSession } from '@critgenius/test-utils/factories'"
      );
      // Check for IntegrationTestHarness import (may span multiple lines)
      expect(guideContent).toContain('IntegrationTestHarness');
      expect(guideContent).toContain('@critgenius/test-utils/integration');
    });

    it('includes troubleshooting guidance', () => {
      expect(guideContent).toContain('Troubleshooting');
      expect(guideContent).toContain('**Symptoms:**');
      expect(guideContent).toContain('**Solutions:**');
    });

    it('provides command examples with bash formatting', () => {
      const bashBlockMatches = guideContent.match(/```bash/g);
      expect(bashBlockMatches).toBeTruthy();
      expect(bashBlockMatches!.length).toBeGreaterThan(10);
    });
  });

  describe('cross-reference validation', () => {
    it('links to related documentation', () => {
      expect(guideContent).toContain('## Related Documentation');
      expect(guideContent).toContain('[Testing Standards]');
      expect(guideContent).toContain('[Integration Testing Standards]');
      expect(guideContent).toContain('[Performance Testing Guide]');
    });

    it('includes internal section links', () => {
      expect(guideContent).toContain('](#');
      // Check some specific internal links
      expect(guideContent).toMatch(/\[.*\]\(#\d+-/);
    });
  });

  describe('completeness validation', () => {
    it('covers all test types', () => {
      expect(guideContent).toContain('Unit Test');
      expect(guideContent).toContain('Integration Test');
      expect(guideContent).toContain('E2E Test');
      expect(guideContent).toContain('Performance');
    });

    it('includes quality gate information', () => {
      expect(guideContent).toContain('Quality Gates');
      expect(guideContent).toContain('90%');
      expect(guideContent).toContain('coverage');
    });

    it('documents test pyramid', () => {
      expect(guideContent).toContain('Testing Pyramid');
      expect(guideContent).toContain('~70%');
      expect(guideContent).toContain('~20%');
      expect(guideContent).toContain('~10%');
    });
  });

  describe('formatting validation', () => {
    it('uses consistent heading levels', () => {
      // Should have ## for main sections, ### for subsections
      expect(guideContent).toMatch(/^## \d\. /m);
      expect(guideContent).toMatch(/^### \d\.\d /m);
    });

    it('includes version history section', () => {
      expect(guideContent).toContain('## Version History');
      expect(guideContent).toContain('| Version | Date | Changes |');
    });

    it('has proper markdown table formatting', () => {
      const tableMatches = guideContent.match(/\|.*\|.*\|/g);
      expect(tableMatches).toBeTruthy();
      expect(tableMatches!.length).toBeGreaterThan(5);
    });
  });
});
