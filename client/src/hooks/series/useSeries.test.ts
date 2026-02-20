import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSeries } from './useSeries';
import { createHookWrapper } from '../../test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { createSeries, createEpisode } from '../../test/mocks/data/series';

describe('useSeries', () => {
  it('returns series from the API', async () => {
    const { result } = renderHook(() => useSeries(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data!.length).toBeGreaterThan(0);
    expect(result.current.data![0]).toHaveProperty('title');
    expect(result.current.data![0]).toHaveProperty('episodes');
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useSeries(), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('returns series with episodes', async () => {
    const seriesWithEpisodes = createSeries({
      id: 'series-multi',
      title: 'Multi Episode Series',
      episodes: [
        createEpisode({ id: 'ep-1', title: 'Episode 1' }),
        createEpisode({ id: 'ep-2', title: 'Episode 2' }),
        createEpisode({ id: 'ep-3', title: 'Episode 3' }),
      ],
    });

    server.use(
      http.get('/api/series', () => HttpResponse.json([seriesWithEpisodes])),
    );

    const { result } = renderHook(() => useSeries(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].episodes).toHaveLength(3);
    expect(result.current.data![0].episodes[0].title).toBe('Episode 1');
  });

  it('handles empty series list', async () => {
    server.use(
      http.get('/api/series', () => HttpResponse.json([])),
    );

    const { result } = renderHook(() => useSeries(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('handles server error', async () => {
    server.use(
      http.get('/api/series', () => new HttpResponse(null, { status: 500 })),
    );

    const { result } = renderHook(() => useSeries(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
