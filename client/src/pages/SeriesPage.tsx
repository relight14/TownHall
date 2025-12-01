import { useParams, Link } from 'react-router-dom';
import { useVideoStore } from '../context/VideoStoreContext';
import EpisodeCard from '../components/EpisodeCard';
import { ArrowLeft } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/image-with-fallback';

export default function SeriesPage() {
  const { seriesId } = useParams<{ seriesId: string }>();
  const { series } = useVideoStore();
  
  const currentSeries = series.find(s => s.id === seriesId);

  if (!currentSeries) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-slate-400 text-xl">Series not found</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-20">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950" />
        <img 
          src="https://images.unsplash.com/photo-1553623717-752f8e160f81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlcGljJTIwbW91bnRhaW4lMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzY0NTMyNTE2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Mountain landscape"
          className="w-full h-full object-cover opacity-20 fixed"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600">
          <ArrowLeft className="w-4 h-4" />
          Back to all series
        </Link>

        <div className="mb-12">
          <div className="relative rounded-2xl overflow-hidden mb-8 aspect-video max-w-4xl shadow-2xl shadow-black/50 border border-slate-800">
            <ImageWithFallback 
              src={currentSeries.thumbnail} 
              alt={currentSeries.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="inline-block mb-3 px-3 py-1 bg-blue-500/30 border border-blue-400/40 rounded-full backdrop-blur-sm">
                <span className="text-blue-200 tracking-wide uppercase text-xs font-semibold">Documentary Series</span>
              </div>
              <h1 className="text-4xl md:text-5xl text-white mb-3 font-bold tracking-tight">{currentSeries.title}</h1>
              <p className="text-lg md:text-xl text-slate-200 max-w-2xl leading-relaxed">
                {currentSeries.description}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-3xl text-white mb-6 flex items-center gap-3 font-semibold">
            <span className="w-1 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-full" />
            Episodes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentSeries.episodes.map(episode => (
              <EpisodeCard key={episode.id} episode={episode} />
            ))}
          </div>

          {currentSeries.episodes.length === 0 && (
            <div className="text-center py-12 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700">
              <p className="text-slate-400">No episodes available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
