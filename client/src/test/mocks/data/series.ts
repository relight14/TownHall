import type { Series, Episode } from '@/hooks/series/useSeries';

export function createEpisode(overrides: Partial<Episode> = {}): Episode {
  return {
    id: 'episode-1',
    title: 'Test Episode',
    description: 'A test episode',
    videoUrl: 'https://vimeo.com/123456',
    videoType: 'vimeo',
    price: 0,
    thumbnail: 'https://example.com/episode-thumb.webp',
    ...overrides,
  };
}

export function createSeries(overrides: Partial<Series> = {}): Series {
  return {
    id: 'series-1',
    title: 'Test Series',
    description: 'A test series',
    thumbnail: 'https://example.com/series-thumb.webp',
    episodes: [createEpisode()],
    ...overrides,
  };
}
