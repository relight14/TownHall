import { useQuery } from '@tanstack/react-query';
import { seriesKeys } from './queryKeys';
import { captureError, getRequestId } from '../../lib/errorTracking';
import { useErrorContext } from '../useErrorContext';
import type { ApiEpisode as Episode, ApiSeries as Series } from '@shared/types';

export type { Episode, Series };

/**
 * Query hook to fetch all series
 */
export function useSeries() {
  const errorCtx = useErrorContext();
  return useQuery<Series[]>({
    queryKey: seriesKeys.api.all,
    queryFn: async () => {
      const res = await fetch('/api/series');
      if (!res.ok) {
        const error = new Error('Failed to fetch series');
        captureError(error, { component: 'useSeries', action: 'fetch_all', requestId: getRequestId(res), ...errorCtx });
        throw error;
      }
      return res.json();
    },
  });
}
