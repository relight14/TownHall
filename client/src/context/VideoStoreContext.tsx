import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    const bufferSeconds = 60;
    return now >= (payload.exp - bufferSeconds);
  } catch {
    return true;
  }
}

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
  price: number;
  author?: string;
}

interface VideoStoreContextType {
  purchasedEpisodes: string[];
  purchaseEpisode: (episodeId: string) => Promise<void>;
  checkPurchase: (episodeId: string) => Promise<boolean>;
  user: User | null;
  login: (email: string, password: string) => Promise<string>;
  signup: (email: string, password: string, name: string) => Promise<string>;
  loginWithGoogle: (accessToken: string) => Promise<string>;
  logout: () => void;
  ledewireToken: string | null;
  walletBalance: number;
  refreshWalletBalance: () => Promise<void>;
  createPaymentSession: (amountCents: number) => Promise<any>;
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
  articles: Article[];
  adminArticles: Article[];
  adminArticlesLoaded: boolean;
  featuredArticles: Article[];
  latestArticles: Article[];
  mostReadArticles: Article[];
  getArticlesByCategory: (category: string) => Article[];
  addArticle: (article: Omit<Article, 'id' | 'publishedAt'>) => Promise<void>;
  updateArticle: (articleId: string, updates: Partial<Omit<Article, 'id'>>) => Promise<void>;
  deleteArticle: (articleId: string) => Promise<void>;
  refreshArticles: () => Promise<void>;
  incrementArticleView: (articleId: string) => Promise<void>;
  loadAdminArticles: (token: string) => Promise<void>;
}

const VideoStoreContext = createContext<VideoStoreContextType | undefined>(undefined);

export function VideoStoreProvider({ children }: { children: ReactNode }) {
  const [purchasedEpisodes, setPurchasedEpisodes] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [ledewireToken, setLedewireToken] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [adminArticles, setAdminArticles] = useState<Article[]>([]);
  const [adminArticlesLoaded, setAdminArticlesLoaded] = useState<boolean>(false);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [mostReadArticles, setMostReadArticles] = useState<Article[]>([]);

  // Note: Articles are loaded by individual pages to avoid race conditions
  // - Public pages call loadArticles() which fetches preview content
  // - Admin page calls loadAdminArticles() which fetches full content

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userRef = useRef<User | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Keep refs in sync with state for interval callback
  useEffect(() => {
    userRef.current = user;
    tokenRef.current = ledewireToken;
  }, [user, ledewireToken]);

  const clearSession = useCallback(() => {
    console.log('[AUTH] Clearing stale session');
    setUser(null);
    setLedewireToken(null);
    setPurchasedEpisodes([]);
    setWalletBalance(0);
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const ssoResponse = await fetch('/api/auth/session', { credentials: 'include' });
      if (ssoResponse.ok) {
        const ssoData = await ssoResponse.json();
        if (ssoData.authenticated && ssoData.ledewireToken) {
          console.log('[SSO] Session refreshed successfully');
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
          setLedewireToken(ssoData.ledewireToken);
          return true;
        }
      }
    } catch (error) {
      console.log('[SSO] Session refresh failed:', error);
    }
    return false;
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

    // Set up periodic session refresh every 5 minutes
    refreshIntervalRef.current = setInterval(() => {
      const currentUser = userRef.current;
      const currentToken = tokenRef.current;
      
      if (currentUser && currentToken) {
        if (isTokenExpired(currentToken)) {
          console.log('[AUTH] Token expired, attempting refresh...');
          refreshSession().then(success => {
            if (!success) {
              clearSession();
            }
          });
        }
      }
    }, 5 * 60 * 1000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Load wallet balance when token changes
  useEffect(() => {
    if (ledewireToken) {
      refreshWalletBalance();
    }
  }, [ledewireToken]);


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

  const loadAdminArticles = async (token: string) => {
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

      await loadAdminArticles(adminToken);
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

      await loadAdminArticles(adminToken);
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

      await loadAdminArticles(adminToken);
    } catch (error) {
      console.error('Failed to delete article:', error);
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
      return data.ledewireToken;
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
      return data.ledewireToken;
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
      return data.ledewireToken;
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
    const currentToken = tokenRef.current || ledewireToken;
    if (!currentToken) return;

    // Check if token is expired before making request
    if (isTokenExpired(currentToken)) {
      console.log('[WALLET] Token expired, attempting refresh before balance check...');
      const refreshed = await refreshSession();
      if (!refreshed) {
        console.log('[WALLET] Token refresh failed, clearing session');
        clearSession();
        return;
      }
      // After refresh, the useEffect watching ledewireToken will call us again
      // with the fresh token, so we can return here
      return;
    }

    try {
      const response = await fetch('/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        console.log('[WALLET] Got 401, attempting session refresh...');
        const refreshed = await refreshSession();
        if (!refreshed) {
          console.log('[WALLET] Session refresh failed after 401, clearing session');
          clearSession();
        }
        // If refresh succeeded, the useEffect will call us again with fresh token
        return;
      }

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



  // getAllEpisodes removed - use useSeries hook and flatten episodes locally

  return (
    <VideoStoreContext.Provider value={{
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
      articles,
      adminArticles,
      adminArticlesLoaded,
      featuredArticles,
      latestArticles,
      mostReadArticles,
      getArticlesByCategory,
      addArticle,
      updateArticle,
      deleteArticle,
      refreshArticles,
      incrementArticleView,
      loadAdminArticles,
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
