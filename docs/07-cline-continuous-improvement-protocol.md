---
description:
  Defines Cline's mandatory protocol for self-reflection, persistent knowledge capture using
  dedicated logs, and continuous improvement of its operational knowledge before task completion.
author: https://github.com/jeanibarz
github-url: https://github.com/cline/prompts/blob/main/.clinerules/cline-continuous-improvement-protocol.md
version: 1.1
tags: ['protocol', 'meta', 'learning', 'reflection', 'knowledge-management', 'core-behavior']
globs: ['*'] # This core protocol is always active and applies to all Cline operations.
---

# Cline Continuous Improvement Protocol

**Objective:** Ensure Cline proactively learns from tasks, captures knowledge in a structured way,
**distills fundamental insights,** refines understanding, and improves efficiency and reliability.
This protocol maintains a paginated knowledge base with `memory-bank/raw_reflection_log.md` for
initial detailed logging, and a series of `memory-bank/consolidated-learnings-XXX.md` files for
pruned, actionable, long-term knowledge. This is vital for optimal performance and avoiding
redundant effort.

**Core Principle:** Continuous learning and adaptation are **mandatory**. This protocol **must be
executed before `attempt_completion`** for tasks with new learning, problem-solving, user feedback,
or multiple steps. Trivial mechanical tasks _may_ be exempt per higher-level rules; otherwise,
execution is default.

**Key Knowledge Files:**

- **`memory-bank/raw_reflection_log.md`**: Contains detailed, timestamped, and task-referenced raw
  entries from the "Task Review & Analysis" phase. This is the initial dump of all observations.
- **`memory-bank/consolidated-learnings-XXX.md`**: Contains curated, summarized, and actionable
  insights derived from `raw_reflection_log.md`. This is the primary, refined knowledge base for
  long-term use, split into multiple files to manage context window limitations. The most recent
  active file is tracked in `memory-bank/learnings-index.md`.
- **`memory-bank/learnings-index.md`**: Tracks all consolidated learning files, indicating which is
  currently active and maintaining metadata about each file.

---

## 1. Mandatory Pre-Completion Reflection & Raw Knowledge Capture

Before signaling task completion (e.g., via `attempt_completion`), Cline **must** perform the
following internal steps:

### 1.1. Task Review & Analysis:

- Review the completed task (conversation, logs, artifacts).
- **Identify Learnings:** What new information, techniques, **underlying patterns,** API behaviors,
  project-specific commands (e.g., test, build, run flags), environment variables, setup quirks, or
  successful outcomes were discovered? **What core principles can be extracted?**
- **Identify Difficulties & Mistakes (as Learning Opportunities):** What challenges were faced? Were
  there any errors, misunderstandings, or inefficiencies? **How can these experiences refine future
  approaches (resilience & adaptation)?** Did user feedback indicate a misstep?
- **Identify Successes:** What went particularly well? What strategies or tools were notably
  effective? **What were the key contributing factors?**

### 1.2. Logging to `memory-bank/raw_reflection_log.md`:

- Based on Task Review & Analysis (1.1), create a timestamped, task-referenced entry in
  `memory-bank/raw_reflection_log.md` detailing all learnings, difficulties (and their
  resolutions/learnings), and successes (and contributing factors).
- This file serves as the initial, detailed record. Its entries are candidates for later
  consolidation.
- **Safe Update Technique:** Always append entries non-destructively by locating the file's final
  closing code fence (````) and inserting the new entry immediately before it. After the new entry,
  re-emit the same closing fence so previous content remains untouched and the file retains valid
  markdown structure.
- _Example Entry in `memory-bank/raw_reflection_log.md`:_

  ```markdown
  ---
  Date: {{CURRENT_DATE_YYYY_MM_DD}}
  TaskRef: "Implement JWT refresh logic for Project Alpha"
  
  Learnings:
  - Discovered `jose` library's `createRemoteJWKSet` is highly effective for dynamic key fetching for Project Alpha's auth.
  - Confirmed that a 401 error with `X-Reason: token-signature-invalid` from the auth provider requires re-fetching JWKS.
  - Project Alpha's integration tests: `cd services/auth && poetry run pytest -m integration --maxfail=1`
  - Required ENV for local testing of Project Alpha auth: `AUTH_API_KEY="test_key_alpha"`
  
  Difficulties:
  - Initial confusion about JWKS caching led to intermittent validation failures. Resolved by implementing a 5-minute cache.
  
  Successes:
  - The 5-minute JWKS cache with explicit bust mechanism proved effective.
  
  Improvements_Identified_For_Consolidation:
  - General pattern: JWKS caching strategy (5-min cache, explicit bust).
  - Project Alpha: Specific commands and ENV vars.
  ---
  ```

---

## 2. Knowledge Consolidation & Refinement Process (Periodic)

This outlines refining knowledge from `memory-bank/raw_reflection_log.md` into the active
`memory-bank/consolidated-learnings-XXX.md` file. This occurs periodically or when
`raw_reflection_log.md` grows significantly, not necessarily after each task.

### 2.1. Review and Identify for Consolidation:

- Periodically, or when prompted by the user or significant new raw entries, review
  `memory-bank/raw_reflection_log.md`.
- Identify entries/parts representing durable, actionable, or broadly applicable knowledge (e.g.,
  reusable patterns, critical configurations, effective strategies, resolved errors).

### 2.2. Synthesize and Transfer to the Active Consolidated Learnings File:

- **First, identify the active consolidated learnings file:**
  - Check `memory-bank/learnings-index.md` to determine the currently active file (e.g.,
    `consolidated-learnings-003.md`).
  - If this file doesn't exist, use `memory-bank/consolidated-learnings-001.md` as the default.
- **Check if the active file needs pagination:**
  - Count the number of rows in the active file.
  - If the row count is ≥ 300, create a new file with an incremented number:
    - Generate the next file number by incrementing the highest existing number.
    - Create the new file with appropriate headers and initial content.
    - Update `memory-bank/learnings-index.md` to mark the new file as active.

- For identified insights:
  - Concisely synthesize, summarize, and **distill into generalizable principles or actionable
    patterns.**
  - Add refined knowledge to the active consolidated learnings file, organizing logically (by topic,
    project, tech) for easy retrieval.
  - Ensure the content is actionable, **generalizable,** and non-redundant.
  - Update the row count and last_updated timestamp in `learnings-index.md` for the active file.
  - After transfer, **verify that every item in `raw_reflection_log.md` now exists (in distilled
    form) somewhere within the active consolidated file.** A quick diff or checklist ensures nothing
    was skipped.
- _Example Entry in consolidated learnings file (derived from raw log example):_

  ```markdown
  ## JWT Handling & JWKS

  **Pattern: JWKS Caching Strategy**

  - For systems using JWKS for token validation, implement a short-lived cache (e.g., 5 minutes) for
    fetched JWKS.
  - Include an explicit cache-bust mechanism if immediate key rotation needs to be handled.
  - _Rationale:_ Balances performance by reducing frequent JWKS re-fetching against timely key
    updates. Mitigates intermittent validation failures due to stale keys.

  ## Project Alpha - Specifics

  **Auth Module:**

  - **Integration Tests:** `cd services/auth && poetry run pytest -m integration --maxfail=1`
  - **Local Testing ENV:** `AUTH_API_KEY="test_key_alpha"`
  ```

### 2.3. Prune `memory-bank/raw_reflection_log.md`:

- **Crucially, once information has been successfully transferred and consolidated into the active
  consolidated learnings file, the corresponding original entries or processed parts **must be
  removed** from `memory-bank/raw_reflection_log.md`.**
- Before removal, perform a visual or automated comparison to confirm every reflection made it into
  the consolidated file, then **prompt the user that the raw reflections are safe to delete**. Cline
  must not delete the reflections on the user's behalf; the user performs the final cleanup.
- This keeps `raw_reflection_log.md` focused on recent, unprocessed reflections and prevents it from
  growing indefinitely with redundant information.

### 2.4. Proposing `.clinerule` Enhancements (Exceptional):

- The primary focus of this protocol is the maintenance of `raw_reflection_log.md` and the
  consolidated learnings files.
- If a significant, broadly applicable insight in a consolidated learnings file strongly suggests
  modifying _another active `.clinerule`_ (e.g., core workflow, tech guidance), Cline MAY propose
  this change after user confirmation. This is exceptional.

---

## 3. Guidelines for Knowledge Content

These guidelines apply to entries in `memory-bank/raw_reflection_log.md` (initial capture) and
especially to consolidated learnings files (refined, long-term knowledge).

- **Prioritize High-Value Insights:** Focus on lessons that significantly impact future performance,
  **lead to more robust or generalizable understanding,** or detail critical errors and their
  resolutions, major time-saving discoveries, fundamental shifts in understanding, and essential
  project-specific configurations.
- **Be Concise & Actionable (especially for consolidated learnings):** Information should be clear,
  to the point, and useful when revisited. What can be _done_ differently or leveraged next time?
- **Strive for Clarity and Future Usability:** Document insights in a way that is clear and easily
  understandable for future review, facilitating effective knowledge retrieval and application (akin
  to self-explainability).
- **Document Persistently, Refine & Prune Continuously:** Capture raw insights immediately.
  Systematically refine, consolidate, and prune this knowledge as per Section 2.
- **Organize for Retrieval:** Structure consolidated learnings files logically with clear sections
  and consistent formatting.
- **Avoid Low-Utility Information in consolidated learnings:** These files should not contain
  trivial statements. Raw, verbose thoughts belong in `raw_reflection_log.md` before pruning.
- **Support Continuous Improvement:** The ultimate goal is to avoid repeating mistakes, accelerate
  future tasks, and make Cline's operations more robust and reliable. Frame all knowledge with this
  in mind.
- **Manage Information Density:** Actively work to keep consolidated learnings files dense with
  high-value information and free of outdated or overly verbose content. The pruning of
  `raw_reflection_log.md` is key to this.

---

## 4. Knowledge File Management

This section outlines the managed pagination system for consolidated learnings files, ensuring that
knowledge remains accessible within Claude's context window limitations.

### 4.1. File Pagination System:

- **Row Count Monitoring:**
  - Consolidated learnings files must never exceed 300 rows to maintain compatibility with Claude
    3.7's processing limitations.
  - Before adding new content to a consolidated learnings file, count the current number of rows.
  - If the current row count plus the new content would exceed 300 rows, create a new file.

- **Sequential File Naming:**
  - Consolidated learnings files follow a consistent naming pattern: `consolidated-learnings-XXX.md`
  - XXX is a sequential 3-digit number (001, 002, 003, etc.)
  - When creating a new file, increment the number from the highest existing file

- **New File Creation Process:**
  - Copy standard headers and organization information from the previous file
  - Create appropriate initial content structure
  - Update the file creation timestamp
  - Begin with a clean row count

### 4.2. Knowledge Index Management:

- **Index File Structure:**
  - `memory-bank/learnings-index.md` serves as the master index for all knowledge files
  - The "Active File" section clearly indicates which file is currently receiving new entries
  - The "File Registry" section lists all consolidated learning files with metadata

- **Index Maintenance:**
  - Update the index whenever a new consolidated learnings file is created
  - Update the row count and last_updated fields when adding content to the active file
  - Maintain topic lists for each file to aid in content discovery

- **Active File Selection:**
  - Always use the file referenced in the "Active File" section of the index
  - If the index doesn't exist or is corrupt, default to the highest-numbered existing file
  - If no consolidated learnings files exist, create `consolidated-learnings-001.md`

### 4.3. Knowledge Retrieval Strategy:

- **For Focused Knowledge Retrieval:**
  - Use the index file to identify which knowledge file(s) contain relevant topics
  - Load only the specific file(s) needed for the current task

- **For Comprehensive Knowledge Review:**
  - Load the active file first for most recent learnings
  - Load additional files selectively, starting from newest to oldest, until context window limits
    are reached
  - Prioritize files with topics relevant to the current task

### 4.4. File Maintenance and Optimization:

- **Avoid Duplicating Content:**
  - Before adding new knowledge, check if similar patterns already exist
  - Consolidate and refine related entries rather than creating duplicates
  - Reference existing patterns when appropriate rather than repeating

- **Topic Tagging:**
  - Maintain consistent topic tags throughout the knowledge base
  - Update the topic lists in the index when adding new content areas
  - Use topics to create relationships between knowledge files

- **Periodic Knowledge Review:**
  - Periodically review older knowledge files for accuracy and continued relevance
  - Consider moving frequently referenced patterns from older files to newer files
  - Archive truly obsolete knowledge (rare) rather than keeping it in active files

---

## Implementation Sequence Diagram

```sequenceDiagram
    participant User
    participant Cline
    participant RawLog as raw_reflection_log.md
    participant Index as learnings-index.md
    participant ActiveFile as Latest consolidated-learnings-XXX.md

    User->>Cline: Complete task
    Cline->>Cline: Perform Task Review & Analysis
    Cline->>RawLog: Log insights, difficulties & successes

    Note over Cline,RawLog: Raw Knowledge Capture Complete

    alt Periodic Knowledge Consolidation
        Cline->>RawLog: Review for consolidation
        Cline->>Cline: Identify valuable patterns

        Cline->>Index: Check active file & row count
        Index-->>Cline: Return active file information

        alt Row count ≥ 300
            Cline->>Cline: Generate next file number
            Cline->>ActiveFile: Create new file
            Cline->>Index: Update with new active file
        end

        Cline->>ActiveFile: Add consolidated knowledge
        Cline->>Index: Update row count & timestamp
        Cline->>RawLog: Remove processed entries
    end

    Cline->>User: Present task completion
```

This enhanced protocol ensures that Cline's knowledge base remains accessible and usable even as it
grows substantially over time, preventing context window limitations from hindering knowledge
retrieval and application.
