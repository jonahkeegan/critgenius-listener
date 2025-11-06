import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { RunOptions } from 'axe-core';

import {
  bindWindowGlobals,
  configureAxe,
  getAxeConfiguration,
  registerAccessibilityMatchers,
  runAxeAudit,
} from '@critgenius/test-utils/accessibility';

const repoRoot = resolve(__dirname, '..', '..');
const clientRequire = createRequire(
  resolve(repoRoot, 'packages', 'client', 'package.json')
);

describe('vitest-axe accessibility integration', () => {
  let testEnv: { dom: JSDOM; restoreGlobals: () => void } | null = null;

  beforeAll(() => {
    registerAccessibilityMatchers();
  });

  beforeEach(() => {
    configureAxe({ reset: true });
  });

  afterEach(() => {
    if (testEnv) {
      testEnv.restoreGlobals();
      testEnv.dom.window.close();
      testEnv = null;
    }
  });

  it('declares vitest-axe dependencies in the workspace', () => {
    const packageJsonPath = resolve(repoRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.devDependencies?.['vitest-axe']).toBeDefined();
    expect(packageJson.devDependencies?.['axe-core']).toBeDefined();
  });

  it('configures WCAG 2.1 AA defaults with audio policy overrides', () => {
    const { runOptions } = getAxeConfiguration();
    const runOnly = runOptions.runOnly as { type: string; values: string[] };
    const ruleOverrides = runOptions.rules as Record<
      string,
      { enabled: boolean }
    >;

    expect(runOnly.type).toBe('tag');
    expect(runOnly.values).toEqual(
      expect.arrayContaining(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    );
    expect(ruleOverrides['video-caption']?.enabled).toBe(false);
    expect(ruleOverrides['media-has-caption']).toBeUndefined();
    expect(ruleOverrides['color-contrast']?.enabled).toBe(true);
  });

  // Skipped in CI due to JSDOM canvas limitation. See docs/jsdom-canvas-limitation.md.
  it.skip(
    'executes audits against Material UI components',
    { timeout: 15000 },
    async () => {
      testEnv = createIsolatedDom('<div id="root"></div>');

      const Button = await loadMaterialUIButton();

      const markup = renderToString(
        React.createElement(Button, { variant: 'contained' }, 'Roll Initiative')
      );
      testEnv.dom.window.document.getElementById('root')!.innerHTML = markup;

      await expect(testEnv.dom.window.document).toPassA11yAudit();
    }
  ); // Increased timeout for complex component rendering

  // Skipped in CI due to JSDOM canvas limitation. See docs/jsdom-canvas-limitation.md.
  it.skip('allows additional per-test run options', async () => {
    testEnv = createIsolatedDom('<main><audio controls></audio></main>');

    const overrides: RunOptions = {
      rules: {
        'video-caption': { enabled: true },
      },
    };

    const results = await runAxeAudit(testEnv.dom.window.document, overrides);
    const mediaRule = results.violations.find(
      violation => violation.id === 'video-caption'
    );

    expect(mediaRule?.nodes.length).toBeGreaterThan(0);
  });
});

/**
 * Creates an isolated JSDOM instance and binds its window/document to globals.
 * Critical pattern: Globals MUST be bound immediately after JSDOM creation,
 * before axe-core initialization, to prevent "Required window or document globals not defined" errors.
 *
 * Known Limitation: JSDOM's canvas implementation is incomplete, which causes axe-core's
 * color-contrast rule to hang when components rely on canvas-backed icon ligatures (for example,
 * Material UI). Attempts to polyfill with the 'canvas' npm package still hang because JSDOM's
 * internal canvas layer cannot be stubbed. Vitest suites therefore skip canvas-dependent
 * assertions until JSDOM improves. For mitigation context and workarounds, see
 * docs/jsdom-canvas-limitation.md (path relative to repo root).
 *
 * @returns Object containing the JSDOM instance and a function to restore previous globals
 */
function createIsolatedDom(bodyMarkup: string): {
  dom: JSDOM;
  restoreGlobals: () => void;
} {
  const htmlDocument = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>CritGenius Listener Accessibility Test</title>
  </head>
  <body>${bodyMarkup}</body>
</html>`;

  const dom = new JSDOM(htmlDocument, {
    pretendToBeVisual: true,
    url: 'http://localhost',
  });

  // Bind globals IMMEDIATELY after JSDOM creation, before any axe operations
  // Type assertion is safe here as JSDOM's window implements the Window interface
  const restoreGlobals = bindWindowGlobals(dom.window as unknown as Window);

  return {
    dom,
    restoreGlobals: restoreGlobals ?? (() => {}), // Provide no-op if already bound
  };
}

async function loadMaterialUIButton(): Promise<
  React.ComponentType<Record<string, unknown>>
> {
  let hasMaterialUI = false;
  try {
    clientRequire.resolve('@mui/material/package.json');
    hasMaterialUI = true;
  } catch {
    hasMaterialUI = false;
  }

  const candidates = [
    () => clientRequire.resolve('@mui/material/Button'),
    () => clientRequire.resolve('@mui/material'),
  ] as const;

  const resolutionErrors: unknown[] = [];

  for (const resolveCandidate of candidates) {
    try {
      const candidatePath = resolveCandidate();
      const moduleUrl = pathToFileURL(candidatePath).href;
      const imported = await import(/* @vite-ignore */ moduleUrl);
      const buttonExport =
        imported.default ?? imported.Button ?? imported.button ?? imported.BTN;
      if (buttonExport) {
        return buttonExport as React.ComponentType<Record<string, unknown>>;
      }
    } catch (error) {
      resolutionErrors.push(error);
    }
  }

  if (hasMaterialUI) {
    const lastError = resolutionErrors.at(-1);
    throw new Error(
      'Failed to load Material UI for accessibility integration test',
      {
        cause: lastError instanceof Error ? lastError : undefined,
      }
    );
  }

  // Accept core button attributes while tolerating design-system props such as `variant`.
  type FallbackButtonProps = React.PropsWithChildren<
    React.ComponentPropsWithoutRef<'button'> & {
      [key: string]: unknown;
    }
  >;

  const FallbackButton: React.FC<FallbackButtonProps> = ({
    children,
    ...rest
  }) => React.createElement('button', { type: 'button', ...rest }, children);

  return FallbackButton as React.ComponentType<Record<string, unknown>>;
}
