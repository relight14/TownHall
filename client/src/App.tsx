import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { VideoStoreProvider, useVideoStore } from './context/VideoStoreContext';
import HomePage from './pages/HomePage';
import SeriesPage from './pages/SeriesPage';
import ArticlePage from './pages/ArticlePage';
import CategoryPage from './pages/CategoryPage';
import AdminPage from './pages/AdminPage';
import WalletPage from './pages/WalletPage';
import AuthModal from './components/AuthModal';
import PasswordResetModal from './components/PasswordResetModal';
import { Wallet, LogIn, LogOut, User } from 'lucide-react';
import { useState, useEffect, createContext, useContext } from 'react';
import indigoSoulLogo from '@assets/indigosoul_1764613870278.avif';

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/series/:seriesId" element={<SeriesPage />} />
        <Route path="/article/:articleId" element={<ArticlePage />} />
        <Route path="/category/:category" element={<CategoryPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/wallet" element={<WalletPage />} />
      </Routes>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onForgotPassword={() => {
            setShowAuthModal(false);
            setShowPasswordReset(true);
          }}
        />
      )}
      
      {showPasswordReset && (
        <PasswordResetModal 
          onClose={() => setShowPasswordReset(false)}
          onBackToLogin={() => {
            setShowPasswordReset(false);
            setShowAuthModal(true);
          }}
        />
      )}
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
