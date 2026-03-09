import { Link } from 'react-router-dom';
import { useSeries } from '../hooks/series/useSeries';
import { ArrowLeft, Play } from 'lucide-react';
import { ImageWithFallback } from '../components/ui/image-with-fallback';
import capitolImage from '@assets/stock_images/us_capitol_building__80cc4b93.jpg';

function SeriesCard({ series }: { series: any }) {
  const episodeCount = series.episodes?.length || 0;
  
  return (
    <Link to={`/series/${series.id}`} data-testid={`link-series-${series.id}`}>
      <div className="group cursor-pointer bg-white rounded-xl overflow-hidden border border-navy/8 hover:border-gold/40 transition-all hover:shadow-lg hover:shadow-navy/5">
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback
            src={series.thumbnail}
            alt={series.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-navy/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 bg-gold/90 rounded-full flex items-center justify-center shadow-lg">
              <Play className="w-6 h-6 text-white ml-1" fill="currentColor" />
            </div>
          </div>
          {episodeCount > 0 && (
            <div className="absolute bottom-2 right-2 bg-navy/80 text-parchment text-xs font-sans px-2 py-1 rounded">
              {episodeCount} {episodeCount === 1 ? 'episode' : 'episodes'}
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="inline-block mb-2 px-2 py-0.5 bg-gold-pale border border-gold/20 rounded">
            <span className="text-gold-dark tracking-wide uppercase text-xs font-sans font-semibold">Series</span>
          </div>
          <h3 className="text-lg font-serif font-bold text-navy group-hover:text-gold-dark transition-colors line-clamp-2 leading-snug">
            {series.title}
          </h3>
          <p className="text-slate mt-2 text-sm line-clamp-2 font-body">
            {series.description}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function VideosPage() {
  const { data: series = [] } = useSeries();

  return (
    <div className="min-h-screen bg-parchment pb-20">
      {/* Hero banner */}
      <div className="bg-navy relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={capitolImage}
            alt="US Capitol building"
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy/60 to-navy" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Link to="/" className="inline-flex items-center gap-2 text-parchment/60 hover:text-gold mb-8 transition-colors font-sans text-sm" data-testid="link-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
          <span className="section-label block mb-3">Watch</span>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight mb-3">Video Series</h1>
          <p className="text-lg text-parchment/60 max-w-2xl font-body">
            Explore our collection of premium video content and documentary series.
          </p>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {series.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {series.map(s => (
              <SeriesCard key={s.id} series={s} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl border border-navy/8">
            <p className="text-slate text-lg font-body">No video series available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
