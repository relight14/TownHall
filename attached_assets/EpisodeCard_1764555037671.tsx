import { useState } from 'react';
import { useVideoStore } from './VideoStoreContext';
import AuthModal from './AuthModal';
import PurchaseModal from './PurchaseModal';
import VideoPlayer from './VideoPlayer';
import { Lock, Play } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

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

export default function EpisodeCard({ episode }: EpisodeCardProps) {
  const { user, purchasedEpisodes } = useVideoStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

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

  return (
    <>
      <div 
        onClick={handleClick}
        className="group relative bg-slate-900/50 rounded-xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-blue-500/10"
      >
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback 
            src={episode.thumbnail} 
            alt={episode.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent opacity-60" />
          
          <div className="absolute inset-0 flex items-center justify-center">
            {isPurchased ? (
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-6 h-6 text-white ml-1" fill="white" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-slate-400" />
              </div>
            )}
          </div>

          {!isPurchased && (
            <div className="absolute top-3 right-3 bg-blue-500 text-white px-3 py-1 rounded-full">
              ${episode.price}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-white mb-2 group-hover:text-blue-400 transition-colors">
            {episode.title}
          </h3>
          <p className="text-slate-400 line-clamp-2">
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
