import { useQuery } from '@tanstack/react-query';
import { featuredEpisodesKeys } from './queryKeys';

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
  return useQuery<FeaturedEpisode[]>({
    queryKey: featuredEpisodesKeys.api.all,
  });
}
