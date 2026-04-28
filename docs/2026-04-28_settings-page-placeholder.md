# Settings Page — Placeholder

**Date:** 2026-04-28
**Status:** Planning
**Scope:** `app/settings/page.tsx`

---

## Problem

The current settings page is a bare black screen with two lines of text. There is nothing to configure yet, but the page is already linked in the sidebar so users land there. It needs at least a coherent placeholder that signals intent and matches the rest of the app's design language.

## Goal

Ship a polished placeholder that mirrors the two-panel Cloudflare Settings layout (sidebar + main content area) but shows a "coming soon" state instead of real controls. When real settings are added later, the structure is already in place.

## Key Decisions

| Option | Why rejected / accepted |
|---|---|
| Single centred card (like Help page) | Rejected — doesn't establish the sidebar structure we'll need later |
| Full two-panel layout with real settings | Rejected — nothing to configure yet; premature |
| Two-panel layout with placeholder sidebar + "coming soon" main area | Accepted — correct skeleton, honest about status |

## Visual Design Reference (Cloudflare Settings)

```
┌─────────────────────────────────────────────────────────┐
│  Sidebar (w-56, fixed)   │  Main content area           │
│  ─────────────────────   │  ──────────────────────────  │
│  > General          ●    │                              │
│    Profile               │   [icon]                     │
│    Security              │   Settings Coming Soon       │
│    Notifications         │   Short sentence explaining  │
│    Appearance            │   it's not ready yet.        │
│                          │                              │
└─────────────────────────────────────────────────────────┘
```

- Sidebar: `bg-white/3 backdrop-blur-xl` with `border-r border-white/10` — matches `AppSidebar` exactly; item labels in `text-lightgrey`, active item highlighted with `border-l-2 border-tertiary bg-tertiary/10 text-tertiary`
- All sidebar items are visual-only (no routing yet) — first item is "active" by default
- Main area: centred card with an icon, heading, and one-liner; same glassmorphism style used on Help page

## Implementation Plan

1. **Scaffold sidebar list** — define a `SETTINGS_SECTIONS` constant (icon, label) for the planned settings categories
2. **Sidebar component** — render the list with a static "active" highlight on the first item; no click handlers yet
3. **Main "coming soon" panel** — centred icon + heading + subtitle; reuse the glassmorphism card pattern from `/help`
4. **Wire layout** — `flex h-full`: sidebar on the left, main panel fills the rest
5. **Replace** the current `app/settings/page.tsx` placeholder with the new component

## Planned Sidebar Sections

| Label | Icon (react-icons/fi) |
|---|---|
| General | `FiSettings` |
| Profile | `FiUser` |
| Security | `FiShield` |
| Notifications | `FiBell` |
| Appearance | `FiSun` |

## Open Questions

- [ ] Should the sidebar sections link to sub-routes (`/settings/general`) or be handled with local state? — Defer until real settings exist; for now, static.
- [ ] Will Appearance ever control a real theme toggle? — Likely yes; note for future.

## Reference

- Existing placeholder: `app/settings/page.tsx`
- Help page pattern (glassmorphism card): `app/help/page.tsx`
- Access-restricted card style: `docs/2026-04-28_access-restricted-pages.md`
- Cloudflare Settings UI — two-panel sidebar layout used as design inspiration
