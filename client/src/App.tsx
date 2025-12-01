import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { VideoStoreProvider, useVideoStore } from './context/VideoStoreContext';
import HomePage from './pages/HomePage';
import SeriesPage from './pages/SeriesPage';
import AdminPage from './pages/AdminPage';
import WalletPage from './pages/WalletPage';
import { Wallet, LogIn, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import indigoSoulLogo from '@assets/indigosoul_1764613870278.avif';

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
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/wallet" element={<WalletPage />} />
      </Routes>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const { login, signup } = useVideoStore();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, name);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl text-white mb-6 font-bold">
          {isLogin ? 'Login' : 'Sign Up'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" data-testid="text-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-slate-300 mb-2 text-sm font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                required
                data-testid="input-name"
              />
            </div>
          )}
          
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
              data-testid="input-email"
            />
          </div>
          
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
              data-testid="input-password"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg transition-colors border border-slate-700 font-medium"
              data-testid="button-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg transition-colors font-medium shadow-lg shadow-blue-600/20 disabled:opacity-50"
              data-testid="button-submit"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            data-testid="button-toggle-auth"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <VideoStoreProvider>
      <Router>
        <AppContent />
      </Router>
    </VideoStoreProvider>
  );
}
