# Event Tracking

## Status

| Field | Value |
| --- | --- |
| Status | ✅ Complete |
| Completed | 2026-02-19 |
| Author | Claude Code |
| Parent Feature | [PostHog](README.md) |
| Related Issues | N/A |

## What It Does

Tracks intentional user actions — signups, logins, logouts, and content engagement — and sends them to PostHog with automatic project tagging. Builds on the PostHog instance established by error tracking. Includes user identity management (identify on login, reset on logout) for cross-session attribution.

## Implementation

### Files Changed

| Path | Purpose |
| --- | --- |
| `client/src/lib/analytics.ts` | `trackEvent`, `identifyUser`, `resetUser` utilities |
| `client/src/context/VideoStoreContext.tsx` | Auth flow instrumentation (signup, login, logout events) |
| `client/src/pages/ArticlePage.tsx` | Article view tracking |

### Domain Model

N/A

### Key Logic

The `analytics.ts` module gates all tracking behind an environment check — enabled in production by default, disabled in dev unless `VITE_ENABLE_ANALYTICS=true`. Three exported functions wrap PostHog calls: `trackEvent` injects `project_name` into every event, `identifyUser` associates the anonymous session with a known user on login, and `resetUser` disassociates on logout. Auth events are instrumented in VideoStoreContext at the success/failure points of signup, login, and logout flows.

## Events Tracked

### Authentication Events (VideoStoreContext)

| Event | When | Properties |
| --- | --- | --- |
| `user_signed_up` | Successful email signup | `method: 'email'` |
| `signup_failed` | Signup error | `error: string` |
| `user_logged_in` | Successful login | `method: 'email' \| 'google'` |
| `login_failed` | Login error | `method`, `error` |
| `user_logged_out` | User clicks logout | — |

### Content Events (ArticlePage)

| Event | When | Properties |
| --- | --- | --- |
| `article_viewed` | Page loads (once per visit) | `articleName`, `loggedIn`, `purchasedArticle` |

## Decisions

| Decision | Why | Alternatives Considered |
| --- | --- | --- |
| Disabled in dev by default | Prevents noise in production analytics | Always-on with dev filter in PostHog |
| `article_viewed` waits for purchase check | `purchasedArticle` reflects actual access state | Fire immediately with unknown purchase state |
| `identifyUser` before tracking login event | PostHog attributes the event to the identified user | Track event then identify (event attributed to anonymous ID) |

## Gotchas & Warnings

- `article_viewed` uses a ref (`viewTrackedRef`) to prevent duplicate tracking on re-renders — don't remove it
- `identifyUser` must be called BEFORE `trackEvent('user_logged_in')` so the event is attributed to the identified user, not the anonymous session
- `resetUser` calls `posthog.reset()` which generates a new anonymous ID — all subsequent events appear as a new visitor

## Dependencies

None beyond `posthog-js` (already installed for error tracking).

## Testing

```bash
# Enable analytics in local dev
echo "VITE_ENABLE_ANALYTICS=true" >> .env

# Manual testing
# 1. Open browser console
# 2. Login → check for "user_logged_in" in PostHog Live Events
# 3. Visit article → check for "article_viewed"
# 4. Logout → check for "user_logged_out"
```

## User Identity Flow

```
Anonymous visit → PostHog assigns anonymous distinct_id
       ↓
Login/Signup → identifyUser() → posthog.identify(userId)
       ↓
PostHog merges anonymous + identified profiles
       ↓
Logout → resetUser() → posthog.reset()
       ↓
New anonymous distinct_id assigned
```

## Implementing in Other Projects

1. Copy `client/src/lib/analytics.ts` to the new project
2. Ensure `config.ts` exports `PROJECT_NAME` (same as error tracking)
3. Instrument auth flows — call `identifyUser`/`trackEvent`/`resetUser` in login/signup/logout
4. Instrument content views — add `trackEvent` calls in page components
5. Set `VITE_ENABLE_ANALYTICS=true` in `.env` for local testing

## Related

- [Error Tracking](error-tracking.md) — Shares same PostHog instance; uses `captureException` instead of `capture`
