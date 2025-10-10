import { z } from 'zod';

import rawPolicy from '../../../../config/tooling-version-policy.json' assert { type: 'json' };

const comparisonModes = ['minimum', 'exact'] as const;
const remediationPlatforms = ['macos', 'linux', 'windows'] as const;

type ComparisonMode = (typeof comparisonModes)[number];

type PolicyJson = unknown;

const remediationSchema = z.object({
  label: z.string(),
  command: z.string(),
  platforms: z.array(z.enum(remediationPlatforms)).optional(),
});

const cliCheckSchema = z.object({
  command: z.array(z.string()).min(1),
  comparison: z.enum(comparisonModes),
  allowFailure: z.boolean().optional(),
});

const jsonSourceSchema = z.object({
  type: z.literal('json'),
  file: z.string(),
  propertyPath: z.array(z.string()).min(1),
  comparison: z.enum(comparisonModes),
  required: z.boolean().optional(),
});

const textIncludesSchema = z.object({
  type: z.literal('text-includes'),
  file: z.string(),
  snippet: z.string(),
  required: z.boolean().optional(),
});

const versionSourceSchema = z.union([jsonSourceSchema, textIncludesSchema]);

const expectedSchema = z.object({
  version: z.string(),
  minimum: z.string().optional(),
});

const detectionSchema = z.object({
  fileGlobs: z.array(z.string()).min(1),
});

const toolSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  category: z.string(),
  expected: expectedSchema,
  detection: detectionSchema,
  versionSources: z.array(versionSourceSchema).default([]),
  cliChecks: z.array(cliCheckSchema).default([]),
  remediation: z.array(remediationSchema).default([]),
});

const toolingVersionPolicySchema = z.object({
  tools: z.array(toolSchema).min(1),
});

export type ToolingVersionPolicy = z.infer<typeof toolingVersionPolicySchema>;
export type ToolPolicy = ToolingVersionPolicy['tools'][number];
export type VersionSource = z.infer<typeof versionSourceSchema>;
export type CliCheck = z.infer<typeof cliCheckSchema>;
export type RemediationStep = z.infer<typeof remediationSchema>;
export type Comparison = ComparisonMode;
export type ExpectedVersion = z.infer<typeof expectedSchema>;

function parsePolicy(policyJson: PolicyJson): ToolingVersionPolicy {
  const parsed = toolingVersionPolicySchema.safeParse(policyJson);
  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    const messages = Object.entries(flattened.fieldErrors).flatMap(
      ([field, errors]) => (errors ?? []).map(err => `${field}: ${err}`)
    );
    const message = messages.length
      ? `Tooling version policy validation failed: ${messages.join('; ')}`
      : 'Tooling version policy validation failed due to an unknown schema error.';
    throw new Error(message);
  }

  return parsed.data;
}

const resolvedPolicy = parsePolicy(rawPolicy as PolicyJson);

export const TOOLING_VERSION_POLICY: ToolingVersionPolicy = resolvedPolicy;

export function getToolPolicyById(id: string): ToolPolicy | undefined {
  return resolvedPolicy.tools.find(tool => tool.id === id);
}

export function getAllToolIds(): string[] {
  return resolvedPolicy.tools.map(tool => tool.id);
}

export function getVersionSourceFiles(tool: ToolPolicy): string[] {
  const files = new Set<string>();
  for (const source of tool.versionSources) {
    files.add(source.file);
  }
  return Array.from(files);
}

export { toolingVersionPolicySchema };
