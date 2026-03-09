/**
 * VideoStoreContext — backward-compatible wrapper
 *
 * The monolithic context has been split into four focused contexts:
 *   - AuthContext    (user, login, signup, loginWithGoogle, logout, ledewireToken)
 *   - WalletContext  (walletBalance, refreshWalletBalance, createPaymentSession)
 *   - PurchaseContext (purchasedEpisodes, purchaseEpisode, checkPurchase)
 *   - AdminContext   (adminToken, setAdminToken, adminArticles, addArticle, ...)
 *
 * This file re-exports a `useVideoStore()` hook with the same shape as before
 * so existing consumers continue to work without changes. Migrate consumers to
 * the granular hooks (useAuth, useWallet, usePurchase, useAdmin) over time.
 */

import { type ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { WalletProvider, useWallet } from './WalletContext';
import { PurchaseProvider, usePurchase } from './PurchaseContext';
import { AdminProvider, useAdmin } from './AdminContext';
import { incrementArticleView } from '../lib/articleUtils';

/**
 * Composed provider — drop-in replacement for the old VideoStoreProvider.
 * Nesting order matters: Auth → Wallet → Purchase → Admin
 */
export function VideoStoreProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <WalletProvider>
        <PurchaseProvider>
          <AdminProvider>
            {children}
          </AdminProvider>
        </PurchaseProvider>
      </WalletProvider>
    </AuthProvider>
  );
}

/**
 * Backward-compatible hook — same shape as the old useVideoStore().
 * Prefer the granular hooks in new code:
 *   useAuth()     — user, login, signup, loginWithGoogle, logout, ledewireToken
 *   useWallet()   — walletBalance, refreshWalletBalance, createPaymentSession
 *   usePurchase() — purchasedEpisodes, purchaseEpisode, checkPurchase
 *   useAdmin()    — adminToken, setAdminToken, adminArticles, addArticle, ...
 */
export function useVideoStore() {
  const auth = useAuth();
  const wallet = useWallet();
  const purchase = usePurchase();
  const admin = useAdmin();

  return {
    // Auth
    user: auth.user,
    login: auth.login,
    signup: auth.signup,
    loginWithGoogle: auth.loginWithGoogle,
    logout: auth.logout,
    ledewireToken: auth.ledewireToken,
    // Wallet
    walletBalance: wallet.walletBalance,
    refreshWalletBalance: wallet.refreshWalletBalance,
    createPaymentSession: wallet.createPaymentSession,
    // Purchases
    purchasedEpisodes: purchase.purchasedEpisodes,
    purchaseEpisode: purchase.purchaseEpisode,
    checkPurchase: purchase.checkPurchase,
    // Admin
    adminToken: admin.adminToken,
    setAdminToken: admin.setAdminToken,
    adminArticles: admin.adminArticles,
    adminArticlesLoaded: admin.adminArticlesLoaded,
    addArticle: admin.addArticle,
    updateArticle: admin.updateArticle,
    deleteArticle: admin.deleteArticle,
    loadAdminArticles: admin.loadAdminArticles,
    // Standalone
    incrementArticleView,
  };
}
