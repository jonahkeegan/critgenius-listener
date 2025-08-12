# GitHub Repository Topics and Labels Configuration Guide

**CritGenius: Listener - Infrastructure Setup Task 1.6** **Created:** 2025-01-08 **Repository:**
jonahkeegan/critgenius-listener

## Overview

This guide provides comprehensive instructions for configuring GitHub repository topics and issue
labels for the CritGenius: Listener project. This setup enhances project organization, improves
discoverability, and establishes a systematic approach to issue tracking and project management.

## Part A: Repository Topics Configuration

Repository topics improve discoverability and help categorize your project within the GitHub
ecosystem. These topics should be configured through the GitHub web interface.

### Access Repository Settings

1. Navigate to: https://github.com/jonahkeegan/critgenius-listener
2. Click the gear icon (⚙️) next to "About" on the right sidebar
3. In the "Repository settings" modal, locate the "Topics" section

### Recommended Topics Configuration

Configure the following topics for optimal categorization and discoverability:

#### Core Technology Stack Topics

```
typescript
react
nodejs
web-audio-api
assemblyai
speech-to-text
real-time-audio
mongodb
redis
websockets
```

#### Domain-Specific Topics

```
dnd
dungeons-and-dragons
tabletop-rpg
gaming
audio-transcription
speaker-identification
session-management
content-creation
```

#### Technical Classification Topics

```
audio-processing
real-time-system
privacy-first
browser-based
cross-platform
```

### Implementation Steps

1. **Add Core Technology Topics:**
   - Type each technology topic (e.g., "typescript", "react", "nodejs")
   - Press Enter after each topic to add it
   - GitHub will suggest existing topics when available

2. **Add Domain-Specific Topics:**
   - Add D&D and gaming-related topics
   - Include audio processing and transcription topics
   - Add user experience topics (session-management, content-creation)

3. **Add Technical Classification Topics:**
   - Include architecture classification topics
   - Add platform and approach descriptors

4. **Verify Topic Suggestions:**
   - GitHub may suggest alternative spellings or existing topics
   - Choose standardized versions when available
   - Maximum of 20 topics can be added per repository

### Expected Result

After configuration, the repository should display all topics under the repository description,
improving discoverability in GitHub search and topic browsing.

---

## Part B: Issue Labels Configuration

Issue labels provide systematic categorization for project management, bug tracking, and feature
development. This comprehensive label system supports effective project organization.

### Access Labels Management

1. Navigate to: https://github.com/jonahkeegan/critgenius-listener
2. Click "Issues" tab
3. Click "Labels" next to the search bar
4. You'll see the default GitHub labels - we'll modify and extend these

### Comprehensive Label System

#### Priority Labels (Red/Yellow/Green/Gray Scale)

| Label Name           | Color Code | Description                                   | Usage                                |
| -------------------- | ---------- | --------------------------------------------- | ------------------------------------ |
| `priority: critical` | #d73a49    | Critical issues requiring immediate attention | System failures, security issues     |
| `priority: high`     | #fbca04    | High priority issues for next sprint          | Major features, important bugs       |
| `priority: medium`   | #28a745    | Medium priority for upcoming development      | Standard features, minor bugs        |
| `priority: low`      | #6f42c1    | Low priority, future consideration            | Nice-to-have features, documentation |

#### Type Labels (Colored by Category)

| Label Name            | Color Code | Description                       | Usage                             |
| --------------------- | ---------- | --------------------------------- | --------------------------------- |
| `type: bug`           | #d73a49    | Something isn't working correctly | Code defects, unexpected behavior |
| `type: feature`       | #a2eeef    | New feature or enhancement        | New functionality requests        |
| `type: documentation` | #0075ca    | Documentation improvements        | README, guides, API docs          |
| `type: maintenance`   | #fef2c0    | Code maintenance and refactoring  | Technical debt, cleanup           |
| `type: enhancement`   | #84b6eb    | Improvements to existing features | Performance, UX improvements      |

#### Component Labels (System Architecture)

| Label Name                   | Color Code | Description                    | Usage                               |
| ---------------------------- | ---------- | ------------------------------ | ----------------------------------- |
| `component: audio-capture`   | #ff6b6b    | Audio recording and processing | Web Audio API, microphone handling  |
| `component: transcription`   | #4ecdc4    | Speech-to-text functionality   | AssemblyAI integration, accuracy    |
| `component: speaker-mapping` | #45b7d1    | Speaker identification system  | Voice profiles, character mapping   |
| `component: session-mgmt`    | #96ceb4    | Session management features    | Session creation, tracking, storage |
| `component: security`        | #feca57    | Security and privacy features  | Authentication, data protection     |
| `component: real-time`       | #ff9ff3    | Real-time processing systems   | WebSocket, live transcription       |

#### Status Labels (Workflow Management)

| Label Name              | Color Code | Description               | Usage                   |
| ----------------------- | ---------- | ------------------------- | ----------------------- |
| `status: investigating` | #fbca04    | Issue is being researched | Investigation phase     |
| `status: in-progress`   | #0052cc    | Actively being worked on  | Development in progress |
| `status: needs-review`  | #5319e7    | Ready for code review     | Awaiting team review    |
| `status: ready-to-test` | #28a745    | Ready for testing phase   | QA testing required     |

#### Technical Area Labels

| Label Name             | Color Code | Description                | Usage                            |
| ---------------------- | ---------- | -------------------------- | -------------------------------- |
| `area: frontend`       | #e99695    | Frontend/UI related issues | React components, user interface |
| `area: backend`        | #c2e0c6    | Backend/API related issues | Node.js, server logic            |
| `area: testing`        | #f9d0c4    | Testing infrastructure     | Jest, test coverage              |
| `area: infrastructure` | #d4c5f9    | DevOps and infrastructure  | CI/CD, deployment, containers    |
| `area: api`            | #c5def5    | API design and integration | REST endpoints, GraphQL          |

### Label Implementation Process

#### Step 1: Remove Default Labels (Optional)

Consider removing or modifying default GitHub labels that don't align with our system:

- `bug` → Replace with `type: bug`
- `enhancement` → Replace with `type: enhancement`
- `documentation` → Replace with `type: documentation`

#### Step 2: Create Priority Labels

1. Click "New label"
2. Enter label name: `priority: critical`
3. Enter color code: `#d73a49`
4. Enter description: "Critical issues requiring immediate attention"
5. Click "Create label"
6. Repeat for all priority labels

#### Step 3: Create Type Labels

Follow the same process for each type label, using the specified colors and descriptions.

#### Step 4: Create Component Labels

Add all component labels following the table specifications above.

#### Step 5: Create Status Labels

Add workflow status labels for issue lifecycle management.

#### Step 6: Create Technical Area Labels

Add area-specific labels for technical categorization.

### Label Usage Guidelines

#### Labeling Best Practices

1. **Every Issue Should Have:**
   - One priority label
   - One type label
   - At least one component label (when applicable)
   - Status labels as issues progress

2. **Label Combinations:**
   - `type: bug` + `priority: high` + `component: audio-capture`
   - `type: feature` + `priority: medium` + `area: frontend`
   - `type: documentation` + `priority: low` + `area: api`

3. **Status Progression:**
   - New Issue → `status: investigating`
   - Investigation Complete → Remove investigating, add `status: in-progress`
   - Development Complete → `status: needs-review`
   - Review Complete → `status: ready-to-test`

#### Automated Workflows (Future Enhancement)

Consider setting up GitHub Actions to:

- Automatically add status labels based on pull request activity
- Require specific label combinations before closing issues
- Generate reports based on label usage

---

## Part C: Verification and Quality Assurance

### Topics Verification Checklist

- [ ] All 20+ topics are visible under repository description
- [ ] Topics include core technologies: typescript, react, nodejs, web-audio-api
- [ ] Domain topics include: dnd, dungeons-and-dragons, tabletop-rpg
- [ ] Technical classification topics include: audio-processing, real-time-system
- [ ] Topics are properly categorized and discoverable in GitHub search
- [ ] No duplicate or misspelled topics

### Labels Verification Checklist

- [ ] All 25+ labels are created with correct names and colors
- [ ] Priority labels use consistent color scheme (red/yellow/green/gray)
- [ ] Component labels use distinct colors for easy identification
- [ ] Type labels include bug, feature, documentation, maintenance, enhancement
- [ ] Status labels support complete workflow progression
- [ ] Technical area labels cover all major system components
- [ ] No duplicate labels exist
- [ ] Label descriptions are clear and actionable

### Issue Management Setup

#### Create Sample Issues for Testing

After label configuration, create a few test issues to verify the labeling system:

1. **Sample Bug Issue:**
   - Title: "Audio capture fails in Firefox browser"
   - Labels: `type: bug`, `priority: high`, `component: audio-capture`, `area: frontend`

2. **Sample Feature Issue:**
   - Title: "Add character voice profile persistence"
   - Labels: `type: feature`, `priority: medium`, `component: speaker-mapping`

3. **Sample Documentation Issue:**
   - Title: "Create API documentation for transcription endpoints"
   - Labels: `type: documentation`, `priority: low`, `area: api`

#### Label Performance Metrics

Track the effectiveness of your labeling system:

- **Issue Resolution Time by Priority:** Monitor if critical issues are resolved faster
- **Component Distribution:** Identify which components generate most issues
- **Type Distribution:** Balance between bugs, features, and maintenance work
- **Status Progression:** Ensure issues move through workflow stages efficiently

---

## Part D: Integration with Project Workflow

### GitHub Project Integration

When setting up GitHub Projects (if used):

- Create views filtered by priority labels
- Set up automation based on status labels
- Use component labels for team assignment
- Track feature development using type labels

### Pull Request Integration

- Use labels on pull requests to match related issues
- Implement branch naming conventions that align with labels
- Set up automated label assignment based on changed files

### Team Communication

- Use labels in issue titles for quick identification
- Reference labels in commit messages
- Include label summaries in sprint planning
- Create team guidelines for consistent label usage

---

## Part E: Maintenance and Evolution

### Regular Label Review

- **Monthly:** Review label usage and effectiveness
- **Quarterly:** Assess if new labels are needed
- **Annually:** Comprehensive label system review and cleanup

### Label System Updates

As the project evolves, consider:

- Adding platform-specific labels (iOS, Android) if mobile support is added
- Creating integration labels for third-party services
- Adding performance-related labels for optimization work
- Including accessibility labels for inclusive design features

### Documentation Updates

- Keep this guide updated with any label changes
- Document team decisions about label usage
- Update examples and use cases as project grows
- Share lessons learned with label system effectiveness

---

## Implementation Timeline

### Phase 1: Initial Setup (Immediate)

- [ ] Configure repository topics (15 minutes)
- [ ] Create priority and type labels (30 minutes)
- [ ] Test basic labeling with sample issues (15 minutes)

### Phase 2: Complete System (Within 1 week)

- [ ] Create all component and status labels (45 minutes)
- [ ] Document team labeling guidelines (30 minutes)
- [ ] Train team members on label usage (1 hour)

### Phase 3: Optimization (Ongoing)

- [ ] Monitor label effectiveness and usage patterns
- [ ] Refine label descriptions based on team feedback
- [ ] Implement automation for common labeling patterns

---

## Support and Troubleshooting

### Common Issues

**Issue:** "Topics not appearing in search"

- **Solution:** Topics may take a few minutes to be indexed by GitHub search

**Issue:** "Label colors not displaying correctly"

- **Solution:** Ensure hex color codes include the # symbol and are 6 digits

**Issue:** "Too many labels making selection difficult"

- **Solution:** Use GitHub's label search functionality or create label groups

### Best Practices Reminders

1. **Consistency:** Always use the same label naming conventions
2. **Clarity:** Label descriptions should be immediately understandable
3. **Maintenance:** Regularly review and update label effectiveness
4. **Training:** Ensure all team members understand the labeling system
5. **Documentation:** Keep this guide updated with any changes

### References

- **GitHub Topics Documentation:**
  https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics
- **GitHub Labels Documentation:**
  https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels
- **Label Color Generator:** https://www.color-hex.com/ (for custom colors)

---

**Configuration Complete:** After following this guide, your repository will have comprehensive
topic categorization and a systematic issue labeling system that supports effective project
management and team collaboration.

**Next Steps:** Proceed to Task 1.7 - Create pull request and issue templates with comprehensive
checklists and guidelines.
