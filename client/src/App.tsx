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
import { Wallet, LogIn, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import indigoSoulLogo from '@assets/indigosoul_1764613870278.avif';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function AppContent() {
  const { user, walletBalance, logout } = useVideoStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

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

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <VideoStoreProvider>
        <Router>
          <AppContent />
        </Router>
      </VideoStoreProvider>
    </GoogleOAuthProvider>
  );
}
