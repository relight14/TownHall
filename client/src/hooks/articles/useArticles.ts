import { useQuery } from '@tanstack/react-query';
import { articleKeys } from './queryKeys';
import { captureError, getRequestId } from '../../lib/errorTracking';
import { useErrorContext } from '../useErrorContext';

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  subheader: string;
  thumbnail: string | null;
  category: string;
  viewCount: number;
  readTimeMinutes: number;
  featured: number;
  publishedAt: string;
  price: number;
  author?: string;
  ledewireContentId?: string | null;
  isPreview?: boolean;
}

/**
 * Query hook to fetch all articles
 */
export function useArticles() {
  const errorCtx = useErrorContext();
  return useQuery<Article[]>({
    queryKey: articleKeys.api.all,
    queryFn: async () => {
      const res = await fetch('/api/articles');
      if (!res.ok) {
        const error = new Error('Failed to fetch articles');
        captureError(error, { component: 'useArticles', action: 'fetch_all', requestId: getRequestId(res), ...errorCtx });
        throw error;
      }

      return res.json();
    },
  });
}

/**
 * Query hook to fetch a single article by ID
 * Passes auth token to get full content if user owns the article
 */
export function useArticle(articleId: string | undefined, ledewireToken?: string | null) {
  const errorCtx = useErrorContext();
  return useQuery<Article>({
    queryKey: [articleKeys.api.detail(articleId || ''), ledewireToken],
    queryFn: async () => {
      const headers: HeadersInit = {};
      if (ledewireToken) {
        headers['Authorization'] = `Bearer ${ledewireToken}`;
      }
      const res = await fetch(`/api/articles/${articleId}`, { headers });
      if (!res.ok) {
        const error = new Error('Article not found');
        captureError(error, { component: 'useArticle', action: 'fetch_detail', entityIds: { articleId }, requestId: getRequestId(res), ...errorCtx });
        throw error;
      }
      return res.json();
    },
    enabled: !!articleId,
  });
}

/**
 * Query hook to fetch featured articles
 */
export function useFeaturedArticles() {
  const errorCtx = useErrorContext();
  return useQuery<Article[]>({
    queryKey: articleKeys.api.featured,
    queryFn: async () => {
      const res = await fetch('/api/articles/featured');
      if (!res.ok) {
        const error = new Error('Failed to fetch featured articles');
        captureError(error, { component: 'useFeaturedArticles', action: 'fetch_featured', requestId: getRequestId(res), ...errorCtx });
        throw error;
      }
      return res.json();
    },
  });
}

/**
 * Query hook to fetch latest articles
 */
export function useLatestArticles(limit = 5) {
  const errorCtx = useErrorContext();
  return useQuery<Article[]>({
    queryKey: [...articleKeys.api.latest, { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/articles/latest?limit=${limit}`);
      if (!res.ok) {
        const error = new Error('Failed to fetch latest articles');
        captureError(error, { component: 'useLatestArticles', action: 'fetch_latest', requestId: getRequestId(res), ...errorCtx });
        throw error;
      }
      return res.json();
    },
  });
}

/**
 * Query hook to fetch most read articles
 */
export function useMostReadArticles(limit = 5) {
  const errorCtx = useErrorContext();
  return useQuery<Article[]>({
    queryKey: [...articleKeys.api.mostRead, { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/articles/most-read?limit=${limit}`);
      if (!res.ok) {
        const error = new Error('Failed to fetch most read articles');
        captureError(error, { component: 'useMostReadArticles', action: 'fetch_most_read', requestId: getRequestId(res), ...errorCtx });
        throw error;
      }
      return res.json();
    },
  });
}

/**
 * Query hook to fetch articles by category
 */
export function useArticlesByCategory(category: string) {
  const { data: articles = [] } = useArticles();
  const { data: featuredArticles = [] } = useFeaturedArticles();

  // Combine and deduplicate
  const allArticles = [
    ...articles,
    ...featuredArticles.filter(fa => !articles.find(a => a.id === fa.id))
  ];

  return allArticles
    .filter(a => a.category === category)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

interface PurchaseVerificationResponse {
  has_purchased: boolean;
}

/**
 * Query hook to verify if a user has purchased an article
 */
export function useArticlePurchaseVerification(
  articleId: string | undefined,
  ledewireContentId: string | null | undefined,
  ledewireToken: string | null | undefined
) {
  const errorCtx = useErrorContext();
  return useQuery<PurchaseVerificationResponse>({
    queryKey: [...articleKeys.api.purchaseVerify(articleId || ''), ledewireToken],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${articleId}/purchase/verify`, {
        headers: {
          'Authorization': `Bearer ${ledewireToken}`,
        },
      });
      if (!res.ok) {
        const error = new Error('Failed to verify purchase status');
        captureError(error, {
          component: 'useArticlePurchaseVerification',
          action: 'verify_purchase',
          entityIds: { articleId },
          requestId: getRequestId(res),
          ...errorCtx,
        });
        throw error;
      }
      const jsonResponse = await res.json();
      return jsonResponse;
    },
    enabled: !!articleId && !!ledewireContentId && !!ledewireToken,
  });
}
