# Vitest + Testing Library Setup

## Status

| Field | Value |
| --- | --- |
| Status | ✅ Complete |
| Completed | 2026-02-19 |
| Author | Claude Code |
| Parent Feature | [Testing](README.md) |
| Related Issues | N/A |

## What It Does

Provides the full unit and integration test infrastructure for the project. Includes Vitest as test runner, Testing Library for React component rendering, MSW for API mocking, and shared test utilities that wrap components with all required providers.

## Implementation

### Files Changed

| Path | Purpose |
| --- | --- |
| `vitest.config.ts` | Vitest configuration with jsdom, path aliases, react plugin |
| `client/src/test/setup.ts` | MSW server lifecycle, jest-dom matchers, module mocks |
| `client/src/test/test-utils.tsx` | Custom render with QueryClient + VideoStoreProvider + MemoryRouter |
| `client/src/test/__mocks__/fileMock.ts` | Static asset stub for .webp/.avif imports |
| `client/src/test/mocks/server.ts` | MSW `setupServer` instance |
| `client/src/test/mocks/handlers.ts` | Default API handlers (articles, series, episodes, auth, settings) |
| `client/src/test/mocks/data/articles.ts` | Article mock data factory |
| `client/src/test/mocks/data/episodes.ts` | Episode mock data factory |
| `client/src/test/mocks/data/series.ts` | Series mock data factory |
| `client/src/lib/formatters.ts` | Extracted utility functions (formatDate, formatShortDate, formatFullDate, formatViewCount) |
| `shared/preview.ts` | Extracted `extractServerPreview` from server/routes.ts for testability |
| `package.json` | Added vitest, testing-library, msw, playwright dev dependencies |

### Domain Model

N/A

### Key Logic

The test setup creates a fresh QueryClient per test with `retry: false` and the project's default `queryFn` from `queryClient.ts`. Components are wrapped with `QueryClientProvider`, `VideoStoreProvider`, and `MemoryRouter`. MSW intercepts all API calls and returns mock data. For components that use `useParams()`, the `renderWithRoute` utility wraps them in `<Routes><Route>` with a `MemoryRouter` pointed at the correct URL.

## Decisions

| Decision | Why | Alternatives Considered |
| --- | --- | --- |
| Separate vitest.config.ts | Replit vite plugins crash in jsdom env | Conditional plugin loading in vite.config.ts |
| MSW v2 over manual fetch mocks | Network-level interception works with any fetch-based library | vi.mock on fetch, nock |
| Module mocks for analytics/PostHog/config | PostHog SDK and analytics fail in jsdom without real API keys | Conditional initialization in source code |
| Fresh QueryClient per test | Shared cache causes test pollution across suites | Clearing cache in afterEach |

## Gotchas & Warnings

- The `react()` plugin is required in vitest.config.ts even though vite.config.ts already has it — vitest uses its own config
- Hooks without a custom `queryFn` (like `useFeaturedArticles`) use the default from `queryClient.ts` which builds URLs from `queryKey.join("/")` — MSW handlers must match those URLs exactly
- `@react-oauth/google` must be mocked in integration tests that render AuthModal — it throws without a valid client ID

## Dependencies

- `vitest` — test runner
- `@testing-library/react` — React component testing
- `@testing-library/jest-dom` — DOM assertion matchers
- `@testing-library/user-event` — User interaction simulation
- `jsdom` — browser environment for Vitest
- `msw` — API mocking at the network level

## Testing

```bash
# Run all unit/integration tests
npm test

# Watch mode
npm run test:watch

# Single file
npx vitest run client/src/lib/formatters.test.ts
```

## Related

- [Playwright E2E](playwright-e2e.md) — E2E tests that run against the full dev server
- [Purchase Flow Tests](purchase-flow-tests.md) — Integration tests using this infrastructure
