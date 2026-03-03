import { useQuery } from '@tanstack/react-query';
import { seriesKeys } from './queryKeys';
import { captureError, getRequestId } from '../../lib/errorTracking';
import { useErrorContext } from '../useErrorContext';

export interface Episode {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoType: 'vimeo' | 'youtube';
  price: number;
  thumbnail: string;
  ledewireContentId?: string;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  trailerUrl?: string;
  trailerType?: 'vimeo' | 'youtube';
  episodes: Episode[];
}

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
