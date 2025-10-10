import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..', '..');
const docsDir = resolve(ROOT, 'docs');
const standardsDoc = resolve(docsDir, 'integration-testing-standards.md');
const patternsDoc = resolve(docsDir, 'integration-test-patterns.md');

function readDocument(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`Expected documentation at ${path}`);
  }
  return readFileSync(path, 'utf8');
}

describe('Integration testing standards documentation', () => {
  it('documents required sections for integration testing', () => {
    const contents = readDocument(standardsDoc);
    expect(contents).toContain('## Guiding Principles');
    expect(contents).toContain('## Environment Profiles');
    expect(contents).toContain('## Quality Gates');
  });

  it('provides pattern catalogue with Socket.IO and AssemblyAI flows', () => {
    const contents = readDocument(patternsDoc);
    expect(contents).toContain('Socket.IO realtime communication');
    expect(contents).toContain('AssemblyAI transcription flow');
    expect(contents).toContain('Resilience failure injection');
  });
});
