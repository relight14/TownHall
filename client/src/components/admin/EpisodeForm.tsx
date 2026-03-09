import { useState } from 'react';

interface EpisodeFormProps {
  seriesId: string;
  episode?: any;
  onSubmit: (episode: any) => void;
  onCancel: () => void;
}

export function EpisodeForm({ seriesId, episode, onSubmit, onCancel }: EpisodeFormProps) {
  const [title, setTitle] = useState(episode?.title || '');
  const [description, setDescription] = useState(episode?.description || '');
  const [videoUrl, setVideoUrl] = useState(episode?.videoUrl || '');
  const [videoType, setVideoType] = useState<'vimeo' | 'youtube'>(episode?.videoType || 'vimeo');
  const [price, setPrice] = useState(episode?.price !== undefined ? episode.price.toFixed(2) : '9.99');
  const [thumbnail, setThumbnail] = useState(episode?.thumbnail || '');
  const [useFile, setUseFile] = useState(false);
  
  const isEditing = !!episode;

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
      <h4 className="text-white mb-4 font-semibold">{isEditing ? 'Edit Episode' : 'Add Episode'}</h4>
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
            {isEditing ? 'Save Changes' : 'Save Episode'}
          </button>
        </div>
      </form>
    </div>
  );
}
