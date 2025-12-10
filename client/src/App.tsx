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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 font-sans">
      <nav className="border-b border-slate-800/50 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-40 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src={indigoSoulLogo} 
                alt="Indigo Soul NYC" 
                className="h-14 w-auto transition-transform group-hover:scale-105"
              />
              <div>
                <span className="text-xl text-white tracking-tight block font-bold">Indigo Soul NYC</span>
                <span className="text-xs text-slate-400 tracking-wide font-medium">Studios • Entertainment • Media</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <Link 
                    to="/wallet" 
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 border border-blue-500/20 font-medium"
                    data-testid="link-wallet"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Wallet</span>
                    <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold" data-testid="text-wallet-balance">
                      ${walletBalance.toFixed(2)}
                    </span>
                  </Link>
                  <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300 text-sm" data-testid="text-username">{user.name}</span>
                    </div>
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-600/50 hover:border-slate-500"
                      data-testid="button-logout"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 border border-blue-500/20 font-medium"
                  data-testid="button-login"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

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
