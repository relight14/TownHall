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

interface VideoStoreContextType {
  series: Series[];
  addSeries: (series: Omit<Series, 'id' | 'episodes'>) => Promise<void>;
  addEpisode: (seriesId: string, episode: Omit<Episode, 'id'>) => Promise<void>;
  updateSeries: (seriesId: string, updates: Omit<Partial<Series>, 'id' | 'episodes'>) => Promise<void>;
  deleteEpisode: (episodeId: string) => Promise<void>;
  purchasedEpisodes: string[];
  purchaseEpisode: (episodeId: string) => Promise<void>;
  checkPurchase: (episodeId: string) => Promise<boolean>;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  ledewireToken: string | null;
  walletBalance: number;
  refreshWalletBalance: () => Promise<void>;
  createPaymentSession: (amountCents: number) => Promise<any>;
  setAdminToken: (token: string | null) => void;
}

const VideoStoreContext = createContext<VideoStoreContextType | undefined>(undefined);

export function VideoStoreProvider({ children }: { children: ReactNode }) {
  const [series, setSeries] = useState<Series[]>([]);
  const [purchasedEpisodes, setPurchasedEpisodes] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [ledewireToken, setLedewireToken] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Load series on mount
  useEffect(() => {
    loadSeries();
  }, []);

  // Check for SSO user on mount
  useEffect(() => {
    const checkSSOUser = async () => {
      try {
        const response = await fetch('/api/auth/user');
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
        // Not logged in via SSO, ignore
      }
    };
    checkSSOUser();
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

  return (
    <VideoStoreContext.Provider value={{
      series,
      addSeries,
      addEpisode,
      updateSeries,
      deleteEpisode,
      purchasedEpisodes,
      purchaseEpisode,
      checkPurchase,
      user,
      login,
      signup,
      logout,
      ledewireToken,
      walletBalance,
      refreshWalletBalance,
      createPaymentSession,
      setAdminToken,
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
