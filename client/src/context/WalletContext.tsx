import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth, isTokenExpired } from './AuthContext';

interface WalletContextType {
  walletBalance: number;
  refreshWalletBalance: () => Promise<void>;
  createPaymentSession: (amountCents: number) => Promise<any>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { ledewireToken } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const refreshWalletBalance = useCallback(async () => {
    if (!ledewireToken) return;

    // Check if token is expired before making request
    if (isTokenExpired(ledewireToken)) {
      console.log('[WALLET] Token expired, skipping balance fetch');
      return;
    }

    try {
      const response = await fetch('/api/wallet/balance', {
        headers: {
          'Authorization': `Bearer ${ledewireToken}`,
        },
        credentials: 'include',
      });

      if (response.status === 401) {
        console.log('[WALLET] Got 401, token may be stale');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance_cents / 100);
      }
    } catch (error) {
      console.error('Failed to refresh wallet balance:', error);
    }
  }, [ledewireToken]);

  // Load wallet balance when token changes
  useEffect(() => {
    if (ledewireToken) {
      refreshWalletBalance();
    } else {
      setWalletBalance(0);
    }
  }, [ledewireToken, refreshWalletBalance]);

  const createPaymentSession = useCallback(async (amountCents: number) => {
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
  }, [ledewireToken]);

  return (
    <WalletContext.Provider value={{
      walletBalance,
      refreshWalletBalance,
      createPaymentSession,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
