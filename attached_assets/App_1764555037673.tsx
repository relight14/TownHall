import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { VideoStoreProvider } from './components/VideoStoreContext';
import HomePage from './components/HomePage';
import SeriesPage from './components/SeriesPage';
import AdminPage from './components/AdminPage';
import { Video, Wallet, Settings } from 'lucide-react';

export default function App() {
  return (
    <VideoStoreProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <nav className="border-b border-slate-700/50 bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-slate-950/95 backdrop-blur-xl relative z-20 shadow-lg shadow-black/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-20">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="text-xl text-white tracking-tight block">Adventure Films</span>
                    <span className="text-xs text-slate-400 tracking-wider uppercase">Premium Content</span>
                  </div>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-3">
                  <Link 
                    to="/wallet" 
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-500/40 border border-blue-500/20"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Wallet</span>
                    <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">$24.50</span>
                  </Link>
                  <Link 
                    to="/admin" 
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-600/50 hover:border-slate-500"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Admin</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/series/:seriesId" element={<SeriesPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </div>
      </Router>
    </VideoStoreProvider>
  );
}