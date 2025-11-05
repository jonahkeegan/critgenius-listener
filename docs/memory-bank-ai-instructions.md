# Memory Bank AI Instructions

**Last Updated:** 2025-11-04  
**Version:** 1.0.0 - AI-specific instructions split from memory-bank-update-guide.md  
**Target Audience:** AI coding assistants (GPT-5, Claude, etc.)

This guide provides specialized instructions optimized for AI coding assistants when working with
the CritGenius Listener memory bank system. It contains mandatory behaviors, decision-making
protocols, and communication guidelines.

---

## GPT-5 Specific Instructions

### 12.1 Mandatory Behaviors

**YOU MUST:**

- ✅ Update raw_reflection_log.md after EVERY task completion
- ✅ Check row counts before adding content to any file
- ✅ Verify active file designation from indexes before updating
- ✅ Obtain user confirmation before pruning raw log
- ✅ Preserve closing code fence when updating raw log
- ✅ Use PST timezone for ALL timestamps
- ✅ Include validation commands in progress entries
- ✅ Cross-check for duplicate patterns before adding new ones
- ✅ Update indexes immediately after modifying tracked files
- ✅ Execute all validation checkpoints before completing workflow

**YOU MUST NEVER:**

- ❌ Skip raw log documentation for "simple" tasks
- ❌ Prune raw log without user confirmation
- ❌ Exceed 300-row limit in paginated files
- ❌ Add patterns without validation commands
- ❌ Update files without checking active designation
- ❌ Create vague or generic entries
- ❌ Skip consistency validation (Step 8)
- ❌ Assume row counts without verification
- ❌ Auto-correct perceived inconsistencies without documentation
- ❌ Consolidate single entries prematurely

### 12.2 Decision-Making Protocol

**When uncertain about file selection:**

1. Consult Decision Matrix (Section 4 in Workflow Guide)
2. Check indexes for active file designation
3. Ask user for clarification if ambiguous
4. Default to most conservative choice (don't create new files unnecessarily)

**When detecting inconsistencies:**

1. Document the inconsistency explicitly
2. Identify most authoritative source
3. Propose correction with rationale
4. Update all affected files simultaneously
5. Log correction in update logs

**When consolidating patterns:**

1. Verify at least 5 entries in raw log OR clear pattern evident
2. Search existing patterns for duplicates
3. Synthesize into problem/solution/benefits format
4. Add validation command that confirms pattern
5. Cross-reference related patterns
6. Mark raw entries for pruning only after consolidation verified

### 12.3 Quality Assurance Protocol

**Before Completing Any Memory Bank Update:**

1. Run through all applicable validation checkpoints
2. Verify row counts match indexes (±5 tolerance)
3. Test that validation commands execute successfully
4. Confirm cross-references resolve correctly
5. Check timestamps use consistent format (YYYY-MM-DD PST)
6. Ensure no duplicate patterns or contradictions
7. Verify user confirmation obtained for any deletions

**If Validation Fails:**

1. Do NOT proceed to task completion
2. Document validation failure
3. Correct issues systematically
4. Re-run validation
5. Only complete after full validation passes

### 12.4 Context Management for AI Assistants

**At Session Start:**

1. Load activeContext.md first for overview
2. Load relevant index files second
3. Load specific active files as needed
4. Use indexes to find patterns without loading all files

**During Session:**

1. Keep track of which files have been modified
2. Maintain list of pending index updates
3. Note row count changes as you work
4. Track cross-references that need updating

**Before Session End:**

1. Complete all pending index updates
2. Verify consistency across modified files
3. Document all changes in appropriate logs
4. Update activeContext if milestone reached
5. Note any incomplete work for next session

### 12.5 Error Recovery Protocol

**If You Realize You Made a Mistake:**

1. DO NOT attempt to hide or quickly fix it
2. Explicitly acknowledge the error
3. Document what went wrong and why
4. Propose correction approach
5. Execute correction with full validation
6. Log the correction in update logs

**If User Points Out an Issue:**

1. Acknowledge the feedback immediately
2. Verify the issue by checking files
3. Propose specific correction
4. Execute correction systematically
5. Add preventive measure to avoid recurrence

### 12.6 Communication Protocol

**When Reporting Memory Bank Updates:**

- ✅ List specific files updated
- ✅ Include row count changes
- ✅ Note validation commands executed
- ✅ Highlight any new files created
- ✅ Summarize key patterns captured

**When Asking for Guidance:**

- ✅ Be specific about uncertainty
- ✅ Present options with pros/cons
- ✅ Reference relevant sections of this guide
- ✅ Ask targeted questions

**When Completing Task:**

- ✅ Confirm all memory bank updates complete
- ✅ Verify validation passed
- ✅ List files modified with row counts
- ✅ Note any follow-up items for next session

---

## AI-Specific Context Management

### Handling Large Memory Banks

When memory bank files approach the 300-row limit:

1. **Prioritize Active Files**: Load only the most recent/paginated files first
2. **Use Index Navigation**: Rely on indexes to locate specific information
3. **Batch Processing**: Process related updates together to minimize file loads
4. **Session Continuity**: Document current state for seamless handoff to next session

### Working with Paginated Systems

When dealing with consolidated-learnings-XXX.md, progress-XXX.md, or systemPatterns-XXX.md files:

1. **Always Check Index First**: Use learnings-index.md, index-progress.md, or
   systemPatterns-index.md to find the active file
2. **Understand Pagination Logic**: Files are numbered sequentially (001, 002, 003...)
3. **Create New Files at Threshold**: When active file reaches 300 rows, create new file with
   incremented number
4. **Update Indexes Immediately**: After creating new file, update the corresponding index

### Handling Timezone Consistency

**PST Timezone Requirements:**

- All timestamps must use PST timezone
- Format: YYYY-MM-DD (e.g., 2025-11-04)
- Consistency across all memory bank files is mandatory
- If uncertain about timezone, default to PST

### Cross-Reference Validation

When creating or updating cross-references:

1. **Verify Target Exists**: Confirm referenced file and section exist before linking
2. **Use Relative Paths**: Reference memory bank files without absolute paths
3. **Test Links**: Verify all cross-references resolve correctly
4. **Update Bidirectionally**: When appropriate, add reciprocal references

---

## AI Session Handoff Protocol

### End-of-Session Documentation

Before ending any AI session that involved memory bank updates:

1. **Complete All Updates**: Ensure all planned memory bank modifications are finished
2. **Update Indexes**: All index files must reflect current state
3. **Document Current State**: Note which files were modified and their new row counts
4. **List Pending Items**: Identify any follow-up work for next session
5. **Validate Consistency**: Run final consistency check across all modified files

### Session Start Protocol

When beginning a new AI session:

1. **Load activeContext.md**: Get project overview and recent milestones
2. **Check Index Files**: Understand current memory bank structure
3. **Review Recent Changes**: Look at latest progress entries and updates
4. **Identify Task Context**: Understand what work was previously done
5. **Plan Memory Bank Updates**: Determine what updates may be needed

### Error Handling for AI Sessions

**If Context Window Limits Are Reached:**

1. Prioritize active files and recent content
2. Use indexes to locate specific information without loading full files
3. Process memory bank updates in smaller batches
4. Defer non-critical updates to next session

**If Memory Bank Files Are Out of Sync:**

1. Identify the most authoritative source for each data type
2. Propose systematic correction approach
3. Update all affected files consistently
4. Document the correction process
5. Validate final state before proceeding

---

## Quality Assurance for AI

### Automated Validation Checks

Before completing any memory bank update task:

**File Integrity Checks:**

- [ ] All updated files save successfully
- [ ] No syntax errors in markdown files
- [ ] Closing code fences preserved in raw log
- [ ] Template structures maintained

**Content Validation Checks:**

- [ ] Row counts verified before and after updates
- [ ] Timestamps use consistent PST format
- [ ] Validation commands reference existing scripts
- [ ] File paths resolve to actual files

**Cross-Reference Checks:**

- [ ] All internal links resolve correctly
- [ ] External documentation references are valid
- [ ] No broken cross-references introduced
- [ ] Related patterns properly linked

**Index Synchronization:**

- [ ] All index files reflect current file state
- [ ] Active file designations are accurate
- [ ] Row counts in indexes match actual files
- [ ] Update logs are current and descriptive

### Red Flag Detection

**Immediate Action Required If:**

- ❌ Raw log exceeds 100 rows without consolidation plan
- ❌ Any file exceeds 320 rows
- ❌ Validation commands fail when tested
- ❌ Cross-references point to non-existent content
- ❌ Indexes show contradictory information
- ❌ User reports confusion about memory bank state

**Escalation Protocol:**

1. Stop current task progression
2. Document the specific issue
3. Propose corrective action plan
4. Execute corrections systematically
5. Validate fix before proceeding
6. Add preventive measures to avoid recurrence

---

## AI-Specific Templates

### Memory Bank Status Report Template

```markdown
## Memory Bank Update Status Report

**Session:** [Date/Time PST] **Task:** [Brief description]

**Files Modified:**

- [File name]: [Old rows] → [New rows]
- [File name]: [Old rows] → [New rows]

**Validation Completed:**

- ✅ Row count verification
- ✅ Cross-reference validation
- ✅ Command accuracy check
- ✅ Index synchronization

**Patterns Captured:**

- [Pattern name] → [Destination file]
- [Pattern name] → [Destination file]

**Next Session Follow-ups:**

- [Any pending items for next session]
```

### Error Documentation Template

```markdown
## Memory Bank Error Report

**Date:** [YYYY-MM-DD PST] **Issue:** [Brief description] **Impact:** [Files/systems affected]

**Root Cause:** [Why the error occurred] **Correction Applied:** [What was fixed] **Prevention
Measure:** [How to avoid recurrence]

**Validation:** [Verification that fix works]
```

---

## Related Documentation

- **[Memory Bank Setup Guide](memory-bank-setup-guide.md)** — Entry point for understanding the
  memory bank system
- **[Memory Bank Workflow Guide](memory-bank-workflow-guide.md)** — Step-by-step operational
  workflows for updating the memory bank
- **[Memory Bank Templates](memory-bank-templates.md)** — Ready-to-use templates and examples for
  creating entries
- **[Memory Bank Maintenance Guide](memory-bank-maintenance-guide.md)** — Ongoing maintenance and
  quality assurance procedures

---

**End of AI Instructions**

This guide provides the specialized instructions needed for AI coding assistants to effectively
maintain the memory bank system while ensuring quality and consistency.
