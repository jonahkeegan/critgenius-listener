import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import tsModule from 'typescript';

const ts =
  (tsModule as unknown as { default?: typeof tsModule }).default ?? tsModule;

const WORKFLOW_GUIDE_PATH = resolve(
  __dirname,
  '../../docs/coverage-workflow-guide.md'
);
const TROUBLESHOOTING_GUIDE_PATH = resolve(
  __dirname,
  '../../docs/coverage-troubleshooting.md'
);
const ONBOARDING_GUIDE_PATH = resolve(
  __dirname,
  '../../docs/developer-onboarding.md'
);
const COVERAGE_SYSTEM_GUIDE_PATH = resolve(
  __dirname,
  '../../docs/coverage-system-guide.md'
);
const COMPREHENSIVE_TESTING_GUIDE_PATH = resolve(
  __dirname,
  '../../docs/comprehensive-testing-guide.md'
);
const PACKAGE_JSON_PATH = resolve(__dirname, '../../package.json');

const REQUIRED_DOCS = [
  'docs/coverage-system-guide.md',
  'docs/coverage-workflow-guide.md',
  'docs/coverage-troubleshooting.md',
  'docs/developer-onboarding.md',
  'docs/comprehensive-testing-guide.md',
];

const MIN_WORKFLOW_SEQUENCE_DIAGRAMS = 6;
const MIN_TROUBLESHOOTING_SEQUENCE_DIAGRAMS = 4;

function extractCodeBlocks(content: string, language: string): string[] {
  const regex = new RegExp('```' + language + '\\r?\\n([\\s\\S]*?)```', 'g');
  const snippets: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content))) {
    if (typeof match[1] === 'string') {
      snippets.push(match[1]);
    }
  }

  return snippets;
}

describe('coverage documentation validation', () => {
  let workflowGuide: string;
  let troubleshootingGuide: string;
  let onboardingGuide: string;
  let coverageSystemGuide: string;
  let comprehensiveTestingGuide: string;
  let packageJson: { scripts?: Record<string, string> };

  beforeAll(() => {
    for (const relativePath of REQUIRED_DOCS) {
      expect(existsSync(resolve(__dirname, '../..', relativePath))).toBe(true);
    }

    workflowGuide = readFileSync(WORKFLOW_GUIDE_PATH, 'utf8');
    troubleshootingGuide = readFileSync(TROUBLESHOOTING_GUIDE_PATH, 'utf8');
    onboardingGuide = readFileSync(ONBOARDING_GUIDE_PATH, 'utf8');
    coverageSystemGuide = readFileSync(COVERAGE_SYSTEM_GUIDE_PATH, 'utf8');
    comprehensiveTestingGuide = readFileSync(
      COMPREHENSIVE_TESTING_GUIDE_PATH,
      'utf8'
    );
    packageJson = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8')) as {
      scripts?: Record<string, string>;
    };
  });

  describe('structure requirements', () => {
    it('workflow guide contains expected sections', () => {
      const headings = [
        '## 2. Five-Minute Quick Start',
        '## 3. Daily Development Workflow',
        '## 4. Investigating Coverage Gaps',
        '## 7. Thematic vs Workspace Coverage',
        '## 9. Practical Examples',
        '## 12. Related Documentation',
      ];

      for (const heading of headings) {
        expect(workflowGuide).toContain(heading);
      }
    });

    it('troubleshooting guide contains scenario sections', () => {
      const headings = [
        '### 3.1 Threshold Failure',
        '### 3.2 Missing Coverage Artefacts',
        '### 3.3 CI Coverage Failure',
        '### 3.4 Slow Coverage Execution',
      ];

      for (const heading of headings) {
        expect(troubleshootingGuide).toContain(heading);
      }
    });

    it('workflow guide includes quick reference table', () => {
      expect(workflowGuide).toContain('| Purpose | Command |');
      expect(workflowGuide).toContain('`pnpm test:coverage:summary`');
    });
  });

  describe('sequence diagram validation', () => {
    function countSequenceDiagrams(content: string): number {
      const matches = content.match(/```mermaid\s+sequenceDiagram/gi);
      return matches?.length ?? 0;
    }

    it('workflow guide provides at least six sequence diagrams', () => {
      expect(countSequenceDiagrams(workflowGuide)).toBeGreaterThanOrEqual(
        MIN_WORKFLOW_SEQUENCE_DIAGRAMS
      );
    });

    it('troubleshooting guide provides at least four sequence diagrams', () => {
      expect(
        countSequenceDiagrams(troubleshootingGuide)
      ).toBeGreaterThanOrEqual(MIN_TROUBLESHOOTING_SEQUENCE_DIAGRAMS);
    });
  });

  describe('command validation', () => {
    const requiredScripts = [
      'test:coverage:workspace',
      'test:coverage:summary',
      'test:coverage:client',
      'test:coverage:server',
      'test:coverage:shared',
      'test:coverage:test-utils',
      'test:coverage:thematic',
      'validate:coverage-orchestration',
    ];

    it('referenced scripts exist in package.json', () => {
      expect(packageJson.scripts).toBeDefined();

      for (const script of requiredScripts) {
        if (workflowGuide.includes(`pnpm ${script}`)) {
          expect(packageJson.scripts).toHaveProperty(script);
        }
        if (troubleshootingGuide.includes(`pnpm ${script}`)) {
          expect(packageJson.scripts).toHaveProperty(script);
        }
      }
    });
  });

  describe('code sample validation', () => {
    it('workflow guide TypeScript samples transpile without syntax errors', () => {
      const tsSnippets = extractCodeBlocks(workflowGuide, 'typescript');
      expect(tsSnippets.length).toBeGreaterThanOrEqual(1);

      for (const snippet of tsSnippets) {
        const result = ts.transpileModule(snippet, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ESNext,
          },
        });
        expect(result.diagnostics?.length ?? 0).toBe(0);
      }
    });
  });

  describe('cross-reference validation', () => {
    it('workflow guide references troubleshooting and system guides', () => {
      expect(workflowGuide).toContain('docs/coverage-system-guide.md');
      expect(workflowGuide).toContain('docs/coverage-troubleshooting.md');
    });

    it('troubleshooting guide references workflow and system guides', () => {
      expect(troubleshootingGuide).toContain('docs/coverage-workflow-guide.md');
      expect(troubleshootingGuide).toContain('docs/coverage-system-guide.md');
    });

    it('onboarding guide links to workflow guide', () => {
      expect(onboardingGuide).toContain('docs/coverage-workflow-guide.md');
    });

    it('coverage system guide see-also section lists new docs', () => {
      expect(coverageSystemGuide).toContain('## See Also');
      expect(coverageSystemGuide).toContain('docs/coverage-workflow-guide.md');
      expect(coverageSystemGuide).toContain('docs/coverage-troubleshooting.md');
    });

    it('comprehensive testing guide mentions coverage documentation', () => {
      expect(comprehensiveTestingGuide).toContain(
        'docs/coverage-workflow-guide.md'
      );
      expect(comprehensiveTestingGuide).toContain(
        'docs/coverage-troubleshooting.md'
      );
    });
  });
});
