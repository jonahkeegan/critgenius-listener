import type { RunOptions } from 'axe-core';

export type AxeRuleMap = NonNullable<RunOptions['rules']>;

export const WCAG_21_AA_TAGS = [
  'wcag2a',
  'wcag2aa',
  'wcag21a',
  'wcag21aa',
] as const;

export type WcagTag = (typeof WCAG_21_AA_TAGS)[number];

const CORE_ENFORCEMENTS: AxeRuleMap = {
  'color-contrast': { enabled: true },
  label: { enabled: true },
  'button-name': { enabled: true },
  'link-name': { enabled: true },
};

const AUDIO_UI_EXCEPTIONS: AxeRuleMap = {
  'video-caption': { enabled: false },
};

const mergeRuleEntries = (rules: readonly AxeRuleMap[]): AxeRuleMap => {
  const merged: AxeRuleMap = {};
  for (const ruleSet of rules) {
    for (const [ruleId, config] of Object.entries(ruleSet)) {
      merged[ruleId] = { ...(merged[ruleId] ?? {}), ...config };
    }
  }
  return merged;
};

const DEFAULT_RULE_SOURCES = [CORE_ENFORCEMENTS, AUDIO_UI_EXCEPTIONS] as const;

export const createDefaultRuleMap = (): AxeRuleMap =>
  mergeRuleEntries(DEFAULT_RULE_SOURCES);

export const createDefaultRunOnly = (): Exclude<
  RunOptions['runOnly'],
  string | string[] | undefined
> => ({
  type: 'tag',
  values: [...WCAG_21_AA_TAGS],
});

export const createDefaultResultTypes = (): NonNullable<
  RunOptions['resultTypes']
> => ['violations', 'incomplete'];

export const DEFAULT_ACCESSIBILITY_RULES: Readonly<AxeRuleMap> = Object.freeze(
  mergeRuleEntries(DEFAULT_RULE_SOURCES)
);
