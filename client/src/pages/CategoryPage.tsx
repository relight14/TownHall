import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useArticles, useFeaturedArticles } from '../hooks/articles';
import { ArrowLeft, Clock, Eye, TrendingUp, User } from 'lucide-react';

const categoryLabels: Record<string, string> = {
  'elections': 'Elections',
  'policy': 'Policy',
  'candidate-rankings': 'Candidate Rankings',
  'speech-analysis': 'Speech Analysis',
};

const categoryDescriptions: Record<string, string> = {
  'elections': 'Coverage of local, state, and national elections including candidate profiles and voting analysis.',
  'policy': 'In-depth analysis of policy proposals, legislation, and their impact on communities.',
  'candidate-rankings': 'Comprehensive rankings of political candidates based on performance and positions.',
  'speech-analysis': 'Expert analysis of political speeches, rhetoric, and communication strategies.',
};

export default function CategoryPage() {
  const params = useParams();
  const category = params.category as string;

  const { data: articles = [] } = useArticles();
  const { data: featuredArticles = [] } = useFeaturedArticles();

  const categoryArticles = useMemo(() => {
    const allArticles = [...articles, ...featuredArticles.filter(fa => !articles.find(a => a.id === fa.id))];
    return allArticles.filter(a => a.category === category);
  }, [articles, featuredArticles, category]);
  
  const featuredInCategory = categoryArticles.filter(a => (a.featured ?? 0) > 0).sort((a, b) => (a.featured ?? 0) - (b.featured ?? 0));
  const latestInCategory = [...categoryArticles].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const mostReadInCategory = [...categoryArticles].sort((a, b) => b.viewCount - a.viewCount);

  const heroArticle = featuredInCategory[0] || latestInCategory[0];
  const remainingArticles = categoryArticles.length > 1 
    ? latestInCategory.filter(a => a.id !== heroArticle?.id)
    : latestInCategory;

  const label = categoryLabels[category] || category;
  const description = categoryDescriptions[category] || '';

  if (!categoryLabels[category]) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Category Not Found</h1>
          <p className="text-gray-600 mb-6">The category you're looking for doesn't exist.</p>
          <Link to="/" className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-2xl font-bold text-slate-900 font-serif">The Commons</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {Object.entries(categoryLabels).map(([key, lbl]) => (
                <Link 
                  key={key} 
                  to={`/category/${key}`}
                  className={`text-sm font-medium transition-colors ${
                    category === key 
                      ? 'text-red-600 border-b-2 border-red-600 pb-1' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  data-testid={`nav-category-${key}`}
                >
                  {lbl}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" data-testid={`category-title-${category}`}>
            {label}
          </h1>
          <p className="text-lg text-gray-600">{description}</p>
          <p className="text-sm text-gray-500 mt-2">{categoryArticles.length} articles</p>
        </div>

        {heroArticle && (
          <div className="mb-12">
            <Link to={`/article/${heroArticle.id}`} className="group block" data-testid={`hero-article-${heroArticle.id}`}>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                  {heroArticle.thumbnail ? (
                    <img 
                      src={heroArticle.thumbnail} 
                      alt={heroArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700">
                      <span className="text-white text-6xl font-bold">{heroArticle.title.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div>
                  {(heroArticle.featured ?? 0) > 0 && (
                    <span className="inline-block bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                      Featured
                    </span>
                  )}
                  <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-red-600 transition-colors">
                    {heroArticle.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">{heroArticle.summary}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {heroArticle.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {heroArticle.readTimeMinutes} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {heroArticle.viewCount.toLocaleString()} views
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {mostReadInCategory.length > 1 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Most Read in {label}</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {mostReadInCategory.slice(0, 3).map((article, index) => (
                <Link key={article.id} to={`/article/${article.id}`} className="group block" data-testid={`most-read-${article.id}`}>
                  <div className="flex gap-4">
                    <span className="text-4xl font-bold text-gray-200 group-hover:text-red-200 transition-colors">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{article.author}</span>
                        <span>{article.viewCount.toLocaleString()} views</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Articles</h2>
          {remainingArticles.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No articles in this category yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingArticles.map(article => (
                <Link 
                  key={article.id} 
                  to={`/article/${article.id}`} 
                  className="group block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow" 
                  data-testid={`article-card-${article.id}`}
                >
                  <div className="aspect-video bg-gray-100">
                    {article.thumbnail ? (
                      <img 
                        src={article.thumbnail} 
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600">
                        <span className="text-white text-4xl font-bold">{article.title.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-2">
                      {article.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{article.summary}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{article.author}</span>
                      <div className="flex items-center gap-3">
                        <span>{article.readTimeMinutes} min</span>
                        <span>{article.viewCount} views</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
