import { Link } from 'react-router-dom';
import { Play, BookOpen } from 'lucide-react';
import { ImageWithFallback } from './ui/image-with-fallback';
import { useState, useRef } from 'react';

interface Series {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  trailerUrl?: string | null;
  trailerType?: string | null;
  episodes: any[];
}

interface SeriesCardProps {
  series: Series;
}

function getVimeoEmbedUrl(url: string): string {
  const videoId = url.split('/').pop()?.split('?')[0];
  return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&background=1&loop=1&quality=auto`;
}

function getYouTubeEmbedUrl(url: string): string {
  let videoId = '';
  if (url.includes('youtu.be')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  } else if (url.includes('youtube.com')) {
    videoId = url.split('v=')[1]?.split('&')[0] || '';
  }
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1`;
}

export default function SeriesCard({ series }: SeriesCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const hasTrailer = series.trailerUrl && series.trailerType;
  
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (hasTrailer) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowPlayer(true);
      }, 300);
    }
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPlayer(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };
  
  const getEmbedUrl = () => {
    if (!series.trailerUrl || !series.trailerType) return '';
    if (series.trailerType === 'vimeo') {
      return getVimeoEmbedUrl(series.trailerUrl);
    } else {
      return getYouTubeEmbedUrl(series.trailerUrl);
    }
  };

  return (
    <Link to={`/series/${series.id}`}>
      <div 
        className="group relative bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-testid={`card-series-${series.id}`}
      >
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback 
            src={series.thumbnail} 
            alt={series.title}
            className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? 'scale-110' : ''} ${showPlayer ? 'opacity-0' : 'opacity-100'}`}
          />
          
          {showPlayer && hasTrailer && (
            <iframe
              src={getEmbedUrl()}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen"
              frameBorder="0"
              title={`${series.title} preview`}
            />
          )}
          
          <div className={`absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent transition-opacity ${showPlayer ? 'opacity-0' : isHovered ? 'opacity-40' : 'opacity-60'}`} />
          
          {!showPlayer && (
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            </div>
          )}
          
          {showPlayer && hasTrailer && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white/80 backdrop-blur-sm">
              Preview
            </div>
          )}
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
