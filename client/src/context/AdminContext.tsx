import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ApiArticle } from '@shared/types';

type Article = Omit<ApiArticle, 'topic' | 'state' | 'contributorId' | 'createdAt' | 'isPreview' | 'ledewireContentId'>;

interface AdminContextType {
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
  adminArticles: Article[];
  adminArticlesLoaded: boolean;
  addArticle: (article: Omit<Article, 'id' | 'publishedAt'>) => Promise<void>;
  updateArticle: (articleId: string, updates: Partial<Omit<Article, 'id'>>) => Promise<void>;
  deleteArticle: (articleId: string) => Promise<void>;
  loadAdminArticles: (token: string) => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminArticles, setAdminArticles] = useState<Article[]>([]);
  const [adminArticlesLoaded, setAdminArticlesLoaded] = useState<boolean>(false);

  const loadAdminArticles = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/admin/articles', {
        headers: { 'X-Admin-Token': token }
      });
      if (response.ok) {
        const data = await response.json();
        setAdminArticles(data);
        setAdminArticlesLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load admin articles:', error);
      setAdminArticlesLoaded(true);
    }
  }, []);

  const addArticle = useCallback(async (newArticle: Omit<Article, 'id' | 'publishedAt'>) => {
    if (!adminToken) {
      throw new Error('Admin authentication required');
    }
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(newArticle),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create article');
      }

      await loadAdminArticles(adminToken);
    } catch (error) {
      console.error('Failed to add article:', error);
      throw error;
    }
  }, [adminToken, loadAdminArticles]);

  const updateArticle = useCallback(async (articleId: string, updates: Partial<Omit<Article, 'id'>>) => {
    if (!adminToken) {
      throw new Error('Admin authentication required');
    }
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update article');
      }

      await loadAdminArticles(adminToken);
    } catch (error) {
      console.error('Failed to update article:', error);
      throw error;
    }
  }, [adminToken, loadAdminArticles]);

  const deleteArticle = useCallback(async (articleId: string) => {
    if (!adminToken) {
      throw new Error('Admin authentication required');
    }
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': adminToken,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete article');
      }

      await loadAdminArticles(adminToken);
    } catch (error) {
      console.error('Failed to delete article:', error);
      throw error;
    }
  }, [adminToken, loadAdminArticles]);

  return (
    <AdminContext.Provider value={{
      adminToken,
      setAdminToken,
      adminArticles,
      adminArticlesLoaded,
      addArticle,
      updateArticle,
      deleteArticle,
      loadAdminArticles,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
