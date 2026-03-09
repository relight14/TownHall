import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';

interface PurchaseContextType {
  purchasedEpisodes: string[];
  purchaseEpisode: (episodeId: string) => Promise<void>;
  checkPurchase: (episodeId: string) => Promise<boolean>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { ledewireToken } = useAuth();
  const { refreshWalletBalance } = useWallet();
  const [purchasedEpisodes, setPurchasedEpisodes] = useState<string[]>([]);

  const purchaseEpisode = useCallback(async (episodeId: string) => {
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
        console.error('Purchase not verified by server:', data);
        throw new Error('Purchase could not be verified. Content not unlocked.');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }, [ledewireToken, refreshWalletBalance]);

  const checkPurchase = useCallback(async (episodeId: string): Promise<boolean> => {
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
  }, [ledewireToken]);

  return (
    <PurchaseContext.Provider value={{
      purchasedEpisodes,
      purchaseEpisode,
      checkPurchase,
    }}>
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase() {
  const context = useContext(PurchaseContext);
  if (!context) {
    throw new Error('usePurchase must be used within PurchaseProvider');
  }
  return context;
}
