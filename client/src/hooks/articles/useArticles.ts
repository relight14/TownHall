import { useQuery } from '@tanstack/react-query';
import { articleKeys } from './queryKeys';
import { captureError } from '../../lib/errorTracking';

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
  return useQuery<Article[]>({
    queryKey: articleKeys.api.all,
    queryFn: async () => {
      const res = await fetch('/api/articles');
      if (!res.ok) {
        const error = new Error('Failed to fetch articles');
        captureError(error, { component: 'useArticles', action: 'fetch_all' });
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
  return useQuery<Article>({
    queryKey: articleKeys.api.detail(articleId || ''),
    queryFn: async () => {
      const headers: HeadersInit = {};
      if (ledewireToken) {
        headers['Authorization'] = `Bearer ${ledewireToken}`;
      }
      const res = await fetch(`/api/articles/${articleId}`, { headers });
      if (!res.ok) throw new Error('Article not found');
      return res.json();
    },
    enabled: !!articleId,
  });
}

/**
 * Query hook to fetch featured articles
 */
export function useFeaturedArticles() {
  return useQuery<Article[]>({
    queryKey: articleKeys.api.featured,
  });
}

/**
 * Query hook to fetch latest articles
 */
export function useLatestArticles(limit = 5) {
  return useQuery<Article[]>({
    queryKey: [...articleKeys.api.latest, { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/articles/latest?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch latest articles');
      return res.json();
    },
  });
}

/**
 * Query hook to fetch most read articles
 */
export function useMostReadArticles(limit = 5) {
  return useQuery<Article[]>({
    queryKey: [...articleKeys.api.mostRead, { limit }],
    queryFn: async () => {
      const res = await fetch(`/api/articles/most-read?limit=${limit}`);
      if (!res.ok) throw new Error('Failed to fetch most read articles');
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
          metadata: { articleId },
        });
        throw error;
      }
      const jsonResponse = await res.json();
      return jsonResponse;
    },
    enabled: !!articleId && !!ledewireContentId && !!ledewireToken,
  });
}
