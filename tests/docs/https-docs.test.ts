import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

describe('documentation: https-development-setup.md', () => {
  const docPath = path.join(
    process.cwd(),
    'docs',
    'https-development-setup.md'
  );
  const md = readFileSync(docPath, 'utf8');

  const requiredHeadings = [
    '# HTTPS Development Setup Guide',
    '## Table of Contents',
    '## 1. Overview & Prerequisites',
    '## 2. Certificate Generation Strategy',
    '## 3. Certificate Provisioning Procedures',
    '## 4. Environment Configuration',
    '## 5. Vite HTTPS Integration',
    '## 6. First Secure Startup Workflow',
    '## 7. Integration Validation Suite',
    '## 8. Certificate Maintenance & Rotation',
    '## 9. Reference Matrix & Next Steps',
    '## Change Log (Doc Specific)',
  ];

  it('contains all required headings', () => {
    for (const heading of requiredHeadings) {
      expect(md).toContain(heading);
    }
  });

  it('includes multiple mermaid sequence diagrams', () => {
    const mermaidBlocks = md.match(/```mermaid/g) || [];
    expect(mermaidBlocks.length).toBeGreaterThanOrEqual(10);
  });

  it('references the troubleshooting companion guide', () => {
    expect(md).toContain('docs/https-troubleshooting-guide.md');
  });

  it('does not contain placeholder text', () => {
    expect(md).not.toContain('...existing code');
  });
});

describe('documentation: https-troubleshooting-guide.md', () => {
  const docPath = path.join(
    process.cwd(),
    'docs',
    'https-troubleshooting-guide.md'
  );
  const md = readFileSync(docPath, 'utf8');

  const requiredHeadings = [
    '# HTTPS Troubleshooting Guide',
    '## Table of Contents',
    '## 1. Troubleshooting Framework',
    '## 2. Certificate Issues',
    '## 3. Configuration & Environment Issues',
    '## 4. Browser Security Warnings',
    '## 5. Runtime & Integration Failures',
    '## 6. Performance Considerations',
    '## 7. Cross-Reference Matrix',
    '## 8. Change Log',
  ];

  it('contains all required headings', () => {
    for (const heading of requiredHeadings) {
      expect(md).toContain(heading);
    }
  });

  it('includes multiple mermaid sequence diagrams', () => {
    const mermaidBlocks = md.match(/```mermaid/g) || [];
    expect(mermaidBlocks.length).toBeGreaterThanOrEqual(8);
  });

  it('references the setup companion guide', () => {
    expect(md).toContain('docs/https-development-setup.md');
  });

  it('does not contain placeholder text', () => {
    expect(md).not.toContain('...existing code');
  });
});
