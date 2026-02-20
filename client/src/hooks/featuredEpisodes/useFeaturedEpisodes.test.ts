import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useFeaturedEpisodes } from './useFeaturedEpisodes';
import { createHookWrapper } from '../../test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { createFeaturedEpisode } from '../../test/mocks/data/episodes';

describe('useFeaturedEpisodes', () => {
  it('returns featured episodes from the API', async () => {
    const { result } = renderHook(() => useFeaturedEpisodes(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data!.length).toBeGreaterThan(0);
    expect(result.current.data![0]).toHaveProperty('title');
    expect(result.current.data![0]).toHaveProperty('displayOrder');
    expect(result.current.data![0]).toHaveProperty('seriesId');
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useFeaturedEpisodes(), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('returns multiple featured episodes', async () => {
    const episodes = [
      createFeaturedEpisode({ id: 'fe-1', title: 'Featured 1', displayOrder: 1 }),
      createFeaturedEpisode({ id: 'fe-2', title: 'Featured 2', displayOrder: 2 }),
      createFeaturedEpisode({ id: 'fe-3', title: 'Featured 3', displayOrder: 3 }),
    ];

    server.use(
      http.get('/api/featured-episodes', () => HttpResponse.json(episodes)),
    );

    const { result } = renderHook(() => useFeaturedEpisodes(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
  });

  it('handles empty featured episodes', async () => {
    server.use(
      http.get('/api/featured-episodes', () => HttpResponse.json([])),
    );

    const { result } = renderHook(() => useFeaturedEpisodes(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('handles server error', async () => {
    server.use(
      http.get('/api/featured-episodes', () => new HttpResponse(null, { status: 500 })),
    );

    const { result } = renderHook(() => useFeaturedEpisodes(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
