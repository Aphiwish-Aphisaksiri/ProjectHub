# Cloudflare Worker Offline Page Improvements

**Date:** 2026-04-27  
**Context:** ProjectHub is self-hosted on a local PC, exposed via Cloudflare Tunnel. A Cloudflare Worker proxies `projecthub.aphiwish.com` to the tunnel and falls back to an offline static page when the origin is unreachable.

---

## Current Setup

```
Browser → projecthub.aphiwish.com (CF Worker)
              ↓ fetches
          projecthub-origin.aphiwish.com (CF Tunnel endpoint)
              ↓ tunnels via cloudflared
          localhost:3000 (Next.js / Docker)

on failure → 302 redirect → projecthub-offline.aphiwish.com (CF Pages)
```

---

## Planned Improvements

### 1. Proxy the offline page instead of 302 redirect

**Problem:** A `302` redirect changes the URL in the browser to `projecthub-offline.aphiwish.com`, which looks broken.

**Solution:** Fetch the offline page content inside the Worker and return it as a `503` response, keeping the URL as `projecthub.aphiwish.com`.

**Worker change** (`catch` block and `status >= 500` block):
```js
const offlineResponse = await fetch(OFFLINE_URL)
return new Response(offlineResponse.body, {
  status: 503,
  headers: offlineResponse.headers,
})
```

---

### 2. Add a dedicated health check endpoint

**Problem:** The Worker currently detects downtime by racing the actual user request against a timeout. This means:
- A real user request is "wasted" as a health probe
- `POST` requests (forms, Server Actions) may be lost on failure detection

**Solution:** Check a lightweight `HEAD /api/health` before proxying the real request.

**Next.js route** — create `app/api/health/route.ts`:
```ts
export function GET() {
  return new Response("ok", { status: 200 })
}
```

**Worker change** — add a helper and call it before proxying:
```js
async function isOriginAlive(tunnelUrl, timeoutMs) {
  try {
    const res = await Promise.race([
      fetch(tunnelUrl + "/api/health", { method: "HEAD" }),
      new Promise((_, r) => setTimeout(() => r(new Error()), timeoutMs))
    ])
    return res.ok
  } catch {
    return false
  }
}
```

Then in the main `fetch` handler, check health first before forwarding the real request.

---

## Implementation Order

1. [x] Create `app/api/health/route.ts` in Next.js
2. [x] Update Cloudflare Worker to use `isOriginAlive()` health check
3. [x] Update Cloudflare Worker to proxy offline page content (503) instead of 302 redirect
4. [x] Test: with app running — verify normal flow works
5. [x] Test: with app stopped — verify offline page shows at `projecthub.aphiwish.com` with no URL change

---

## Final Worker Script

Paste this into the Cloudflare Worker editor:

```js
const TUNNEL_URL  = "https://projecthub-origin.aphiwish.com"
const OFFLINE_URL = "https://projecthub-offline.aphiwish.com"
const TIMEOUT_MS  = 5000

async function isOriginAlive() {
  try {
    const res = await Promise.race([
      fetch(TUNNEL_URL + "/api/health", { method: "HEAD" }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS))
    ])
    return res.ok
  } catch {
    return false
  }
}

async function offlinePage() {
  const res = await fetch(OFFLINE_URL)
  return new Response(res.body, {
    status: 503,
    headers: res.headers,
  })
}

export default {
  async fetch(request, env) {
    const alive = await isOriginAlive()
    if (!alive) return offlinePage()

    const url = new URL(request.url)

    const headers = new Headers(request.headers)
    headers.set("x-forwarded-host", url.hostname)

    const tunnelRequest = new Request(
      TUNNEL_URL + url.pathname + url.search,
      {
        method:   request.method,
        headers:  headers,
        body:     request.body,
        redirect: "manual",
      }
    )

    try {
      const response = await Promise.race([
        fetch(tunnelRequest),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS))
      ])

      if (response.status >= 500) return offlinePage()

      return response
    } catch {
      return offlinePage()
    }
  }
}
