# Memory Bank Maintenance Guide

**Last Updated:** 2025-11-04  
**Version:** 1.0.0 - Maintenance procedures split from memory-bank-update-guide.md  
**Target Audience:** Project maintainers, quality reviewers

This guide provides ongoing maintenance procedures and quality assurance protocols for the
CritGenius Listener memory bank system. It focuses on validation checkpoints, quality metrics, and
troubleshooting procedures.

---

## Validation Checkpoints

### 6.1 Pre-Update Validation

✅ **Before Starting Workflow:**

- [ ] Task completion confirmed
- [ ] Validation commands executed successfully
- [ ] Completion report available (if applicable)
- [ ] Git history reviewed for changed files
- [ ] Decisions and learnings identified

**Purpose:** Ensure all necessary context is available before beginning memory bank updates.

**Verification Steps:**

1. Confirm task completion with user acknowledgment
2. Execute any validation commands mentioned in task
3. Locate and review task completion reports
4. Examine git diffs for changed files
5. Extract decisions and learnings from conversation

**Failure Actions:**

- If validation commands failed: Fix underlying issues before proceeding
- If completion report missing: Create or request one
- If git history unclear: Review recent commits and conversations

---

### 6.2 During Raw Log Update (Step 2)

✅ **While Logging Reflections:**

- [ ] Date uses YYYY-MM-DD format
- [ ] TaskRef includes task ID or clear title
- [ ] Learnings are specific (not generic)
- [ ] File paths and commands are accurate
- [ ] Closing fence preserved
- [ ] No corruption of previous entries

**Purpose:** Maintain raw log quality and structure integrity.

**Verification Steps:**

1. Check date format matches YYYY-MM-DD PST timezone
2. Verify TaskRef contains meaningful identifier
3. Ensure learnings include specific details and commands
4. Validate all file paths exist and are current
5. Confirm closing code fence is intact
6. Review previous entries remain uncorrupted

**Common Issues:**

- Wrong date format or timezone
- Generic, non-actionable learnings
- Outdated file paths or commands
- Template corruption

---

### 6.3 During Consolidation (Step 3)

✅ **While Distilling Patterns:**

- [ ] Active file identified from index
- [ ] Row count checked before adding
- [ ] Pattern includes problem/solution/benefits
- [ ] Pattern is actionable and generalizable
- [ ] No duplicate patterns created
- [ ] Cross-references added where appropriate

**Purpose:** Ensure consolidated learnings are valuable and non-redundant.

**Verification Steps:**

1. Read `learnings-index.md` to find active file
2. Count rows before adding new pattern
3. Check for similar patterns to avoid duplicates
4. Verify pattern follows required structure
5. Add cross-references to related patterns
6. Update index after adding pattern

**Quality Indicators:**

- Pattern solves real, recurring problems
- Implementation notes provide actionable guidance
- Validation commands verify pattern effectiveness

---

### 6.4 During Index Updates (Step 4)

✅ **While Syncing Indexes:**

- [ ] Row counts match actual file contents
- [ ] Timestamps use PST timezone
- [ ] Update log entries are descriptive
- [ ] Topic lists reflect new content
- [ ] Active file designations correct

**Purpose:** Maintain accurate metadata for file navigation and management.

**Verification Steps:**

1. Count actual rows in files being tracked
2. Use consistent PST timezone timestamps
3. Write descriptive update log entries
4. Update topic lists with new content areas
5. Verify active file designations are current

**Index Maintenance:**

- Update immediately after file modifications
- Track row counts within ±5 tolerance
- Include update rationale in logs

---

### 6.5 During Progress Logging (Step 5)

✅ **While Recording Progress:**

- [ ] Correct active progress file used
- [ ] Entry includes all required sections
- [ ] File paths are complete and accurate
- [ ] Validation commands are complete
- [ ] Outcomes are observable and measurable

**Purpose:** Ensure progress entries provide complete task traceability.

**Verification Steps:**

1. Check `index-progress.md` for correct active file
2. Follow progress entry template structure
3. Include full file paths with context
4. List all validation commands executed
5. Describe observable outcomes

**Progress Entry Quality:**

- Tasks can be reproduced from entry
- Validation commands verify current state
- Outcomes provide success criteria

---

### 6.6 During Pattern Capture (Step 6)

✅ **While Capturing Patterns:**

- [ ] Pattern is truly reusable
- [ ] Appropriate domain file selected
- [ ] All pattern sections complete
- [ ] Validation commands tested
- [ ] Related patterns cross-referenced
- [ ] Index updated with pattern summary

**Purpose:** Document only genuinely reusable patterns with full context.

**Verification Steps:**

1. Confirm pattern applies to multiple contexts
2. Select appropriate domain file via `systemPatterns-index.md`
3. Fill all required template sections
4. Test validation commands work
5. Link to related patterns
6. Update pattern index

**Pattern Validation:**

- Pattern has been used successfully multiple times
- Implementation is proven and tested
- Benefits are concrete and measurable

---

### 6.7 During Context Update (Step 7)

✅ **While Refreshing Context:**

- [ ] Version number incremented
- [ ] Latest Updates chronologically ordered
- [ ] Current Capabilities accurate
- [ ] Decision Log includes rationale
- [ ] Next Steps are actionable

**Purpose:** Keep active context current and useful for new sessions.

**Verification Steps:**

1. Increment version number logically
2. Add updates in chronological order
3. Verify capabilities reflect actual state
4. Include decision rationale in log
5. Ensure next steps are current and actionable

**Context Currency:**

- Version reflects actual progress
- Updates provide clear timeline
- Capabilities match reality

---

### 6.8 During Consistency Validation (Step 8)

✅ **While Validating Consistency:**

- [ ] Dates consistent across files
- [ ] Commands reference existing scripts
- [ ] Cross-references resolve
- [ ] Row counts match indexes
- [ ] No contradictory information

**Purpose:** Maintain data integrity across all memory bank files.

**Verification Steps:**

1. Compare timestamps across files
2. Test all documented commands
3. Check all internal and external references
4. Verify index accuracy
5. Scan for contradictions

**Consistency Checks:**

- All scripts referenced exist and work
- Cross-references point to valid content
- Information is coherent across files

---

### 6.9 Before Raw Log Pruning (Step 9)

✅ **Before Removing Entries:**

- [ ] All entries verified in consolidated file
- [ ] User confirmation obtained
- [ ] Template structure will be preserved
- [ ] Closing fence will remain intact
- [ ] Unprocessed entries identified

**Purpose:** Ensure no valuable information is lost during pruning.

**Verification Steps:**

1. Cross-reference each raw entry with consolidated file
2. Obtain explicit user confirmation
3. Verify template structure will remain
4. Identify any entries not yet processed
5. Plan selective pruning approach

**Critical Safety Measures:**

- Never prune without user confirmation
- Always preserve template structure
- Keep unprocessed entries

---

### 6.10 Post-Update Final Validation

✅ **After Completing Workflow:**

- [ ] All updated files saved
- [ ] Indexes synchronized
- [ ] No syntax errors introduced
- [ ] Cross-references valid
- [ ] Timestamps accurate
- [ ] Version numbers incremented

**Purpose:** Final quality check before considering update complete.

**Verification Steps:**

1. Confirm all files are properly saved
2. Verify all indexes reflect latest state
3. Check for markdown syntax errors
4. Test all cross-reference links
5. Validate timestamp consistency
6. Confirm version updates are logical

**Completion Criteria:**

- All workflow steps validated
- No broken references or syntax errors
- User acknowledges successful completion

---

## Quality Metrics

### 9.1 Completeness Metrics

**Raw Log Entries:**

- ✅ Contains Date, TaskRef, Learnings, Success Patterns, Implementation Excellence
- ✅ Learnings include specific file paths or commands
- ✅ At least 3 bullet points per section (when applicable)
- ✅ Includes consolidation candidates in Improvements section

**Consolidated Patterns:**

- ✅ Includes Problem, Solution, Benefits, Implementation Notes
- ✅ Contains validation command that verifies pattern
- ✅ Cross-references at least 1 related pattern (when applicable)
- ✅ Pattern name is descriptive and searchable

**Progress Entries:**

- ✅ Contains Objective, Changes, Validation, Outcomes
- ✅ Changes list includes at least 2 specific file paths
- ✅ Validation section includes at least 2 commands
- ✅ Outcomes are observable and measurable

### 9.2 Accuracy Metrics

**Command Accuracy:**

- ✅ All commands reference existing scripts in `package.json`
- ✅ File paths resolve to actual files
- ✅ Config paths point to current configuration files
- ✅ Commands execute successfully when run

**Temporal Accuracy:**

- ✅ All timestamps use PST timezone consistently
- ✅ Dates follow YYYY-MM-DD format
- ✅ Chronological ordering is maintained
- ✅ Version numbers increment logically

**Row Count Accuracy:**

- ✅ Index row counts match actual file row counts (±5 margin)
- ✅ New files created before exceeding 300 rows
- ✅ Active file designations are current
- ✅ Archived files properly marked in indexes

### 9.3 Actionability Metrics

**Pattern Actionability:**

- ✅ Pattern can be applied to new scenarios
- ✅ Implementation notes provide sufficient detail
- ✅ Validation command confirms pattern effectiveness
- ✅ Benefits are concrete and measurable

**Progress Actionability:**

- ✅ Changes can be reproduced from description
- ✅ Validation commands verify current state
- ✅ Outcomes provide measurable success criteria
- ✅ File paths enable quick navigation

**Learning Actionability:**

- ✅ Insights can inform future decisions
- ✅ Commands can be reused in similar scenarios
- ✅ Patterns are generalizable beyond specific task
- ✅ Documentation links provide additional context

### 9.4 Success Indicators

**High-Quality Memory Bank:**

- 📊 Cross-references resolve without errors
- 📊 Commands execute successfully when tested
- 📊 Patterns are frequently referenced in new tasks
- 📊 Row counts stay within limits (never exceed 310)
- 📊 Consolidation happens regularly (every 5-10 tasks)
- 📊 Active context reflects current project state
- 📊 No duplicate or contradictory patterns

**Quality Degradation Warning Signs:**

- ⚠️ Raw log exceeds 100 rows without consolidation
- ⚠️ Files exceed 320 rows
- ⚠️ Commands fail when executed
- ⚠️ Cross-references lead to missing content
- ⚠️ Patterns lack validation commands
- ⚠️ Progress entries missing file paths
- ⚠️ Timestamps inconsistent across files

---

## Troubleshooting Guide

### 10.1 Issue: Raw Log Entries Not Consolidating

**Symptoms:**

- Raw log exceeds 50 rows
- Patterns not evident
- Consolidation keeps getting deferred

**Solutions:**

1. Review entries for common themes
2. Lower threshold for consolidation (consolidate at 3-4 entries)
3. Create "Work in Progress" patterns for emerging insights
4. Schedule dedicated consolidation session

**Prevention:**

- Set consolidation reminder every 5 tasks
- Include consolidation in task completion checklist

---

### 10.2 Issue: Row Counts Don't Match Indexes

**Symptoms:**

- Index shows 250 rows, file has 280
- Active file designation incorrect
- New file not created at threshold

**Solutions:**

1. Manually count rows in actual file
2. Update index with correct count
3. Check if file was recently edited outside workflow
4. Create new file if threshold exceeded

**Prevention:**

- Always update indexes immediately after file changes
- Include row count verification in validation checkpoints
- Use automated row counter if available

---

### 10.3 Issue: Duplicate Patterns in Consolidated Learnings

**Symptoms:**

- Similar patterns appear multiple times
- Pattern names overlap
- Redundant implementation notes

**Solutions:**

1. Search existing patterns before adding new ones
2. Merge duplicate patterns into single comprehensive entry
3. Add cross-references between related patterns
4. Update indexes to remove duplicate listings

**Prevention:**

- Always search file for existing patterns before adding
- Use consistent pattern naming conventions
- Include "Related Patterns" section to surface overlaps

---

### 10.4 Issue: Commands Fail When Executed

**Symptoms:**

- Validation commands return errors
- Scripts referenced don't exist
- Config paths are incorrect

**Solutions:**

1. Verify script exists in `package.json`
2. Check if script was renamed or moved
3. Update command with current script name
4. Test command before documenting

**Prevention:**

- Execute commands during validation checkpoint
- Include command testing in quality metrics
- Regular audit of documented commands

---

### 10.5 Issue: Cross-References Lead to Missing Content

**Symptoms:**

- References point to deleted files
- Section anchors don't exist
- Pattern names changed

**Solutions:**

1. Search for content in other files
2. Update reference to correct location
3. Add redirect note if content moved
4. Remove reference if content no longer relevant

**Prevention:**

- Update references when moving content
- Periodic audit of cross-references
- Maintain redirect stubs for moved content

---

### 10.6 Issue: Files Exceed 300-Row Limit

**Symptoms:**

- Consolidated file has 350+ rows
- Progress file exceeds capacity
- Index shows overflow

**Solutions:**

1. Immediately create new numbered file
2. Move newest entries to new file
3. Update index with new active file
4. Archive old file by updating status

**Prevention:**

- Check row counts before adding content
- Create new file at 290 rows (buffer)
- Include row count in validation checkpoints

---

### 10.7 Issue: Context Window Limitations During AI Session

**Symptoms:**

- AI truncates responses
- Cannot load all memory bank files
- Runs out of context mid-update

**Solutions:**

1. Load only essential files for current task
2. Use indexes to identify relevant files
3. Focus on active files first
4. Defer non-critical updates to next session

**Prevention:**

- Keep files under 300-row limit strictly
- Regularly consolidate and prune
- Use paginated file system
- Load files selectively based on task

---

### 10.8 Issue: Inconsistent Information Across Files

**Symptoms:**

- Version numbers don't match
- Timestamps contradict
- Patterns conflict with learnings

**Solutions:**

1. Identify most recent/accurate source
2. Update all files to match correct information
3. Document correction in update log
4. Add note explaining discrepancy

**Prevention:**

- Single source of truth for each data type
- Consistency validation checkpoint
- Regular cross-file audits
- Clear update sequencing

---

### 10.9 Issue: Lost Information After Pruning

**Symptoms:**

- Entries missing from raw log
- Can't find consolidated version
- Information gap in timeline

**Solutions:**

1. Check git history for deleted content
2. Review consolidated-learnings for pattern
3. Restore from backup if available
4. Reconstruct from task completion reports

**Prevention:**

- **ALWAYS** verify consolidation before pruning
- **ALWAYS** obtain user confirmation before deletion
- Keep git history of memory bank files
- Never auto-prune without verification

---

### 10.10 Issue: New AI Session Can't Find Context

**Symptoms:**

- AI asks for information already in memory bank
- Doesn't reference established patterns
- Repeats previous work

**Solutions:**

1. Explicitly reference relevant memory bank files
2. Load activeContext.md first for overview
3. Point to specific consolidated patterns
4. Reference progress log for recent work

**Prevention:**

- Keep activeContext.md current and comprehensive
- Use descriptive pattern names for searchability
- Maintain clear indexes with topic mapping
- Include task IDs for traceability

---

## Automation Recommendations

### 11.1 Row Count Automation

**Current Process:** Manual row counting **Proposed Automation:**

```bash
node scripts/count-memory-bank-rows.mjs
```

**Capabilities:**

- Counts rows in all memory bank files
- Updates indexes automatically
- Alerts if files approach 300-row limit

**Benefits:**

- Eliminates manual counting errors
- Provides early warning for pagination
- Automates index updates

---

### 11.2 Cross-Reference Validation

**Current Process:** Manual cross-reference checking **Proposed Automation:**

```bash
node scripts/validate-memory-bank-refs.mjs
```

**Capabilities:**

- Checks that all cross-references resolve
- Identifies broken links
- Suggests corrections

**Benefits:**

- Catches broken references early
- Maintains reference integrity
- Reduces manual validation effort

---

### 11.3 Consolidation Reminder

**Current Process:** Manual tracking of consolidation needs **Proposed Automation:**

```bash
node scripts/check-consolidation-need.mjs
```

**Execution Tips:**

- Run as a pre-commit hook or manual check
- Counts raw log entries
- Alerts when consolidation is recommended
- Shows the last consolidation date

**Benefits:**

- Prevents raw log from growing too large
- Maintains a regular consolidation cadence
- Reduces cognitive load

---

### 11.4 Template Generation

**Current Process:** Manual template copying **Proposed Automation:**

```bash
node scripts/generate-memory-bank-entry.mjs --type [raw|progress|pattern]
```

**Capabilities:**

- Generates a pre-filled template
- Includes the current date and interactive prompts
- Validates structure before saving

**Benefits:**

- Ensures template consistency
- Reduces formatting errors
- Speeds up entry creation

---

## Periodic Maintenance Tasks

### Weekly Tasks

- [ ] Review raw log size (should not exceed 100 rows)
- [ ] Check for unprocessed consolidation candidates
- [ ] Validate recent cross-references
- [ ] Verify active file designations
- [ ] Test recent validation commands

### Monthly Tasks

- [ ] Comprehensive cross-reference audit
- [ ] Pattern usage analysis
- [ ] Command accuracy verification
- [ ] Index synchronization check
- [ ] Row count accuracy validation

### Quarterly Tasks

- [ ] Complete memory bank structure review
- [ ] Pattern relevance assessment
- [ ] Active context currency check
- [ ] Archive completion for old files
- [ ] Update automation scripts as needed

---

## Related Documentation

- **[Memory Bank Setup Guide](memory-bank-setup-guide.md)** — Entry point for understanding the
  memory bank system
- **[Memory Bank Workflow Guide](memory-bank-workflow-guide.md)** — Step-by-step operational
  workflows for updating the memory bank
- **[Memory Bank Templates](memory-bank-templates.md)** — Ready-to-use templates and examples for
  creating entries
- **[Memory Bank AI Instructions](memory-bank-ai-instructions.md)** — Specialized instructions for
  AI coding assistants

---

**End of Maintenance Guide**

This guide provides the maintenance procedures needed to keep the memory bank system healthy and
reliable. For setup instructions, operational workflows, and templates, see the related
documentation guides listed above.
