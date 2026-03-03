import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Article } from './useArticles';
import { articleKeys } from './queryKeys';
import { captureError } from '../../lib/errorTracking';
import { useErrorContext } from '../useErrorContext';

// Helper to make API requests with admin token
async function apiAdminRequest(method: string, url: string, data?: any, adminToken?: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (adminToken) {
    headers['X-Admin-Token'] = adminToken;
  }
  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || `API request failed: ${url}`);
  }
  return res.json();
}

/**
 * Invalidate all article-related queries
 */
function invalidateArticleQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: articleKeys.api.all });
  queryClient.invalidateQueries({ queryKey: articleKeys.api.featured });
  queryClient.invalidateQueries({ queryKey: articleKeys.api.latest });
  queryClient.invalidateQueries({ queryKey: articleKeys.api.mostRead });
  queryClient.invalidateQueries({ queryKey: articleKeys.api.admin });
}

/**
 * Mutation hook to create a new article
 */
export function useCreateArticle(adminToken?: string | null) {
  const queryClient = useQueryClient();
  const errorCtx = useErrorContext();
  return useMutation({
    mutationFn: (article: Omit<Article, 'id' | 'publishedAt'>) =>
      apiAdminRequest('POST', '/api/articles', article, adminToken),
    onSuccess: () => invalidateArticleQueries(queryClient),
    onError: (error: Error) => {
      captureError(error, { component: 'useCreateArticle', action: 'create_article', ...errorCtx });
    },
  });
}

/**
 * Mutation hook to update an article
 */
export function useUpdateArticle(adminToken?: string | null) {
  const queryClient = useQueryClient();
  const errorCtx = useErrorContext();
  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Omit<Article, 'id'>>) =>
      apiAdminRequest('PUT', `/api/articles/${id}`, updates, adminToken),
    onSuccess: () => invalidateArticleQueries(queryClient),
    onError: (error: Error, variables) => {
      captureError(error, { component: 'useUpdateArticle', action: 'update_article', entityIds: { articleId: variables.id }, ...errorCtx });
    },
  });
}

/**
 * Mutation hook to delete an article
 */
export function useDeleteArticle(adminToken?: string | null) {
  const queryClient = useQueryClient();
  const errorCtx = useErrorContext();
  return useMutation({
    mutationFn: (articleId: string) =>
      apiAdminRequest('DELETE', `/api/articles/${articleId}`, undefined, adminToken),
    onSuccess: () => invalidateArticleQueries(queryClient),
    onError: (error: Error, articleId) => {
      captureError(error, { component: 'useDeleteArticle', action: 'delete_article', entityIds: { articleId }, ...errorCtx });
    },
  });
}

/**
 * Mutation hook to increment article view count
 */
export function useIncrementArticleView() {
  const errorCtx = useErrorContext();
  return useMutation({
    mutationFn: (articleId: string) =>
      fetch(`/api/articles/${articleId}/view`, { method: 'POST' }),
    onError: (error: Error, articleId) => {
      captureError(error, { component: 'useIncrementArticleView', action: 'increment_view', entityIds: { articleId }, ...errorCtx });
    },
  });
}
