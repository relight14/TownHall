import type { FeaturedEpisode } from '@/hooks/featuredEpisodes';

export function createFeaturedEpisode(overrides: Partial<FeaturedEpisode> = {}): FeaturedEpisode {
  return {
    id: 'feat-ep-1',
    title: 'Featured Episode',
    description: 'A featured episode for testing',
    videoUrl: 'https://vimeo.com/789',
    videoType: 'vimeo',
    price: 0,
    thumbnail: 'https://example.com/feat-ep-thumb.webp',
    displayOrder: 1,
    seriesId: 'series-1',
    ...overrides,
  };
}
