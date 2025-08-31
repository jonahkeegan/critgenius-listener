#!/usr/bin/env node
/**
 * Legacy Orchestration Script (pre-v3)
 * Purpose: Provides a stable rollback target referencing the last experimental (v2) implementation.
 * Note: Do NOT point this at the primary wrapper (`dev-orchestration.mjs`) to avoid indirect self-delegation.
 */
import './dev-orchestration.v2.mjs';
