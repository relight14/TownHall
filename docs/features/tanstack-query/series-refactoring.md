# Series Refactoring

## Status

| Field | Value |
| --- | --- |
| Status | ✅ Complete |
| Completed | 2026-02-19 |
| Author | Claude Code |
| Parent Feature | [TanStack Query](README.md) |
| Related Issues | N/A |

## What It Does

Migrated the `series` data domain from VideoStoreContext state management to TanStack Query hooks. All pages that previously consumed `series` from context now use the `useSeries()` hook with automatic caching and cache invalidation.

## Implementation

### Files Changed

| Path | Purpose |
| --- | --- |
| `client/src/hooks/series/queryKeys.ts` | Series query key constants |
| `client/src/hooks/series/useSeries.ts` | `useSeries()` query hook with `Series` and `Episode` types |
| `client/src/hooks/series/useSeriesMutations.ts` | CRUD mutation hooks (create, update, delete, reorder) |
| `client/src/hooks/series/index.ts` | Barrel exports |
| `client/src/context/VideoStoreContext.tsx` | Removed `series` state, `loadSeries()`, and `getAllEpisodes` |
| `client/src/pages/HomePage.tsx` | Replaced `useVideoStore().series` with `useSeries()` |
| `client/src/pages/VideosPage.tsx` | Replaced `useVideoStore().series` with `useSeries()` |
| `client/src/pages/SeriesPage.tsx` | Replaced `useVideoStore().series` with `useSeries()` |
| `client/src/pages/AdminPage.tsx` | Replaced `useVideoStore().series` with `useSeries()`, moved `getAllEpisodes` to local helper |

### Domain Model

N/A

### Key Logic

The `useSeries()` hook uses `seriesKeys.api.all` as its query key (`['/api/series']`), which the default `queryFn` in `queryClient.ts` resolves to `fetch('/api/series')`. All five mutation hooks (create series, update series, delete series, add episode, delete episode) call `queryClient.invalidateQueries({ queryKey: seriesKeys.api.all })` on success, which triggers an automatic refetch of the series list.

## Pages Migrated

| Page | Before | After |
| --- | --- | --- |
| `HomePage` | `useVideoStore().series` | `useSeries()` — passed as prop to `VideoAnalysisSection` |
| `VideosPage` | `useVideoStore().series` | `useSeries()` — maps over series cards |
| `SeriesPage` | `useVideoStore().series` | `useSeries()` — finds current series by URL param |
| `AdminPage` | `useVideoStore().series` + `getAllEpisodes` | `useSeries()` — `getAllEpisodes` moved to local helper |

## Context Cleanup

Removed from `VideoStoreContext`:
- `series` state (`useState<Series[]>([])`)
- `loadSeries()` function
- `series` from provider value
- `getAllEpisodes` helper
- `loadSeries()` calls from mutation success handlers

Kept in `VideoStoreContext`:
- Admin mutation methods (`addSeries`, `updateSeries`, etc.) — they now call `queryClient.invalidateQueries()` instead of `loadSeries()`

## Decisions

| Decision | Why | Alternatives Considered |
| --- | --- | --- |
| Keep admin mutations in context | Avoids breaking admin panel during incremental migration | Move all mutations to hooks at once |
| Move `getAllEpisodes` to AdminPage local helper | Only used in AdminPage; no need for global context | Keep in context, create a hook |
| Replace `loadSeries()` with `invalidateQueries` | TanStack Query handles refetching; no manual data loading needed | Call `refetchQueries` directly |

## Gotchas & Warnings

- Admin mutations still live in VideoStoreContext — they call `queryClient.invalidateQueries()` to sync cache, don't remove the `queryClient` import
- `VideoAnalysisSection` in HomePage receives `series` as a prop from the parent hook call — it doesn't call `useSeries()` directly
- The `seriesKeys.api.all` key (`['/api/series']`) must match the actual API endpoint for the default queryFn to work

## Dependencies

None beyond `@tanstack/react-query` (installed in migration guide).

## Testing

```bash
# Unit tests for the series hook
npx vitest run client/src/hooks/series/useSeries.test.ts
```

## Related

- [Migration Guide](migration-guide.md) — Full step-by-step migration process this followed
