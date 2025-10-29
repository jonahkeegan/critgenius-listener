import { runPlaywrightSuite } from './run-e2e-lib.mjs';

const exitCode = await runPlaywrightSuite();

process.exit(exitCode);
