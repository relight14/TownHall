import { useParams, Link } from 'react-router-dom';
import { Eye, ArrowLeft, MapPin } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getStateName } from '../lib/states';
import { useArticles } from '../hooks/articles';
import { useAuthModals, AuthModals } from '../hooks/useAuthModals';
import { formatShortDate, formatViewCount } from '../lib/formatters';
import { ImageWithFallback } from '../components/ui/image-with-fallback';

export default function ContributorPage() {
  const { contributorId } = useParams<{ contributorId: string }>();
  const auth = useAuthModals();

  // TODO: Fetch contributor data from API once contributor endpoints are built
  // For now this is a structural placeholder
  const contributor = null as null | {
    id: string;
    name: string;
    bio: string | null;
    state: string;
    profileImage: string | null;
  };

  const { data: allArticles = [], isLoading } = useArticles();

  // Filter articles by contributor
  const contributorArticles = allArticles.filter(a => {
    return (a as any).contributorId === contributorId;
  });

  return (
    <div className="min-h-screen bg-white">
      <Header onLoginClick={auth.openLogin} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        {/* Contributor profile placeholder */}
        {!contributor && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">👤</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Contributor Profile</h2>
            <p className="text-gray-500">Contributor profiles are coming soon.</p>
          </div>
        )}

        {contributor && (
          <>
            {/* Profile header */}
            <div className="flex flex-col sm:flex-row items-start gap-6 mb-10 pb-8 border-b border-gray-200">
              {contributor.profileImage && (
                <img
                  src={contributor.profileImage}
                  alt={contributor.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{contributor.name}</h1>
                <div className="flex items-center gap-1.5 text-gray-500 mt-1">
                  <MapPin className="w-4 h-4" />
                  <Link to={`/state/${contributor.state.toLowerCase()}`} className="hover:text-blue-600 transition-colors">
                    {getStateName(contributor.state)}
                  </Link>
                </div>
                {contributor.bio && (
                  <p className="text-gray-600 mt-3 max-w-2xl">{contributor.bio}</p>
                )}
              </div>
            </div>

            {/* Contributor articles */}
            <h2 className="text-lg font-bold text-gray-900 mb-6">Articles</h2>
            {contributorArticles.length === 0 && (
              <p className="text-gray-500">No articles published yet.</p>
            )}
            <div className="space-y-6">
              {contributorArticles.map(article => (
                <Link key={article.id} to={`/article/${article.id}`}>
                  <article className="group flex flex-col sm:flex-row gap-4 sm:gap-6 py-4 border-b border-gray-100 hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors">
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
          </>
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
