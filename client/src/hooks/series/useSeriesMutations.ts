import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Series, Episode } from './useSeries';
import { seriesKeys } from './queryKeys';

/**
 * Mutation hook to create a new series
 * @param adminToken - Admin authentication token
 */
export function useCreateSeries(adminToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (series: Omit<Series, 'id' | 'episodes'>) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (adminToken) {
        headers['X-Admin-Token'] = adminToken;
      }

      const res = await fetch('/api/series', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(series),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create series');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.api.all });
    },
  });
}

/**
 * Mutation hook to update a series
 * @param adminToken - Admin authentication token
 */
export function useUpdateSeries(adminToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Omit<Partial<Series>, 'id' | 'episodes'>) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (adminToken) {
        headers['X-Admin-Token'] = adminToken;
      }

      const res = await fetch(`/api/series/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update series');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.api.all });
    },
  });
}

/**
 * Mutation hook to create a new episode
 * @param adminToken - Admin authentication token
 */
export function useCreateEpisode(adminToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ seriesId, ...episode }: { seriesId: string } & Omit<Episode, 'id'>) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (adminToken) {
        headers['X-Admin-Token'] = adminToken;
      }

      const res = await fetch('/api/episodes', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ ...episode, seriesId }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to create episode');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.api.all });
    },
  });
}

/**
 * Mutation hook to update an episode
 * @param adminToken - Admin authentication token
 */
export function useUpdateEpisode(adminToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Omit<Partial<Episode>, 'id'>) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (adminToken) {
        headers['X-Admin-Token'] = adminToken;
      }

      const res = await fetch(`/api/episodes/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to update episode');
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.api.all });
    },
  });
}

/**
 * Mutation hook to delete an episode
 * @param adminToken - Admin authentication token
 */
export function useDeleteEpisode(adminToken?: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (episodeId: string) => {
      const headers: Record<string, string> = {};

      if (adminToken) {
        headers['X-Admin-Token'] = adminToken;
      }

      const res = await fetch(`/api/episodes/${episodeId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to delete episode');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.api.all });
    },
  });
}
