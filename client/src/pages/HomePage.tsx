import { useVideoStore } from '../context/VideoStoreContext';
import SeriesCard from '../components/SeriesCard';
import studioBackground from '@assets/indigostudio_1764614068955.webp';
import { Link } from 'wouter';
import { Play, Star } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/image-with-fallback';

function FeaturedEpisodeCard({ episode, seriesTitle }: { 
  episode: { id: string; title: string; thumbnail: string; seriesId: string; price: number };
  seriesTitle: string;
}) {
  return (
    <Link to={`/series/${episode.seriesId}`}>
      <div 
        className="group relative bg-gradient-to-br from-amber-900/30 to-orange-900/20 backdrop-blur-sm rounded-2xl overflow-hidden border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/20 hover:-translate-y-1"
        data-testid={`card-featured-${episode.id}`}
      >
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-amber-500/90 text-white px-2.5 py-1 rounded-full text-xs font-medium">
          <Star className="w-3 h-3" fill="currentColor" />
          Featured
        </div>
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback 
            src={episode.thumbnail} 
            alt={episode.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-lg text-white mb-1 group-hover:text-amber-400 transition-colors font-medium line-clamp-1">
            {episode.title}
          </h3>
          <p className="text-slate-400 text-sm mb-2">{seriesTitle}</p>
          <div className="flex items-center justify-between">
            <div className="text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-full text-sm border border-amber-500/20">
              ${(episode.price / 100).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { series, siteSettings, featuredEpisodes } = useVideoStore();

  const renderHeroHeading = () => {
    const lines = siteSettings.heroHeading.split('\n');
    if (lines.length === 1) {
      return <span>{lines[0]}</span>;
    }
    return (
      <>
        {lines[0]}<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-300">
          {lines.slice(1).join(' ')}
        </span>
      </>
    );
  };

  const getSeriesTitle = (seriesId: string) => {
    return series.find(s => s.id === seriesId)?.title || 'Video Series';
  };

  return (
    <div className="relative min-h-screen pb-20">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/50 to-slate-950/60" />
        <img 
          src={studioBackground}
          alt="Indigo Soul Studio"
          className="w-full h-full object-cover opacity-30 fixed"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 pt-8 animate-in slide-in-from-bottom-4 duration-700 fade-in">
          <h1 className="text-5xl md:text-6xl text-white mb-4 tracking-tight font-bold" data-testid="text-hero-heading">
            {renderHeroHeading()}
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl leading-relaxed" data-testid="text-hero-subheading">
            {siteSettings.heroSubheading}
          </p>
        </div>

        {/* Featured Videos Section */}
        {featuredEpisodes.length > 0 && (
          <div className="mb-16 animate-in slide-in-from-bottom-6 duration-800 fade-in fill-mode-backwards delay-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" fill="white" />
              </div>
              <h2 className="text-2xl md:text-3xl text-white font-bold">Featured Videos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEpisodes.map(episode => (
                <FeaturedEpisodeCard 
                  key={episode.id} 
                  episode={episode}
                  seriesTitle={getSeriesTitle(episode.seriesId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Series Section */}
        {series.length > 0 && (
          <div className="animate-in slide-in-from-bottom-8 duration-1000 fade-in fill-mode-backwards delay-200">
            <h2 className="text-2xl md:text-3xl text-white font-bold mb-6">All Series</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {series.map(s => (
                <SeriesCard key={s.id} series={s} />
              ))}
            </div>
          </div>
        )}

        {series.length === 0 && featuredEpisodes.length === 0 && (
          <div className="text-center py-20 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700">
            <p className="text-slate-400 text-xl">No series available yet.</p>
            <p className="text-slate-500 mt-2">Use the Admin panel to add your first series.</p>
          </div>
        )}
      </div>
    </div>
  );
}
