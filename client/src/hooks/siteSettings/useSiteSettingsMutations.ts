import { useMutation, useQueryClient } from '@tanstack/react-query';
import { siteSettingsKeys } from './queryKeys';
import type { SiteSettings } from './useSiteSettings';
import { captureError } from '../../lib/errorTracking';
import { useErrorContext } from '../useErrorContext';

// Helper to make API requests with admin token
async function apiAdminRequest(method: string, url: string, data: any, adminToken?: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (adminToken) {
    headers['X-Admin-Token'] = adminToken;
  }
  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `API request failed: ${url}`);
  }
  return res.json();
}

/**
 * Mutation hook to update site settings
 * @param adminToken - Admin authentication token
 */
export function useUpdateSiteSettings(adminToken?: string | null) {
  const queryClient = useQueryClient();
  const errorCtx = useErrorContext();
  return useMutation({
    mutationFn: (settings: Partial<SiteSettings>) =>
      apiAdminRequest('PUT', '/api/admin/site-settings', settings, adminToken),
    onSuccess: (data) => {
      // Update the cache with the new data
      queryClient.setQueryData<SiteSettings>(siteSettingsKeys.api.all, {
        heroHeading: data.heroHeading,
        heroSubheading: data.heroSubheading,
      });
    },
    onError: (error: Error) => {
      captureError(error, { component: 'useUpdateSiteSettings', action: 'update_settings', ...errorCtx });
    },
  });
}
