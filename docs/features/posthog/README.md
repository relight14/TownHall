# PostHog

## Architecture Overview

- Config: `client/src/lib/config.ts` (PROJECT_NAME export)
- Client error tracking: `client/src/lib/errorTracking.ts`
- Server error tracking: `server/errorTracking.ts`
- Event tracking: `client/src/lib/analytics.ts`
- Error boundary: `client/src/components/ErrorBoundary.tsx`
- Error context hook: `client/src/hooks/useErrorContext.ts`
- Initialization (client): `client/src/main.tsx` (PostHogProvider setup)
- Initialization (server): `server/index.ts` (request ID middleware, shutdown hook)

## Sub-Features

| Feature | Status | Date | Summary |
| --- | --- | --- | --- |
| [Error Tracking](error-tracking.md) | ✅ | 2026-03-02 | Client-side error capture with user/entity context and backend correlation |
| [Server Error Tracking](server-error-tracking.md) | ✅ | 2026-03-02 | Server-side error capture via posthog-node with request ID correlation |
| [Event Tracking](event-tracking.md) | ✅ | 2026-02-19 | User behavior analytics (auth, content engagement) |

## Shared Decisions

| Decision | Why |
| --- | --- |
| Single PostHog instance across all Ledewire projects | Centralized analytics dashboard, filter by `project_name` |
| `posthog.init()` before React render, not via Provider `apiKey` prop | `errorTracking.ts` imports `posthog` directly — must be initialized before any component renders |
| `project_name` as super property via `posthog.register()` | Automatically included in every event without manual tagging |
| Analytics disabled in dev by default | Prevents dev noise in production data; opt-in with `VITE_ENABLE_ANALYTICS=true` |
| Server PostHog client lazy-inits (null without API key) | Dev environments work without PostHog config; no startup crash |
| X-Request-Id header for cross-layer correlation | Frontend errors link to exact backend failure in PostHog dashboard |
| All hooks have error tracking with user context | Full traceability: PostHog error -> endpoint -> entity -> user |

## Shared Gotchas

- Ad blockers block PostHog requests (`ERR_BLOCKED_BY_CLIENT`) — test in incognito without extensions
- `PostHogProvider` with `apiKey` prop initializes too late for direct `posthog` imports — always use `client` prop with pre-initialized instance
- All projects must use consistent `project_name` values: `chris-cillizza`, `prodrop`, `rocco-pendola`, etc.
