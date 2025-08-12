# Consolidated Learnings

**Purpose:** Curated, actionable insights derived from raw_reflection_log.md entries.

**File:** consolidated-learnings-001.md
**Status:** Active
**Last Updated:** 2025-01-11 19:49 PST
**Row Count:** 47
**Version:** 1.0

---

## Project Setup & Configuration

### TypeScript Monorepo Configuration
**Pattern: Strict TypeScript Configuration with Path Mapping**
- Use `"strict": true` in all tsconfig.json files for maximum type safety
- Configure path mapping with `"baseUrl": "src"` and `"paths"` for clean imports
- Enable `"declaration": true` for shared packages to generate .d.ts files
- *Rationale:* Strict mode catches type errors early, path mapping improves code readability, and declaration files enable proper TypeScript support across packages.

**Pattern: Workspace Package Dependencies**
- Use workspace protocol (`"workspace:*"`) for internal package references in monorepos
- Keep external dependencies aligned across packages using pnpm workspace constraints
- *Rationale:* Ensures consistency and proper dependency resolution in monorepo environments.

### pnpm Workspace Management
**Pattern: Efficient Dependency Installation**
- Use `pnpm install --filter <package>` for package-specific installations in monorepos
- Leverage pnpm's workspace linking for internal package dependencies
- *Rationale:* Reduces disk space usage and ensures consistent versions across packages.

## React & Development Environment

### Vite Configuration for React
**Pattern: Optimized Vite Configuration**
- Configure Vite with React plugin and TypeScript support
- Use proper HMR (Hot Module Replacement) settings for development
- Set appropriate build optimization for production bundles
- *Rationale:* Vite provides faster development builds and optimized production bundles compared to traditional bundlers.

### Testing Framework Integration
**Pattern: Vitest + React Testing Library Setup**
- Configure Vitest as Jest replacement with better ESM support and faster execution
- Use React Testing Library for component testing with user-centric approach
- Implement proper test setup files for consistent testing environment
- *Rationale:* Modern testing stack that integrates well with Vite and provides better developer experience.

## Memory Bank & Knowledge Management

### Knowledge Capture Protocol
**Pattern: Raw-to-Consolidated Learning Pipeline**
- Use `memory-bank/raw_reflection_log.md` for immediate, detailed logging
- Consolidate insights into `memory-bank/consolidated-learnings-XXX.md` with actionable patterns
- Maintain `memory-bank/learnings-index.md` for file management and navigation
- *Rationale:* Systematic knowledge capture prevents loss of insights and enables pattern recognition across projects.

**Pattern: Contextual Documentation**
- Document not just what was done, but why decisions were made
- Include specific version numbers, commands, and configuration details
- Reference external resources and validation sources (e.g., Context7 MCP)
- *Rationale:* Contextual information enables better decision-making in similar future situations.

---

**Note:** This file uses pagination to maintain compatibility with context window limitations. When row count approaches 300, create consolidated-learnings-002.md and update learnings-index.md accordingly.