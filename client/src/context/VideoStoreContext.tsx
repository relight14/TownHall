import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Episode {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoType: 'vimeo' | 'youtube';
  price: number;
  thumbnail: string;
  ledewireContentId?: string;
}

interface Series {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  trailerUrl?: string;
  trailerType?: 'vimeo' | 'youtube';
  episodes: Episode[];
}

interface User {
  id: string;
  email: string;
  name: string;
}

interface SiteSettings {
  heroHeading: string;
  heroSubheading: string;
}

interface FeaturedEpisode extends Episode {
  displayOrder: number;
  seriesId: string;
}

interface Article {
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
}

interface VideoStoreContextType {
  series: Series[];
  addSeries: (series: Omit<Series, 'id' | 'episodes'>) => Promise<void>;
  addEpisode: (seriesId: string, episode: Omit<Episode, 'id'>) => Promise<void>;
  updateSeries: (seriesId: string, updates: Omit<Partial<Series>, 'id' | 'episodes'>) => Promise<void>;
  updateEpisode: (episodeId: string, updates: Omit<Partial<Episode>, 'id'>) => Promise<void>;
  deleteEpisode: (episodeId: string) => Promise<void>;
  purchasedEpisodes: string[];
  purchaseEpisode: (episodeId: string) => Promise<void>;
  checkPurchase: (episodeId: string) => Promise<boolean>;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  logout: () => void;
  ledewireToken: string | null;
  walletBalance: number;
  refreshWalletBalance: () => Promise<void>;
  createPaymentSession: (amountCents: number) => Promise<any>;
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  featuredEpisodes: FeaturedEpisode[];
  setFeaturedEpisodes: (episodeIds: string[]) => Promise<void>;
  getAllEpisodes: () => Episode[];
  articles: Article[];
  featuredArticles: Article[];
  latestArticles: Article[];
  mostReadArticles: Article[];
  getArticlesByCategory: (category: string) => Article[];
  addArticle: (article: Omit<Article, 'id' | 'publishedAt'>) => Promise<void>;
  updateArticle: (articleId: string, updates: Partial<Omit<Article, 'id'>>) => Promise<void>;
  deleteArticle: (articleId: string) => Promise<void>;
  refreshArticles: () => Promise<void>;
  incrementArticleView: (articleId: string) => Promise<void>;
}

const VideoStoreContext = createContext<VideoStoreContextType | undefined>(undefined);

const defaultSiteSettings: SiteSettings = {
  heroHeading: "Nurturing artists.\nShaping culture.",
  heroSubheading: "Accessible space, community, and education for artists of all levels, mediums, and backgrounds—transforming society through the power of culture.",
};

export function VideoStoreProvider({ children }: { children: ReactNode }) {
  const [series, setSeries] = useState<Series[]>([]);
  const [purchasedEpisodes, setPurchasedEpisodes] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [ledewireToken, setLedewireToken] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [featuredEpisodes, setFeaturedEpisodesState] = useState<FeaturedEpisode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [mostReadArticles, setMostReadArticles] = useState<Article[]>([]);

  // Load series, site settings, featured episodes, and articles on mount
  useEffect(() => {
    loadSeries();
    loadSiteSettings();
    loadFeaturedEpisodes();
    loadArticles();
    loadFeaturedArticles();
    loadLatestArticles();
    loadMostReadArticles();
  }, []);

  // Check for cross-subdomain SSO session first, then local session
  useEffect(() => {
    const checkSSOSession = async () => {
      // First, try the cross-subdomain SSO session (uses shared cookie)
      try {
        const ssoResponse = await fetch('/api/auth/session', { credentials: 'include' });
        if (ssoResponse.ok) {
          const ssoData = await ssoResponse.json();
          if (ssoData.authenticated) {
            console.log('[SSO] Cross-site session restored');
            if (ssoData.user) {
              setUser({
                id: ssoData.user.id,
                email: ssoData.user.email || '',
                name: ssoData.user.name || ssoData.user.email || 'User',
              });
            } else if (ssoData.ledewireUserId) {
              setUser({
                id: ssoData.ledewireUserId,
                email: '',
                name: 'User',
              });
            }
            if (ssoData.ledewireToken) {
              setLedewireToken(ssoData.ledewireToken);
            }
            return;
          }
        }
      } catch (error) {
        console.log('[SSO] No cross-site session found');
      }

      // Fall back to local session check (Google OAuth session)
      try {
        const response = await fetch('/api/auth/user', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setUser({
            id: data.id,
            email: data.email || '',
            name: data.name || data.email || 'User',
          });
          if (data.ledewireToken) {
            setLedewireToken(data.ledewireToken);
          }
        }
      } catch (error) {
        // Not logged in via any method
      }
    };
    checkSSOSession();
  }, []);

  // Load wallet balance when token changes
  useEffect(() => {
    if (ledewireToken) {
      refreshWalletBalance();
    }
  }, [ledewireToken]);

  const loadSeries = async () => {
    try {
      const response = await fetch('/api/series');
      if (response.ok) {
        const data = await response.json();
        setSeries(data);
      }
    } catch (error) {
      console.error('Failed to load series:', error);
    }
  };

  const loadSiteSettings = async () => {
    try {
      const response = await fetch('/api/site-settings');
      if (response.ok) {
        const data = await response.json();
        setSiteSettings({
          heroHeading: data.heroHeading || defaultSiteSettings.heroHeading,
          heroSubheading: data.heroSubheading || defaultSiteSettings.heroSubheading,
        });
      }
    } catch (error) {
      console.error('Failed to load site settings:', error);
    }
  };

  const loadFeaturedEpisodes = async () => {
    try {
      const response = await fetch('/api/featured-episodes');
      if (response.ok) {
        const data = await response.json();
        setFeaturedEpisodesState(data);
      }
    } catch (error) {
      console.error('Failed to load featured episodes:', error);
    }
  };

  const loadArticles = async () => {
    try {
      const response = await fetch('/api/articles');
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error('Failed to load articles:', error);
    }
  };

  const loadFeaturedArticles = async () => {
    try {
      const response = await fetch('/api/articles/featured');
      if (response.ok) {
        const data = await response.json();
        setFeaturedArticles(data);
      }
    } catch (error) {
      console.error('Failed to load featured articles:', error);
    }
  };

  const loadLatestArticles = async () => {
    try {
      const response = await fetch('/api/articles/latest?limit=5');
      if (response.ok) {
        const data = await response.json();
        setLatestArticles(data);
      }
    } catch (error) {
      console.error('Failed to load latest articles:', error);
    }
  };

  const loadMostReadArticles = async () => {
    try {
      const response = await fetch('/api/articles/most-read?limit=5');
      if (response.ok) {
        const data = await response.json();
        setMostReadArticles(data);
      }
    } catch (error) {
      console.error('Failed to load most read articles:', error);
    }
  };

  const getArticlesByCategory = (category: string): Article[] => {
    const allArticles = [...articles, ...featuredArticles.filter(fa => !articles.find(a => a.id === fa.id))];
    return allArticles.filter(a => a.category === category).sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  };

  const incrementArticleView = async (articleId: string) => {
    try {
      await fetch(`/api/articles/${articleId}/view`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  };

  const refreshArticles = async () => {
    await loadArticles();
    await loadFeaturedArticles();
    await loadLatestArticles();
    await loadMostReadArticles();
  };

  const addArticle = async (newArticle: Omit<Article, 'id' | 'publishedAt'>) => {
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

      await refreshArticles();
    } catch (error) {
      console.error('Failed to add article:', error);
      throw error;
    }
  };

  const updateArticle = async (articleId: string, updates: Partial<Omit<Article, 'id'>>) => {
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

      await refreshArticles();
    } catch (error) {
      console.error('Failed to update article:', error);
      throw error;
    }
  };

  const deleteArticle = async (articleId: string) => {
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

      await refreshArticles();
    } catch (error) {
      console.error('Failed to delete article:', error);
      throw error;
    }
  };

  const addSeries = async (newSeries: Omit<Series, 'id' | 'episodes'>) => {
    if (!adminToken) {
      throw new Error('Admin authentication required');
    }
    try {
      const response = await fetch('/api/series', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(newSeries),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create series');
      }

      await loadSeries();
    } catch (error) {
      console.error('Failed to add series:', error);
      throw error;
    }
  };

  const addEpisode = async (seriesId: string, newEpisode: Omit<Episode, 'id'>) => {
    if (!adminToken) {
      throw new Error('Admin authentication required');
    }
    try {
      const response = await fetch('/api/episodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify({
          ...newEpisode,
          seriesId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create episode');
      }

      await loadSeries();
    } catch (error) {
      console.error('Failed to add episode:', error);
      throw error;
    }
  };

  const updateSeries = async (seriesId: string, updates: Omit<Partial<Series>, 'id' | 'episodes'>) => {
    if (!adminToken) {
      throw new Error('Admin authentication required');
    }
    try {
      const response = await fetch(`/api/series/${seriesId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update series');
      }

      await loadSeries();
    } catch (error) {
      console.error('Failed to update series:', error);
      throw error;
    }
  };

  const updateEpisode = async (episodeId: string, updates: Omit<Partial<Episode>, 'id'>) => {
    if (!adminToken) {
      throw new Error('Admin authentication required');
    }
    try {
      const response = await fetch(`/api/episodes/${episodeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update episode');
      }

      await loadSeries();
    } catch (error) {
      console.error('Failed to update episode:', error);
      throw error;
    }
  };

  const deleteEpisode = async (episodeId: string) => {
    if (!adminToken) {
      throw new Error('Admin authentication required');
    }
    try {
      const response = await fetch(`/api/episodes/${episodeId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Token': adminToken,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete episode');
      }

      await loadSeries();
    } catch (error) {
      console.error('Failed to delete episode:', error);
      throw error;
    }
  };

  const purchaseEpisode = async (episodeId: string) => {
    if (!ledewireToken) {
      throw new Error('Please login to purchase');
    }

    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ledewireToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ episodeId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Purchase failed');
      }

      // Only unlock content if the server confirmed the purchase was verified
      if (data.unlocked === true) {
        setPurchasedEpisodes(prev => [...prev, episodeId]);
        await refreshWalletBalance();
      } else {
        // Purchase was not verified - don't unlock
        console.error('Purchase not verified by server:', data);
        throw new Error('Purchase could not be verified. Content not unlocked.');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  };

  const checkPurchase = async (episodeId: string): Promise<boolean> => {
    if (!ledewireToken) {
      return false;
    }

    try {
      const response = await fetch(`/api/purchase/verify/${episodeId}`, {
        headers: {
          'Authorization': `Bearer ${ledewireToken}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.has_purchased || false;
      }
      return false;
    } catch (error) {
      console.error('Failed to check purchase:', error);
      return false;
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, name }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signup failed');
      }

      const data = await response.json();
      setUser(data.user);
      setLedewireToken(data.ledewireToken);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      setLedewireToken(data.ledewireToken);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const loginWithGoogle = async (accessToken: string) => {
    try {
      const response = await fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ accessToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Google login failed');
      }

      const data = await response.json();
      setUser(data.user);
      setLedewireToken(data.ledewireToken);
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setLedewireToken(null);
    setPurchasedEpisodes([]);
    setWalletBalance(0);
    // Also logout from Replit Auth (SSO)
    window.location.href = '/api/logout';
  };

  const refreshWalletBalance = async () => {
    if (!ledewireToken) return;

    try {
      const response = await fetch('/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${ledewireToken}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance_cents / 100);
      }
    } catch (error) {
      console.error('Failed to refresh wallet balance:', error);
    }
  };

  const createPaymentSession = async (amountCents: number) => {
    if (!ledewireToken) {
      throw new Error('Please login to add funds');
    }

    try {
      const response = await fetch('/api/wallet/payment-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ledewireToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ amount_cents: amountCents }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payment session');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create payment session:', error);
      throw error;
    }
  };

  const updateSiteSettings = async (settings: Partial<SiteSettings>) => {
    if (!adminToken) {
      throw new Error('Admin authentication required');
    }
    try {
      const response = await fetch('/api/admin/site-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update site settings');
      }

      const data = await response.json();
      setSiteSettings({
        heroHeading: data.heroHeading,
        heroSubheading: data.heroSubheading,
      });
    } catch (error) {
      console.error('Failed to update site settings:', error);
      throw error;
    }
  };

  const setFeaturedEpisodes = async (episodeIds: string[]) => {
    if (!adminToken) {
      throw new Error('Admin authentication required');
    }
    try {
      const response = await fetch('/api/admin/featured-episodes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify({ episodeIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update featured episodes');
      }

      const data = await response.json();
      setFeaturedEpisodesState(data);
    } catch (error) {
      console.error('Failed to update featured episodes:', error);
      throw error;
    }
  };

  const getAllEpisodes = (): Episode[] => {
    return series.flatMap(s => s.episodes.map(ep => ({ ...ep, seriesId: s.id })));
  };

  return (
    <VideoStoreContext.Provider value={{
      series,
      addSeries,
      addEpisode,
      updateSeries,
      updateEpisode,
      deleteEpisode,
      purchasedEpisodes,
      purchaseEpisode,
      checkPurchase,
      user,
      login,
      signup,
      loginWithGoogle,
      logout,
      ledewireToken,
      walletBalance,
      refreshWalletBalance,
      createPaymentSession,
      adminToken,
      setAdminToken,
      siteSettings,
      updateSiteSettings,
      featuredEpisodes,
      setFeaturedEpisodes,
      getAllEpisodes,
      articles,
      featuredArticles,
      latestArticles,
      mostReadArticles,
      getArticlesByCategory,
      addArticle,
      updateArticle,
      deleteArticle,
      refreshArticles,
      incrementArticleView,
    }}>
      {children}
    </VideoStoreContext.Provider>
  );
}

export function useVideoStore() {
  const context = useContext(VideoStoreContext);
  if (!context) {
    throw new Error('useVideoStore must be used within VideoStoreProvider');
  }
  return context;
}
