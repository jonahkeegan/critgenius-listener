#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

import { loadPolicy } from './validate-versions.mjs';

const CWD = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(CWD, '..');
const REGISTRY_PATH = join(REPO_ROOT, '.git', 'tool-registry.json');

function execGit(args) {
  return new Promise((resolveExec, rejectExec) => {
    execFile('git', args, { cwd: REPO_ROOT }, (error, stdout, stderr) => {
      if (error) {
        rejectExec({ error, stdout, stderr });
        return;
      }
      resolveExec(stdout.trim());
    });
  });
}

async function resolveHeadCommit() {
  try {
    return await execGit(['rev-parse', 'HEAD']);
  } catch {
    return 'UNKNOWN';
  }
}

async function resolveLastCommitForFile(file) {
  try {
    return await execGit(['log', '-n', '1', '--pretty=format:%H', '--', file]);
  } catch {
    return null;
  }
}

async function buildRegistry() {
  const tools = await loadPolicy();
  const registry = {
    generatedAt: new Date().toISOString(),
    head: await resolveHeadCommit(),
    tools: [],
  };

  for (const tool of tools) {
    const files = new Set();
    for (const source of tool.versionSources ?? []) {
      files.add(source.file);
    }
    const fileMetadata = {};
    for (const file of files) {
      const commit = await resolveLastCommitForFile(file);
      fileMetadata[file] = commit;
    }
    registry.tools.push({
      id: tool.id,
      displayName: tool.displayName,
      category: tool.category,
      expectedVersion: tool.expected?.version ?? null,
      minimumVersion: tool.expected?.minimum ?? null,
      versionSources: Array.from(files),
      lastKnownCommits: fileMetadata,
    });
  }

  return registry;
}

async function run() {
  try {
    const registry = await buildRegistry();
    await writeFile(REGISTRY_PATH, `${JSON.stringify(registry, null, 2)}\n`);
    console.log(`Tool registry updated at ${REGISTRY_PATH}`);
  } catch (error) {
    console.error('Failed to build tool registry.');
    console.error(error?.message ?? error);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run();
}
