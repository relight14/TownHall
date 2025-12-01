import { Link } from 'react-router-dom';
import { Play, BookOpen } from 'lucide-react';
import { ImageWithFallback } from './ui/image-with-fallback';

interface Series {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  episodes: any[];
}

interface SeriesCardProps {
  series: Series;
}

export default function SeriesCard({ series }: SeriesCardProps) {
  return (
    <Link to={`/series/${series.id}`}>
      <div 
        className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1"
        data-testid={`card-series-${series.id}`}
      >
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback 
            src={series.thumbnail} 
            alt={series.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
              <Play className="w-8 h-8 text-white ml-1" fill="white" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="text-xl text-white mb-2 group-hover:text-blue-400 transition-colors font-medium">
            {series.title}
          </h3>
          <p className="text-slate-400 mb-4 line-clamp-2 text-sm leading-relaxed">
            {series.description}
          </p>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <BookOpen className="w-4 h-4" />
            <span>{series.episodes.length} episodes</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
