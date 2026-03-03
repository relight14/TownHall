---
description: Analyze session changes, classify them across documentation areas, preview the plan, then write all docs. Covers features (cross-cutting domain), client (React/hooks), server (Express/API), architecture, and reference.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash(git log:*), Bash(git diff:*), Bash(git branch:*), Bash(git status:*), Bash(ls:*), Bash(find:*), Bash(date:*)
argument-hint: [optional: brief session description]
---

# Document Changes

## Step 1: Load configuration and agent memory

Read both files before doing anything else:

1. `.claude/skills/feature-docs/SKILL.md` — get `DOCS_BASE`, `DOCS_EXT`, `INDEX_FILE`, `USES_FRONTMATTER`, and all templates
2. `.claude/skills/feature-docs/AGENT.md` — load agent memory: project map, domain vocabulary, recent decisions, known gotchas

If `AGENT.md` doesn't exist yet, create it using the **Agent Memory Template** below with empty sections, then continue.

### Agent Memory Template

```markdown
# Agent Memory

> Persistent memory for the document-changes command.
> Updated automatically after each documentation session.

## Last Updated

YYYY-MM-DD

## Project Map

| Doc Path | Area | Last Updated | Summary |
| -------- | ---- | ------------ | ------- |

## Recent Decisions (max 15)

| Date | Decision | Context |
| ---- | -------- | ------- |

## Domain Vocabulary

| Term | Meaning |
| ---- | ------- |
| Ledewire | Micropayment platform for content monetization |
| Series | A collection of premium video episodes |
| Episode | A single paid video within a series |
| SSO Cookie | Cross-subdomain auth via refresh token in cookie |

## Known Gotchas

- (none yet)
```

---

## Step 2: Scan changes from the session

Run the following to gather raw evidence:

```bash
# What files changed in this branch vs main
git diff --name-only main...HEAD 2>/dev/null || git diff --name-only HEAD~1 2>/dev/null || git diff --name-only --cached

# Summary of actual changes (not full diff, just stat)
git diff --stat main...HEAD 2>/dev/null || git diff --stat HEAD~1 2>/dev/null

# Recent commit messages for context
git log --oneline -10 2>/dev/null

# Current branch name
git branch --show-current 2>/dev/null
```

If $ARGUMENTS is provided, treat it as the developer's own description of what was done — weight it heavily in classification.

If the session context (conversation history) contains implementation details, decisions, or gotchas — extract and record them now. They are more valuable than git diffs alone.

---

## Step 3: Classify changes

For each changed file or logical group of changes, assign it to one or more documentation areas:

| Area         | Folder          | Trigger signals |
| ------------ | --------------- | --------------- |
| Features     | `features/`     | Cross-cutting domain topics: PostHog integration, Ledewire purchases, content monetization, admin panel, SSO, wallet top-ups, article previews |
| Client       | `client/`       | React components, hooks (TanStack Query), UI (shadcn/Radix), Tailwind, routing (React Router), VideoStoreContext, client-side state |
| Server       | `server/`       | Express routes, middleware, storage layer (Drizzle/Neon), Ledewire API client, admin auth, Google OAuth, error handling |
| Architecture | `architecture/` | Monorepo structure, path aliases, build system (Vite/esbuild), deployment topology, cross-layer decisions, DDD patterns |
| Reference    | `reference/`    | Package changes, env vars, tooling, build scripts, test config, Playwright setup |

### Classification rules

1. A file in `server/` triggers **Server**. A file in `client/src/` triggers **Client**.
2. If the change spans both client and server for the same domain concern (e.g., error tracking end-to-end), it triggers **Features** as the primary area, with Server/Client as secondary.
3. Schema changes (`shared/schema.ts`) trigger **Server** (DB) + **Features** (if new entity).
4. Package.json / .env changes trigger **Reference**.
5. CLAUDE.md or `.claude/` changes trigger **Reference** only if they document tooling. Otherwise skip.
6. A single session can produce docs in **multiple areas**. This is expected and correct.

For each area triggered, determine:

- **Is this a new topic or an update to an existing doc?**
- **What is the parent folder / document name?**
- **What sub-feature or section name applies?**

Cross-reference `AGENT.md`'s project map to avoid duplicating existing docs — update them instead.

---

## Step 4: Compact the session into a summary

Before building the preview, synthesize a compact internal summary:

```
SESSION SUMMARY
───────────────
Branch: {branch-name}
Date: {today}
Developer note: {$ARGUMENTS or "none provided"}

Changes detected:
  {list of changed files grouped by type}

What was done:
  {1-3 sentence description of the work, extracted from context + diffs}

Key decisions made:
  {bullet list — what was chosen and why, if known}

Gotchas found:
  {anything unexpected, tricky, or worth warning the next dev about}

Dependencies introduced:
  {new packages, services, or APIs, if any}

Classification result:
  features/     → {list of domain topics touched, or "none"}
  client/       → {list of client topics, or "none"}
  server/       → {list of server topics, or "none"}
  architecture/ → {list of architecture topics, or "none"}
  reference/    → {list of reference topics, or "none"}
```

Do not write any files yet.

---

## Step 5: Show preview and require confirmation

Present the full documentation plan to the user. **Nothing is written until the user confirms.**

Format the preview as:

```
DOCUMENTATION PLAN
══════════════════════════════════════════════════════

SESSION SUMMARY
  {compact summary from Step 4}

PROPOSED CHANGES
──────────────────

  [FEATURE] features/{domain}/{sub-feature}.md           ← CREATE / UPDATE
    Domain: {domain name}
    Covers: {use cases, business rules, integrations}
    Design decision: {key architectural choice and reason}

  [SERVER] server/{topic}.md                             ← CREATE / UPDATE
    Section: {which section changes}
    Adds: {what's new}

  [CLIENT] client/{topic}.md                             ← CREATE / UPDATE
    Covers: {component, hook, or screen}

  [ARCHITECTURE] architecture/{topic}.md                 ← CREATE / UPDATE
    Covers: {what decision or pattern}

  [REFERENCE] reference/{topic}.md                       ← CREATE / UPDATE
    Covers: {env vars, packages, tooling}

  [CHANGELOG] docs/CHANGELOG.md                          ← APPEND
    Entry: "{date} — {one-line summary}" → links to all above

  [AGENT MEMORY] .claude/skills/feature-docs/AGENT.md    ← UPDATE
    Adds to: recent decisions, project map

──────────────────
Files to create:  {count}
Files to update:  {count}
──────────────────

Nothing has been written yet.

Reply with one of:
  "ok" or "proceed" — write everything as planned
  "change X to Y" — modify the plan, then re-show preview
  "cancel" — abort without writing anything
```

Wait for the user's response. Do not proceed until you receive explicit confirmation.

If the user requests changes to the plan, apply them, show the updated preview again, and wait for confirmation again. Repeat until confirmed.

---

## Step 6: Write all documentation files

Only after confirmed — write all files from the approved plan.

### For each `features/` entry:

Use the **Sub-Feature Template** from `SKILL.md` (without frontmatter since USES_FRONTMATTER=false).

A feature doc must include:

- **What It Does** — user-facing explanation of the feature
- **Files Changed** — table of paths and their purpose
- **Key Logic** — implementation approach in words (NO code snippets)
- **Decisions** — what was chosen, why, what alternatives were considered
- **Gotchas** — non-obvious things that would trip someone up
- **Dependencies** — new packages, services, env vars, or APIs

### For each `server/` entry:

A server doc must include:

- API routes or middleware introduced/changed
- DB schema changes (tables, columns, relations) if any
- Error handling approach
- Environment variables required
- Integration points (Ledewire, PostHog, etc.)

### For each `client/` entry:

A client doc must include:

- Component or hook purpose
- Props / API surface
- State management approach (TanStack Query, VideoStoreContext)
- Dependencies on server routes or domain logic
- Test coverage notes

### For each `architecture/` entry:

An architecture doc must include:

- Decision context (what problem was being solved)
- Options considered
- Decision made and rationale
- Consequences and tradeoffs
- Which parts of the codebase are affected

### For each `reference/` entry:

A reference doc must include:

- What changed (packages, env vars, config files)
- Why it was needed
- How to configure it

### Parent index files

If this is the first doc in a `features/{parent}/` folder, also create the parent `README.md` using the **Parent Index Template** from `SKILL.md`.

If the parent already exists, update its Sub-Features table to include the new doc.

---

## Step 7: Update changelog

File: `docs/CHANGELOG.md`

If the file doesn't exist, create it with the changelog header from `SKILL.md`.

Prepend a new entry to the top of the table:

```
| {date} | {one-line summary of the session} | {type icon} | {comma-separated links to all docs written} |
```

---

## Step 8: Update AGENT.md memory

Update `.claude/skills/feature-docs/AGENT.md`. Hard cap: **300 lines**.

### 8a. Health check first

Count total lines in AGENT.md. If already > 250 lines, compact **before**
writing new entries — this avoids ever exceeding the cap.

### 8b. Compaction (only if > 250 lines)

Archive the current file to `.claude/skills/feature-docs/AGENT-archive-{YYYY-MM-DD}.md`
before writing the compacted version.

1. **Recent Decisions** — keep the last 15 entries as-is. Summarize all
   older entries into a single "Prior decisions (summarized):" paragraph
   at the top of the section, then remove the old rows.
2. **Known Gotchas** — auto-detect resolved gotchas by checking whether
   the referenced file/pattern still exists or still applies. Drop any
   that are resolved. Keep max 25 active.
3. **Project Map** — check each entry's doc path on disk. Remove rows
   where the file no longer exists.
4. **Domain Vocabulary** — no compaction (terms are cheap, always useful).

### 8c. Write new entries

- **Project Map** — add or update rows for every file created/updated today
- **Recent Decisions** — prepend top 1–3 decisions from this session
- **Domain Vocabulary** — add any new project-specific terms encountered
- **Known Gotchas** — add session gotchas (deduplicate against existing)
- **Last Updated** — set to today's date

### 8d. Final line count

Count lines again after writing. Track the result for the summary report.

---

## Step 9: Summary report

Show the user:

```
DOCUMENTATION WRITTEN
════════════════════════

Files created:
  - {path} — {one-line description}

Files updated:
  - {path} — {what was added/changed}

Changelog:
  - Added entry: "{date} — {summary}"

Agent memory: {line count} lines ({status})
  - {N} decisions, {N} vocabulary, {N} gotchas added
  - {compaction note if triggered, e.g. "Compacted: archived 12 old decisions, dropped 3 resolved gotchas"}

Want me to commit these documentation changes?
  Reply "commit" to create a docs commit, or "skip" to leave unstaged.
```

Where `{status}` is:
- **healthy** — under 250 lines
- **warming** — 250–300 lines (will compact next session)
- **compacted** — compaction ran this session
