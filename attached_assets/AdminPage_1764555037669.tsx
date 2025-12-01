import { useState } from 'react';
import { useVideoStore } from './VideoStoreContext';
import { Plus, Trash2, Video } from 'lucide-react';

export default function AdminPage() {
  const { series, addSeries, addEpisode } = useVideoStore();
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl text-white mb-2">Content Management</h1>
        <p className="text-slate-400">Manage your video series and episodes</p>
      </div>

      <div className="mb-8">
        <button
          onClick={() => setShowSeriesForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
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

      <div className="space-y-6">
        {series.map(s => (
          <div key={s.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4 flex-1">
                <div className="w-32 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl text-white mb-1">{s.title}</h3>
                  <p className="text-slate-400">{s.description}</p>
                  <p className="text-slate-500 mt-2">{s.episodes.length} episodes</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSeriesId(selectedSeriesId === s.id ? null : s.id)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Episode
              </button>
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
              <div className="mt-4 space-y-2">
                {s.episodes.map(ep => (
                  <div key={ep.id} className="bg-slate-800/50 rounded-lg p-4 flex items-center gap-4">
                    <Video className="w-5 h-5 text-blue-400" />
                    <div className="flex-1">
                      <h4 className="text-white">{ep.title}</h4>
                      <p className="text-slate-400">{ep.description}</p>
                    </div>
                    <div className="text-blue-400">${ep.price}</div>
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

function SeriesForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (series: any) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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
    onSubmit({ title, description, thumbnail });
    onClose();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
      <h3 className="text-xl text-white mb-4">New Series</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-300 mb-2">Series Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-24"
            required
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-2">Thumbnail</label>
          <div className="flex items-center gap-3 mb-3">
            <button
              type="button"
              onClick={() => setUseFile(false)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                !useFile 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setUseFile(true)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                useFile 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-800 text-slate-400 hover:text-white'
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
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="https://..."
              required
            />
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:cursor-pointer"
                required={!thumbnail}
              />
              {thumbnail && (
                <div className="mt-3">
                  <img src={thumbnail} alt="Preview" className="w-32 h-20 object-cover rounded-lg" />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
          >
            Create Series
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
    <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
      <h4 className="text-white mb-4">Add Episode</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 mb-1">Episode Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-slate-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 h-20"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 mb-1">Video URL</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="https://vimeo.com/... or https://youtube.com/..."
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-1">Video Type</label>
            <select
              value={videoType}
              onChange={(e) => setVideoType(e.target.value as 'vimeo' | 'youtube')}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="vimeo">Vimeo</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-slate-300 mb-1">Thumbnail</label>
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setUseFile(false)}
              className={`px-3 py-1 rounded transition-colors text-sm ${
                !useFile 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              URL
            </button>
            <button
              type="button"
              onClick={() => setUseFile(true)}
              className={`px-3 py-1 rounded transition-colors text-sm ${
                useFile 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-slate-900 text-slate-400 hover:text-white'
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
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="https://..."
              required
            />
          ) : (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600 file:cursor-pointer"
                required={!thumbnail}
              />
              {thumbnail && (
                <div className="mt-2">
                  <img src={thumbnail} alt="Preview" className="w-24 h-16 object-cover rounded" />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-colors"
          >
            Add Episode
          </button>
        </div>
      </form>
    </div>
  );
}