import { Link } from 'react-router-dom';
import { Play, BookOpen } from 'lucide-react';
import { ImageWithFallback } from './ui/image-with-fallback';
import type { ApiSeries } from '@shared/types';

type Series = Pick<ApiSeries, 'id' | 'title' | 'description' | 'thumbnail' | 'episodes'>;

interface SeriesCardProps {
  series: Series;
}

export default function SeriesCard({ series }: SeriesCardProps) {
  return (
    <Link to={`/series/${series.id}`}>
      <div 
        className="group relative bg-white rounded-xl overflow-hidden border border-navy/8 hover:border-gold/40 transition-all duration-300 hover:shadow-lg hover:shadow-navy/5 hover:-translate-y-0.5"
        data-testid={`card-series-${series.id}`}
      >
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback 
            src={series.thumbnail} 
            alt={series.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-navy/15 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
            <div className="w-14 h-14 bg-gold rounded-full flex items-center justify-center shadow-lg shadow-gold/30">
              <Play className="w-7 h-7 text-white ml-0.5" fill="white" />
            </div>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-lg font-serif font-bold text-navy mb-2 group-hover:text-gold-dark transition-colors leading-snug">
            {series.title}
          </h3>
          <p className="text-slate mb-4 line-clamp-2 text-sm leading-relaxed font-body">
            {series.description}
          </p>
          <div className="flex items-center gap-2 text-slate/50 text-xs font-sans">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{series.episodes.length} episodes</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
