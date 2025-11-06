import axeCore from 'axe-core';
import type { AxeResults, ElementContext, RunOptions } from 'axe-core';

import {
  createDefaultResultTypes,
  createDefaultRuleMap,
  createDefaultRunOnly,
  DEFAULT_ACCESSIBILITY_RULES,
} from './wcag-rules';

export type AccessibilityAuditTarget =
  | Element
  | Document
  | DocumentFragment
  | ElementContext;

export interface ConfigureAxeOptions {
  /**
   * Additional axe configuration spec to merge with the CritGenius defaults.
   */
  spec?: Partial<AxeSpec>;
  /**
   * Extra run options layered on top of the default WCAG 2.1 AA baseline.
   */
  runOptions?: RunOptions;
  /**
   * Reset axe-core to its factory configuration before applying supplied options.
   */
  reset?: boolean;
}

export interface AxeConfigurationSnapshot {
  spec: AxeSpec;
  runOptions: RunOptions;
}

type AxeSpec = {
  reporter?: string;
  branding?: Record<string, unknown>;
  checks?: Array<Record<string, unknown>>;
  rules?: AxeRuleMap;
  locale?: Record<string, unknown>;
};

type AxeRuleMap = Record<
  string,
  { enabled: boolean } & Record<string, unknown>
>;

type AxeSpecInput = Parameters<typeof axeCore.configure>[0];

type RunOnlyObject = Extract<RunOptions['runOnly'], { type: unknown }>;

type AxeCoreModule = typeof axeCore;

let axeInstance: AxeCoreModule = axeCore;

type AxeTestInstance = Pick<AxeCoreModule, 'configure' | 'reset' | 'run'> & {
  getRules?: AxeCoreModule['getRules'];
};

export const __setAxeInstanceForTesting = (
  instance?: AxeTestInstance
): void => {
  axeInstance = (instance as AxeCoreModule) ?? axeCore;
};

const AVAILABLE_RULE_IDS = (() => {
  const getRules = (
    axeCore as unknown as {
      getRules?: () => Array<{ ruleId: string }>;
    }
  ).getRules;

  if (typeof getRules !== 'function') {
    return undefined;
  }

  try {
    return new Set(getRules().map(rule => rule.ruleId));
  } catch {
    return undefined;
  }
})();

const sanitizeRuleMap = (rules: AxeRuleMap): AxeRuleMap => {
  if (!AVAILABLE_RULE_IDS) {
    return { ...rules };
  }

  const sanitizedEntries = Object.entries(rules).filter(([ruleId]) =>
    AVAILABLE_RULE_IDS.has(ruleId)
  );

  if (sanitizedEntries.length === 0) {
    return { ...rules };
  }

  return sanitizedEntries.reduce<AxeRuleMap>((acc, [ruleId, config]) => {
    acc[ruleId] = { ...config };
    return acc;
  }, {} as AxeRuleMap);
};

const RAW_DEFAULT_RULES = createDefaultRuleMap();
const DEFAULT_RULES = sanitizeRuleMap(RAW_DEFAULT_RULES);

const DEFAULT_SPEC: AxeSpec = {
  reporter: 'v2',
  branding: {
    application: 'CritGenius Listener Accessibility Tests',
  },
  rules: DEFAULT_RULES,
};

const DEFAULT_RUN_OPTIONS: RunOptions = {
  reporter: 'v2',
  runOnly: createDefaultRunOnly(),
  resultTypes: createDefaultResultTypes(),
  rules: DEFAULT_RULES,
};

let currentSpec: AxeSpec = cloneSpec(DEFAULT_SPEC);
let currentRunOptions: RunOptions = cloneRunOptions(DEFAULT_RUN_OPTIONS);
let configurationApplied = false;

const DEBUG_AXE_GLOBAL_BINDINGS =
  process.env.DEBUG_AXE_GLOBAL_BINDINGS === 'true';
const WINDOW_BINDING_KEY = '__critgeniusAxeBindingId__';
let nextGlobalBindingId = 1;

const logAxeGlobalBinding = (
  phase: 'bind:start' | 'bind:applied' | 'restore:start' | 'restore:complete',
  details: Record<string, unknown>
): void => {
  if (DEBUG_AXE_GLOBAL_BINDINGS) {
    console.log(`[axe-globals] ${phase}`, details);
  }
};

const assignWindowBindingId = (windowLike: Window): number => {
  const windowRecord = windowLike as Window & Record<string, unknown>;
  const existing = windowRecord[WINDOW_BINDING_KEY];
  if (typeof existing === 'number') {
    return existing;
  }

  const bindingId = nextGlobalBindingId++;
  Object.defineProperty(windowRecord, WINDOW_BINDING_KEY, {
    configurable: true,
    enumerable: false,
    writable: true,
    value: bindingId,
  });

  return bindingId;
};

/**
 * Mutex to serialize axe.run calls and prevent "Axe is already running" errors.
 * This ensures only one accessibility audit executes at a time across all tests.
 */
let axeRunMutex: Promise<void> = Promise.resolve();

/**
 * Wraps an async function with mutex protection to serialize execution.
 * Critical for preventing concurrent axe.run calls in parallel test environments.
 */
const withAxeMutex = async <T>(fn: () => Promise<T>): Promise<T> => {
  const previousRun = axeRunMutex;
  let release: (() => void) | undefined;

  axeRunMutex = new Promise<void>(resolve => {
    release = resolve;
  });

  await previousRun; // Wait for previous audit to complete

  try {
    return await fn();
  } finally {
    release?.(); // Release next waiting audit (if defined)
  }
};

const DOCUMENT_NODE =
  typeof Node !== 'undefined' ? Node.DOCUMENT_NODE : /* DOM Level 2 */ 9;
const DOCUMENT_FRAGMENT_NODE =
  typeof Node !== 'undefined'
    ? Node.DOCUMENT_FRAGMENT_NODE
    : /* DOM Level 2 */ 11;

export const resetAxeConfiguration = (): void => {
  axeInstance.reset();
  currentSpec = cloneSpec(DEFAULT_SPEC);
  currentRunOptions = cloneRunOptions(DEFAULT_RUN_OPTIONS);
  configurationApplied = false;
};

export const configureAxe = (options: ConfigureAxeOptions = {}): void => {
  const { spec, runOptions, reset } = options;

  if (reset) {
    resetAxeConfiguration();
  }

  if (!configurationApplied && !reset) {
    axeInstance.configure(convertSpecForAxe(currentSpec));
    configurationApplied = true;
  }

  if (spec) {
    currentSpec = mergeSpec(currentSpec, spec);
  }

  axeInstance.configure(convertSpecForAxe(currentSpec));
  configurationApplied = true;

  if (runOptions) {
    currentRunOptions = mergeRunOptions(currentRunOptions, runOptions);
  }
};

export const getAxeConfiguration = (): AxeConfigurationSnapshot => ({
  spec: cloneSpec(currentSpec),
  runOptions: cloneRunOptions(currentRunOptions),
});

export const runAxeAudit = async (
  target: AccessibilityAuditTarget,
  override?: RunOptions
): Promise<AxeResults> => {
  ensureConfigured();

  return withAxeMutex(async () => {
    const resolvedContext = normalizeTarget(target);
    const auditDocument =
      resolveDocument(target) ?? resolveDocument(resolvedContext ?? target);

    // Always attempt to bind globals for the audit document's window.
    // bindWindowGlobals will return undefined if the SPECIFIC window is already bound,
    // ensuring we don't double-bind or restore incorrectly.
    // This supports both test-managed globals (via createIsolatedDom)
    // and standalone usage (direct runAxeAudit calls).
    const restoreGlobals = bindWindowGlobals(
      auditDocument?.defaultView ?? null
    );

    const runOptions = override
      ? mergeRunOptions(currentRunOptions, override)
      : cloneRunOptions(currentRunOptions);

    try {
      if (DEBUG_AXE_GLOBAL_BINDINGS) {
        console.log('[axe-globals] before-run', {
          hasWindow:
            typeof (globalThis as Record<string, unknown>).window !==
            'undefined',
          hasDocument:
            typeof (globalThis as Record<string, unknown>).document !==
            'undefined',
          bindingId: (globalThis as Record<string, unknown>)[
            WINDOW_BINDING_KEY
          ],
        });
      }

      return await axeInstance.run(resolvedContext, runOptions);
    } finally {
      if (DEBUG_AXE_GLOBAL_BINDINGS) {
        console.log('[axe-globals] after-run', {
          hasWindow:
            typeof (globalThis as Record<string, unknown>).window !==
            'undefined',
          hasDocument:
            typeof (globalThis as Record<string, unknown>).document !==
            'undefined',
          bindingId: (globalThis as Record<string, unknown>)[
            WINDOW_BINDING_KEY
          ],
        });
      }
      restoreGlobals?.();
    }
  });
};

export interface AccessibilityTestContext {
  target: AccessibilityAuditTarget;
  audit(overrides?: RunOptions): Promise<AxeResults>;
}

export const createA11yTestContext = (
  target: AccessibilityAuditTarget,
  overrides?: RunOptions
): AccessibilityTestContext => {
  const baseOverrides = overrides
    ? mergeRunOptions({} as RunOptions, overrides)
    : undefined;

  return {
    target,
    async audit(additionalOverrides?: RunOptions) {
      const mergedOverrides = baseOverrides
        ? additionalOverrides
          ? mergeRunOptions(baseOverrides, additionalOverrides)
          : baseOverrides
        : additionalOverrides;
      return runAxeAudit(target, mergedOverrides);
    },
  };
};

function ensureConfigured(): void {
  if (!configurationApplied) {
    axeInstance.configure(convertSpecForAxe(currentSpec));
    configurationApplied = true;
  }
}

const normalizeTarget = (target: AccessibilityAuditTarget): ElementContext => {
  if (isDocument(target)) {
    const documentElement = target.documentElement;
    if (!documentElement) {
      throw new Error('Document target is missing documentElement');
    }
    return documentElement;
  }

  if (isDocumentFragment(target)) {
    if (!target.ownerDocument) {
      throw new Error('DocumentFragment target is missing ownerDocument');
    }
    const container = target.ownerDocument.createElement('div');
    container.append(target.cloneNode(true));
    return container;
  }

  return target as ElementContext;
};

const isDocument = (value: AccessibilityAuditTarget): value is Document =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'nodeType' in value &&
      (value as { nodeType?: number }).nodeType === DOCUMENT_NODE
  );

const isDocumentFragment = (
  value: AccessibilityAuditTarget
): value is DocumentFragment =>
  Boolean(
    value &&
      typeof value === 'object' &&
      'nodeType' in value &&
      (value as { nodeType?: number }).nodeType === DOCUMENT_FRAGMENT_NODE
  );

const resolveDocument = (value: unknown): Document | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const nodeType = (value as { nodeType?: number }).nodeType;

  if (nodeType === DOCUMENT_NODE) {
    return value as Document;
  }

  const possibleOwnerDocument = (value as { ownerDocument?: Document })
    .ownerDocument;
  if (possibleOwnerDocument) {
    return possibleOwnerDocument;
  }

  const possibleDocument = (value as { document?: Document }).document;
  if (possibleDocument) {
    return possibleDocument;
  }

  return undefined;
};

export const bindWindowGlobals = (
  windowLike: Window | null
): (() => void) | undefined => {
  if (!windowLike) {
    return undefined;
  }

  const globalRef = globalThis as typeof globalThis & Record<string, unknown>;
  const extendedWindow = windowLike as Window &
    typeof globalThis & {
      Document?: typeof Document;
      DocumentFragment?: typeof DocumentFragment;
      Text?: typeof Text;
    };
  const documentLike = extendedWindow.document;
  const bindingId = assignWindowBindingId(extendedWindow);
  const previousBindingId = (globalRef[WINDOW_BINDING_KEY] ?? undefined) as
    | number
    | undefined;

  logAxeGlobalBinding('bind:start', {
    bindingId,
    previousBindingId,
    hasDocument: Boolean(documentLike),
  });

  const previous = {
    window: globalRef.window,
    document: globalRef.document,
    Node: globalRef.Node,
    Element: globalRef.Element,
    navigator: globalRef.navigator,
    self: (globalRef as { self?: typeof globalRef.self }).self,
    HTMLElement: globalRef.HTMLElement,
    HTMLCanvasElement: (
      globalRef as { HTMLCanvasElement?: typeof HTMLCanvasElement }
    ).HTMLCanvasElement,
    Document: (globalRef as { Document?: typeof Document }).Document,
    DocumentFragment: (
      globalRef as { DocumentFragment?: typeof DocumentFragment }
    ).DocumentFragment,
    Text: globalRef.Text,
    bindingId: previousBindingId,
  };

  globalRef.window = extendedWindow;
  globalRef.document = documentLike;
  globalRef.Node = extendedWindow.Node;
  globalRef.Element = extendedWindow.Element;
  globalRef.navigator = extendedWindow.navigator;
  globalRef.self = extendedWindow as typeof globalRef.self;
  globalRef.HTMLElement = extendedWindow.HTMLElement;
  (
    globalRef as { HTMLCanvasElement?: typeof HTMLCanvasElement }
  ).HTMLCanvasElement = extendedWindow.HTMLCanvasElement;
  (globalRef as { Document?: typeof Document }).Document =
    extendedWindow.Document;
  (
    globalRef as { DocumentFragment?: typeof DocumentFragment }
  ).DocumentFragment = extendedWindow.DocumentFragment;
  globalRef.Text = extendedWindow.Text;
  globalRef[WINDOW_BINDING_KEY] = bindingId;

  logAxeGlobalBinding('bind:applied', {
    bindingId,
    previousBindingId,
    reassigned:
      previous.window !== extendedWindow || previous.document !== documentLike,
  });

  return () => {
    logAxeGlobalBinding('restore:start', { bindingId });
    globalRef.window = previous.window;
    globalRef.document = previous.document;
    globalRef.Node = previous.Node;
    globalRef.Element = previous.Element;
    globalRef.navigator = previous.navigator;
    setOrDeleteGlobal(globalRef, 'self', previous.self);
    setOrDeleteGlobal(globalRef, 'HTMLElement', previous.HTMLElement);
    setOrDeleteGlobal(
      globalRef as { HTMLCanvasElement?: typeof HTMLCanvasElement },
      'HTMLCanvasElement',
      (previous as { HTMLCanvasElement?: typeof HTMLCanvasElement })
        .HTMLCanvasElement
    );
    setOrDeleteGlobal(
      globalRef as { Document?: typeof Document },
      'Document',
      previous.Document
    );
    setOrDeleteGlobal(
      globalRef as { DocumentFragment?: typeof DocumentFragment },
      'DocumentFragment',
      previous.DocumentFragment
    );
    setOrDeleteGlobal(globalRef, 'Text', previous.Text);
    if (previous.bindingId !== undefined) {
      globalRef[WINDOW_BINDING_KEY] = previous.bindingId;
    } else {
      delete globalRef[WINDOW_BINDING_KEY];
    }
    logAxeGlobalBinding('restore:complete', {
      bindingId,
      previousBindingId: previous.bindingId,
    });
  };
};

const setOrDeleteGlobal = <
  T extends Record<string, unknown>,
  K extends keyof T,
>(
  container: T,
  key: K,
  value: T[K] | undefined
): void => {
  if (value !== undefined) {
    container[key] = value;
  } else {
    delete container[key];
  }
};

function mergeSpec(base: AxeSpec, override: Partial<AxeSpec>): AxeSpec {
  const merged: AxeSpec = { ...base };

  if (override.branding) {
    merged.branding = {
      ...(base.branding ?? {}),
      ...override.branding,
    };
  }

  if (override.rules) {
    const mergedRules = mergeRuleMaps(base.rules, override.rules);
    if (mergedRules) {
      merged.rules = mergedRules;
    }
  }

  if (override.checks !== undefined) {
    const baseChecks = base.checks ?? [];
    merged.checks = [...baseChecks, ...override.checks];
  }

  if (override.locale !== undefined) {
    merged.locale = {
      ...(base.locale ?? {}),
      ...override.locale,
    };
  }

  if (override.reporter !== undefined) {
    merged.reporter = override.reporter;
  }

  return merged;
}

function mergeRuleMaps(
  base?: AxeRuleMap,
  override?: AxeRuleMap
): AxeRuleMap | undefined {
  if (!base && !override) {
    return undefined;
  }

  const merged: AxeRuleMap = { ...(base ?? {}) };
  if (override) {
    for (const [ruleId, config] of Object.entries(override)) {
      merged[ruleId] = { ...(merged[ruleId] ?? {}), ...config };
    }
  }
  return merged;
}

function mergeRunOptions(base: RunOptions, override: RunOptions): RunOptions {
  const merged: RunOptions = cloneRunOptions(base);

  if (override.runOnly !== undefined) {
    merged.runOnly = cloneRunOnly(
      override.runOnly as unknown as NonNullable<RunOptions['runOnly']>
    );
  }

  if (override.resultTypes !== undefined) {
    merged.resultTypes = [...override.resultTypes];
  }

  if (override.rules) {
    const mergedRules = mergeRuleMaps(
      merged.rules as AxeRuleMap | undefined,
      override.rules as AxeRuleMap
    );
    if (mergedRules) {
      merged.rules = mergedRules;
    }
  }

  if (override.reporter !== undefined) {
    merged.reporter = override.reporter;
  }

  if (override.selectors !== undefined) {
    merged.selectors = override.selectors;
  }
  if (override.ancestry !== undefined) {
    merged.ancestry = override.ancestry;
  }
  if (override.xpath !== undefined) {
    merged.xpath = override.xpath;
  }
  if (override.absolutePaths !== undefined) {
    merged.absolutePaths = override.absolutePaths;
  }
  if (override.iframes !== undefined) {
    merged.iframes = override.iframes;
  }
  if (override.elementRef !== undefined) {
    merged.elementRef = override.elementRef;
  }

  if (override.frameWaitTime !== undefined) {
    merged.frameWaitTime = override.frameWaitTime;
  }
  if (override.preload !== undefined) {
    merged.preload = override.preload;
  }
  if (override.performanceTimer !== undefined) {
    merged.performanceTimer = override.performanceTimer;
  }
  if (override.pingWaitTime !== undefined) {
    merged.pingWaitTime = override.pingWaitTime;
  }

  return merged;
}

function cloneRunOnly(
  value: NonNullable<RunOptions['runOnly']>
): NonNullable<RunOptions['runOnly']> {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    return [...value];
  }

  if (value && typeof value === 'object') {
    const runOnlyObject = value as RunOnlyObject;
    const clonedValues = Array.isArray(runOnlyObject.values)
      ? [...runOnlyObject.values]
      : runOnlyObject.values;
    return {
      ...runOnlyObject,
      values: clonedValues,
    } as RunOnlyObject;
  }

  return value;
}

function cloneRunOptions(options: RunOptions): RunOptions {
  const cloned: RunOptions = {};

  if (options.runOnly !== undefined) {
    cloned.runOnly = cloneRunOnly(
      options.runOnly as unknown as NonNullable<RunOptions['runOnly']>
    );
  }

  if (options.resultTypes !== undefined) {
    cloned.resultTypes = [...options.resultTypes];
  }

  if (options.rules) {
    const mergedRules = mergeRuleMaps(options.rules);
    if (mergedRules) {
      cloned.rules = mergedRules;
    }
  }

  if (options.reporter !== undefined) {
    cloned.reporter = options.reporter;
  }

  if (options.selectors !== undefined) {
    cloned.selectors = options.selectors;
  }
  if (options.ancestry !== undefined) {
    cloned.ancestry = options.ancestry;
  }
  if (options.xpath !== undefined) {
    cloned.xpath = options.xpath;
  }
  if (options.absolutePaths !== undefined) {
    cloned.absolutePaths = options.absolutePaths;
  }
  if (options.iframes !== undefined) {
    cloned.iframes = options.iframes;
  }
  if (options.elementRef !== undefined) {
    cloned.elementRef = options.elementRef;
  }
  if (options.frameWaitTime !== undefined) {
    cloned.frameWaitTime = options.frameWaitTime;
  }
  if (options.preload !== undefined) {
    cloned.preload = options.preload;
  }
  if (options.performanceTimer !== undefined) {
    cloned.performanceTimer = options.performanceTimer;
  }
  if (options.pingWaitTime !== undefined) {
    cloned.pingWaitTime = options.pingWaitTime;
  }

  return cloned;
}

function cloneSpec(spec: AxeSpec): AxeSpec {
  const cloned: AxeSpec = { ...spec };

  if (spec.branding) {
    cloned.branding = { ...spec.branding };
  }

  if (spec.rules) {
    const mergedRules = mergeRuleMaps(spec.rules);
    if (mergedRules) {
      cloned.rules = mergedRules;
    }
  }

  if (spec.checks) {
    cloned.checks = [...spec.checks];
  }

  if (spec.locale) {
    cloned.locale = { ...spec.locale };
  }

  if (spec.reporter !== undefined) {
    cloned.reporter = spec.reporter;
  }

  return cloned;
}

function convertSpecForAxe(spec: AxeSpec): AxeSpecInput {
  const { rules, ...rest } = spec;
  const specInput: Record<string, unknown> = { ...rest };

  if (rules) {
    specInput.rules = Object.entries(rules).map(([ruleId, config]) => ({
      id: ruleId,
      ...config,
    }));
  }

  return specInput as AxeSpecInput;
}

export const isAxeRuleEnforced = (ruleId: string): boolean =>
  Boolean(DEFAULT_ACCESSIBILITY_RULES[ruleId]?.enabled !== false);
