# NextAuth Credentials Error Handling Plan

**Date:** 2026-04-28  
**Context:** The sign-in page currently passes raw NextAuth error codes (e.g. `CredentialsSignin`) directly to the user, which is not human-readable.

---

## Problem

When `signIn("credentials", { redirect: false })` is called, NextAuth returns a result object:

```ts
const res = await signIn("credentials", { redirect: false, email, password });
// res.error = "CredentialsSignin"  ← not user-friendly
```

The current frontend does:
```ts
setResult({ type: "error", message: res.error });
```

This shows raw codes like `"CredentialsSignin"` or `"Configuration"` to the user, which are meaningless to them.

---

## NextAuth Error Reference (Credentials Provider)

| `res.error` value | Cause |
|---|---|
| `"CredentialsSignin"` | `authorize()` returned `null` — covers wrong email, wrong password, missing user |
| `"Configuration"` | Server misconfiguration (bad `NEXTAUTH_SECRET`, broken adapter, DB unreachable) |
| Thrown error message | If `authorize()` throws an `Error`, NextAuth sets `res.error` to that error's `.message` |
| `null` / `undefined` | Sign-in succeeded (`res.ok === true`) |

> **Security note:** Never distinguish "email not found" from "wrong password" in error messages — this enables user enumeration attacks.

---

## Implementation Plan

### Step 1 — Throw typed errors in `authorize()` (`lib/auth.ts`)

Replace `return null` with `throw new Error(...)` for each failure case. This causes NextAuth to forward the message directly into `res.error`.

```ts
async authorize(credentials): Promise<{ id: string; email: string; name: string } | null> {
    if (!credentials?.email || !credentials.password) {
        throw new Error("Please provide your email and password.");
    }

    const user = await prisma.user.findUnique({
        where: { email: credentials.email }
    }) as ExtendedUser | null;

    if (!user || !user.hashedPassword) {
        throw new Error("Invalid email or password.");
    }

    const valid = await bcrypt.compare(credentials.password, user.hashedPassword);
    if (!valid) {
        throw new Error("Invalid email or password.");
    }

    if (!user.id || !user.email || !user.name) {
        throw new Error("Account data is incomplete. Please contact support.");
    }

    return { id: user.id, email: user.email, name: user.name };
}
```

**Why same message for "user not found" and "wrong password"?**  
Giving different messages for each case lets an attacker probe which emails are registered (user enumeration). A single generic message prevents this.

---

### Step 2 — Guard against null `res` (`app/user/signin/page.tsx`)

If the network is down or the server crashes, `res` itself may be `null`. Add a guard before reading `res.error`:

```ts
const res = await signIn("credentials", { redirect: false, email, password });

setLoading(false);

if (!res) {
    setResult({ type: "error", message: "Could not reach the server. Check your connection." });
    return;
}
```

---

### Step 3 — Add an error code fallback map (`app/user/signin/page.tsx`)

Even with Step 1, some codes (like `"Configuration"`) bypass `authorize()` entirely and will never be a thrown message. Map them explicitly as a safety net:

```ts
const errorMap: Record<string, string> = {
    CredentialsSignin: "Invalid email or password.",       // fallback if Step 1 not applied
    Configuration:     "A server error occurred. Please try again later.",
};

const message = errorMap[res.error ?? ""] ?? res.error ?? "Something went wrong.";
setResult({ type: "error", message });
```

With Step 1 in place, `res.error` will already contain a human-readable string for most cases, and this map only catches the codes that come from NextAuth internals.

---

### Step 4 — (Future) Extend for account-level errors

If features like account locking or rate limiting are added later, `authorize()` can throw specific messages that will automatically surface on the frontend with no additional frontend changes required:

```ts
// Example future additions inside authorize():
if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error("Your account is temporarily locked. Try again later.");
}
if (await isRateLimited(credentials.email)) {
    throw new Error("Too many attempts. Please wait 15 minutes before trying again.");
}
```

---

## Summary of Data Flow After Changes

```
User submits wrong password
    → authorize() throws new Error("Invalid email or password.")
    → NextAuth sets res.error = "Invalid email or password."
    → Frontend errorMap lookup: no match (it's already human-readable)
    → res.error is used as-is
    → User sees: "Invalid email or password."

Server misconfiguration
    → authorize() never runs
    → NextAuth sets res.error = "Configuration"
    → Frontend errorMap lookup: match found
    → User sees: "A server error occurred. Please try again later."

Network failure
    → res is null
    → null guard triggers
    → User sees: "Could not reach the server. Check your connection."
```

---

## Files to Change

| File | Change |
|---|---|
| `lib/auth.ts` | Replace `return null` with `throw new Error(...)` in `authorize()` |
| `app/user/signin/page.tsx` | Add null guard on `res`, replace raw `res.error` with mapped message |
