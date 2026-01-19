/**
 * Query keys for featured episodes queries
 * Following TanStack Query best practices for type-safe, hierarchical query keys
 */
export const featuredEpisodesKeys = {
  all: ['featuredEpisodes'] as const,
  api: {
    all: ['/api/featured-episodes'] as const,
    admin: ['/api/admin/featured-episodes'] as const,
  },
} as const;
