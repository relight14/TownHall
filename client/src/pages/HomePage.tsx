import { useMemo } from 'react';
import { useVideoStore } from '../context/VideoStoreContext';
import { useSeries } from '../hooks/series/useSeries';
import { useArticles, useFeaturedArticles, type Article } from '../hooks/articles';
import { useFeaturedEpisodes } from '../hooks/featuredEpisodes';
import { useAuthModals, AuthModals } from '../hooks/useAuthModals';
import { Link } from 'react-router-dom';
import { Clock, Eye, Play, ChevronRight, MapPin, ArrowRight } from 'lucide-react';
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
    <span className="inline-block bg-navy/90 text-parchment text-xs font-sans font-medium px-2 py-0.5 rounded tracking-wide">
      {label}
    </span>
  );
}

function LatestArticleItem({ article }: { article: Article }) {
  return (
    <Link to={`/article/${article.id}`}>
      <div className="group py-4 last:border-b-0 hover:bg-gold-pale/30 -mx-2 px-2 rounded transition-colors cursor-pointer" data-testid={`latest-article-${article.id}`}>
        <div className="flex items-start justify-between">
          <StateBadge state={(article as any).state} />
          {article.price > 0 && (
            <span className="text-xs font-sans font-semibold text-slate bg-parchment px-2 py-0.5 rounded" data-testid={`price-badge-${article.id}`}>
              ${(article.price / 100).toFixed(2)}
            </span>
          )}
        </div>
        <h3 className="text-base font-serif font-semibold text-navy mt-2 group-hover:text-gold-dark transition-colors line-clamp-2 leading-snug">
          {article.title}
        </h3>
        <div className="flex items-center gap-2 mt-2 text-xs font-sans text-slate">
          <span>{formatShortDate(article.publishedAt)}</span>
          <span className="text-slate/30">·</span>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
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
      <div className="group py-4 last:border-b-0 hover:bg-gold-pale/30 -mx-2 px-2 rounded transition-colors cursor-pointer" data-testid={`most-read-article-${article.id}`}>
        <div className="flex items-start justify-between">
          <StateBadge state={(article as any).state} />
          {article.price > 0 && (
            <span className="text-xs font-sans font-semibold text-slate bg-parchment px-2 py-0.5 rounded" data-testid={`price-badge-${article.id}`}>
              ${(article.price / 100).toFixed(2)}
            </span>
          )}
        </div>
        <h3 className="text-base font-serif font-semibold text-navy mt-2 group-hover:text-gold-dark transition-colors line-clamp-2 leading-snug">
          {article.title}
        </h3>
        <div className="flex items-center gap-2 mt-2 text-xs font-sans text-slate">
          <span>{formatShortDate(article.publishedAt)}</span>
          <span className="text-slate/30">·</span>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
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
            <span className="text-sm font-sans font-semibold text-slate bg-gold-pale px-3 py-1 rounded" data-testid={`price-badge-${article.id}`}>
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
            <div className="w-full aspect-[16/9] bg-gradient-to-br from-cool-grey to-parchment flex items-center justify-center rounded-xl shadow-lg shadow-navy/5">
              <span className="text-slate/40 text-4xl font-serif">The Commons</span>
            </div>
          )}
        </div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-navy mt-5 group-hover:text-gold-dark transition-colors leading-tight">
          {article.title}
        </h2>
        <p className="text-slate mt-3 line-clamp-3 leading-relaxed font-body text-base">
          {stripHtmlMemoized(article.summary)}
        </p>
        <div className="flex items-center gap-3 mt-4 text-xs font-sans text-slate">
          <span>{formatDate(article.publishedAt)}</span>
          <span className="text-slate/30">·</span>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.readTimeMinutes} min read</span>
          </div>
          <span className="text-slate/30">·</span>
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
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
        <h3 className="text-lg font-bold text-navy mt-2 group-hover:text-gold-dark transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-slate mt-2 text-sm line-clamp-3 font-body">
          {stripHtmlMemoized(article.summary)}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-slate">
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
        <h3 className="text-lg font-bold text-navy mt-3 group-hover:text-gold-dark transition-colors line-clamp-2">
          {episode.title}
        </h3>
        <p className="text-slate mt-2 text-sm line-clamp-2 font-body">
          {episode.description}
        </p>
        <div className="flex items-center gap-2 mt-3 text-xs text-slate">
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
        <h2 className="text-2xl font-bold text-navy">Video Analysis</h2>
        <Link to="/videos">
          <span className="text-sm text-slate hover:text-gold flex items-center gap-1 transition-colors" data-testid="view-all-videos">
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
    <div className="min-h-screen bg-parchment">
      <Header onLoginClick={auth.openLogin} />

      {/* Hero Section — Navy background, editorial gravity */}
      <section className="bg-navy relative overflow-hidden">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="py-16 sm:py-20 lg:py-24 text-center max-w-3xl mx-auto">
            <span className="section-label text-gold/90 mb-4 block">Reader-Funded Journalism</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight tracking-tight">
              Local Reporting.{' '}
              <span className="text-gold">National Reach.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-parchment/70 font-body leading-relaxed max-w-2xl mx-auto">
              On-the-ground journalism from reporters across all 50 states. Every story you unlock directly supports the writer who reported it.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={auth.openLogin}
                className="bg-gold hover:bg-gold-light text-white px-8 py-3 rounded font-sans font-semibold transition-colors text-base tracking-wide"
              >
                Start Reading
              </button>
              <Link
                to="/videos"
                className="border border-parchment/30 text-parchment/80 hover:text-white hover:border-parchment/50 px-8 py-3 rounded font-sans font-medium transition-colors text-base"
              >
                Watch Video Analysis
              </Link>
            </div>
            {/* 75% trust signal */}
            <div className="mt-10 inline-flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/5 border border-gold/20">
              <span className="text-gold font-serif font-bold text-2xl">75%</span>
              <span className="text-parchment/60 text-sm text-left leading-tight font-sans">of every purchase<br />goes directly to the writer</span>
            </div>
          </div>
        </div>
        {/* Bottom gradient transition */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </section>

      {/* Topic Subheader */}
      <div className="border-b border-navy/10 bg-white sticky top-12 sm:top-14 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-8 h-11 overflow-x-auto">
            <span className="text-sm font-sans font-medium text-navy relative py-3">
              Politics
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold" />
            </span>
            <Link
              to="/videos"
              className="text-sm font-sans font-medium whitespace-nowrap transition-colors relative py-3 text-slate hover:text-navy"
              data-testid="category-tab-videos"
            >
              Videos
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content — Parchment background */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Loading State */}
        {isLoading && <ArticlesSkeleton />}

        {/* Hero Section - 3 Column Layout */}
        {!isLoading && featuredArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Left Column - Latest */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <h2 className="section-label pb-3 border-b border-navy/10 mb-1">Latest</h2>
              <div className="divide-y divide-navy/5">
                {displayedLatest.map(article => (
                  <LatestArticleItem key={article.id} article={article} />
                ))}
              </div>
              {displayedLatest.length === 0 && (
                <p className="text-slate text-sm py-4 font-body">No articles yet</p>
              )}
            </div>

            {/* Center Column - Featured */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <FeaturedHeroArticle article={featuredArticle} />
            </div>

            {/* Right Column - Most Read */}
            <div className="lg:col-span-3 order-3">
              <h2 className="section-label pb-3 border-b border-navy/10 mb-1">Trending</h2>
              <div className="divide-y divide-navy/5">
                {displayedMostRead.map((article, index) => (
                  <MostReadArticleItem key={article.id} article={article} rank={index + 1} />
                ))}
              </div>
              {displayedMostRead.length === 0 && (
                <p className="text-slate text-sm py-4 font-body">No articles yet</p>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !featuredArticle && (
          <div className="text-center py-20">
            <p className="text-navy text-2xl font-bold font-serif">Welcome to The Commons</p>
            <p className="text-slate mt-3 font-body text-lg">Reader-funded local news from every state. Select your state above to get started.</p>
          </div>
        )}
      </main>

      {/* Browse by State — Cool grey background for rhythm */}
      <section className="bg-cool-grey py-14 sm:py-16 border-t border-navy/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="section-label block mb-2">Explore</span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-navy">Browse by State</h2>
            </div>
          </div>
          <div className="space-y-8">
            {Object.entries(REGIONS).map(([regionKey, region]) => (
              <div key={regionKey}>
                <h3 className="text-xs font-sans font-semibold uppercase tracking-widest text-slate/60 mb-3">{region.label}</h3>
                <div className="flex flex-wrap gap-2">
                  {region.states.map(code => (
                    <Link
                      key={code}
                      to={`/state/${code.toLowerCase()}`}
                      className={`px-3 py-2 text-sm font-sans font-medium rounded border transition-all duration-200 ${
                        homeState?.toUpperCase() === code
                          ? 'bg-navy text-white border-navy shadow-sm'
                          : 'bg-white text-slate border-navy/10 hover:bg-gold-pale hover:border-gold/30 hover:text-navy'
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
        </div>
      </section>

      {/* Video Analysis Section — Navy background for rhythm */}
      {featuredEpisodes.length > 0 && (
        <section className="bg-navy py-14 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="section-label block mb-2">Watch</span>
                <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">Video Analysis</h2>
              </div>
              <Link to="/videos">
                <span className="text-sm text-parchment/60 hover:text-gold flex items-center gap-1 transition-colors font-sans" data-testid="view-all-videos">
                  View all <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredEpisodes.slice(0, 2).map(episode => {
                const seriesTitle = series.find(s => s.id === episode.seriesId)?.title || 'Video Series';
                return (
                  <Link key={episode.id} to={`/series/${episode.seriesId}`}>
                    <div className="group cursor-pointer" data-testid={`video-card-${episode.id}`}>
                      <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10">
                        <ImageWithFallback
                          src={episode.thumbnail}
                          alt={episode.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-14 h-14 bg-gold/90 rounded-full flex items-center justify-center shadow-lg">
                            <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
                          </div>
                        </div>
                        {episode.duration && (
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-sans">
                            {episode.duration}
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-serif font-bold text-white mt-4 group-hover:text-gold transition-colors line-clamp-2">
                        {episode.title}
                      </h3>
                      <p className="text-parchment/50 mt-2 text-sm line-clamp-2 font-body">
                        {episode.description}
                      </p>
                      <span className="text-xs text-parchment/40 mt-2 block font-sans">{seriesTitle}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

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
