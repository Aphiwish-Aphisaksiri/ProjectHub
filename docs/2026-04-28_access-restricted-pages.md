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

---

## Follow-up: Tasks Hero & Spacing Normalization (2026-04-28)

### Problem

After the initial implementation, the Tasks page hero and content spacing differed from Notes and Projects in 4 ways:

| Issue | Tasks (before) | Notes / Projects (reference) |
|---|---|---|
| Hero inner container | `flex flex-col justify-end gap-8 pb-10` | `h-full flex items-end pb-8` |
| Title structure | Icon + `<h1>` wrapped in two extra `flex` divs | Icon `<span>` directly inside `<h1>` |
| `<h1>` font size | `text-4xl md:text-6xl` (responsive) | `text-6xl` (flat) |
| Content container margin | `mt-10` | `mt-6` |
| Access Restricted card margin | `mt-10` | `mt-20` |

### Changes Made (`app/tasks/page.tsx`)

1. **Hero inner container** — replaced `relative z-10 mx-auto flex max-w-7xl flex-col justify-end gap-8 px-6 pb-10 pt-6` with `max-w-7xl mx-auto px-6 h-full flex items-end pb-8 relative z-10 pt-6`
2. **Title structure** — removed the outer `flex flex-col` wrapper div and inner `flex flex-row` wrapper div; moved `flex items-center gap-4 justify-center md:justify-start` directly onto `<h1>`; set font size to flat `text-6xl`; `<span>` icon is now a direct child of `<h1>`
3. **Content container margin** — `mt-10` → `mt-6`
4. **Access Restricted card margin** — `mt-10` → `mt-20`

---

---

## Follow-up: Projects Hero Icon Size (2026-04-28)

### Problem

The `FiFolder` icon in the Projects page hero was `size={40}`, while Notes (`FiFileText`) and Tasks (`FiCheckSquare`) both used `size={38}`, making the Projects icon visually larger.

### Change Made (`app/projects/page.tsx`)

- `<FiFolder className="text-tertiary" size={40} />` → `size={38}`

---

---

## Follow-up: Chat Page Access Restricted (2026-04-28)

### Problem

`/chat` used a hard `redirect("/user/signin")` (same pattern as Tasks before the fix). The page header ("Hi, {user.name}") and the decorative background were invisible to unauthenticated users.

### Plan

Instead of a server-side redirect, make `userId` nullable and handle the unauthenticated state entirely inside `ChatBox`. The page header stays visible with a fallback greeting, and the Access Restricted card replaces the guide placeholder in the message area. The input bar remains rendered but is disabled.

### Changes Made

**`app/chat/page.tsx`**
- Removed `import { redirect }` and the `if (!user) redirect(...)` block
- `{user.name}` → `{user?.name ?? "there"}` (safe fallback for unauthenticated render)
- `userId={user.id}` → `userId={user?.id ?? null}`

**`app/chat/components/chatBox.tsx`**
- Prop type: `userId: string` → `userId: string | null`
- `handleSend` early-return guard: added `|| !userId`
- Placeholder section: added `!userId` branch that renders the Access Restricted card (✦ star icon in red ring, "Access Restricted" heading, "You must be signed in to use the AI assistant.", "Sign In Now" `<a>` to `/user/signin`); existing guide placeholder (icon + intro + chips) only renders when `userId` is truthy
- Textarea: `disabled={loading}` → `disabled={loading || !userId}`; placeholder text shows "Sign in to chat..." when unauthenticated
- Send button: `disabled={loading || !input.trim()}` → `disabled={loading || !input.trim() || !userId}`

### Icon

Used the ✦ four-pointed star (already present in the component as the Hubboi brand symbol) for the Access Restricted card icon — consistent with the chat page's existing visual identity, and avoids a new import.

---

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
