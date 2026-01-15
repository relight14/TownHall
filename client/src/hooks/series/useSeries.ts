import { useQuery } from '@tanstack/react-query';
import { seriesKeys } from './queryKeys';

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
  return useQuery<Series[]>({
    queryKey: seriesKeys.api.all,
  });
}
