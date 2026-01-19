/**
 * Query keys for site settings queries
 * Following TanStack Query best practices for type-safe, hierarchical query keys
 */
export const siteSettingsKeys = {
  all: ['siteSettings'] as const,
  api: {
    all: ['/api/site-settings'] as const,
    admin: ['/api/admin/site-settings'] as const,
  },
} as const;
