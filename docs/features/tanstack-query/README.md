# TanStack Query

## Architecture Overview

- QueryClient: `client/src/lib/queryClient.ts`
- Provider: `client/src/main.tsx` (QueryClientProvider)
- Hooks: `client/src/hooks/{domain}/` (one folder per data domain)
- Context: `client/src/context/VideoStoreContext.tsx` (auth + wallet only, data fetching removed)

## Sub-Features

| Feature | Status | Date | Summary |
| --- | --- | --- | --- |
| [Migration Guide](migration-guide.md) | ✅ | 2026-02-19 | Step-by-step guide for migrating context-based data fetching to TanStack Query |
| [Series Refactoring](series-refactoring.md) | ✅ | 2026-02-19 | Series domain migrated from VideoStoreContext to TanStack Query hooks |

## Shared Decisions

| Decision | Why |
| --- | --- |
| Default `queryFn` builds URL from `queryKey.join("/")` | Hooks without custom `queryFn` automatically fetch from matching API endpoints |
| `staleTime: Infinity` + `retry: false` | Data doesn't auto-refetch; manual invalidation on mutations; fail fast |
| One folder per data domain (`hooks/series/`, `hooks/articles/`, etc.) | Clear separation, each domain owns its keys, hooks, and types |
| Query keys as typed constants in `queryKeys.ts` | Prevents typos, enables autocomplete, single source of truth |
| Barrel exports via `index.ts` | Clean imports: `import { useSeries, type Series } from '../hooks/series'` |

## Shared Gotchas

- Hooks without custom `queryFn` (like `useFeaturedArticles`) rely on the default from `queryClient.ts` which builds URLs from `queryKey.join("/")` — the query key must match the API endpoint path exactly
- Admin mutations still live in `VideoStoreContext` but use `queryClient.invalidateQueries()` to refresh TanStack Query cache — don't remove the `queryClient` import from context
- Always destructure with defaults: `const { data: series = [] }` — prevents undefined errors during loading
- `useQuery` with `enabled: false` won't fetch — use this for conditional queries (e.g., fetch article only when `articleId` is defined)
