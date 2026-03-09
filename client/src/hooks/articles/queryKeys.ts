/**
 * Query keys for article-related queries
 * Following TanStack Query best practices for type-safe, hierarchical query keys
 */
export const articleKeys = {
  all: ['articles'] as const,
  lists: () => [...articleKeys.all, 'list'] as const,
  featured: () => [...articleKeys.all, 'featured'] as const,
  latest: () => [...articleKeys.all, 'latest'] as const,
  mostRead: () => [...articleKeys.all, 'most-read'] as const,
  byCategory: (category: string) => [...articleKeys.all, 'category', category] as const,
  byState: (stateCode: string) => [...articleKeys.all, 'state', stateCode] as const,
  detail: (id: string) => [...articleKeys.all, 'detail', id] as const,
  // API-based keys (matching current API endpoint pattern)
  api: {
    all: ['/api/articles'] as const,
    featured: ['/api/articles/featured'] as const,
    latest: ['/api/articles/latest'] as const,
    mostRead: ['/api/articles/most-read'] as const,
    detail: (id: string) => ['/api/articles', id] as const,
    admin: ['/api/admin/articles'] as const,
    purchaseVerify: (id: string) => ['/api/articles', id, 'purchase', 'verify'] as const,
  },
} as const;
