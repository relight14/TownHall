import { useState } from 'react';
import { X, Star, Plus, GripVertical } from 'lucide-react';
import type { ApiEpisode, ApiSeries } from '@shared/types';

type Episode = Pick<ApiEpisode, 'id' | 'title' | 'thumbnail'> & { seriesId: string };
type Series = Pick<ApiSeries, 'id' | 'title'>;

interface FeaturedEpisodesManagerProps {
  allEpisodes: Episode[];
  featuredEpisodeIds: string[];
  series: Series[];
  onSave: (episodeIds: string[]) => void;
  onClose: () => void;
}

export function FeaturedEpisodesManager({
  allEpisodes,
  featuredEpisodeIds,
  series,
  onSave,
  onClose,
}: FeaturedEpisodesManagerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(featuredEpisodeIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const toggleEpisode = (episodeId: string) => {
    setSelectedIds(prev => 
      prev.includes(episodeId) 
        ? prev.filter(id => id !== episodeId)
        : [...prev, episodeId]
    );
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newIds = [...selectedIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    setSelectedIds(newIds);
  };

  const moveDown = (index: number) => {
    if (index === selectedIds.length - 1) return;
    const newIds = [...selectedIds];
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    setSelectedIds(newIds);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await onSave(selectedIds);
      setSuccess('Featured videos updated!');
      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update featured videos');
    } finally {
      setLoading(false);
    }
  };

  const getSeriesTitle = (seriesId: string) => {
    return series.find(s => s.id === seriesId)?.title || 'Unknown Series';
  };

  const selectedEpisodes = selectedIds
    .map(id => allEpisodes.find(ep => ep.id === id))
    .filter(Boolean) as Episode[];

  const availableEpisodes = allEpisodes.filter(ep => !selectedIds.includes(ep.id));

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl text-white font-semibold">Featured Videos</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Currently Featured ({selectedEpisodes.length})
            </h4>
            <div className="space-y-2 min-h-[200px] bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              {selectedEpisodes.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No featured videos selected</p>
              ) : (
                selectedEpisodes.map((ep, index) => (
                  <div key={ep.id} className="flex items-center gap-2 bg-slate-900 rounded-lg p-2 border border-amber-500/30">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <GripVertical className="w-3 h-3 rotate-90" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === selectedEpisodes.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                      >
                        <GripVertical className="w-3 h-3 rotate-90" />
                      </button>
                    </div>
                    <img src={ep.thumbnail} alt={ep.title} className="w-16 h-10 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{ep.title}</p>
                      <p className="text-slate-500 text-xs truncate">{getSeriesTitle(ep.seriesId)}</p>
                    </div>
                    <button
                      onClick={() => toggleEpisode(ep.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-3">Available Episodes ({availableEpisodes.length})</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              {availableEpisodes.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">All episodes are featured</p>
              ) : (
                availableEpisodes.map(ep => (
                  <div 
                    key={ep.id} 
                    onClick={() => toggleEpisode(ep.id)}
                    className="flex items-center gap-2 bg-slate-900 rounded-lg p-2 border border-slate-700 cursor-pointer hover:border-amber-500/50 transition-colors"
                  >
                    <img src={ep.thumbnail} alt={ep.title} className="w-16 h-10 object-cover rounded" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{ep.title}</p>
                      <p className="text-slate-500 text-xs truncate">{getSeriesTitle(ep.seriesId)}</p>
                    </div>
                    <div className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-lg transition-colors border border-slate-700 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white py-2.5 rounded-lg transition-all font-medium shadow-lg shadow-amber-600/20 disabled:opacity-50"
            data-testid="button-save-featured"
          >
            {loading ? 'Saving...' : 'Save Featured Videos'}
          </button>
        </div>
      </div>
    </div>
  );
}
