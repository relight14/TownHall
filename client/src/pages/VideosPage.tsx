import { Link } from 'react-router-dom';
import { useVideoStore } from '../context/VideoStoreContext';
import { ArrowLeft, Play } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/image-with-fallback';

function SeriesCard({ series }: { series: any }) {
  const episodeCount = series.episodes?.length || 0;
  
  return (
    <Link to={`/series/${series.id}`} data-testid={`link-series-${series.id}`}>
      <div className="group cursor-pointer bg-slate-900/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-800 hover:border-slate-600 transition-all">
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback
            src={series.thumbnail}
            alt={series.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center">
              <Play className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" />
            </div>
          </div>
          {episodeCount > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="inline-block mb-2 px-2 py-0.5 bg-blue-500/30 border border-blue-400/40 rounded-full">
            <span className="text-blue-200 tracking-wide uppercase text-xs font-semibold">Series</span>
          </div>
          <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
            {series.title}
          </h3>
          <p className="text-slate-400 mt-2 text-sm line-clamp-2">
            {series.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function VideosPage() {
  const { series } = useVideoStore();

  return (
    <div className="relative min-h-screen pb-20">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950" />
        <img 
          src="https://images.unsplash.com/photo-1553623717-752f8e160f81?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlcGljJTIwbW91bnRhaW4lMjBsYW5kc2NhcGV8ZW58MXx8fHwxNzY0NTMyNTE2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Mountain landscape"
          className="w-full h-full object-cover opacity-20 fixed"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors bg-slate-900/50 backdrop-blur-sm px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-600" data-testid="link-back-home">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl text-white font-bold tracking-tight mb-4">Video Series</h1>
          <p className="text-lg text-slate-300 max-w-2xl">
            Explore our collection of premium video content and documentary series.
          </p>
        </div>

        {series.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map(s => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-lg">No video series available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
