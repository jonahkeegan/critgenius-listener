#!/usr/bin/env node
import { formatThematicSummary, generateThematicSummary } from './thematic-summary.mjs';

try {
  const summary = generateThematicSummary();
  const table = formatThematicSummary(summary);
  console.log('[coverage] Thematic summary');
  console.log(table);
} catch (error) {
  console.error('[coverage] Unable to generate summary:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
