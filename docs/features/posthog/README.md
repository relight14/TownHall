# PostHog

## Architecture Overview

- Config: `client/src/lib/config.ts` (PROJECT_NAME export)
- Error tracking: `client/src/lib/errorTracking.ts`
- Event tracking: `client/src/lib/analytics.ts`
- Error boundary: `client/src/components/ErrorBoundary.tsx`
- Initialization: `client/src/main.tsx` (PostHogProvider setup)

## Sub-Features

| Feature | Status | Date | Summary |
| --- | --- | --- | --- |
| [Error Tracking](error-tracking.md) | ✅ | 2026-02-19 | Error capture with project tagging and global handlers |
| [Event Tracking](event-tracking.md) | ✅ | 2026-02-19 | User behavior analytics (auth, content engagement) |

## Shared Decisions

| Decision | Why |
| --- | --- |
| Single PostHog instance across all Ledewire projects | Centralized analytics dashboard, filter by `project_name` |
| `posthog.init()` before React render, not via Provider `apiKey` prop | `errorTracking.ts` imports `posthog` directly — must be initialized before any component renders |
| `project_name` as super property via `posthog.register()` | Automatically included in every event without manual tagging |
| Analytics disabled in dev by default | Prevents dev noise in production data; opt-in with `VITE_ENABLE_ANALYTICS=true` |

## Shared Gotchas

- Ad blockers block PostHog requests (`ERR_BLOCKED_BY_CLIENT`) — test in incognito without extensions
- `PostHogProvider` with `apiKey` prop initializes too late for direct `posthog` imports — always use `client` prop with pre-initialized instance
- All projects must use consistent `project_name` values: `chris-cillizza`, `prodrop`, `rocco-pendola`, etc.
