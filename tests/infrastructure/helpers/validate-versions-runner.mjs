#!/usr/bin/env node
import { runAction } from './validate-versions-runner-core.mjs';

async function main() {
  const [, , action, payloadArg] = process.argv;
  const payload = payloadArg ? JSON.parse(payloadArg) : {};
  const result = await runAction(action, payload);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

main().catch(error => {
  console.error(JSON.stringify({ error: error.message ?? String(error) }));
  process.exitCode = 1;
});
