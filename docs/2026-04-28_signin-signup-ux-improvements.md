# Sign-in / Sign-up UX Improvements

**Date:** 2026-04-28  
**Scope:** `app/user/signin/page.tsx`, `app/user/signup/page.tsx`, `app/help/page.tsx` (new)

---

## Summary

Three UX issues identified on the sign-in and sign-up flows, plus a new `/help` placeholder page needed before linking to it.

---

## Changes

### 1. Redirect to `/projects` after successful sign-in

**File:** `app/user/signin/page.tsx`

- Import `useRouter` from `next/navigation`
- After successful `signIn`, update the success message to `"Signed in! Redirecting to your projects..."` to set expectations
- Store the timeout reference in a `useRef<ReturnType<typeof setTimeout>>`
- Call `router.push("/projects")` inside `setTimeout` with a **1500ms** delay
- Clear the timeout in a `useEffect` cleanup to avoid state updates on unmounted component

```
[ success ] "Signed in! Redirecting to your projects..."
  → 1500ms → router.push("/projects")
```

---

### 2. Decouple feedback message from the register link

**File:** `app/user/signin/page.tsx`

Current behaviour: the "Don't have an account? Register here" row is conditionally rendered with `{!result && ...}`, so any result (success or error) hides it.

Fix: remove the condition so the register link is **always visible**. Move the result message to render *below* the register link. Final order:

```
[ Sign In button            ]
[ Don't have an account?    ]  ← always shown
[ feedback message, if any  ]  ← appended below, never replaces the row above
```

---

### 3. "Need help signing in?" → `/help`

**File:** `app/user/signin/page.tsx`

- Change `href="#"` → `href="/help"` on the help link

---

### 4. "Need help signing up?" → `/help`

**File:** `app/user/signup/page.tsx`

- Change `href="#"` → `href="/help"` on the help link

---

### 5. New `/help` placeholder page

**File:** `app/help/page.tsx` (create new)

A stub page that matches the site visual style. No real content — acts as a landing target until the Help section is built out.

**Design reference:** `app/user/page.tsx`

**Layout:**

```
bg-primary, full height, centered content

  [ decorative blur circles — same pattern as /user hero ]

  [ FiHelpCircle icon — tertiary/20 bg, tertiary border ]
  [ "Help & Support" heading — text-offwhite, font-black, tracking-tight ]
  [ subtext — text-lightgrey, max-w-md ]
  [ two pill-style "coming soon" tags for planned sections ]
  [ "Go back" link → uses router.back() ]
```

**Colors / tokens used** (from README design notes + `/user` page conventions):

| Token | Hex |
|---|---|
| `bg-primary` | `#061E29` |
| `text-offwhite` | `#F0F6FC` |
| `text-lightgrey` | `#BABABA` |
| `text-tertiary` | `#5F9598` |
| `bg-secondary/20` + blur | card background |
| `border-white/10` | card border |

**Planned help sections (placeholder tags only):**

- Getting Started
- Account & Security

---

## File Change Summary

| File | Type | Change |
|---|---|---|
| `app/user/signin/page.tsx` | Edit | Redirect on success, always-visible register link, /help link |
| `app/user/signup/page.tsx` | Edit | /help link |
| `app/help/page.tsx` | Create | Placeholder help page |

---

## Verification Checklist

- [ ] Sign in with valid credentials → "Signed in! Redirecting..." → navigates to `/projects` after ~1.5s
- [ ] Sign in with wrong password → error message appears, "Don't have an account?" row is still visible below the button
- [ ] "Need help signing in?" on `/user/signin` → navigates to `/help`
- [ ] "Need help signing up?" on `/user/signup` → navigates to `/help`
- [ ] `/help` renders without errors, matches site color scheme
- [ ] "Go back" on `/help` returns to the previous page
