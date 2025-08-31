import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Documentation integrity test for `docs/development-server.md`.
 * Guards: required headings present, table anchors intact, sequence diagrams blocks present.
 */

describe('documentation: development-server.md', () => {
  const docPath = path.join(process.cwd(), 'docs', 'development-server.md');
  const md = readFileSync(docPath, 'utf8');

  const requiredHeadings = [
    '# Development Server (Vite) – Developer Guide',
    '## At a Glance',
    '## 1. Overview',
    '## 2. Quick Start',
    '## 3. Core Concepts',
    '## 4. Configuration Matrix',
    '## 5. Validation & Test Harness',
    '## 6. Common Workflows',
    '## 7. Troubleshooting Matrix',
    '## 8. Advanced Usage & Roadmap',
    '## 9. Security & Privacy Posture',
    '## 10. Reference File Map',
    '## 11. Appendix: Sequence Diagrams',
  ];

  it('contains all required headings', () => {
    for (const h of requiredHeadings) {
      expect(md).toContain(h);
    }
  });

  it('contains configuration matrix table headers', () => {
    expect(md).toMatch(
      /\| Variable \| Scope \| Required \| Default \| Purpose \|/
    );
  });

  it('contains sequence diagrams blocks', () => {
    const blocks = (md.match(/```sequenceDiagram/g) || []).length;
    expect(blocks).toBeGreaterThanOrEqual(3);
  });

  it('does not contain deprecated placeholder text', () => {
    expect(md).not.toContain('...existing code');
  });
});
