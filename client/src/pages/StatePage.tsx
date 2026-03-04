import { useParams, Link } from 'react-router-dom';
import { lazy, Suspense, useState } from 'react';
import { Eye, ArrowLeft } from 'lucide-react';
import { VideoStoreProvider, useVideoStore } from '../context/VideoStoreContext';
import Header from '../components/Header';
import { getStateName, isValidStateCode } from '../lib/states';
import { useArticles } from '../hooks/articles';
import { formatShortDate, formatViewCount } from '../lib/formatters';
import { ImageWithFallback } from '../components/ui/image-with-fallback';

const AuthModal = lazy(() => import('../components/AuthModal'));
const PasswordResetModal = lazy(() => import('../components/PasswordResetModal'));

export default function StatePage() {
  const { stateCode } = useParams<{ stateCode: string }>();
  const code = stateCode?.toUpperCase() || '';
  const stateName = getStateName(code);
  const isValid = isValidStateCode(code);
  const { data: allArticles = [], isLoading } = useArticles();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Filter articles for this state
  const stateArticles = allArticles.filter(a => {
    if (!(a as any).state) return false;
    return (a as any).state.toUpperCase() === code;
  });

  if (!isValid) {
    return (
      <div className="min-h-screen bg-white">
        <Header onLoginClick={() => setShowAuthModal(true)} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">State Not Found</h1>
          <p className="text-gray-500 mb-8">"{stateCode}" is not a valid state code.</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header onLoginClick={() => setShowAuthModal(true)} selectedState={code} />

      {/* State Hero */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            All States
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{stateName}</h1>
          <p className="text-gray-600 mt-2 text-lg">Local coverage from {stateName}</p>

          {/* Topic tabs — just Politics for now, expandable */}
          <nav className="flex items-center gap-6 mt-6">
            <button className="text-sm font-medium text-gray-900 border-b-2 border-gray-900 pb-2">
              Politics
            </button>
            {/* Future topics will be added here */}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-6">
                <div className="w-48 h-32 bg-gray-200 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-16" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && stateArticles.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏛️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No stories yet for {stateName}</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              We're building our coverage network. Contributors for {stateName} are coming soon.
            </p>
          </div>
        )}

        {!isLoading && stateArticles.length > 0 && (
          <div className="space-y-8">
            {stateArticles.map(article => (
              <Link key={article.id} to={`/article/${article.id}`}>
                <article className="group flex flex-col sm:flex-row gap-4 sm:gap-6 py-6 border-b border-gray-100 hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors">
                  {article.thumbnail && (
                    <div className="w-full sm:w-48 h-40 sm:h-32 rounded-lg overflow-hidden shrink-0">
                      <ImageWithFallback
                        src={article.thumbnail}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="inline-block bg-slate-800 text-white text-xs font-medium px-2.5 py-1 rounded mb-2">
                      Politics
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1 line-clamp-2">{article.summary}</p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                      <span>{formatShortDate(article.publishedAt)}</span>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        <span>{formatViewCount(article.viewCount)}</span>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-cream py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <span className="text-xl font-bold text-navy font-serif">The Commons</span>
              <div className="flex items-center gap-4 text-sm">
                <Link to="/terms" className="text-gray-500 hover:text-gray-700 transition-colors">Terms of Service</Link>
                <span className="text-gray-300">|</span>
                <Link to="/privacy" className="text-gray-500 hover:text-gray-700 transition-colors">Privacy Policy</Link>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} The Commons. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {showAuthModal && (
        <Suspense fallback={null}>
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onForgotPassword={() => { setShowAuthModal(false); setShowPasswordReset(true); }}
          />
        </Suspense>
      )}

      {showPasswordReset && (
        <Suspense fallback={null}>
          <PasswordResetModal
            onClose={() => setShowPasswordReset(false)}
            onBackToLogin={() => { setShowPasswordReset(false); setShowAuthModal(true); }}
          />
        </Suspense>
      )}
    </div>
  );
}
