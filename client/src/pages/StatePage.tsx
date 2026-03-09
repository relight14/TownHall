import { useParams, Link } from 'react-router-dom';
import { Eye, ArrowLeft } from 'lucide-react';
import { VideoStoreProvider, useVideoStore } from '../context/VideoStoreContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getStateName, isValidStateCode } from '../lib/states';
import { useArticlesByState } from '../hooks/articles';
import { useAuthModals, AuthModals } from '../hooks/useAuthModals';
import { formatShortDate, formatViewCount } from '../lib/formatters';
import { ImageWithFallback } from '../components/ui/image-with-fallback';

export default function StatePage() {
  const { stateCode } = useParams<{ stateCode: string }>();
  const code = stateCode?.toUpperCase() || '';
  const stateName = getStateName(code);
  const isValid = isValidStateCode(code);
  const { data: stateArticles = [], isLoading } = useArticlesByState(isValid ? code : null);
  const auth = useAuthModals();

  if (!isValid) {
    return (
      <div className="min-h-screen bg-parchment">
        <Header onLoginClick={auth.openLogin} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-3xl font-serif font-bold text-navy mb-4">State Not Found</h1>
          <p className="text-slate mb-8 font-body">"{stateCode}" is not a valid state code.</p>
          <Link to="/" className="text-gold hover:text-gold-dark font-medium font-sans">
            ← Back to Home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <Header onLoginClick={auth.openLogin} selectedState={code} />

      {/* State Hero */}
      <div className="bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-parchment/60 hover:text-gold mb-4 transition-colors font-sans">
            <ArrowLeft className="w-4 h-4" />
            All States
          </Link>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white">{stateName}</h1>
          <p className="text-parchment/70 mt-2 text-lg font-body">Local coverage from {stateName}</p>

          {/* Topic tabs — just Politics for now, expandable */}
          <nav className="flex items-center gap-6 mt-6">
            <button className="text-sm font-sans font-medium text-white border-b-2 border-gold pb-2">
              Politics
            </button>
            {/* Future topics will be added here */}
          </nav>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-6">
                <div className="w-48 h-32 bg-navy/5 rounded-lg shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-navy/5 rounded w-16" />
                  <div className="h-6 bg-navy/5 rounded w-3/4" />
                  <div className="h-4 bg-navy/5 rounded w-full" />
                  <div className="h-3 bg-navy/5 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && stateArticles.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏛️</div>
            <h2 className="text-xl font-serif font-bold text-navy mb-2">No stories yet for {stateName}</h2>
            <p className="text-slate max-w-md mx-auto font-body">
              We're building our coverage network. Contributors for {stateName} are coming soon.
            </p>
          </div>
        )}

        {!isLoading && stateArticles.length > 0 && (
          <div className="space-y-8">
            {stateArticles.map(article => (
              <Link key={article.id} to={`/article/${article.id}`}>
                <article className="group flex flex-col sm:flex-row gap-4 sm:gap-6 py-6 border-b border-navy/8 hover:bg-white -mx-4 px-4 rounded-lg transition-colors">
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
                    <span className="inline-block bg-navy text-white text-xs font-sans font-medium px-2.5 py-1 rounded mb-2">
                      Politics
                    </span>
                    <h3 className="text-lg font-serif font-bold text-navy group-hover:text-gold transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-slate text-sm mt-1 line-clamp-2 font-body">{article.summary}</p>
                    <div className="flex items-center gap-2 mt-3 text-sm text-slate font-sans">
                      <span>{formatShortDate(article.publishedAt)}</span>
                      <span className="text-navy/20">•</span>
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

      <Footer />

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
