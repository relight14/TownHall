# Error Tracking

## Status

| Field | Value |
| --- | --- |
| Status | ✅ Complete |
| Completed | 2026-02-19 |
| Author | Claude Code |
| Parent Feature | [PostHog](README.md) |
| Related Issues | N/A |

## What It Does

Captures JavaScript errors from three sources — manual try/catch, React ErrorBoundary, and global handlers — and sends them to PostHog with project identification and component context. Error messages are formatted as `[project_name] ComponentName @ /page/path: Original error message` for easy filtering. Enhanced with user context (id, email, loggedIn status), entity IDs (articleId, episodeId, seriesId), and request ID correlation with backend errors via `X-Request-Id` header.

## Implementation

### Files Changed

| Path | Purpose |
| --- | --- |
| `client/src/lib/config.ts` | Exports `PROJECT_NAME` from env var |
| `client/src/lib/errorTracking.ts` | `captureError`, `createErrorCapturer`, and `getRequestId` utilities |
| `client/src/hooks/useErrorContext.ts` | Shared hook returning user context from VideoStoreContext |
| `client/src/components/ErrorBoundary.tsx` | React Error Boundary + global `window.onerror` / `unhandledrejection` handlers |
| `client/src/main.tsx` | PostHog initialization and provider setup |
| `client/src/hooks/articles/useArticles.ts` | All 6 query hooks enhanced with error tracking |
| `client/src/hooks/articles/useArticleMutations.ts` | All 4 mutation hooks with onError callbacks |
| `client/src/hooks/series/useSeries.ts` | Query hook with custom queryFn + error tracking |
| `client/src/hooks/series/useSeriesMutations.ts` | All 5 mutation hooks with onError callbacks |
| `client/src/hooks/featuredEpisodes/useFeaturedEpisodes.ts` | Query hook with custom queryFn + error tracking |
| `client/src/hooks/featuredEpisodes/useFeaturedEpisodesMutations.ts` | Mutation hook with onError callback |
| `client/src/hooks/siteSettings/useSiteSettings.ts` | Query hook with error tracking (preserves defaults fallback) |
| `client/src/hooks/siteSettings/useSiteSettingsMutations.ts` | Mutation hook with onError callback |

### Domain Model

N/A

### Key Logic

Three capture sources feed into a single `captureError` function that formats the error message with project name, component, and page path, then calls `posthog.captureException()`. The `createErrorCapturer` factory returns a component-scoped version for components with multiple error points. Global handlers catch uncaught errors and unhandled promise rejections that escape try/catch blocks. The `useErrorContext` hook reads the current user from VideoStoreContext and returns a formatted object for spreading into `captureError` calls, keeping all hooks DRY. The `getRequestId` helper extracts the `X-Request-Id` header from failed fetch responses, enabling correlation with server-side errors in PostHog. All query hooks use custom `queryFn` wrappers that capture errors with user context, entity IDs, and request ID. All mutation hooks include `onError` callbacks with the same context.

## Decisions

| Decision | Why | Alternatives Considered |
| --- | --- | --- |
| Direct `posthog` import in errorTracking.ts | Simpler than prop-drilling or context; works in non-React code | React context, callback injection |
| Format `[project] Component @ /path: message` | Scannable in PostHog dashboard, filterable by any segment | Structured properties only (harder to scan) |
| `createErrorCapturer` factory | Reduces boilerplate in components with multiple catch blocks | Repeated `captureError` calls with same component name |
| `useErrorContext` hook for user context | DRY pattern — all hooks call one hook instead of repeating VideoStoreContext logic | Inline user extraction in each hook (duplicated code) |
| Custom `queryFn` on hooks that used default | Default queryFn from queryClient has no error tracking hooks; custom queryFn enables try/catch | Global error handler in queryClient (can't add entity context) |
| `getRequestId` from response headers | Enables frontend-backend error correlation in PostHog dashboard | Separate logging correlation (harder to query) |

## Gotchas & Warnings

- `posthog.init()` must run BEFORE `createRoot().render()` — otherwise `errorTracking.ts` imports an uninitialized instance
- `PostHogProvider` must use `client` prop (pre-initialized), NOT `apiKey` prop (lazy init)
- Ad blockers will silently swallow PostHog requests — errors still log to console but won't reach the dashboard
- Hooks that relied on the default `queryFn` from queryClient (useFeaturedArticles, useSeries, useFeaturedEpisodes) needed custom `queryFn` to enable error capture — the default has no try/catch hooks
- Import path for VideoStoreContext is `../context/VideoStoreContext` (singular "context"), not `../contexts/` (plural)

## Dependencies

- `posthog-js` — PostHog JavaScript SDK

## Testing

```bash
# Manual testing — add ErrorTestButton to any page
import { ErrorTestButton } from '@/components/ErrorTestButton';
<ErrorTestButton />

# Verify in PostHog
# 1. Check browser console for "[PostHog] Initialized for project: ..."
# 2. Click the test button
# 3. Check PostHog Error Tracking, filter by project_name
```

## Implementing in Other Projects

1. Install: `npm install posthog-js`
2. Copy `config.ts`, `errorTracking.ts`, `ErrorBoundary.tsx` to the new project
3. Update `main.tsx` — init PostHog before render, wrap app in `PostHogProvider` + `ErrorBoundary`
4. Set env vars: `VITE_PUBLIC_POSTHOG_KEY`, `VITE_PUBLIC_POSTHOG_HOST`, `VITE_PUBLIC_PROJECT_NAME`
5. Use `captureError()` in try/catch blocks throughout the app

## Environment Variables

| Variable | Required | Example |
| --- | --- | --- |
| `VITE_PUBLIC_POSTHOG_KEY` | Yes | `phc_...` |
| `VITE_PUBLIC_POSTHOG_HOST` | Yes | `https://us.i.posthog.com` |
| `VITE_PUBLIC_PROJECT_NAME` | Yes | `chris-cillizza` |

## PostHog Properties

Each error includes these filterable properties:

| Property | Description | Example |
| --- | --- | --- |
| `project_name` | Project identifier | `chris-cillizza` |
| `component` | React component name | `UserProfile` |
| `page` | URL pathname | `/admin` |
| `action` | What was happening | `fetch_user_data` |
| `original_message` | Raw error message | `Cannot read properties...` |
| `user_id` | Authenticated user ID | `usr_123` |
| `user_email` | User email address | `user@example.com` |
| `user_logged_in` | Whether user is authenticated | `true` |
| `article_id` | Article entity ID (if applicable) | `42` |
| `episode_id` | Episode entity ID (if applicable) | `7` |
| `series_id` | Series entity ID (if applicable) | `3` |
| `request_id` | Backend correlation via X-Request-Id | `a1b2c3d4-...` |

## Related

- [Server-Side Error Tracking](server-error-tracking.md) — Backend counterpart; errors correlated via X-Request-Id
- [Event Tracking](event-tracking.md) — Shares the same PostHog instance; captures user actions instead of errors
