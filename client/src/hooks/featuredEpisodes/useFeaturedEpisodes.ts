import { useQuery } from '@tanstack/react-query';
import { featuredEpisodesKeys } from './queryKeys';
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

export interface FeaturedEpisode extends Episode {
  displayOrder: number;
  seriesId: string;
}

/**
 * Query hook to fetch featured episodes
 */
export function useFeaturedEpisodes() {
  const errorCtx = useErrorContext();
  return useQuery<FeaturedEpisode[]>({
    queryKey: featuredEpisodesKeys.api.all,
    queryFn: async () => {
      const res = await fetch('/api/featured-episodes');
      if (!res.ok) {
        const error = new Error('Failed to fetch featured episodes');
        captureError(error, { component: 'useFeaturedEpisodes', action: 'fetch_featured', requestId: getRequestId(res), ...errorCtx });
        throw error;
      }
      return res.json();
    },
  });
}
