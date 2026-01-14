/**
 * Query keys for series-related queries
 * Following TanStack Query best practices for type-safe, hierarchical query keys
 */
export const seriesKeys = {
  all: ['series'] as const,
  lists: () => [...seriesKeys.all, 'list'] as const,
  list: (filters: string) => [...seriesKeys.lists(), { filters }] as const,
  details: () => [...seriesKeys.all, 'detail'] as const,
  detail: (id: string) => [...seriesKeys.details(), id] as const,
  // API-based keys (matching current API endpoint pattern)
  api: {
    all: ['/api/series'] as const,
    detail: (id: string) => ['/api/series', id] as const,
  },
} as const;
