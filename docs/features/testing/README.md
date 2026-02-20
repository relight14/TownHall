# Testing

## Architecture Overview

- Config: `vitest.config.ts`, `playwright.config.ts`
- Setup: `client/src/test/setup.ts`
- Utils: `client/src/test/test-utils.tsx`
- Mocks: `client/src/test/mocks/`
- Unit tests: `client/src/**/*.test.{ts,tsx}`, `shared/**/*.test.ts`
- E2E tests: `e2e/`

## Sub-Features

| Feature | Status | Date | Summary |
| --- | --- | --- | --- |
| [Vitest + Testing Library Setup](vitest-setup.md) | ✅ | 2026-02-19 | Unit/integration test infra with MSW API mocking |
| [Playwright E2E](playwright-e2e.md) | ✅ | 2026-02-19 | End-to-end tests with Desktop/Mobile Chrome |
| [Purchase Flow Integration Tests](purchase-flow-tests.md) | ✅ | 2026-02-19 | ArticlePage paywall/auth/purchase test suite |
| [Preview Security Tests](preview-security.md) | ✅ | 2026-02-19 | Server-side content stripping verification |

## Shared Decisions

| Decision | Why |
| --- | --- |
| Separate `vitest.config.ts` from `vite.config.ts` | Replit-specific plugins in vite config crash in jsdom |
| MSW v2 for API mocking | Intercepts `fetch()` at the network level, works with TanStack Query |
| Custom render wrapper with fresh QueryClient per test | Prevents test pollution; includes `queryFn` default for hooks without custom `queryFn` |
| Real AuthModal in integration tests (mock only Google OAuth) | Tests the actual login flow rather than mocking it away |
| Extracted `extractServerPreview` to `shared/preview.ts` | Enables unit testing without spinning up Express server |

## Shared Gotchas

- `vitest.config.ts` MUST include `react()` plugin for JSX transform (React 19 automatic runtime)
- Test QueryClient MUST include `queryFn: getQueryFn(...)` in defaultOptions — hooks without custom `queryFn` (e.g., `useFeaturedArticles`) will hang
- Date tests: use noon UTC (`T12:00:00.000Z`) to avoid timezone off-by-one issues
- Port 5000 conflicts with macOS AirPlay — Playwright uses port 5173 (`E2E_PORT`)
- Create valid JWT tokens for tests: `[btoa(header), btoa({ exp: 9999999999 }), 'sig'].join('.')`
- `useSiteSettings` has `initialData` — `isSuccess` is immediately true with defaults; wait for actual API values instead
