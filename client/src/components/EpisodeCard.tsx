import { useState, useRef } from 'react';
import { useVideoStore } from '../context/VideoStoreContext';
import AuthModal from './AuthModal';
import PurchaseModal from './PurchaseModal';
import VideoPlayer from './VideoPlayer';
import { Lock, Play } from 'lucide-react';
import { ImageWithFallback } from './ui/image-with-fallback';

interface Episode {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoType: 'vimeo' | 'youtube';
  price: number;
  thumbnail: string;
}

interface EpisodeCardProps {
  episode: Episode;
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

export default function EpisodeCard({ episode }: EpisodeCardProps) {
  const { user, purchasedEpisodes } = useVideoStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isPurchased = purchasedEpisodes.includes(episode.id);

  const handleClick = () => {
    if (isPurchased) {
      setShowPlayer(true);
    } else if (!user) {
      setShowAuthModal(true);
    } else {
      setShowPurchaseModal(true);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPreview(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowPreview(false);
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  const getEmbedUrl = () => {
    if (episode.videoType === 'vimeo') {
      return getVimeoEmbedUrl(episode.videoUrl);
    } else {
      return getYouTubeEmbedUrl(episode.videoUrl);
    }
  };

  return (
    <>
      <div 
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-blue-500/10"
        data-testid={`card-episode-${episode.id}`}
      >
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback 
            src={episode.thumbnail} 
            alt={episode.title}
            className={`w-full h-full object-cover transition-all duration-500 ${isHovered ? 'scale-110' : ''} ${showPreview ? 'opacity-0' : 'opacity-100'}`}
          />
          
          {showPreview && (
            <iframe
              src={getEmbedUrl()}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen"
              frameBorder="0"
              title={`${episode.title} preview`}
            />
          )}
          
          <div className={`absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent transition-opacity ${showPreview ? 'opacity-0' : 'opacity-60'}`} />
          
          {!showPreview && (
            <div className="absolute inset-0 flex items-center justify-center">
              {isPurchased ? (
                <div className={`w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg shadow-blue-500/50 ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
                  <Play className="w-6 h-6 text-white ml-1" fill="white" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-slate-800/80 backdrop-blur-sm rounded-full flex items-center justify-center border border-slate-700 group-hover:border-slate-600 transition-colors">
                  <Lock className="w-6 h-6 text-slate-400" />
                </div>
              )}
            </div>
          )}

          {!isPurchased && !showPreview && (
            <div className="absolute top-3 right-3 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
              ${episode.price}
            </div>
          )}
          
          {showPreview && (
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white/80 backdrop-blur-sm">
              Preview
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-white mb-2 group-hover:text-blue-400 transition-colors font-medium">
            {episode.title}
          </h3>
          <p className="text-slate-400 line-clamp-2 text-sm">
            {episode.description}
          </p>
        </div>
      </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            setShowPurchaseModal(true);
          }}
        />
      )}

      {showPurchaseModal && (
        <PurchaseModal 
          episode={episode}
          onClose={() => setShowPurchaseModal(false)}
          onSuccess={() => {
            setShowPurchaseModal(false);
            setShowPlayer(true);
          }}
        />
      )}

      {showPlayer && (
        <VideoPlayer 
          episode={episode}
          onClose={() => setShowPlayer(false)}
        />
      )}
    </>
  );
}
