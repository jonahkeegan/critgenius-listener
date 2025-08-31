#!/usr/bin/env node
/** Primary Orchestration Script (v3)
 * Delegates to dev-orchestration.v3.mjs.
 */
import { orchestrate } from './dev-orchestration.v3.mjs';
orchestrate().catch(err => { console.error('[v3] orchestration failed:', err); process.exitCode = 1; });
