# Agent Memory

> Persistent memory for the document-changes command.
> Updated automatically after each documentation session.

## Last Updated

2026-03-02 (session 2)

## Project Map

| Doc Path | Area | Last Updated | Summary |
| -------- | ---- | ------------ | ------- |
| `docs/features/posthog/README.md` | Features | 2026-03-02 | PostHog integration index (added server infra paths + new sub-feature) |
| `docs/features/posthog/error-tracking.md` | Features | 2026-03-02 | Client-side error tracking with user/entity context and backend correlation |
| `docs/features/posthog/server-error-tracking.md` | Features | 2026-03-02 | Server-side PostHog error capture with request ID correlation |
| `docs/features/posthog/event-tracking.md` | Features | pre-existing | Analytics event tracking |
| `docs/features/tanstack-query/README.md` | Features | pre-existing | TanStack Query migration index |
| `docs/features/tanstack-query/migration-guide.md` | Features | pre-existing | Hook migration patterns |
| `docs/features/tanstack-query/series-refactoring.md` | Features | pre-existing | Series hooks refactoring |
| `docs/features/testing/README.md` | Features | pre-existing | Testing infrastructure index |
| `docs/features/testing/vitest-setup.md` | Features | pre-existing | Vitest configuration |
| `docs/features/testing/playwright-e2e.md` | Features | pre-existing | Playwright E2E setup |
| `docs/features/testing/preview-security.md` | Features | pre-existing | Server preview security tests |
| `docs/features/testing/purchase-flow-tests.md` | Features | pre-existing | Purchase flow integration tests |
| `docs/AUTHENTICATION.md` | Architecture | pre-existing | Auth system overview |
| `docs/AUTHENTICATION_CONTEXT.md` | Architecture | pre-existing | Auth implementation context |
| `docs/project-architecture.md` | Architecture | pre-existing | Project architecture overview |
| `docs/environment-variables.md` | Reference | pre-existing | Env var documentation |
| `docs/performance-optimizations.md` | Architecture | pre-existing | Performance optimization notes |
| `docs/CHANGELOG.md` | Reference | pre-existing | Project changelog |

## Recent Decisions (max 15)

| Date | Decision | Context |
| ---- | -------- | ------- |
| 2026-03-02 | Lazy-init PostHog server client (null without API key) | Dev environments must work without PostHog config |
| 2026-03-02 | X-Request-Id header for frontend-backend error correlation | PostHog errors need to link across client and server |
| 2026-03-02 | Custom queryFn on hooks that used default queryFn | Default queryFn has no error tracking hooks — need try/catch |

## Domain Vocabulary

| Term | Meaning |
| ---- | ------- |
| Ledewire | Micropayment platform for content monetization |
| Series | A collection of premium video episodes |
| Episode | A single paid video within a series |
| Article | Written content, can be free or paid via Ledewire |
| SSO Cookie | Cross-subdomain auth via refresh token in cookie |
| PostHog | Analytics and error tracking platform |
| TanStack Query | Data fetching/caching library (React Query) |
| shadcn/ui | Component library built on Radix UI primitives |
| VideoStoreContext | Global React context for user, wallet, purchases |
| Admin Token | Session token with 4-hour TTL for admin panel access |
| posthog-node | Server-side PostHog SDK for structured error capture |
| X-Request-Id | UUID header for cross-layer error correlation (server -> client) |
| captureRouteError | Helper in routes.ts that extracts req context and calls captureServerError |

## Known Gotchas

- Express global error handler: never `throw` after response is sent — it crashes the process
- VideoStoreContext import path is `../context/` (singular), not `../contexts/` (plural)
- Hooks using default queryFn from queryClient can't capture errors — need custom queryFn with try/catch
- PostHog Node client requires explicit `shutdown()` to flush events before process exit
