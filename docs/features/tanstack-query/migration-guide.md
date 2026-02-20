# Migration Guide

## Status

| Field | Value |
| --- | --- |
| Status | ✅ Complete |
| Completed | 2026-02-19 |
| Author | Claude Code |
| Parent Feature | [TanStack Query](README.md) |
| Related Issues | N/A |

## What It Does

Step-by-step guide for migrating Ledewire projects from context-based data fetching (VideoStoreContext with `useState` + `useEffect`) to TanStack Query with a proper cache layer, hook-based API, and automatic cache invalidation.

## Implementation

### Files Changed

| Path | Purpose |
| --- | --- |
| `client/src/lib/queryClient.ts` | QueryClient config with default queryFn, apiRequest helper |
| `client/src/main.tsx` | QueryClientProvider wrapping the app |
| `client/src/hooks/{domain}/queryKeys.ts` | Typed query key constants per domain |
| `client/src/hooks/{domain}/use{Domain}.ts` | Query hooks (data fetching) |
| `client/src/hooks/{domain}/use{Domain}Mutations.ts` | Mutation hooks (create/update/delete) |
| `client/src/hooks/{domain}/index.ts` | Barrel exports |
| `package.json` | Added @tanstack/react-query dependency |

### Domain Model

N/A

### Key Logic

The default `queryFn` in `queryClient.ts` builds fetch URLs from `queryKey.join("/")`, so a query key of `['/api/series']` automatically fetches from `/api/series`. This eliminates custom `queryFn` for simple endpoints. Mutations use `invalidateQueries` on success to refresh stale data. Each domain folder follows the same structure: `queryKeys.ts` → `use{Domain}.ts` → `use{Domain}Mutations.ts` → `index.ts`.

## Migration Steps

### Phase 1: Install and Configure

1. Add dependency: `npm install @tanstack/react-query`
2. Create `client/src/lib/queryClient.ts` with default queryFn that builds URLs from query keys
3. Wrap app in `QueryClientProvider` in `main.tsx`

### Phase 2: Create Hook Structure

For each data domain (series, articles, episodes, settings), create:

```
client/src/hooks/{domain}/
├── queryKeys.ts          # Query key constants
├── use{Domain}.ts        # Query hooks
├── use{Domain}Mutations.ts  # Mutation hooks
└── index.ts              # Barrel exports
```

### Phase 3: Query Keys Pattern

```typescript
export const seriesKeys = {
  all: ['series'] as const,
  lists: () => [...seriesKeys.all, 'list'] as const,
  details: () => [...seriesKeys.all, 'detail'] as const,
  detail: (id: string) => [...seriesKeys.details(), id] as const,
  api: {
    all: ['/api/series'] as const,
    detail: (id: string) => ['/api/series', id] as const,
  },
} as const;
```

The `api` keys match endpoint URLs so the default `queryFn` works without custom fetch logic.

### Phase 4: Query Hook Pattern

```typescript
import { useQuery } from '@tanstack/react-query';
import { seriesKeys } from './queryKeys';

export function useSeries() {
  return useQuery<Series[]>({
    queryKey: seriesKeys.api.all,
    // No queryFn needed — default builds URL from key
  });
}
```

### Phase 5: Mutation Hook Pattern

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { seriesKeys } from './queryKeys';

export function useCreateSeries(adminToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiAdminRequest('POST', '/api/series', data, adminToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.api.all });
    },
  });
}
```

### Phase 6: Migrate Components

**Before (context-based):**
```typescript
const { series, refreshSeries } = useVideoStore();
useEffect(() => { refreshSeries(); }, []);
```

**After (TanStack Query):**
```typescript
const { data: series = [], isLoading } = useSeries();
if (isLoading) return <Skeleton />;
```

Key changes:
- Replace `useVideoStore()` data access with domain hooks
- Remove `useEffect` data loading calls
- Add loading states / skeletons using `isLoading`
- Remove data state from VideoStoreContext (keep auth + wallet only)

### Phase 7: Local Development Setup

1. Add `.env` with `DATABASE_URL` and `ENVIRONMENT=development`
2. Update `server/db.ts` to load `.env` in non-production
3. Update `server/index.ts` to use `localhost` instead of `0.0.0.0` outside Replit (macOS compatibility)
4. Create `script/seed.ts` for local database seeding

## Decisions

| Decision | Why | Alternatives Considered |
| --- | --- | --- |
| Default queryFn from query keys | Zero-config for simple GET endpoints | Custom queryFn per hook |
| `staleTime: Infinity` | Data only refreshes on explicit invalidation — predictable | Short staleTime with auto-refetch |
| Keep admin mutations in VideoStoreContext | Avoid breaking admin flows during migration; migrate later | Move mutations to hooks immediately |
| Hierarchical query key structure | Enables granular invalidation (all series vs one series) | Flat string keys |

## Gotchas & Warnings

- The default `queryFn` joins query key segments with `/` — keys like `['/api/series']` produce `/api/series`, but `['api', 'series']` produces `api/series` (missing leading slash)
- Always destructure with defaults: `const { data = [] }` — TanStack Query returns `undefined` during loading
- `enabled: !!id` is required for detail queries — without it, the hook fetches with an empty/undefined ID
- Admin mutations in VideoStoreContext must call `queryClient.invalidateQueries()` to keep TanStack Query cache in sync

## Dependencies

- `@tanstack/react-query` ^5.60.5
- `dotenv` (for local development server)

## Testing

```bash
# Verify hooks work
npm test -- --grep "useSeries\|useArticles"

# Verify local dev server
npm run dev

# Seed local database
npm run db:seed
```

## Related

- [Series Refactoring](series-refactoring.md) — Concrete example of migrating the series domain
