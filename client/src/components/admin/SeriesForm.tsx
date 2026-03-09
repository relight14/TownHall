import { useState } from 'react';

interface SeriesFormProps {
  series?: any;
  onClose: () => void;
  onSubmit: (series: any) => void | Promise<void>;
}

export function SeriesForm({ series, onClose, onSubmit }: SeriesFormProps) {
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
