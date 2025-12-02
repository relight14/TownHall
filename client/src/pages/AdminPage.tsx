import { useState, useEffect } from 'react';
import { useVideoStore } from '../context/VideoStoreContext';
import { Plus, Trash2, Video, Edit, X, Lock, LogOut } from 'lucide-react';

function AdminLoginGate({ onAuthenticated }: { onAuthenticated: (token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authentication failed');
      }

      const data = await response.json();
      sessionStorage.setItem('adminAuthenticated', 'true');
      sessionStorage.setItem('adminToken', data.adminToken);
      onAuthenticated(data.adminToken);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl backdrop-blur-sm">
        <div className="flex items-center justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl text-white mb-2 font-bold text-center">Admin Access</h2>
        <p className="text-slate-400 text-center mb-6 text-sm">Enter your credentials to access the admin panel</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm" data-testid="text-admin-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="admin@example.com"
              required
              data-testid="input-admin-email"
            />
          </div>
          
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              placeholder="••••••••"
              required
              data-testid="input-admin-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 rounded-lg transition-all font-medium shadow-lg shadow-indigo-600/20 disabled:opacity-50 mt-6"
            data-testid="button-admin-login"
          >
            {loading ? 'Authenticating...' : 'Access Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { series, addSeries, addEpisode, updateSeries, deleteEpisode, setAdminToken } = useVideoStore();
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

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
    }} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-4xl text-white mb-2 font-bold">Content Management</h1>
          <p className="text-slate-400">Manage your video series and episodes</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
          data-testid="button-admin-logout"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="mb-8">
        <button
          onClick={() => setShowSeriesForm(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/20 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add New Series
        </button>
      </div>

      {showSeriesForm && (
        <SeriesForm 
          onClose={() => setShowSeriesForm(false)}
          onSubmit={addSeries}
        />
      )}

      {editingSeriesId && (
        <SeriesForm 
          series={series.find(s => s.id === editingSeriesId)}
          onClose={() => setEditingSeriesId(null)}
          onSubmit={async (data) => {
            try {
              await updateSeries(editingSeriesId, data);
              setEditingSeriesId(null);
            } catch (error) {
              console.error('Failed to update series:', error);
            }
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
                  addEpisode(s.id, episode);
                  setSelectedSeriesId(null);
                }}
                onCancel={() => setSelectedSeriesId(null)}
              />
            )}

            {s.episodes.length > 0 && (
              <div className="mt-4 space-y-2 pl-4 border-l-2 border-slate-800">
                {s.episodes.map(ep => (
                  <div key={ep.id} className="bg-slate-800/30 hover:bg-slate-800/50 rounded-lg p-4 flex items-center gap-4 transition-colors border border-slate-800/50">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{ep.title}</h4>
                      <p className="text-slate-400 text-sm">{ep.description}</p>
                    </div>
                    <div className="text-blue-400 font-semibold bg-blue-500/10 px-3 py-1 rounded-full text-sm border border-blue-500/20">${ep.price}</div>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this episode?')) {
                          deleteEpisode(ep.id);
                        }
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                      data-testid={`button-delete-episode-${ep.id}`}
                      title="Delete episode"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SeriesForm({ series, onClose, onSubmit }: { series?: any; onClose: () => void; onSubmit: (series: any) => void | Promise<void> }) {
  const [title, setTitle] = useState(series?.title || '');
  const [description, setDescription] = useState(series?.description || '');
  const [thumbnail, setThumbnail] = useState(series?.thumbnail || '');
  const [useFile, setUseFile] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(series?.trailerUrl || '');
  const [trailerType, setTrailerType] = useState<'vimeo' | 'youtube'>(series?.trailerType || 'vimeo');
  
  const isEditing = !!series;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnail(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ 
      title, 
      description, 
      thumbnail,
      trailerUrl: trailerUrl || null,
      trailerType: trailerUrl ? trailerType : null
    });
    if (!isEditing) {
      onClose();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 animate-in fade-in slide-in-from-top-2">
      <h3 className="text-xl text-white mb-4 font-semibold">{isEditing ? 'Edit Series' : 'New Series'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-300 mb-2 text-sm font-medium">Series Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-2 text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-24"
            required
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-2 text-sm font-medium">Thumbnail</label>
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => setUseFile(false)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                !useFile 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setUseFile(true)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                useFile 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Upload File
            </button>
          </div>
          {!useFile ? (
            <input
              type="url"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="https://..."
              required
            />
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer file:font-medium"
                required={!thumbnail}
              />
              {thumbnail && (
                <div className="mt-3">
                  <img src={thumbnail} alt="Preview" className="w-32 h-20 object-cover rounded-lg border border-slate-700" />
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="block text-slate-300 mb-2 text-sm font-medium">Series Trailer (Optional)</label>
          <div>
            <input
              type="url"
              value={trailerUrl}
              onChange={(e) => setTrailerUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all mb-2"
              placeholder="https://vimeo.com/... or https://youtube.com/..."
            />
          </div>
          {trailerUrl && (
            <div>
              <label className="block text-slate-300 mb-2 text-sm font-medium">Trailer Type</label>
              <select
                value={trailerType}
                onChange={(e) => setTrailerType(e.target.value as 'vimeo' | 'youtube')}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              >
                <option value="vimeo">Vimeo</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors border border-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors font-medium shadow-lg shadow-blue-600/20"
          >
            {isEditing ? 'Save Changes' : 'Create Series'}
          </button>
        </div>
      </form>
    </div>
  );
}

function EpisodeForm({ seriesId, onSubmit, onCancel }: { seriesId: string; onSubmit: (episode: any) => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoType, setVideoType] = useState<'vimeo' | 'youtube'>('vimeo');
  const [price, setPrice] = useState('9.99');
  const [thumbnail, setThumbnail] = useState('');
  const [useFile, setUseFile] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnail(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      videoUrl,
      videoType,
      price: parseFloat(price),
      thumbnail
    });
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 mt-4 border border-slate-700 animate-in fade-in slide-in-from-top-2">
      <h4 className="text-white mb-4 font-semibold">Add Episode</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 mb-1 text-sm font-medium">Episode Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1 text-sm font-medium">Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-slate-300 mb-1 text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-20"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 mb-1 text-sm font-medium">Video URL</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="https://vimeo.com/... or https://youtube.com/..."
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1 text-sm font-medium">Video Type</label>
            <select
              value={videoType}
              onChange={(e) => setVideoType(e.target.value as 'vimeo' | 'youtube')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            >
              <option value="vimeo">Vimeo</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-slate-300 mb-1 text-sm font-medium">Thumbnail</label>
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setUseFile(false)}
              className={`px-3 py-1 rounded transition-colors text-sm font-medium ${
                !useFile 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setUseFile(true)}
              className={`px-3 py-1 rounded transition-colors text-sm font-medium ${
                useFile 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Upload File
            </button>
          </div>
          {!useFile ? (
            <input
              type="url"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              placeholder="https://..."
              required
            />
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer file:text-sm"
                required={!thumbnail}
              />
              {thumbnail && (
                <div className="mt-2">
                  <img src={thumbnail} alt="Preview" className="w-32 h-20 object-cover rounded border border-slate-700" />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg transition-colors border border-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg transition-colors font-medium shadow-lg shadow-blue-600/20"
          >
            Save Episode
          </button>
        </div>
      </form>
    </div>
  );
}
