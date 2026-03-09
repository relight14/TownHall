import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { VideoStoreProvider, useVideoStore } from './context/VideoStoreContext';
import { lazy, Suspense, useState, useEffect, createContext, useContext } from 'react';
import { useAuthModals, AuthModals } from './hooks/useAuthModals';

// Route-level code splitting — each page loads only when navigated to
const HomePage = lazy(() => import('./pages/HomePage'));
const StatePage = lazy(() => import('./pages/StatePage'));
const ContributorPage = lazy(() => import('./pages/ContributorPage'));
const SeriesPage = lazy(() => import('./pages/SeriesPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const VideosPage = lazy(() => import('./pages/VideosPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

const CookieConsent = lazy(() => import('./components/CookieConsent'));

interface GoogleOAuthContextType {
  isAvailable: boolean;
  isLoading: boolean;
}

const GoogleOAuthContext = createContext<GoogleOAuthContextType>({ 
  isAvailable: false, 
  isLoading: true 
});

export function useGoogleOAuthStatus() {
  return useContext(GoogleOAuthContext);
}

function AppContent() {
  const { user, walletBalance, logout } = useVideoStore();
  const auth = useAuthModals();

  return (
    <div className="min-h-screen bg-white font-sans">
      <Suspense fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      }>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/state/:stateCode" element={<StatePage />} />
          <Route path="/contributor/:contributorId" element={<ContributorPage />} />
          <Route path="/series/:seriesId" element={<SeriesPage />} />
          <Route path="/article/:articleId" element={<ArticlePage />} />
          <Route path="/category/:category" element={<CategoryPage />} />
          <Route path="/videos" element={<VideosPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </Suspense>

      <Suspense fallback={null}>
        <CookieConsent />
      </Suspense>

      <AuthModals
        showAuth={auth.showAuth}
        showPasswordReset={auth.showPasswordReset}
        onClose={auth.closeAll}
        onForgotPassword={auth.switchToPasswordReset}
        onBackToLogin={auth.switchToLogin}
      />
    </div>
  );
}

function GoogleOAuthWrapper({ children }: { children: React.ReactNode }) {
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGoogleConfig() {
      try {
        const response = await fetch('/api/auth/google/config');
        if (response.ok) {
          const data = await response.json();
          setGoogleClientId(data.clientId);
        } else {
          console.warn('[App] Google OAuth config not available');
        }
      } catch (error) {
        console.error('[App] Failed to fetch Google OAuth config:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchGoogleConfig();
  }, []);

  if (loading) {
    return (
      <GoogleOAuthContext.Provider value={{ isAvailable: false, isLoading: true }}>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </GoogleOAuthContext.Provider>
    );
  }

  if (!googleClientId) {
    return (
      <GoogleOAuthContext.Provider value={{ isAvailable: false, isLoading: false }}>
        {children}
      </GoogleOAuthContext.Provider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <GoogleOAuthContext.Provider value={{ isAvailable: true, isLoading: false }}>
        {children}
      </GoogleOAuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export default function App() {
  return (
    <GoogleOAuthWrapper>
      <VideoStoreProvider>
        <Router>
          <AppContent />
        </Router>
      </VideoStoreProvider>
    </GoogleOAuthWrapper>
  );
}
