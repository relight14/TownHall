import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  useArticles,
  useFeaturedArticles,
  useLatestArticles,
  useMostReadArticles,
  useArticle,
  useArticlesByCategory,
  useArticlePurchaseVerification,
} from './useArticles';
import { createHookWrapper } from '../../test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { createArticle } from '../../test/mocks/data/articles';

describe('useArticles', () => {
  it('returns articles from the API', async () => {
    const { result } = renderHook(() => useArticles(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data!.length).toBeGreaterThan(0);
    expect(result.current.data![0]).toHaveProperty('title');
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useArticles(), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('handles server error', async () => {
    server.use(
      http.get('/api/articles', () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useArticles(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe('useArticle', () => {
  it('returns a single article by ID', async () => {
    const article = createArticle({ id: 'single-1', title: 'Single Article' });
    server.use(
      http.get('/api/articles/:articleId', () => HttpResponse.json(article)),
    );

    const { result } = renderHook(() => useArticle('single-1'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data!.title).toBe('Single Article');
  });

  it('does not fetch when articleId is undefined', () => {
    const { result } = renderHook(() => useArticle(undefined), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('handles not found error', async () => {
    server.use(
      http.get('/api/articles/:articleId', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useArticle('nonexistent'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Article not found');
  });

  it('sends authorization header when ledewireToken is provided', async () => {
    let capturedHeaders: Record<string, string> = {};
    const article = createArticle({ id: 'auth-1' });

    server.use(
      http.get('/api/articles/:articleId', ({ request }) => {
        capturedHeaders = Object.fromEntries(request.headers.entries());
        return HttpResponse.json(article);
      }),
    );

    const { result } = renderHook(() => useArticle('auth-1', 'test-token-123'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedHeaders['authorization']).toBe('Bearer test-token-123');
  });
});

describe('useFeaturedArticles', () => {
  it('returns featured articles', async () => {
    const { result } = renderHook(() => useFeaturedArticles(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeDefined();
    expect(result.current.data!.length).toBeGreaterThan(0);
  });
});

describe('useLatestArticles', () => {
  it('returns latest articles with default limit', async () => {
    const { result } = renderHook(() => useLatestArticles(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });

  it('respects limit parameter', async () => {
    const { result } = renderHook(() => useLatestArticles(2), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.length).toBeLessThanOrEqual(2);
  });
});

describe('useMostReadArticles', () => {
  it('returns most-read articles', async () => {
    const { result } = renderHook(() => useMostReadArticles(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
    expect(result.current.data!.length).toBeGreaterThan(0);
  });

  it('respects limit parameter', async () => {
    const { result } = renderHook(() => useMostReadArticles(1), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.length).toBeLessThanOrEqual(1);
  });
});

describe('useArticlesByCategory', () => {
  it('returns articles filtered by category', async () => {
    const electionsArticle = createArticle({ id: 'cat-1', title: 'Elections One', category: 'elections', publishedAt: '2025-06-10T12:00:00.000Z' });
    const policyArticle = createArticle({ id: 'cat-2', title: 'Policy One', category: 'policy', publishedAt: '2025-06-09T12:00:00.000Z' });

    server.use(
      http.get('/api/articles', () => HttpResponse.json([electionsArticle, policyArticle])),
      http.get('/api/articles/featured', () => HttpResponse.json([])),
    );

    const { result } = renderHook(() => useArticlesByCategory('elections'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.length).toBeGreaterThan(0));

    expect(result.current.every(a => a.category === 'elections')).toBe(true);
    expect(result.current.find(a => a.title === 'Elections One')).toBeDefined();
    expect(result.current.find(a => a.title === 'Policy One')).toBeUndefined();
  });

  it('returns empty array for category with no articles', async () => {
    server.use(
      http.get('/api/articles', () => HttpResponse.json([
        createArticle({ id: 'only-elections', category: 'elections' }),
      ])),
      http.get('/api/articles/featured', () => HttpResponse.json([])),
    );

    const { result } = renderHook(() => useArticlesByCategory('nonexistent-category'), {
      wrapper: createHookWrapper(),
    });

    // Wait for the underlying queries to settle
    await waitFor(() => {
      // useArticlesByCategory is derived, so check it returns empty
      expect(result.current).toEqual([]);
    });
  });

  it('deduplicates articles from both sources', async () => {
    const sharedArticle = createArticle({ id: 'shared-1', title: 'Shared', category: 'elections', publishedAt: '2025-06-10T12:00:00.000Z' });

    server.use(
      http.get('/api/articles', () => HttpResponse.json([sharedArticle])),
      http.get('/api/articles/featured', () => HttpResponse.json([sharedArticle])),
    );

    const { result } = renderHook(() => useArticlesByCategory('elections'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.length).toBe(1));
    expect(result.current[0].id).toBe('shared-1');
  });

  it('sorts articles by publishedAt descending', async () => {
    const older = createArticle({ id: 'old-1', category: 'elections', publishedAt: '2025-06-01T12:00:00.000Z' });
    const newer = createArticle({ id: 'new-1', category: 'elections', publishedAt: '2025-06-15T12:00:00.000Z' });

    server.use(
      http.get('/api/articles', () => HttpResponse.json([older, newer])),
      http.get('/api/articles/featured', () => HttpResponse.json([])),
    );

    const { result } = renderHook(() => useArticlesByCategory('elections'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.length).toBe(2));
    expect(result.current[0].id).toBe('new-1');
    expect(result.current[1].id).toBe('old-1');
  });
});

describe('useArticlePurchaseVerification', () => {
  it('returns purchase status when all params provided', async () => {
    server.use(
      http.get('/api/articles/:articleId/purchase/verify', () =>
        HttpResponse.json({ has_purchased: true }),
      ),
    );

    const { result } = renderHook(
      () => useArticlePurchaseVerification('article-1', 'lw-content-1', 'token-123'),
      { wrapper: createHookWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.has_purchased).toBe(true);
  });

  it('does not fetch when articleId is undefined', () => {
    const { result } = renderHook(
      () => useArticlePurchaseVerification(undefined, 'lw-content-1', 'token-123'),
      { wrapper: createHookWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('does not fetch when ledewireContentId is null', () => {
    const { result } = renderHook(
      () => useArticlePurchaseVerification('article-1', null, 'token-123'),
      { wrapper: createHookWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('does not fetch when ledewireToken is null', () => {
    const { result } = renderHook(
      () => useArticlePurchaseVerification('article-1', 'lw-content-1', null),
      { wrapper: createHookWrapper() },
    );

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('sends authorization header with token', async () => {
    let capturedAuth = '';
    server.use(
      http.get('/api/articles/:articleId/purchase/verify', ({ request }) => {
        capturedAuth = request.headers.get('authorization') || '';
        return HttpResponse.json({ has_purchased: false });
      }),
    );

    const { result } = renderHook(
      () => useArticlePurchaseVerification('article-1', 'lw-content-1', 'my-token'),
      { wrapper: createHookWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedAuth).toBe('Bearer my-token');
  });

  it('handles server error', async () => {
    server.use(
      http.get('/api/articles/:articleId/purchase/verify', () =>
        new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderHook(
      () => useArticlePurchaseVerification('article-1', 'lw-content-1', 'token-123'),
      { wrapper: createHookWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
