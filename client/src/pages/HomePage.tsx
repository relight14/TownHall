import { useMemo } from 'react';
import { useVideoStore } from '../context/VideoStoreContext';
import { useSeries } from '../hooks/series/useSeries';
import { useArticles, useFeaturedArticles, type Article } from '../hooks/articles';
import { useFeaturedEpisodes } from '../hooks/featuredEpisodes';
import { useAuthModals, AuthModals } from '../hooks/useAuthModals';
import { Link } from 'react-router-dom';
import { Clock, Eye, Play, ChevronRight, MapPin } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/image-with-fallback';
import { DynamicImage } from '../components/ui/dynamic-image';
import { stripHtmlMemoized } from '../lib/utils';
import { formatDate, formatShortDate, formatViewCount } from '../lib/formatters';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { STATE_NAMES, REGIONS, getHomeState } from '../lib/states';

function ArticlesSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-6 order-1 lg:order-2">
          <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
          <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="lg:col-span-3 order-3">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StateBadge({ state }: { state?: string | null }) {
  const label = state ? STATE_NAMES[state.toUpperCase()] || state : 'National';
  return (
    <span className="inline-block bg-navy text-white text-xs font-medium px-2.5 py-1 rounded font-sans">
      {label}
    </span>
  );
}

function LatestArticleItem({ article }: { article: Article }) {
  return (
    <Link to={`/article/${article.id}`}>
      <div className="group py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors cursor-pointer" data-testid={`latest-article-${article.id}`}>
        <div className="flex items-start justify-between">
          <StateBadge state={(article as any).state} />
          {article.price > 0 && (
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded" data-testid={`price-badge-${article.id}`}>
              ${(article.price / 100).toFixed(2)}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
          <span>{formatShortDate(article.publishedAt)}</span>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{formatViewCount(article.viewCount)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MostReadArticleItem({ article, rank }: { article: Article; rank: number }) {
  return (
    <Link to={`/article/${article.id}`}>
      <div className="group py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors cursor-pointer" data-testid={`most-read-article-${article.id}`}>
        <div className="flex items-start justify-between">
          <StateBadge state={(article as any).state} />
          {article.price > 0 && (
            <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded" data-testid={`price-badge-${article.id}`}>
              ${(article.price / 100).toFixed(2)}
            </span>
          )}
        </div>
        <h3 className="text-base font-semibold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
          <span>{formatShortDate(article.publishedAt)}</span>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{formatViewCount(article.viewCount)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeaturedHeroArticle({ article }: { article: Article }) {
  return (
    <Link to={`/article/${article.id}`}>
      <div className="group cursor-pointer" data-testid={`featured-article-${article.id}`}>
        <div className="flex items-start justify-between">
          <StateBadge state={(article as any).state} />
          {article.price > 0 && (
            <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded" data-testid={`price-badge-${article.id}`}>
              ${(article.price / 100).toFixed(2)}
            </span>
          )}
        </div>
        <div className="mt-4 relative">
          {article.thumbnail ? (
            <DynamicImage
              src={article.thumbnail}
              alt={article.title}
              maxHeight="480px"
              maxHeightMobile="320px"
              minHeight="280px"
              minHeightMobile="200px"
              fallbackAspectRatio={16/9}
              hoverScale={true}
              shadow={true}
            />
          ) : (
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-xl shadow-lg shadow-black/10">
              <span className="text-gray-400 text-4xl font-serif">The Commons</span>
            </div>
          )}
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-4 group-hover:text-blue-600 transition-colors leading-tight">
          {article.title}
        </h2>
        <p className="text-gray-800 mt-3 line-clamp-3 leading-relaxed">
          {stripHtmlMemoized(article.summary)}
        </p>
        <div className="flex items-center gap-3 mt-4 text-sm text-gray-700">
          <span>{formatDate(article.publishedAt)}</span>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{article.readTimeMinutes} min read</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{formatViewCount(article.viewCount)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CategoryArticleCard({ article }: { article: Article }) {
  return (
    <Link to={`/article/${article.id}`}>
      <div className="group cursor-pointer" data-testid={`category-article-${article.id}`}>
        <div className="relative aspect-[3/2] overflow-hidden rounded-xl shadow-lg shadow-black/10">
          {article.thumbnail ? (
            <ImageWithFallback
              src={article.thumbnail}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xl font-serif">The Commons</span>
            </div>
          )}
          {article.price > 0 && (
            <div className="absolute top-3 right-3">
              <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded" data-testid={`price-badge-${article.id}`}>
                ${(article.price / 100).toFixed(2)}
              </span>
            </div>
          )}
        </div>
        <StateBadge state={(article as any).state} />
        <h3 className="text-lg font-bold text-gray-900 mt-2 group-hover:text-blue-600 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-gray-800 mt-2 text-sm line-clamp-3">
          {stripHtmlMemoized(article.summary)}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-700">
          <span>{formatShortDate(article.publishedAt)}</span>
          <span className="text-gray-400">•</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{article.readTimeMinutes} min read</span>
          </div>
          <span className="text-gray-300">•</span>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>{formatViewCount(article.viewCount)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function VideoCard({ episode, seriesTitle }: { episode: any; seriesTitle: string }) {
  return (
    <Link to={`/series/${episode.seriesId}`}>
      <div className="group cursor-pointer" data-testid={`video-card-${episode.id}`}>
        <div className="relative aspect-video overflow-hidden rounded-lg">
          <ImageWithFallback
            src={episode.thumbnail}
            alt={episode.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" />
            </div>
          </div>
          {episode.duration && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {episode.duration}
            </div>
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-900 mt-3 group-hover:text-blue-600 transition-colors line-clamp-2">
          {episode.title}
        </h3>
        <p className="text-gray-600 mt-2 text-sm line-clamp-2">
          {episode.description}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <span>{seriesTitle}</span>
        </div>
      </div>
    </Link>
  );
}

function VideoAnalysisSection({ episodes, series }: { episodes: any[]; series: any[] }) {
  if (episodes.length === 0) return null;

  const getSeriesTitle = (seriesId: string) => {
    return series.find(s => s.id === seriesId)?.title || 'Video Series';
  };

  return (
    <section className="py-12 border-t border-gray-200">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Video Analysis</h2>
        <Link to="/videos">
          <span className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors" data-testid="view-all-videos">
            View all <ChevronRight className="w-4 h-4" />
          </span>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {episodes.slice(0, 2).map(episode => (
          <VideoCard key={episode.id} episode={episode} seriesTitle={getSeriesTitle(episode.seriesId)} />
        ))}
      </div>
    </section>
  );
}

export default function HomePage() {
  const { 
    user,
    walletBalance,
    logout,
  } = useVideoStore();
  const { data: series = [] } = useSeries();
  const { data: featuredEpisodes = [] } = useFeaturedEpisodes();
  
  // Article queries with loading states
  const { data: articles = [], isLoading: articlesLoading } = useArticles();
  const { data: featuredArticles = [], isLoading: featuredLoading } = useFeaturedArticles();
  
  const isLoading = articlesLoading || featuredLoading;
  
  const auth = useAuthModals();

  const homeState = getHomeState();

  // Memoize combined articles to prevent recalculation on every render
  const allArticles = useMemo(() =>
    [...articles, ...featuredArticles.filter(fa => !articles.find(a => a.id === fa.id))],
    [articles, featuredArticles]
  );

  // Memoize sorted arrays (national feed — no category filtering anymore)
  const latestSorted = useMemo(() =>
    [...allArticles].sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    ),
    [allArticles]
  );

  const mostReadSorted = useMemo(() =>
    [...allArticles].sort((a, b) => b.viewCount - a.viewCount),
    [allArticles]
  );

  const featuredSorted = useMemo(() =>
    allArticles.filter(a => (a.featured ?? 0) > 0).sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0)),
    [allArticles]
  );

  const featuredArticle = featuredSorted[0] || latestSorted[0];

  const displayedLatest = useMemo(() =>
    latestSorted.filter(a => a.id !== featuredArticle?.id).slice(0, 4),
    [latestSorted, featuredArticle]
  );

  const displayedMostRead = useMemo(() =>
    mostReadSorted.slice(0, 4),
    [mostReadSorted]
  );

  return (
    <div className="min-h-screen bg-white">
      <Header onLoginClick={auth.openLogin} />

      {/* Topic Subheader */}
      <div className="border-b border-gray-100 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-8 h-12 overflow-x-auto">
            <span className="text-sm font-medium text-navy relative py-3">
              Politics
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-navy" />
            </span>
            {/* Future topics (Sports, Business, etc.) will appear here */}
            <Link
              to="/videos"
              className="text-sm font-medium whitespace-nowrap transition-colors relative py-3 text-gray-500 hover:text-gray-700"
              data-testid="category-tab-videos"
            >
              Videos
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && <ArticlesSkeleton />}

        {/* Hero Section - 3 Column Layout */}
        {!isLoading && featuredArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column - Latest */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-200">Latest</h2>
              <div className="divide-y divide-gray-100">
                {displayedLatest.map(article => (
                  <LatestArticleItem key={article.id} article={article} />
                ))}
              </div>
              {displayedLatest.length === 0 && (
                <p className="text-gray-500 text-sm py-4">No articles yet</p>
              )}
            </div>

            {/* Center Column - Featured */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <FeaturedHeroArticle article={featuredArticle} />
            </div>

            {/* Right Column - Most Read */}
            <div className="lg:col-span-3 order-3">
              <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-200">Trending</h2>
              <div className="divide-y divide-gray-100">
                {displayedMostRead.map((article, index) => (
                  <MostReadArticleItem key={article.id} article={article} rank={index + 1} />
                ))}
              </div>
              {displayedMostRead.length === 0 && (
                <p className="text-gray-500 text-sm py-4">No articles yet</p>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !featuredArticle && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏛️</div>
            <p className="text-navy text-xl font-bold font-serif">Welcome to The Commons</p>
            <p className="text-gray-500 mt-2">Reader-funded local news from every state. Select your state above to get started.</p>
          </div>
        )}

        {/* Browse by State Section */}
        <section className="py-12 border-t border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Browse by State</h2>
          </div>
          <div className="space-y-8">
            {Object.entries(REGIONS).map(([regionKey, region]) => (
              <div key={regionKey}>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{region.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {region.states.map(code => (
                    <Link
                      key={code}
                      to={`/state/${code.toLowerCase()}`}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        homeState?.toUpperCase() === code
                          ? 'bg-navy text-white border-navy'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-cream hover:border-gray-300'
                      }`}
                      data-testid={`state-link-${code}`}
                    >
                      {STATE_NAMES[code]}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Video Analysis Section */}
        <VideoAnalysisSection episodes={featuredEpisodes} series={series} />
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
