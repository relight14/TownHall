# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A content monetization platform (video episodes + paid articles) using Ledewire micropayments. Users browse series/articles, purchase content via Ledewire wallet, and watch/read purchased content. Includes an admin panel for content management.

## Commands

```bash
# Development
npm run dev                    # Start full-stack dev server (Express + Vite on port 5000)
npm run dev:client             # Vite dev server only (port 5000)

# Build & Production
npm run build                  # Build client (Vite) + server (esbuild → dist/index.cjs)
npm start                      # Run production build

# Type checking
npm run check                  # tsc --noEmit

# Database
npm run db:push                # Push schema changes via drizzle-kit
npm run db:seed                # Seed database

# Tests
npm test                       # Vitest (unit tests, single run)
npm run test:watch             # Vitest in watch mode
npx vitest run path/to/file    # Run a single test file
npm run test:e2e               # Playwright end-to-end tests
npm run test:e2e:ui            # Playwright with UI
```

## Architecture

### Monorepo Layout

- `client/` — React SPA (Vite, React Router, TanStack Query, shadcn/ui + Tailwind v4)
- `server/` — Express API server (TypeScript, ESM)
- `shared/` — Shared code (Drizzle schema in `schema.ts`, utilities)
- `e2e/` — Playwright tests
- `attached_assets/` — Static images/assets

### Path Aliases

| Alias | Resolves to |
|-------|------------|
| `@/*` | `client/src/*` |
| `@shared/*` | `shared/*` |
| `@assets` | `attached_assets/` |

### Server (`server/`)

- **Entry**: `index.ts` — Express app with cookie parser, JSON body parsing, request logging
- **Routes**: `routes.ts` — All API endpoints under `/api/*` (auth, series, episodes, articles, wallet, purchases, admin)
- **Storage**: `storage.ts` — `DatabaseStorage` class implementing `IStorage` interface (Drizzle ORM + PostgreSQL via Neon serverless)
- **Ledewire**: `ledewire.ts` — API client for Ledewire payment system (buyer auth, seller content registration, purchases, wallet)
- **Auth**: Two auth systems:
  - **User auth**: Ledewire tokens (email/password or Google SSO via `googleAuth.ts`), with SSO cookie support (`sso-module/`)
  - **Admin auth**: Session tokens with 4-hour TTL, rate-limited login (`adminAuth.ts`), protected by `requireAdminAuth` middleware
- **Database**: Schema in `shared/schema.ts`, Drizzle config points to `DATABASE_URL` env var (Neon PostgreSQL)

### Client (`client/src/`)

- **Routing**: React Router v6 (`App.tsx`) — `/`, `/series/:seriesId`, `/article/:articleId`, `/category/:category`, `/videos`, `/admin`, `/wallet`, `/terms`, `/privacy`
- **State**: `VideoStoreContext` provides global state (user, wallet, series, purchases). Data fetching hooks use TanStack Query.
- **Hooks**: Domain-organized in `hooks/` — each domain (articles, series, featuredEpisodes, siteSettings) has `queryKeys.ts`, query hooks, mutation hooks, and barrel `index.ts` exports (see Cursor rule below)
- **UI**: shadcn/ui (new-york style) with Radix primitives in `components/ui/`. Custom components in `components/`.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin

### Data Flow: Purchases

Episodes and articles are registered with Ledewire (get a `ledewireContentId`). Purchases go through Ledewire's API. Prices stored in cents in DB, converted to dollars in API responses for episodes. Wallet top-ups use Stripe via Ledewire.

### Test Setup

- **Unit tests**: Vitest + jsdom + Testing Library + MSW for API mocking. Setup in `client/src/test/setup.ts`, mocks in `client/src/test/mocks/`.
- **E2E tests**: Playwright (Desktop Chrome + Mobile Chrome). Auto-starts dev server on configurable port (`E2E_PORT` env var).
- **Shared tests**: Pure logic in `shared/` (e.g., `preview.ts`) tested alongside client tests via vitest include pattern.
- **Test config**: `vitest.config.ts` is separate from `vite.config.ts` (avoids Replit-specific plugins that fail in jsdom).

### Test Patterns & Gotchas

- `vitest.config.ts` MUST include `react()` plugin for JSX transform (React 19 automatic runtime)
- Test QueryClient MUST include `queryFn: getQueryFn(...)` in defaultOptions — hooks without custom queryFn (e.g., `useFeaturedArticles`) will hang otherwise
- Use `renderWithRoute()` from `test-utils.tsx` for components using `useParams()` — wraps in `<Routes><Route>` with `MemoryRouter`
- Use `createHookWrapper()` from `test-utils.tsx` for `renderHook()` calls
- For login flow integration tests: mock `@react-oauth/google` and `useGoogleOAuthStatus` from `App.tsx`, but keep the real `AuthModal`
- Create valid JWT tokens for tests: `[btoa(header), btoa({ exp: 9999999999 }), 'sig'].join('.')` — required for `isTokenExpired()` in VideoStoreContext
- Server-side preview: `extractServerPreview()` in `shared/preview.ts` strips paid article content to first 3 `<p>` tags; returns `isPreview: true`
- Port 5000 conflicts with macOS AirPlay — Playwright uses port 5173 (`E2E_PORT`)
- Date tests: use noon UTC (`T12:00:00.000Z`) to avoid timezone off-by-one issues

## TanStack Query Hooks Convention

Each data domain in `client/src/hooks/` follows this pattern:
- `queryKeys.ts` — Query key constants (never hardcode key strings)
- `useX.ts` — Query hooks for data fetching
- `useXMutations.ts` — Mutation hooks that invalidate queries on success
- `index.ts` — Barrel exports

## Environment Variables

See `.env.example`. Key vars: `DATABASE_URL`, `LEDEWIRE_API_URL`, `LEDEWIRE_API_KEY`, `LEDEWIRE_API_SECRET`, `CILLIZZA_SELLER_API_KEY`, `CILLIZZA_SELLER_API_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET`. Client-side vars prefixed with `VITE_PUBLIC_`.
