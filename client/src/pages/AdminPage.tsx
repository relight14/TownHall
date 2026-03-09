import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoStore } from '../context/VideoStoreContext';
import { useSeries } from '../hooks/series/useSeries';
import { useCreateSeries, useUpdateSeries, useCreateEpisode, useUpdateEpisode, useDeleteEpisode } from '../hooks/series/useSeriesMutations';
import { useFeaturedEpisodes, useSetFeaturedEpisodes } from '../hooks/featuredEpisodes';
import { useSiteSettings, useUpdateSiteSettings } from '../hooks/siteSettings';
import { Plus, Trash2, Video, Edit, Key, LogOut, Star, FileText, ArrowLeft } from 'lucide-react';
import { AdminLoginGate } from '../components/admin/AdminLoginGate';
import { PasswordChangeForm } from '../components/admin/PasswordChangeForm';
import { SeriesForm } from '../components/admin/SeriesForm';
import { EpisodeForm } from '../components/admin/EpisodeForm';

// Lazy-load ArticleForm (heaviest component — includes TipTap rich text editor)
const ArticleForm = lazy(() => import('../components/admin/ArticleForm').then(m => ({ default: m.ArticleForm })));
const FeaturedEpisodesManager = lazy(() => import('../components/admin/FeaturedEpisodesManager').then(m => ({ default: m.FeaturedEpisodesManager })));

function AdminFormFallback() {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
      <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-white rounded-full mx-auto mb-4" />
      <p className="text-slate-400">Loading editor...</p>
    </div>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const { 
    setAdminToken,
    adminArticles, adminArticlesLoaded, addArticle, updateArticle, deleteArticle, loadAdminArticles
  } = useVideoStore();
  const { data: series = [] } = useSeries();
  const { data: featuredEpisodes = [] } = useFeaturedEpisodes();
  const { data: siteSettings } = useSiteSettings();
  
  // Get admin token for mutations
  const adminToken = sessionStorage.getItem('adminToken');
  const createSeriesMutation = useCreateSeries(adminToken);
  const updateSeriesMutation = useUpdateSeries(adminToken);
  const createEpisodeMutation = useCreateEpisode(adminToken);
  const updateEpisodeMutation = useUpdateEpisode(adminToken);
  const deleteEpisodeMutation = useDeleteEpisode(adminToken);
  const setFeaturedEpisodesMutation = useSetFeaturedEpisodes(adminToken);
  const updateSiteSettingsMutation = useUpdateSiteSettings(adminToken);
  
  // Helper function to get all episodes from series
  const getAllEpisodes = () => {
    return series.flatMap(s => s.episodes.map(ep => ({ ...ep, seriesId: s.id })));
  };
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [editingEpisodeId, setEditingEpisodeId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showFeaturedManager, setShowFeaturedManager] = useState(false);
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<'videos' | 'articles'>('articles');

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    sessionStorage.removeItem('adminToken');
    setAdminToken(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const verifyToken = async () => {
      const auth = sessionStorage.getItem('adminAuthenticated');
      const token = sessionStorage.getItem('adminToken');
      
      if (auth === 'true' && token) {
        try {
          const response = await fetch('/api/admin/verify', {
            headers: { 'X-Admin-Token': token }
          });
          
          if (response.ok) {
            setIsAuthenticated(true);
            setAdminToken(token);
            loadAdminArticles(token);
          } else {
            handleLogout();
          }
        } catch {
          handleLogout();
        }
      }
      setIsVerifying(false);
    };
    
    verifyToken();
  }, [setAdminToken]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Verifying session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginGate onAuthenticated={(token) => {
      setIsAuthenticated(true);
      setAdminToken(token);
      loadAdminArticles(token);
    }} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      {showPasswordChange && (
        <PasswordChangeForm onClose={() => setShowPasswordChange(false)} />
      )}

      {showFeaturedManager && (
        <Suspense fallback={<AdminFormFallback />}>
          <FeaturedEpisodesManager
            allEpisodes={getAllEpisodes().map(ep => ({ ...ep, seriesId: (ep as any).seriesId || '' }))}
            featuredEpisodeIds={featuredEpisodes.map(ep => ep.id)}
            series={series.map(s => ({ id: s.id, title: s.title }))}
            onSave={(episodeIds) => {
              setFeaturedEpisodesMutation.mutate(episodeIds, {
                onSuccess: () => {
                  setShowFeaturedManager(false);
                },
              });
            }}
            onClose={() => setShowFeaturedManager(false)}
          />
        </Suspense>
      )}
      
      <div className="mb-8 flex justify-between items-start">
        <div>
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 px-3 py-2 text-slate-300 bg-slate-800/50 hover:bg-slate-700 hover:text-white rounded-lg transition-colors mb-4" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back to Homepage
          </button>
          <h1 className="text-4xl text-white mb-2 font-bold">Content Management</h1>
          <p className="text-slate-400">Manage your articles and video content</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPasswordChange(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
            data-testid="button-change-password-open"
          >
            <Key className="w-4 h-4" />
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
            data-testid="button-admin-logout"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="mb-6 flex gap-2 p-1 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 w-fit">
        <button
          onClick={() => setAdminTab('articles')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            adminTab === 'articles'
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'text-slate-200 hover:text-white hover:bg-slate-700/50'
          }`}
          data-testid="admin-tab-articles"
        >
          <FileText className="w-5 h-5" />
          Articles
        </button>
        <button
          onClick={() => setAdminTab('videos')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            adminTab === 'videos'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
              : 'text-slate-200 hover:text-white hover:bg-slate-700/50'
          }`}
          data-testid="admin-tab-videos"
        >
          <Video className="w-5 h-5" />
          Videos
        </button>
      </div>

      {/* Videos Tab Actions */}
      {adminTab === 'videos' && (
      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={() => setShowSeriesForm(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20 font-medium"
          data-testid="button-add-series"
        >
          <Plus className="w-5 h-5" />
          Add New Series
        </button>
        <button
          onClick={() => setShowFeaturedManager(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-amber-600/20 font-medium"
          data-testid="button-featured-videos"
        >
          <Star className="w-5 h-5" />
          Featured Videos
        </button>
      </div>
      )}

      {/* Articles Tab Actions */}
      {adminTab === 'articles' && (
      <div className="mb-8 flex flex-wrap gap-3">
        <button
          onClick={() => setShowArticleForm(true)}
          className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-red-600/20 font-medium"
          data-testid="button-add-article"
        >
          <Plus className="w-5 h-5" />
          Add New Article
        </button>
      </div>
      )}

      {/* Videos Tab Content */}
      {adminTab === 'videos' && (
      <>
      {showSeriesForm && (
        <SeriesForm 
          onClose={() => setShowSeriesForm(false)}
          onSubmit={(data) => {
            createSeriesMutation.mutate(data, {
              onSuccess: () => setShowSeriesForm(false),
              onError: (error) => console.error('Failed to create series:', error)
            });
          }}
        />
      )}

      {editingSeriesId && (
        <SeriesForm 
          series={series.find(s => s.id === editingSeriesId)}
          onClose={() => setEditingSeriesId(null)}
          onSubmit={(data) => {
            updateSeriesMutation.mutate(
              { id: editingSeriesId, ...data },
              {
                onSuccess: () => setEditingSeriesId(null),
                onError: (error) => console.error('Failed to update series:', error)
              }
            );
          }}
        />
      )}

      <div className="space-y-6">
        {series.map(s => (
          <div key={s.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
              <div className="flex gap-4 flex-1">
                <div className="w-32 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700">
                  <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl text-white mb-1 font-medium">{s.title}</h3>
                  <p className="text-slate-400 text-sm line-clamp-2 mb-2">{s.description}</p>
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">{s.episodes.length} episodes</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingSeriesId(s.id)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-slate-700 whitespace-nowrap"
                  data-testid="button-edit-series"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => setSelectedSeriesId(selectedSeriesId === s.id ? null : s.id)}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-slate-700 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Add Episode
                </button>
              </div>
            </div>

            {selectedSeriesId === s.id && (
              <EpisodeForm
                seriesId={s.id}
                onSubmit={(episode) => {
                  createEpisodeMutation.mutate(
                    { seriesId: s.id, ...episode },
                    {
                      onSuccess: () => setSelectedSeriesId(null),
                      onError: (error) => console.error('Failed to create episode:', error)
                    }
                  );
                }}
                onCancel={() => setSelectedSeriesId(null)}
              />
            )}

            {s.episodes.length > 0 && (
              <div className="mt-4 space-y-2 pl-4 border-l-2 border-slate-800">
                {s.episodes.map(ep => (
                  <div key={ep.id}>
                    {editingEpisodeId === ep.id ? (
                      <EpisodeForm
                        seriesId={s.id}
                        episode={ep}
                        onSubmit={(episodeData) => {
                          updateEpisodeMutation.mutate(
                            { id: ep.id, ...episodeData },
                            {
                              onSuccess: () => setEditingEpisodeId(null),
                              onError: (error) => console.error('Failed to update episode:', error)
                            }
                          );
                        }}
                        onCancel={() => setEditingEpisodeId(null)}
                      />
                    ) : (
                      <div className="bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-4 flex items-center gap-4 transition-colors border border-slate-800/50">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium">{ep.title}</h4>
                          <p className="text-slate-400 text-sm">{ep.description}</p>
                        </div>
                        <div className="text-blue-400 font-semibold bg-blue-500/10 px-3 py-1 rounded-full text-sm border border-blue-500/20">${ep.price.toFixed(2)}</div>
                        <button
                          onClick={() => {
                            setEditingEpisodeId(ep.id);
                            window.scrollTo(0, 0);
                          }}
                          className="p-2 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg transition-colors"
                          data-testid={`button-edit-episode-${ep.id}`}
                          title="Edit episode"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this episode?')) {
                              deleteEpisodeMutation.mutate(ep.id, {
                                onError: (error) => console.error('Failed to delete episode:', error)
                              });
                            }
                          }}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                          data-testid={`button-delete-episode-${ep.id}`}
                          title="Delete episode"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      </>
      )}

      {/* Articles Tab Content */}
      {adminTab === 'articles' && (
      <>
      {(showArticleForm || editingArticleId) && adminArticlesLoaded && (
        <Suspense fallback={<AdminFormFallback />}>
          <ArticleForm
            key={editingArticleId ? `edit-${editingArticleId}-${adminArticles.find(a => a.id.toString() === editingArticleId)?.content?.length || 0}` : 'new'}
            article={editingArticleId ? adminArticles.find(a => a.id.toString() === editingArticleId) : undefined}
            onClose={() => {
              setShowArticleForm(false);
              setEditingArticleId(null);
            }}
            onSubmit={async (data) => {
              if (editingArticleId) {
                await updateArticle(editingArticleId, data);
              } else {
                await addArticle(data);
              }
              setShowArticleForm(false);
              setEditingArticleId(null);
            }}
          />
        </Suspense>
      )}

      <div className="space-y-4">
        {!adminArticlesLoaded ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-slate-600 border-t-white rounded-full mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">Loading Articles...</h3>
            <p className="text-slate-400 mb-4">Please wait while we fetch your articles</p>
          </div>
        ) : adminArticles.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl text-white mb-2">No Articles Yet</h3>
            <p className="text-slate-400 mb-4">Start by adding your first article</p>
          </div>
        ) : (
          adminArticles.map(article => (
            <div key={article.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex gap-4 flex-1">
                  {article.thumbnail && (
                    <div className="w-32 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700">
                      <img src={article.thumbnail} alt={article.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl text-white font-medium">{article.title}</h3>
                      {article.category && (
                        <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
                          {article.category === 'elections' ? 'Elections' : 
                           article.category === 'policy' ? 'Policy' :
                           article.category === 'candidate-rankings' ? 'Candidate Rankings' :
                           article.category === 'speech-analysis' ? 'Speech Analysis' : article.category}
                        </span>
                      )}
                      {article.featured && (
                        <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">Featured</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm mb-2">The Commons{article.subheader ? ` — ${article.subheader}` : ''}</p>
                    <p className="text-slate-500 text-xs">
                      {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Not published'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const token = sessionStorage.getItem('adminToken');
                      if (token) {
                        await loadAdminArticles(token);
                      }
                      setEditingArticleId(article.id.toString());
                      window.scrollTo(0, 0);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-slate-700"
                    data-testid={`button-edit-article-${article.id}`}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this article?')) {
                        deleteArticle(article.id);
                      }
                    }}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                    data-testid={`button-delete-article-${article.id}`}
                    title="Delete article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </>
      )}
    </div>
  );
}
