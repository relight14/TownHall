# Server-Side Error Tracking

## Status

| Field | Value |
| --- | --- |
| Status | ✅ Complete |
| Completed | 2026-03-02 |
| Author | Claude Code |
| Parent Feature | [PostHog](README.md) |
| Related Issues | N/A |

## What It Does

Captures server-side errors from all Express API routes and sends them to PostHog with structured context — endpoint, HTTP method, status code, request ID, user ID, and entity IDs (article/episode/series). Every error response includes an `X-Request-Id` header so frontend PostHog errors can be correlated with the exact backend failure.

## Implementation

### Files Changed

| Path | Purpose |
| --- | --- |
| `server/errorTracking.ts` | PostHog server client init, `captureServerError`, `shutdownErrorTracking` |
| `server/index.ts` | Request ID middleware, global error handler fix, SIGTERM shutdown hook |
| `server/routes.ts` | `captureRouteError` helper, replaced ~27 `console.error` catch blocks |
| `.env.example` | Added `POSTHOG_SERVER_API_KEY`, `POSTHOG_SERVER_HOST` |
| `package.json` | Added `posthog-node` dependency |

### Domain Model

N/A

### Key Logic

A `captureServerError` function lazy-initializes the PostHog Node client on first call (returns null if no API key is configured, so dev environments work without setup). Every error is always logged to `console.error` regardless of PostHog availability. A `captureRouteError` helper in routes.ts extracts context from the Express request (path, method, user, entity IDs from params/body) and delegates to `captureServerError`. Request ID middleware assigns a `crypto.randomUUID()` to each request and sets it as the `X-Request-Id` response header. The global error handler was fixed to call `captureServerError` instead of rethrowing after the response was already sent. On SIGTERM, `shutdownErrorTracking` flushes pending events before process exit.

## Decisions

| Decision | Why | Alternatives Considered |
| --- | --- | --- |
| Lazy-init PostHog client (null if no API key) | Dev environments work without PostHog config; no crash on missing env vars | Fail-fast on startup (breaks dev), always-init with dummy key |
| Always log to console.error alongside PostHog | Preserves existing behavior; errors visible in server logs even if PostHog is down | PostHog-only (loses server log visibility) |
| Replace `throw err` in global error handler with `captureServerError` | Throwing after `res.status().json()` crashes the process — response is already sent | Wrapping in try-catch (redundant since handler IS the catch) |
| `captureRouteError` helper in routes.ts | Centralizes context extraction; avoids repeating req parsing in 27 catch blocks | Inline `captureServerError` calls (verbose, inconsistent) |
| Request ID via `crypto.randomUUID()` | Built-in, no dependency; UUID v4 is unique enough for correlation | nanoid (extra dep), sequential counter (not unique across restarts) |

## Gotchas & Warnings

- `throw err` in Express error handler after response is sent crashes the process — this was the existing bug that was fixed
- PostHog Node client requires explicit `shutdown()` to flush pending events — without the SIGTERM hook, last errors before process exit may be lost
- `req.requestId` is added via middleware — TypeScript declaration merging on `IncomingMessage` is needed for type safety
- Ledewire-specific inner catch blocks in article/series creation use `captureServerError` directly with `metadata: { ledewireSync: true }` to distinguish from general route errors

## Dependencies

- `posthog-node` — PostHog server-side SDK

## Environment Variables

| Variable | Required | Example |
| --- | --- | --- |
| `POSTHOG_SERVER_API_KEY` | No (graceful degradation) | `phx_...` |
| `POSTHOG_SERVER_HOST` | No (defaults to `https://us.i.posthog.com`) | `https://us.i.posthog.com` |

## PostHog Properties

Each server error event includes these filterable properties:

| Property | Description | Example |
| --- | --- | --- |
| `endpoint` | API route path | `/api/articles` |
| `method` | HTTP method | `GET` |
| `status_code` | Response status | `500` |
| `request_id` | UUID for cross-layer correlation | `a1b2c3d4-...` |
| `user_id` | Authenticated user ID (if available) | `usr_123` |
| `article_id` | Article entity ID (if applicable) | `42` |
| `episode_id` | Episode entity ID (if applicable) | `7` |
| `series_id` | Series entity ID (if applicable) | `3` |
| `duration_ms` | Request duration at time of error | `1523` |

## Testing

```bash
# Manual testing
# 1. Stop the database or break a route handler
# 2. Hit the endpoint: curl http://localhost:5000/api/articles
# 3. Check server console for structured error log
# 4. Check PostHog Error Tracking for server-side event with endpoint + requestId
# 5. Check response headers for X-Request-Id
```

## Related

- [Error Tracking](error-tracking.md) — Client-side counterpart; uses X-Request-Id for correlation
- [Event Tracking](event-tracking.md) — Shares the same PostHog project; captures user actions
