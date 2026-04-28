# Docs Guideline

This guide explains when and how to write a feature doc, provides templates for both planning and retrospective phases, and shows how to use a doc to kick off a new chat session without re-explaining context.

---

## When to Write a Doc

| Situation | What to write |
|---|---|
| Starting a non-trivial feature | **Pre-feature plan** — clarify the problem, goal, and design before touching code |
| Finishing a feature or bug fix | **Post-feature retrospective** — record what changed and why for future reference |
| Picking up a feature across sessions | Both — write the plan in session 1, fill in the retrospective after it's done |

Skip docs for trivial one-liner fixes. Write one whenever a future-you (or a new chat session) would need more than 30 seconds of background to understand what happened.

---

## File Naming Convention

```
docs/YYYY-MM-DD_short-feature-slug.md
```

Use the date the doc was first created. The slug should be lowercase with hyphens, descriptive enough to find at a glance.

**Examples:**
```
docs/2026-04-28_access-restricted-pages.md
docs/2026-04-28_nextauth-error-handling.md
docs/2026-05-01_kanban-drag-persistence.md
```

---

## Template: Pre-Feature Plan

Use this before starting implementation. Fill in what you know; leave blanks if unknown and fill them in later.

```markdown
# <Feature Name>

**Date:** YYYY-MM-DD
**Status:** Planning
**Scope:** List of files or areas expected to change

---

## Problem

What is broken, missing, or suboptimal? Be specific — include current behaviour vs. expected behaviour.

## Goal

What should be true once this feature is done? Keep it to 1–3 sentences.

## Key Decisions

Document design choices and alternatives you considered. This is especially useful if a "simpler" approach was rejected.

| Option | Why rejected / accepted |
|---|---|
| Option A | Accepted — reason |
| Option B | Rejected — reason |

## Implementation Plan

Break the work into ordered steps. Each step should be independently testable if possible.

1. Step one
2. Step two
3. ...

## Open Questions

Things you haven't decided yet. Remove items as they get resolved.

- [ ] Question one
- [ ] Question two

## Reference

Links, prior art, related docs, or relevant code snippets that are useful to have nearby.
```

---

## Template: Post-Feature Retrospective

Fill this in after the feature is complete. Can be a second section appended to the plan, or a standalone file if no plan was written first.

```markdown
# <Feature Name>

**Date:** YYYY-MM-DD
**Status:** Done
**Scope:** `app/foo/page.tsx`, `lib/services/foo.ts`, ...

---

## Problem

What was the issue or need that triggered this work.

## Solution

High-level description of the approach taken. 2–5 sentences. Include any non-obvious design choices.

## Files Changed

### `path/to/file.tsx`

What changed and why. Call out anything non-obvious (e.g. "Removed the redirect; made the fetch conditional to avoid a server-side call for unauthenticated users.").

### `path/to/another-file.ts`

What changed here.

---

## Notes & Gotchas

Anything that tripped you up, edge cases discovered, or things to watch for in future work related to this feature.

## Follow-up Tasks

- [ ] Thing that was deferred
- [ ] Known limitation to address later
```

---

## Combined Doc (Plan → Retrospective in One File)

When a feature spans multiple sessions, keep one file and append the retrospective below the plan when done. Use a horizontal rule and a `**Status: Done**` update to mark the transition.

```markdown
# <Feature Name>

**Date:** YYYY-MM-DD
**Status:** Planning → Done

---

## Problem
...

## Goal
...

## Implementation Plan
...

---

## Retrospective (completed YYYY-MM-DD)

## Solution
...

## Files Changed
...
```

---

## Using a Doc to Start a New Chat Session

### Attaching the file

In VS Code Copilot Chat, use the paperclip / `#file` reference to attach the doc before sending your first message:

```
#file:docs/2026-05-01_kanban-drag-persistence.md
```

Or drag the file into the chat input.

### Chat Kickoff Snippet

Paste this at the start of a new session (edit the bracketed parts):

```
I'm continuing work on [feature name] in ProjectHub — a Next.js 16 + FastAPI + PostgreSQL project management app.

Read the attached doc for full context: #file:docs/YYYY-MM-DD_feature-slug.md

[Then state exactly what you need in this session, e.g.:]
- "I need to implement step 3 from the plan."
- "The plan is done. Help me debug X."
- "Review the retrospective and help me address the first follow-up task."
```

### What to include in the kickoff message

- The specific step or question for this session (not a re-explanation of the whole project)
- Any new constraints or decisions made since the doc was last updated
- If the doc is outdated, say so briefly: "The plan changed — we're now doing Y instead of X."

---

## Quick Reference: Section Checklist

| Section | Plan | Retro |
|---|---|---|
| Problem | ✓ | ✓ |
| Goal | ✓ | — |
| Key Decisions | ✓ (if relevant) | — |
| Implementation Plan | ✓ | — |
| Open Questions | ✓ | — |
| Solution | — | ✓ |
| Files Changed | — | ✓ |
| Notes & Gotchas | — | ✓ (if any) |
| Follow-up Tasks | — | ✓ (if any) |
| Chat Kickoff Snippet | ✓ | ✓ |
