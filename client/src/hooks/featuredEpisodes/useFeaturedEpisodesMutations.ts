import { useMutation, useQueryClient } from '@tanstack/react-query';
import { featuredEpisodesKeys } from './queryKeys';

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
 * Mutation hook to update featured episodes
 * @param adminToken - Admin authentication token
 */
export function useSetFeaturedEpisodes(adminToken?: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (episodeIds: string[]) =>
      apiAdminRequest('PUT', '/api/admin/featured-episodes', { episodeIds }, adminToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featuredEpisodesKeys.api.all });
    },
  });
}
