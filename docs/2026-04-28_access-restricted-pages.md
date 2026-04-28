# Access Restricted Pages

**Date:** 2026-04-28

## Problem

Unauthenticated users hitting protected pages had a poor experience:

| Page | Old Behavior | Issue |
|---|---|---|
| `/projects` | Showed "No projects yet" empty state | Misleading — implied there was nothing to show, not that auth was required |
| `/tasks` | Hard `redirect("/user/signin")` | Abrupt; user loses context of where they were trying to go |
| `/notes` | Access Restricted card ✓ | Already correct — used as the reference design |

## Solution

Added an "Access Restricted" card to the Projects and Tasks pages that renders in-place when `getCurrentUser()` returns `null`. The hero banner remains visible so users still understand what page they landed on.

### Design (matching Notes page)

```
bg-secondary/20 backdrop-blur-md p-10 rounded-4xl border border-white/10
max-w-2xl mx-auto text-center mt-20
```

- **Icon:** Page-specific icon inside a red-tinted ring (`bg-red/20 border border-red/30`)
- **Heading:** "Access Restricted" — `text-3xl font-bold text-offwhite`
- **Body:** Descriptive message per page
- **CTA:** "Sign In Now" button linking to `/user/signin` — `bg-tertiary text-offblack font-bold rounded-2xl`

## Files Changed

### `app/projects/page.tsx`

- Replaced the single `projects.length === 0` ternary with a three-way conditional:
  1. `!user` → Access Restricted card (`FiFolder` icon)
  2. `projects.length === 0` → existing "No projects yet" empty state
  3. else → project grid
- No new imports needed; `FiFolder`, `Link`, and `getCurrentUser` were already present.

### `app/tasks/page.tsx`

- Removed `import { redirect } from "next/navigation"` and the `if (!user) redirect("/user/signin")` call.
- Made the data fetch conditional: `const rawTasks = user ? await getAllUserTasks() : [];`
  - Prevents a server-side fetch for unauthenticated requests.
- Added `!user` branch in the content section rendering the Access Restricted card (`FiCheckSquare` icon) before the existing Kanban / empty-state branches.

## Auth Pattern

All three pages now follow the same pattern:

```ts
const user = await getCurrentUser();
// fetch data conditionally
const items = user ? await fetchItems() : [];

// in JSX:
{!user ? (
    <AccessRestrictedCard />
) : items.length > 0 ? (
    <MainContent items={items} />
) : (
    <EmptyState />
)}
```
