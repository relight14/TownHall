# Playwright E2E

## Status

| Field | Value |
| --- | --- |
| Status | ✅ Complete |
| Completed | 2026-02-19 |
| Author | Claude Code |
| Parent Feature | [Testing](README.md) |
| Related Issues | N/A |

## What It Does

End-to-end tests that run against the full dev server (Express + Vite) using real browser automation. Tests the Homepage flow across Desktop Chrome and Mobile Chrome viewports.

## Implementation

### Files Changed

| Path | Purpose |
| --- | --- |
| `playwright.config.ts` | Playwright configuration with Desktop/Mobile Chrome projects |
| `e2e/homepage.spec.ts` | Homepage E2E test suite (8 tests) |

### Domain Model

N/A

### Key Logic

Playwright auto-starts the dev server on a configurable port (`E2E_PORT` env var, defaults to 5173 to avoid macOS AirPlay conflict on 5000). Tests run against Desktop Chrome and Mobile Chrome. The homepage tests verify page load, navigation, category tabs, article cards, and responsive layout. Tests that depend on real API data use conditional skips when content isn't available.

## Decisions

| Decision | Why | Alternatives Considered |
| --- | --- | --- |
| Port 5173 instead of 5000 | macOS AirPlay Receiver occupies port 5000 | Disabling AirPlay, using random ports |
| Chromium only (no Firefox/WebKit) | Faster CI runs, Chromium covers 90%+ of users | Multi-browser matrix |
| Conditional test skips for data-dependent tests | Tests run against real API — content may vary | Seeding test data, MSW in Playwright |

## Gotchas & Warnings

- The `webServer` in playwright.config.ts uses `npm run dev` which starts the full Express + Vite server
- Tests may need adjustment if the homepage content structure changes significantly
- Mobile tests use Playwright's built-in `devices['Pixel 5']` viewport settings

## Dependencies

- `@playwright/test` — E2E test framework
- Chromium browser (installed via `npx playwright install chromium`)

## Testing

```bash
# Run all E2E tests
npm run test:e2e

# With Playwright UI
npm run test:e2e:ui

# Specific test file
npx playwright test e2e/homepage.spec.ts
```

## Related

- [Vitest Setup](vitest-setup.md) — Unit/integration testing infrastructure
